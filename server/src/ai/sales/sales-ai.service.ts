import { ocrService, OcrResult } from "../ocr/ocr.service.js";
import { llmService, LlmResponse } from "../llm/llm.service.js";
import { prisma } from "../../prisma/client.js";
import { logger } from "../../utils/logger.js";

/**
 * Product from database for AI context
 */
interface ProductContext {
  id: number;
  name: string;
  price: number;
  category: string;
}

/**
 * Suggested sale item from AI
 */
export interface SuggestedSaleItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Full result from sales AI processing
 */
export interface SalesAiResult {
  success: boolean;
  totalDetected: number | null;
  dateDetected: string | null;
  suggestedItems: SuggestedSaleItem[];
  approximateTotal: number;
  confidence: number;
  notes: string | null;
  rawText: string;
  ocrConfidence: number;
  error?: string;
}

/**
 * Prompt for sales ticket analysis
 */
const getSalesPrompt = (products: ProductContext[]) => `Eres un asistente que ayuda a deducir productos vendidos a partir de un ticket de bar/restaurante.

Tienes:
- El texto OCR de un ticket de venta
- Una lista de productos con precios reales del negocio

Tu tarea es:
1. Detectar el TOTAL de la venta en el ticket.
   - Busca "TOTAL", "Total", "Importe", "Pagar" o el número más grande al final del ticket.
   - Si dudas, prefiere la suma de los productos listados.
2. Detectar la FECHA si aparece.
3. IDENTIFICAR PRODUCTOS (IMPORTANTE):
   - PASO 1 (COINCIDENCIA EXACTA): Mira los números en el ticket. Si un precio coincide EXACTAMENTE con el de un producto de la lista, asígnalo directamente.
   - PASO 2 (DEDUCCIÓN POR SUMA): Solo si encuentras un importe (como el total) que NO coincide con ningún producto, intenta descomponerlo.
   - ESTRATEGIA DE DESCOMPOSICIÓN: Normalmente estos importes se forman por un PRODUCTO PRINCIPAL (caro) + un COMPLEMENTO (barato).
     - Busca el producto con el precio más alto que sea INFERIOR al importe (pero cercano).
     - Luego busca un producto pequeño que complete la diferencia.
   - EJEMPLO REAL: Si ves 13,00€ y no hay producto de 13,00€:
     - Busca producto alto cercano: "Pollo Asado" (11,80€). Faltan 1,20€.
     - Busca complemento: "Mojo Verde" (1,20€).
     - Solución: 1 Pollo Asado + 1 Mojo Verde.

REGLAS IMPORTANTES:
- Prioriza SIEMPRE la coincidencia exacta de precios.
- Para importes grandes (totales), usa la lógica "Principal + Complemento". NO intentes sumar 10 productos pequeños.
- Siempre ten en cuenta que al precio final sumale la bolsa de papel que cuesta 0.10€, 
  es decir, por ejemplo si son 13,10€, realmente el total de los productos es 13,00€.
- NO inventes descuentos ni precios que no estén en la lista.
- Devuelve SOLO JSON válido, sin texto adicional.
- Intenta SIEMPRE devolver un totalDetected. Si no está explícito, usa la suma de los items que ves.

REGLA SOBRE DECIMALES EN EL TICKET:
- El OCR a veces NO detecta el punto/coma decimal
- Si ves "2350" es probablemente 23.50€
- Si ves "1520" es probablemente 15.20€
- Números de 2 dígitos como "30" pueden ser 3.00€ O 30.00€, usa el contexto.

LISTA DE PRODUCTOS DISPONIBLES:
${JSON.stringify(products, null, 2)}

FORMATO DE RESPUESTA (JSON):
{
  "totalDetected": 23.50,
  "dateDetected": "2026-01-15",
  "suggestedItems": [
    {"productId": 1, "name": "Cerveza", "quantity": 4, "unitPrice": 2.50},
    {"productId": 3, "name": "Bocadillo", "quantity": 2, "unitPrice": 5.50}
  ],
  "approximateTotal": 21.00,
  "confidence": 0.65,
  "notes": "Combinación aproximada. La diferencia puede ser propinas o productos no listados."
}

TEXTO OCR DEL TICKET A ANALIZAR:
`;

/**
 * Sales AI Service
 * OCR → LLM with product context → Suggested products
 */
export class SalesAiService {
  private static instance: SalesAiService;

  private constructor() { }

  public static getInstance(): SalesAiService {
    if (!SalesAiService.instance) {
      SalesAiService.instance = new SalesAiService();
    }
    return SalesAiService.instance;
  }

  /**
   * Check if all AI services are available
   */
  async checkStatus(): Promise<{ available: boolean; ocr: boolean; llm: boolean; products: number }> {
    // OCR is always ready (Tesseract.js)
    const ocrStatus = true;
    const llmStatus = await llmService.isAvailable();

    // Count active products
    const productCount = await prisma.product.count({ where: { active: true } });

    return {
      available: ocrStatus && llmStatus && productCount > 0,
      ocr: ocrStatus,
      llm: llmStatus,
      products: productCount,
    };
  }

