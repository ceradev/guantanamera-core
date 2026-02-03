import { logger } from "../../utils/logger.js";

export interface LlmResponse {
  raw: string;
  parsed: Record<string, any> | null;
}

export interface LlmConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

const DEFAULT_CONFIG: LlmConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: process.env.OLLAMA_MODEL || "mistral",
  timeout: 120000, // 2 minutes for slow models
};

/**
 * LLM Service for local AI processing using Ollama
 * Connects to Ollama API for text interpretation
 */
export class LlmService {
  private static instance: LlmService;
  private config: LlmConfig;

  private constructor(config: Partial<LlmConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<LlmConfig>): LlmService {
    if (!LlmService.instance) {
      LlmService.instance = new LlmService(config);
    }
    return LlmService.instance;
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models from Ollama
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to fetch models");
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error: any) {
      logger.error(`Failed to get models: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate a response from the LLM
   * @param prompt - The prompt to send
   * @param systemPrompt - Optional system prompt for context
   */
  async generate(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    try {
      logger.info(`Sending prompt to LLM (model: ${this.config.model})...`);

      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          system: systemPrompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent JSON output
            num_predict: 2048,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const raw = data.response || "";

      logger.info(`LLM response received (${raw.length} characters)`);

      // Try to parse JSON from response
      let parsed: Record<string, any> | null = null;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || 
                         raw.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, raw];
        
        const jsonStr = jsonMatch[1] || raw;
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        logger.warn("Could not parse LLM response as JSON");
      }

      return { raw, parsed };
    } catch (error: any) {
      logger.error(`LLM generation failed: ${error.message}`);
      throw new Error(`LLM generation failed: ${error.message}`);
    }
  }

  /**
   * Update the model to use
   */
  setModel(model: string): void {
    this.config.model = model;
    logger.info(`LLM model changed to: ${model}`);
  }
}

// Export singleton instance
export const llmService = LlmService.getInstance();
