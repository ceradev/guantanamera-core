import { ocrService, OcrResult } from "../ocr/ocr.service.js";
import { llmService, LlmResponse } from "../llm/llm.service.js";
import { logger } from "../../utils/logger.js";

/**
 * Invoice item extracted by AI
 */
export interface ExtractedInvoiceItem {
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
}

/**
 * Invoice data extracted by AI
 */
export interface ExtractedInvoiceData {
  supplier: string | null;
  date: string | null;
  totalAmount: number | null;
  reference: string | null;
  category: string | null;
  items: ExtractedInvoiceItem[];
}

/**
 * Full result from invoice AI processing
 */
export interface InvoiceAiResult {
  success: boolean;
  rawText: string;
  ocrConfidence: number;
  extractedData: ExtractedInvoiceData | null;
  llmRawResponse: string | null;
  error?: string;
}

// Prompt optimizado para facturas españolas
const INVOICE_EXTRACTION_PROMPT = `Eres un asistente especializado en analizar texto OCR de facturas y tickets españoles.

Extrae la siguiente información del texto:
- supplier: nombre del proveedor o comercio
- date: fecha de la factura en formato YYYY-MM-DD
- totalAmount: importe total (número decimal)
- reference: número de factura o ticket si existe
- category: categoría del gasto según los productos (ver opciones abajo)
- items: lista de productos/servicios (si se pueden identificar)

Para cada item extrae:
- description: descripción del producto
- quantity: cantidad
- unitPrice: precio unitario
- total: precio total de la línea

CATEGORÍAS DISPONIBLES (usa el código en inglés):
- FOOD: Comida, alimentos, ingredientes, productos alimenticios
- DRINKS: Bebidas, refrescos, agua, cerveza, vino, alcohol
- SUPPLIES: Suministros de oficina, material, productos de limpieza, desechables
- RENT: Alquiler, arrendamiento
- UTILITIES: Servicios, electricidad, agua, gas, internet, teléfono
- MAINTENANCE: Mantenimiento, reparaciones, arreglos
- OTHER: Otros gastos no clasificables

REGLAS IMPORTANTES:
1. Devuelve SOLO JSON válido, sin texto adicional
2. Si un campo no es claro o no existe, usa null
3. NO inventes datos que no estén en el texto
4. Los importes deben ser números, no strings
5. Las fechas deben estar en formato YYYY-MM-DD

REGLA CRÍTICA SOBRE DECIMALES:
- Las facturas SIEMPRE muestran los importes con 2 decimales
- El OCR a veces NO detecta el punto/coma decimal
- Si ves un número como "250" o "1000", los últimos 2 dígitos son los decimales
- Ejemplos de conversión:
  * "250" → 2.50 (dos euros con cincuenta)
  * "1250" → 12.50 (doce euros con cincuenta)
  * "10000" → 100.00 (cien euros)
  * "350" → 3.50 (tres euros con cincuenta)
  * "99" → 0.99 (noventa y nueve céntimos)
- Si el número YA tiene punto/coma, respétalo: "12.50" → 12.50

REGLA SOBRE FECHAS:
- Busca la fecha en el ticket (puede aparecer como "Fecha:", "Date:", o simplemente DD/MM/YYYY)
- Formatos comunes: "15/01/2025", "15-01-2025", "15 Ene 2025"
- SIEMPRE convierte al formato YYYY-MM-DD
- Si ves "15/01/25", el año es 2025

Ejemplo de respuesta:
{
  "supplier": "Mercadona S.A.",
  "date": "2025-01-15",
  "totalAmount": 45.67,
  "reference": "0001-123456",
  "category": "FOOD",
  "items": [
    {"description": "Leche entera 1L", "quantity": 2, "unitPrice": 1.25, "total": 2.50}
  ]
}

TEXTO OCR A ANALIZAR:
`;

/**
 * Invoice AI Service
 * Orchestrates OCR → LLM → Structured Data extraction
 */
export class InvoiceAiService {
  private static instance: InvoiceAiService;

  private constructor() {}

  public static getInstance(): InvoiceAiService {
    if (!InvoiceAiService.instance) {
      InvoiceAiService.instance = new InvoiceAiService();
    }
    return InvoiceAiService.instance;
  }

  /**
   * Check if all required services are available
   */
  async checkServices(): Promise<{ ocr: boolean; llm: boolean }> {
    const llmAvailable = await llmService.isAvailable();
    return {
      ocr: true, // Tesseract.js always available (local)
      llm: llmAvailable,
    };
  }

