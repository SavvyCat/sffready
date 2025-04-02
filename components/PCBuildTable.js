import { useMemo } from "react";

const PCBuildTable = ({
  aiMessageContent,
  selectedGpu,
  activeCase,
  budget,
  useWebSearch,
}) => {
  // Parse the AI message content to extract components
  const parsedBuild = useMemo(() => {
    if (!aiMessageContent) return null;

    // Initialize the build object with default structure
    const buildData = {
      components: [],
      totalCost: 0,
      additionalRecommendations: [],
    };

    try {
      // Match component sections with pattern: ### 1. Component Name
      const componentSections =
        aiMessageContent.match(
          /### \d+\.\s+[^#]+?(?=### \d+\.|### Total Cost|$)/gs
        ) || [];

      // Process each component section
      componentSections.forEach((section) => {
        // Extract component type
        const typeMatch = section.match(/### \d+\.\s+([\w\s]+)/);
        if (!typeMatch) return;

        const type = typeMatch[1].trim();

        // Extract component name and price - improved regex to handle price formats better
        const nameMatch = section.match(
          /\*\*([^*]+)\*\*\s+-\s+\*\*Price:\*\*\s+\$(\d+(?:\.\d+)?)/
        );

        // Skip components marked as "Not required" or similar
        if (!nameMatch) {
          const noRequiredMatch = section.match(
            /\*\*([^*]+)\*\*\s+-\s+\*\*Price:\*\*\s+(Not required|N\/A|\$0)/i
          );
          if (noRequiredMatch) {
            buildData.components.push({
              type,
              name: noRequiredMatch[1].trim(),
              price: 0,
              reason: "Not required for this build",
            });
          }
          return;
        }

        const name = nameMatch[1].trim();
        const price = parseFloat(nameMatch[2]);

        // Extract reason with links preserved
        const reasonMatch = section.match(/\*\*Reason:\*\*\s+(.*?)(?=\n\n|$)/s);
        let reason = reasonMatch ? reasonMatch[1].trim() : "";

        // Extract any links in the reason
        const links = [];
        const linkRegex = /\(([^)]+)\)/g;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(reason)) !== null) {
          if (linkMatch[1].startsWith("http")) {
            links.push(linkMatch[1]);
          }
        }

        // Remove the links from the visible reason text
        reason = reason.replace(/\s*\([^)]+\)/g, "");

        // Add component to the build data
        buildData.components.push({ type, name, price, reason, links });
      });

      // Try multiple patterns to extract the total cost

      // Pattern 1: Direct from the Total Cost section with the updated format
      const totalCostExactMatch = aiMessageContent.match(
        /\*\*Total Cost: \$(\d+(?:\.\d+)?)\*\* \(excluding GPU and case\)/
      );

      // Pattern 2: From a Total Cost Calculation section
      const costSectionMatch = aiMessageContent.match(
        /### Total Cost Calculation[\s\S]+?Total Cost:?\s+\$(\d+(?:\.\d+)?)/i
      );

      // Pattern 3: Just looking for Total Cost anywhere
      const totalCostMatch = aiMessageContent.match(
        /Total Cost:?\s+\$(\d+(?:\.\d+)?)/i
      );

      // Use the first pattern that matches
      if (totalCostExactMatch) {
        buildData.totalCost = parseFloat(totalCostExactMatch[1]);
      } else if (costSectionMatch) {
        buildData.totalCost = parseFloat(costSectionMatch[1]);
      } else if (totalCostMatch) {
        buildData.totalCost = parseFloat(totalCostMatch[1]);
      } else {
        // If no explicit total is found, calculate from components
        buildData.totalCost = buildData.components.reduce(
          (sum, comp) => sum + (comp.price || 0),
          0
        );
      }

      // Verify with recalculation to ensure consistency
      const calculatedTotal = buildData.components.reduce(
        (sum, comp) => sum + (comp.price || 0),
        0
      );

      // If there's a significant discrepancy, log it and use the calculated value
      if (Math.abs(calculatedTotal - buildData.totalCost) > 1) {
        console.warn(
          `Total cost discrepancy: AI reported ${buildData.totalCost}, calculated ${calculatedTotal}`
        );
        buildData.totalCost = calculatedTotal;
      }

      // Extract remaining budget
      const remainingBudgetMatch = aiMessageContent.match(
        /Remaining Budget[:\s]+\$(\d+(?:\.\d+)?)/i
      );
      if (remainingBudgetMatch) {
        buildData.remainingBudget = parseFloat(remainingBudgetMatch[1]);
      }

      // Extract all additional recommendations
      const additionalRecSection = aiMessageContent.match(
        /Additional Recommendations([\s\S]+?)(?=\n\n|$)/i
      );
      if (additionalRecSection) {
        // Process all recommendation points marked with asterisks or numbers
        const recPoints =
          additionalRecSection[1].match(
            /(\*\*|\d+\.\s+|•\s+|\*\s+|\-\s+)([^*\n]+?)(?=\*\*|\d+\.\s+|•\s+|\*\s+|\-\s+|$)/g
          ) || [];

        buildData.additionalRecommendations = recPoints
          .map((point) => {
            // Clean up the point text
            return point
              .replace(/(\*\*|\d+\.\s+|•\s+|\*\s+|\-\s+)/g, "")
              .trim();
          })
          .filter((point) => point.length > 0);
      }

      return buildData;
    } catch (error) {
      console.error("Error parsing build content:", error);
      return null;
    }
  }, [aiMessageContent]);

  // Fallback if parsing fails
  if (!parsedBuild) {
    return (
      <div className="p-4 text-red-400 bg-red-900/20 rounded-lg">
        Unable to parse build data. Please check the format of the AI response.
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate remaining budget if not explicitly provided
  const remainingBudget =
    parsedBuild.remainingBudget !== undefined
      ? parsedBuild.remainingBudget
      : budget
      ? budget - parsedBuild.totalCost
      : null;

  // Extract case name for compatibility section
  const caseName = activeCase ? activeCase.product_name : "";

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden shadow-lg ">
      {/* Header with pre-selected components */}
      <div className="p-4 bg-gradient-to-r from-zinc-800 to-black border-b border-zinc-700">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Custom PC Build</h2>
          <div className="flex items-center gap-2">
            {useWebSearch && (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs font-medium">
                Web Search Enabled
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedGpu && (
            <div className="px-3 py-2 bg-zinc-800 rounded-lg text-white">
              <span className="text-zinc-400">GPU:</span> {selectedGpu.title}
            </div>
          )}
          {activeCase && (
            <div className="px-3 py-2 bg-zinc-800 rounded-lg text-white">
              <span className="text-zinc-400">Case:</span>{" "}
              {activeCase.product_name}
            </div>
          )}
          {budget && (
            <div className="px-3 py-2 bg-indigo-900 rounded-lg text-white">
              <span className="text-indigo-300">Budget:</span>{" "}
              {formatCurrency(budget)}
            </div>
          )}
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-hidden overflow-x-auto">
        <table className="w-full text-zinc-300">
          <thead>
            <tr className="bg-black">
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider border-b border-zinc-700 w-1/6">
                Component
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider border-b border-zinc-700">
                Name
              </th>
              <th className="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider border-b border-zinc-700 w-1/6">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {parsedBuild.components.map((component, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0 ? "bg-zinc-800/40" : "bg-zinc-900/60"
                }
              >
                <td className="py-4 px-4 border-b border-zinc-700">
                  <div className="font-medium text-white">{component.type}</div>
                </td>
                <td className="py-4 px-4 border-b border-zinc-700">
                  <div className="font-medium text-white">{component.name}</div>
                  {component.reason && (
                    <div className="text-sm text-zinc-400 mt-1">
                      {component.reason}
                      {component.links && component.links.length > 0 && (
                        <div className="mt-1 text-xs">
                          {component.links.map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 mr-2 inline-block"
                            >
                              [Source {i + 1}]
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center border-b border-zinc-700 font-mono">
                  {formatCurrency(component.price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-800 font-semibold text-white">
              <td className="py-3 px-4">Total</td>
              <td colSpan="1"></td>
              <td className="py-3 px-4 text-center">
                {formatCurrency(parsedBuild.totalCost)}
              </td>
            </tr>
            {remainingBudget !== null && (
              <tr className="bg-indigo-900/30 font-semibold text-indigo-200">
                <td className="py-3 px-4">Remaining Budget</td>
                <td colSpan="1"></td>
                <td className="py-3 px-4 text-center">
                  {formatCurrency(remainingBudget)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      {/* Actions */}
      <div className="p-4 bg-gradient-to-r from-black to-zinc-900 border-t border-zinc-800 flex justify-end gap-3">
        <button
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition flex items-center gap-2"
          onClick={() => {
            const gpuInfo = selectedGpu ? `GPU: ${selectedGpu.title}` : "";
            const caseInfo = activeCase
              ? `\nCase: ${activeCase.product_name}`
              : "";
            const buildInfo = aiMessageContent
              ? `\n\nBuild details:\n${aiMessageContent}`
              : "";
            const content = `My Custom PC Build ${gpuInfo}${caseInfo}${buildInfo}`;

            if (navigator.clipboard) {
              navigator.clipboard
                .writeText(content)
                .then(() => alert("Build copied to clipboard!"))
                .catch((err) => console.error("Could not copy text: ", err));
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Build
        </button>
      </div>
    </div>
  );
};

// Create a wrapper component that can be directly used in place of formatBuildResponse
const BuildResponseFormatter = ({
  content,
  selectedGpu,
  activeCase,
  budget,
  useWebSearch,
}) => {
  if (!content) return null;

  return (
    <PCBuildTable
      aiMessageContent={content}
      selectedGpu={selectedGpu}
      activeCase={activeCase}
      budget={budget}
      useWebSearch={useWebSearch}
    />
  );
};

export default BuildResponseFormatter;
