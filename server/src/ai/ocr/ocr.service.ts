import Tesseract from "tesseract.js";
import { logger } from "../../utils/logger.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

/**
 * OCR Service using Tesseract.js
 * Extracts text from images locally without cloud dependencies
 */
export class OcrService {
  private static instance: OcrService;

  private constructor() {}

  public static getInstance(): OcrService {
    if (!OcrService.instance) {
      OcrService.instance = new OcrService();
    }
    return OcrService.instance;
  }

  /**
   * Extract text from an image buffer
   * @param imageBuffer - Buffer containing image data (JPEG, PNG, PDF first page)
   * @param language - OCR language (default: Spanish)
   * @returns Extracted text and confidence score
   */
  async extractText(imageBuffer: Buffer, language: string = "spa"): Promise<OcrResult> {
    try {
      logger.info("Starting OCR text extraction...");

      const result = await Tesseract.recognize(imageBuffer, language, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      logger.info(`OCR completed. Confidence: ${confidence.toFixed(1)}%`);
      logger.debug(`OCR text length: ${text.length} characters`);

      return {
        text,
        confidence,
      };
    } catch (error: any) {
      logger.error(`OCR extraction failed: ${error.message}`);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from a file path
   * @param filePath - Path to the image file
   * @param language - OCR language
   */
  async extractTextFromFile(filePath: string, language: string = "spa"): Promise<OcrResult> {
    try {
      const result = await Tesseract.recognize(filePath, language);
      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
      };
    } catch (error: any) {
      logger.error(`OCR file extraction failed: ${error.message}`);
      throw new Error(`OCR file extraction failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const ocrService = OcrService.getInstance();