  /**
   * Process a sales ticket image and suggest products
   */
  async processSalesTicket(
    imageBuffer: Buffer,
    language: string = "spa"
  ): Promise<SalesAiResult> {
    const startTime = Date.now();

    try {
      // Step 1: OCR - Extract text from image
      logger.info("[SalesAI] Starting OCR processing...");
      const ocrResult: OcrResult = await ocrService.extractText(imageBuffer, language);

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        return {
          success: false,
          totalDetected: null,
          dateDetected: null,
          suggestedItems: [],
          approximateTotal: 0,
          confidence: 0,
          notes: null,
          rawText: "",
          ocrConfidence: 0,
          error: "No se pudo extraer texto de la imagen",
        };
      }

      logger.info(`[SalesAI] OCR completed. Text length: ${ocrResult.text.length}, Confidence: ${ocrResult.confidence}`);
      logger.debug(`[SalesAI] OCR Text:\n${ocrResult.text}`);
      console.log('--- OCR TEXT START ---');
      console.log(ocrResult.text);
      console.log('--- OCR TEXT END ---');

      // Step 2: Fetch active products from database
      const products = await prisma.product.findMany({
        where: { active: true },
        select: { id: true, name: true, price: true, category: true },
        orderBy: { name: "asc" },
      });

      if (products.length === 0) {
        return {
          success: false,
          totalDetected: null,
          dateDetected: null,
          suggestedItems: [],
          approximateTotal: 0,
          confidence: 0,
          notes: null,
          rawText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          error: "No hay productos activos en la base de datos",
        };
      }

      logger.info(`[SalesAI] Found ${products.length} active products`);

      // Map to context structure (category object -> string)
      const productContext: ProductContext[] = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category ? p.category.name : "Sin categoría"
      }));

      // Step 3: Build prompt and call LLM (with retry loop)
      let currentPrompt = getSalesPrompt(productContext) + ocrResult.text;
      let lastResult: any = null;
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        logger.info(`[SalesAI] Attempt ${attempt}/${MAX_RETRIES}...`);

        const llmResponse: LlmResponse = await llmService.generate(currentPrompt);

        if (!llmResponse.raw) {
          if (attempt === MAX_RETRIES) {
            return {
              success: false,
              totalDetected: null,
              dateDetected: null,
              suggestedItems: [],
              approximateTotal: 0,
              confidence: 0,
              notes: "Error al procesar con IA tras varios intentos",
              rawText: ocrResult.text,
              ocrConfidence: ocrResult.confidence,
              error: "Error al procesar con IA",
            };
          }
          continue; // Retry if empty response
        }

        logger.debug(`[SalesAI] Step ${attempt} Raw Response:\n${llmResponse.raw}`);

        // Step 4: Parse LLM response
        const parsedData = llmResponse.parsed || this.parseLlmResponse(llmResponse.raw);

        if (!parsedData) {
          logger.warn(`[SalesAI] Failed to parse JSON on attempt ${attempt}`);
          if (attempt === MAX_RETRIES) {
            return {
              success: false,
              totalDetected: null,
              dateDetected: null,
              suggestedItems: [],
              approximateTotal: 0,
              confidence: 0,
              notes: null,
              rawText: ocrResult.text,
              ocrConfidence: ocrResult.confidence,
              error: "No se pudo interpretar la respuesta de la IA",
            };
          }
          // Use feedback to ask for valid JSON? Or just retry? 
          // For simplicity, just continue loop, maybe next seed helps? 
          // Better: Add checking constraint to prompt?
          currentPrompt += "\n\nERROR: Tu respuesta no fue un JSON válido. Por favor devuelve SOLO JSON.";
          continue;
        }

        // Step 5: Validate and normalize data (Use context products)
        const result = this.validateAndNormalize(parsedData, productContext);
        lastResult = result;

        // CHECK DISCREPANCY
        // If we have a detected total, and it differs from the sum of items
        if (result.totalDetected !== null && result.suggestedItems.length > 0) {
          const diff = Math.abs(result.totalDetected - result.approximateTotal);

          // Tolerance of 0.10€
          if (diff <= 0.10) {
            logger.info(`[SalesAI] Match confirmed (Diff: ${diff.toFixed(2)}). Accepted.`);
            break; // Success!
          } else {
            logger.info(`[SalesAI] Discrepancy: Total Detected ${result.totalDetected} vs Sum ${result.approximateTotal} (Diff: ${diff}). Retrying...`);

            if (attempt < MAX_RETRIES) {
              const feedback = `\n\nRESULTADO INCORRECTO:
               - Tu "totalDetected" es ${result.totalDetected}
               - Pero la suma de "suggestedItems" es ${result.approximateTotal}
               - Diferencia: ${diff.toFixed(2)}
               
               INSTRUCCIONES PARA CORREGIR:
               1. REVISA los precios unitarios. Asegúrate de que coincidan con la lista de productos.
               2. REVISA si falta algún producto (ej. bolsa, pan, etc).
               3. AJUSTA la selección para que la suma sea EXACTAMENTE ${result.totalDetected}.
               4. Si el Total Detectado es erróneo, corrígelo.
               
               Devuelve el JSON corregido.`;

              currentPrompt += `\n\nRespuesta previa: ${llmResponse.raw}\n${feedback}`;
              continue; // Next attempt
            }
          }
        } else {
          // If no total detected, or no items, we can't really validate math.
          // Unless we want to prompt "Hey, calculate a total".
          // For now, accept it.
          break;
        }
      }

      // Return the last best result
      const finalResult = lastResult;

      const elapsed = Date.now() - startTime;
      logger.info(`[SalesAI] Processing complete in ${elapsed}ms. Suggested ${finalResult?.suggestedItems.length || 0} items.`);

      return {
        success: true,
        ...finalResult,
        rawText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
      };

    } catch (error: any) {
      logger.error(`[SalesAI] Error: ${error.message}`);
      return {
        success: false,
        totalDetected: null,
        dateDetected: null,
        suggestedItems: [],
        approximateTotal: 0,
        confidence: 0,
        notes: null,
        rawText: "",
        ocrConfidence: 0,
        error: error.message || "Error desconocido",
      };
    }
  }

  /**
   * Parse LLM JSON response
   */
  private parseLlmResponse(text: string): Record<string, any> | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn("[SalesAI] No JSON found in LLM response");
        return null;
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      logger.warn(`[SalesAI] Failed to parse LLM response: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate and normalize the parsed data
   */
  private validateAndNormalize(
    data: Record<string, any>,
    products: ProductContext[]
  ): Omit<SalesAiResult, "success" | "rawText" | "ocrConfidence" | "error"> {
    // Normalize total
    let totalDetected = this.normalizeMonetaryValue(data.totalDetected);

    // Normalize date
    const dateDetected = this.normalizeDate(data.dateDetected);

    // Validate and normalize suggested items
    const suggestedItems: SuggestedSaleItem[] = [];
    let approximateTotal = 0;

    if (Array.isArray(data.suggestedItems)) {
      for (const item of data.suggestedItems) {
        // Find the product in our database
        const product = products.find(p => p.id === item.productId);

        if (product) {
          const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
          const unitPrice = product.price; // Always use DB price

          suggestedItems.push({
            productId: product.id,
            name: product.name,
            quantity,
            unitPrice,
          });

          approximateTotal += unitPrice * quantity;
        }
      }
    }

    // Calculate confidence
    let confidence = typeof data.confidence === "number" ? data.confidence : 0.5;

    // Adjust confidence based on total difference
    if (totalDetected && approximateTotal > 0) {
      const diff = Math.abs(totalDetected - approximateTotal) / totalDetected;
      if (diff > 0.3) {
        confidence = Math.min(confidence, 0.4); // Big difference = low confidence
      } else if (diff > 0.15) {
        confidence = Math.min(confidence, 0.6);
      }
    }

    // If no items suggested, set low confidence
    if (suggestedItems.length === 0) {
      confidence = 0;
    }

    const notes = typeof data.notes === "string" ? data.notes : null;

    return {
      totalDetected,
      dateDetected,
      suggestedItems,
      approximateTotal: Math.round(approximateTotal * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      notes,
    };
  }

  /**
   * Normalize monetary value with decimal handling
   */
  private normalizeMonetaryValue(value: any): number | null {
    if (value === null || value === undefined) return null;

    let num: number;

    if (typeof value === "number") {
      num = value;
    } else if (typeof value === "string") {
      // Clean string
      let cleaned = value.trim();

      // Check for comma usage as decimal separator (common in Spain)
      // e.g., "1.250,50" -> 1250.50 or "25,50" -> 25.50
      if (cleaned.includes(",")) {
        // Remove dots (thousands separators) AND replace comma with dot
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      }
      // Handle cases like "1.250" without comma -> assume it could be 1250 or 1.25
      // But typically we'll treat it as standard float first

      num = parseFloat(cleaned);
    } else {
      return null;
    }

    if (isNaN(num)) return null;

    // Fix possible integer representation of decimals (e.g. 2350 -> 23.50)
    // Only apply this logic if the number is an integer
    if (num % 1 === 0) {
      const digits = Math.abs(num).toString().length;

      // Logic: If it's 3 or more digits, it's likely avoiding a decimal point 
      // (e.g. 1250 -> 12.50, 2350 -> 23.50). 
      // UNLESS it's a huge number, but unlikely for this business context (bar/restaurant ticket usually < 1000)
      if (digits >= 3) {
        num = num / 100;
      }
      // For 2 digits (e.g. 50), it could be 50.00 or 0.50. 
      // Without context hard to say, but usually totals are > 1 euro.
      // We'll leave 2 digits as is (50 -> 50.00).
    }

    return Math.round(num * 100) / 100;
  }

  /**
   * Normalize date to YYYY-MM-DD
   */
  private normalizeDate(date: any): string | null {
    if (!date) return null;

    if (typeof date === "string") {
      // Already in correct format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // DD/MM/YYYY or DD-MM-YYYY
      const match = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        let year = match[3];
        if (year.length === 2) {
          year = "20" + year;
        }
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }
}

// Export singleton instance
export const salesAiService = SalesAiService.getInstance();
