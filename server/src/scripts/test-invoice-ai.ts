#!/usr/bin/env npx tsx

/**
 * Test script for Invoice AI processing
 * Usage: npx tsx src/scripts/test-invoice-ai.ts <image_path>
 */

import { invoiceAiService } from "../ai/index.js";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║            Invoice AI Test Script                          ║
╠════════════════════════════════════════════════════════════╣
║  Usage: npx tsx src/scripts/test-invoice-ai.ts <image>     ║
║                                                            ║
║  Examples:                                                 ║
║    npx tsx src/scripts/test-invoice-ai.ts invoice.jpg      ║
║    npx tsx src/scripts/test-invoice-ai.ts ./ticket.png     ║
║                                                            ║
║  Supported formats: JPEG, PNG, WebP, TIFF                  ║
╚════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  const imagePath = args[0];
  const language = args[1] || "spa";

  // Check file exists
  if (!existsSync(imagePath)) {
    console.error(`❌ Error: File not found: ${imagePath}`);
    process.exit(1);
  }

  console.log("\n🔍 Invoice AI Scanner Test");
  console.log("═".repeat(50));
  console.log(`📄 File: ${imagePath}`);
  console.log(`🌍 Language: ${language}`);
  console.log("═".repeat(50));

  // Check services
  console.log("\n⏳ Checking services...");
  const services = await invoiceAiService.checkServices();
  
  console.log(`   OCR (Tesseract): ${services.ocr ? "✅" : "❌"}`);
  console.log(`   LLM (Ollama):    ${services.llm ? "✅" : "❌"}`);

  if (!services.llm) {
    console.error("\n❌ Ollama is not running!");
    console.log("   Start it with: ollama serve");
    console.log("   Make sure you have a model: ollama pull llama3.2");
    process.exit(1);
  }

  // Process invoice
  console.log("\n⏳ Processing invoice...\n");
  const startTime = Date.now();

  try {
    const buffer = await readFile(imagePath);
    const result = await invoiceAiService.processInvoice(buffer, language);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("═".repeat(50));
    console.log(`⏱️  Processing time: ${duration}s`);
    console.log(`📊 OCR Confidence: ${result.ocrConfidence.toFixed(1)}%`);
    console.log("═".repeat(50));

    if (result.success && result.extractedData) {
      console.log("\n✅ EXTRACTION SUCCESSFUL\n");
      console.log("📋 Extracted Data:");
      console.log("─".repeat(30));
      console.log(`   Supplier:    ${result.extractedData.supplier || "N/A"}`);
      console.log(`   Date:        ${result.extractedData.date || "N/A"}`);
      console.log(`   Total:       ${result.extractedData.totalAmount !== null ? `€${result.extractedData.totalAmount.toFixed(2)}` : "N/A"}`);
      console.log(`   Reference:   ${result.extractedData.reference || "N/A"}`);

      if (result.extractedData.items.length > 0) {
        console.log("\n📦 Items:");
        result.extractedData.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.description || "Unknown"}`);
          console.log(`      Qty: ${item.quantity || "?"} × €${item.unitPrice?.toFixed(2) || "?"} = €${item.total?.toFixed(2) || "?"}`);
        });
      }

      // Show raw OCR text (truncated)
      console.log("\n📝 OCR Raw Text (first 500 chars):");
      console.log("─".repeat(30));
      console.log(result.rawText.substring(0, 500) + (result.rawText.length > 500 ? "..." : ""));
      
    } else {
      console.log("\n❌ EXTRACTION FAILED");
      console.log(`   Error: ${result.error}`);
      
      if (result.rawText) {
        console.log("\n📝 OCR Raw Text:");
        console.log(result.rawText.substring(0, 500));
      }
    }

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }

  console.log("\n");
}

main().catch(console.error);
