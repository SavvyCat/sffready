import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 60 seconds (increased from 30)
export const maxDuration = 60;

export async function POST(req) {
  try {
    // Get JSON body from the request
    const body = await req.json();

    // Extract messages and build parameters with better error handling
    const { messages = [], buildParams = {} } = body;
    const { gpu, budget, useWebSearch = true, selectedCase } = buildParams;

    // Validate required parameters
    if (!gpu) {
      return new Response(JSON.stringify({ error: "GPU selection is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!budget || isNaN(budget) || budget <= 0) {
      return new Response(JSON.stringify({ error: "Valid budget is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Define system prompt with enhanced component information and explicit calculation instructions
    const systemPrompt = `You are a PC hardware expert who specializes in recommending balanced PC builds based on specific requirements.
When generating a PC build, provide detailed component recommendations using the following consistent format:

### 1. CPU
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

### 2. CPU Cooler (if needed)
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

### 3. Motherboard
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

### 4. RAM
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

### 5. Storage
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

### 6. Power Supply
**[Component Name]** - **Price:** $XXX
**Reason:** Brief explanation of why this component was selected.

End with a section titled '### Total Cost Calculation' that lists each component with its price in a bullet point format:
- **CPU:** $XXX
- **CPU Cooler:** $XXX (if applicable, if not needed write "Not required" or "$0")
- **Motherboard:** $XXX
- **RAM:** $XXX
- **Storage:** $XXX
- **Power Supply:** $XXX

IMPORTANT: You must carefully add up all component prices to ensure mathematical accuracy. 
Calculate the final total by adding ONLY these prices - do NOT include the GPU or case price in this total.
Double-check your math before providing the final total.

For example, if the components are:
- CPU: $300
- CPU Cooler: $50
- Motherboard: $150
- RAM: $100
- Storage: $120
- Power Supply: $80

The total should be $300 + $50 + $150 + $100 + $120 + $80 = $800.

Then write: "**Total Cost: $800** (excluding GPU and case)"

IMPORTANT NOTES:
1. The user's budget of $${budget} does NOT include the GPU (${gpu.title}, $${gpu.price || 'unknown price'}) or the case ${selectedCase ? `(${selectedCase.product_name}, $${selectedCase.price || 'unknown price'})` : ''}.
2. The budget is only for: CPU, CPU cooler (if needed), motherboard, RAM, storage, and power supply.
3. Ensure all components are compatible with the selected GPU and each other.
4. Prioritize performance for gaming and content creation unless specified otherwise.
5. If the budget is tight, explain which compromises were made.
6. Always verify your price addition is mathematically correct. This is critically important.`;

    // Enhanced system prompt for web search
    const webSearchSystemPrompt = systemPrompt + `

When using web search:
1. Find the latest prices from major retailers like Amazon, Newegg, Best Buy, or Micro Center.
2. Focus on components that are currently in stock and widely available.
3. Use specific model numbers when searching for the most accurate pricing.
4. If multiple price points exist, use the lowest price from a reputable retailer.
5. For CPU coolers, consider whether the CPU includes a stock cooler that may be adequate.
6. Pay special attention to compatibility with the user's selected GPU (${gpu.title}) ${selectedCase ? `and case (${selectedCase.product_name})` : ''}.
7. The GPU is ${gpu.length}mm long, ${gpu.height}mm tall, and ${gpu.thickness} PCIe slots thick - ensure the other components are compatible with these dimensions.
8. After finding prices for all components, double-check your math when calculating the total cost.`;

    // Configuration for response stream
    const config = {
      model: useWebSearch ? openai.responses("gpt-4o") : openai("gpt-4o"),
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: useWebSearch ? webSearchSystemPrompt : systemPrompt,
        },
        ...messages,
      ],
    };

    // Add web search tools if enabled
    if (useWebSearch) {
      config.tools = {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: 'standard',
          numWebResults: 3  // Increased from default
        }),
      };
      config.toolChoice = { type: 'tool', toolName: 'web_search_preview' };
    }

    // Create response stream
    const result = streamText(config);

    // Return a streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in PC build generation:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred while generating your PC build", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}