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
1. Detectar el TOTAL de la venta en el ticket
2. Detectar la FECHA si aparece
3. DEDUCIR PRODUCTOS POR SUMA:
   - Si un precio en el ticket (especialmente el total) NO coincide con ningún producto individual, es probable que sea la suma de varios.
   - Busca combinaciones racionales de productos que sumen esa cantidad.
   - EJEMPLO CLAVE: Si ves un importe de 13,10€ y no existe ese producto, comprueba si es la suma de un "Pollo Asado con Papas" (ej. 11.80€) + "Mojo Verde" (ej. 1,20€). Si suman exacto, sugiere ambos.
4. Usar SOLO productos de la lista proporcionada

REGLAS IMPORTANTES:
- NO inventes productos ni precios
- NO intentes cuadrar el total a la fuerza, solo si encuentras una combinación lógica que sume el importe.
- NO inventes descuentos
- Devuelve SOLO JSON válido, sin texto adicional
- Si no puedes detectar el total, pon null
- Si hay mucha incertidumbre, usa confidence baja (0.3-0.5)

REGLA SOBRE DECIMALES EN EL TICKET:
- El OCR a veces NO detecta el punto/coma decimal
- Si ves "2350" es probablemente 23.50€
- Si ves "1520" es probablemente 15.20€
- Números de 2 dígitos como "30" pueden ser 3.00€

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

  private constructor() {}

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
        select: { id: true, name: true, price: true },
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

      // Step 3: Build prompt and call LLM
      const prompt = getSalesPrompt(products) + ocrResult.text;
      logger.info(`[SalesAI] Sending to LLM (prompt length: ${prompt.length})...`);

      const llmResponse: LlmResponse = await llmService.generate(prompt);

      if (!llmResponse.raw) {
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
          error: "Error al procesar con IA",
        };
      }

      logger.info(`[SalesAI] LLM response received (length: ${llmResponse.raw.length})`);
      logger.debug(`[SalesAI] LLM Raw Response:\n${llmResponse.raw}`);
      console.log('--- LLM RAW RESPONSE START ---');
      console.log(llmResponse.raw);
      console.log('--- LLM RAW RESPONSE END ---');

      // Step 4: Parse LLM response (use pre-parsed if available)
      const parsedData = llmResponse.parsed || this.parseLlmResponse(llmResponse.raw);
      
      if (parsedData) {
        console.log('--- PARSED DATA START ---');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('--- PARSED DATA END ---');
      }
      
      if (!parsedData) {
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

      // Step 5: Validate and normalize data
      const result = this.validateAndNormalize(parsedData, products);

      const elapsed = Date.now() - startTime;
      logger.info(`[SalesAI] Processing complete in ${elapsed}ms. Suggested ${result.suggestedItems.length} items, confidence: ${result.confidence}`);

      return {
        success: true,
        ...result,
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
      // Handle Spanish format
      const normalized = value.replace(/\./g, "").replace(",", ".");
      num = parseFloat(normalized);
    } else {
      return null;
    }

    if (isNaN(num)) return null;

    // If it's already a decimal, return as is
    if (num % 1 !== 0) return Math.round(num * 100) / 100;

    // If integer, check if we need to add decimals
    const digits = Math.abs(num).toString().length;
    
    if (digits <= 2) {
      // 30 → 3.00, 99 → 9.90 (but could also be 0.99)
      // For totals, 2-digit integers are likely euros, not cents
      // So 30 is probably 30€, not 0.30€
      // Only divide if it seems unreasonably high for a single transaction
      if (num > 500) {
        num = num / 100;
      }
    } else if (digits >= 3) {
      // 250 → 2.50, 1250 → 12.50, 10000 → 100.00
      num = num / 100;
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