  /**
   * Process an invoice image and extract structured data
   * @param imageBuffer - Buffer containing the invoice image
   * @param language - OCR language (default: Spanish)
   */
  async processInvoice(
    imageBuffer: Buffer,
    language: string = "spa"
  ): Promise<InvoiceAiResult> {
    try {
      logger.info("Starting invoice AI processing...");

      // Step 1: OCR
      logger.info("Step 1: Running OCR...");
      let ocrResult: OcrResult;
      try {
        ocrResult = await ocrService.extractText(imageBuffer, language);
      } catch (error: any) {
        return {
          success: false,
          rawText: "",
          ocrConfidence: 0,
          extractedData: null,
          llmRawResponse: null,
          error: `OCR failed: ${error.message}`,
        };
      }

      // Log OCR result
      logger.info(`OCR Confidence: ${ocrResult.confidence.toFixed(1)}%`);
      logger.info("=== OCR TEXT START ===");
      logger.info(ocrResult.text);
      logger.info("=== OCR TEXT END ===");

      if (!ocrResult.text || ocrResult.text.length < 10) {
        return {
          success: false,
          rawText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          extractedData: null,
          llmRawResponse: null,
          error: "OCR extracted insufficient text",
        };
      }

      // Step 2: LLM Processing
      logger.info("Step 2: Processing with LLM...");
      let llmResponse: LlmResponse;
      try {
        const prompt = INVOICE_EXTRACTION_PROMPT + ocrResult.text;
        logger.info(`Prompt length: ${prompt.length} characters`);
        llmResponse = await llmService.generate(prompt);
      } catch (error: any) {
        return {
          success: false,
          rawText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          extractedData: null,
          llmRawResponse: null,
          error: `LLM processing failed: ${error.message}`,
        };
      }

      // Log LLM response
      logger.info("=== LLM RAW RESPONSE START ===");
      logger.info(llmResponse.raw);
      logger.info("=== LLM RAW RESPONSE END ===");
      logger.info(`LLM parsed data: ${JSON.stringify(llmResponse.parsed, null, 2)}`);

      // Step 3: Parse and validate response
      logger.info("Step 3: Parsing LLM response...");
      let extractedData: ExtractedInvoiceData | null = null;

      if (llmResponse.parsed) {
        extractedData = this.validateAndNormalize(llmResponse.parsed);
        logger.info(`Extracted data: ${JSON.stringify(extractedData, null, 2)}`);
      } else {
        logger.warn("LLM did not return parsed data");
      }

      logger.info("Invoice AI processing completed successfully");

      return {
        success: true,
        rawText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        extractedData,
        llmRawResponse: llmResponse.raw,
      };
    } catch (error: any) {
      logger.error(`Invoice AI processing error: ${error.message}`);
      return {
        success: false,
        rawText: "",
        ocrConfidence: 0,
        extractedData: null,
        llmRawResponse: null,
        error: error.message,
      };
    }
  }

  /**
   * Process invoice from file path
   */
  async processInvoiceFromFile(
    filePath: string,
    language: string = "spa"
  ): Promise<InvoiceAiResult> {
    const fs = await import("fs/promises");
    const buffer = await fs.readFile(filePath);
    return this.processInvoice(buffer, language);
  }
  // IGIC tax rate (Canarias)
  private readonly IGIC_RATE = 0.07; // 7%

  /**
   * Apply IGIC tax to a monetary value
   */
  private applyIGIC(value: number | null): number | null {
    if (value === null) return null;
    const withTax = value * (1 + this.IGIC_RATE);
    return Math.round(withTax * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate and normalize extracted data
   */
  private validateAndNormalize(data: Record<string, any>): ExtractedInvoiceData {
    return {
      supplier: typeof data.supplier === "string" ? data.supplier : null,
      date: this.normalizeDate(data.date),
      totalAmount: this.normalizeMonetaryValue(data.totalAmount),
      reference: typeof data.reference === "string" ? data.reference : null,
      category: this.normalizeCategory(data.category),
      items: this.normalizeItems(data.items),
    };
  }

  /**
   * Normalize category to valid ExpenseCategory
   */
  private normalizeCategory(category: any): string | null {
    const validCategories = ["FOOD", "DRINKS", "SUPPLIES", "RENT", "UTILITIES", "MAINTENANCE", "OTHER"];
    if (typeof category === "string" && validCategories.includes(category.toUpperCase())) {
      return category.toUpperCase();
    }
    return null;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(date: any): string | null {
    if (!date) return null;
    
    if (typeof date === "string") {
      // Already in correct format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      
      // Try to parse common Spanish formats (DD/MM/YYYY)
      const match = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    
    return null;
  }

  /**
   * Normalize number value
   * If the number appears to be missing decimal places (integer > 10), assume last 2 digits are cents
   */
  private normalizeNumber(value: any): number | null {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      // Handle Spanish number format (1.234,56 → 1234.56)
      const normalized = value.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }
    return null;
  }

  /**
   * Normalize a monetary value - if it's a whole number, insert decimal point
   * - 2 digits: 30 → 3.00 (divide by 10)
   * - 3+ digits: 250 → 2.50, 1250 → 12.50, 10000 → 100.00 (divide by 100)
   */
  private normalizeMonetaryValue(value: any): number | null {
    let num = this.normalizeNumber(value);
    if (num === null) return null;
    
    // If the number is already a decimal (has fractional part), return as is
    if (num % 1 !== 0) return num;
    
    // Determine how many digits the integer has
    const digits = Math.abs(num).toString().length;
    
    if (digits <= 2) {
      // 2-digit numbers: 30 → 3.00, 40 → 4.00
      num = num / 10;
    } else {
      // 3+ digit numbers: 250 → 2.50, 1250 → 12.50
      num = num / 100;
    }
    
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Normalize items array
   */
  private normalizeItems(items: any): ExtractedInvoiceItem[] {
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      description: typeof item.description === "string" ? item.description : null,
      quantity: this.normalizeNumber(item.quantity), // Quantity stays as integer
      unitPrice: this.normalizeMonetaryValue(item.unitPrice),
      total: this.normalizeMonetaryValue(item.total),
    }));
  }
}

// Export singleton instance
export const invoiceAiService = InvoiceAiService.getInstance();
