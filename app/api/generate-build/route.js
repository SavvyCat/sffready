import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  // Get JSON body from the request
  const body = await req.json();

  // Extract messages and build parameters
  const { messages, buildParams } = body;
  
  const { gpu, budget } = buildParams || {};

  // Create a response stream
  const result = streamText({
    model: openai("gpt-4o"),
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are a PC hardware expert who specializes in recommending balanced PC builds based on specific requirements. " +
          "When generating a PC build, provide detailed component recommendations using the following consistent format:\n\n" +
          "### 1. CPU\n" +
          "**[Component Name]** - **Price:** $XXX\n" +
          "**Reason:** Brief explanation of why this component was selected.\n\n" +
          "### 2. Motherboard\n" +
          "**[Component Name]** - **Price:** $XXX\n" +
          "**Reason:** Brief explanation of why this component was selected.\n\n" +
          "Continue this exact format for all components (RAM, Storage, Power Supply, Case).\n\n" +
          "End with a section titled '### Total Cost Calculation' that lists each component with its price in a bullet point format:\n" +
          "- **CPU:** $XXX\n" +
          "- **Motherboard:** $XXX\n" +
          "etc.\n\n" +
          "Then provide a total cost summary and any final recommendations.\n\n" +
          "Ensure all components are compatible with each other and stay within the user's budget. If the budget is too tight, explain what compromises might be needed."
      },
      ...messages,
    ],
  });

  // Return a streaming response
  return result.toDataStreamResponse();
}