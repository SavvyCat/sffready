"use client";

import getFilteredCases from "@/Backend/Data/GetDataBasesOn";
import supabase from "@/Backend/supabase";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import BuildResponseFormatter from "./PCBuildTable";
import SimplifiedCaseDisplay from "./SimplifiedCaseComponent";
export default function PCBuildGenerator() {
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [budget, setBudget] = useState(1000);
  const [gpus, setGpus] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Brands");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [compatibleCases, setCompatibleCases] = useState([]);
  const [recommendedCase, setRecommendedCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showAllCases, setShowAllCases] = useState(true);
  const [caseSlug, setCaseSlug] = useState(null);
  const [caseSearchText, setCaseSearchText] = useState("");
  const [filteredCases, setFilteredCases] = useState([]);
  // Categories for GPU brands
  const categories = [
    "ASL",
    "ASRock",
    "ASUS",
    "All Brands",
    "Biostar",
    "CORSAIR",
    "Colorful",
    "ELSA",
    "EVGA",
    "GUNNIR",
    "Gainward",
    "Galax",
    "Gigabyte",
    "Huananzhi",
    "INNO3D",
    "Intel",
    "KFA2",
    "KUROUTOSHIKOU",
    "Leadtek",
    "MAXSUN",
    "MSI",
    "Manli",
    "Matrox",
    "NVIDIA",
    "Onda",
    "PNY",
    "Palit",
    "Point Of View",
    "Sparkle",
    "Yeston",
    "Zogis",
    "Zotac",
    "emTek",
  ];

  const [errorInfo, setErrorInfo] = useState({
    isError: false,
    message: "",
  });

  useEffect(() => {
    const activeCase = selectedCase || recommendedCase;

    if (activeCase && activeCase.url) {
      setCaseSlug(extractCaseSlugFromUrl(activeCase.url));
    } else {
      setCaseSlug(null);
    }
  }, [selectedCase, recommendedCase]);

  const extractCaseSlugFromUrl = (url) => {
    if (!url) return null;

    // The URL format appears to be something like "...abee/case-slug"
    const match = url.match(/abee\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const handleRateLimitError = (error) => {
    console.log("Error received:", error);

    try {
      // Try to parse the error message
      let errorData =
        typeof error.message === "string"
          ? JSON.parse(error.message)
          : error.message;

      // Extract error message and wait time
      const errorMessage = errorData.message || "Rate limit exceeded";
      const waitTime =
        errorData.waitTime ||
        (errorData.message && errorData.message.match(/(\d+)/)?.[1]) ||
        818; // default to 818 if no time found

      // Set error state with more detailed information
      setErrorInfo({
        isError: true,
        message: `${errorMessage}.`,
        displayTime: waitTime,
      });
    } catch (e) {
      console.error("Error parsing rate limit message:", e);
      setErrorInfo({
        isError: true,
        message: "You've reached the request limit. Please try again later.",
      });
    }
  };
  // Simplify the Try Again handler
  const handleTryAgain = (e) => {
    setErrorInfo({ isError: false });
    generateBuild(e);
  };

  // Use the useChat hook for AI integration
  const {
    messages,
    append,
    status: chatStatus,
    sources,
  } = useChat({
    api: "/api/generate-build",
    id: "pc-build-generator",
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        buildParams: {
          gpu: selectedGpu,
          budget: budget,
          useWebSearch: useWebSearch,
          selectedCase: selectedCase || recommendedCase,
        },
        messages: messages,
      };
    },
    onError: handleRateLimitError,
    onResponse: () => {
      // Reset error state when a successful response comes back
      if (errorInfo.isError) {
        setErrorInfo({
          isError: false,
          message: "",
        });
      }
    },
  });

  // Fetch compatible cases when GPU selection changes
  useEffect(() => {
    const fetchCompatibleCases = async () => {
      if (
        selectedGpu &&
        selectedGpu.length &&
        selectedGpu.height &&
        selectedGpu.thickness
      ) {
        setCaseLoading(true);
        setSelectedCase(null);
        try {
          const cases = await getFilteredCases(
            selectedGpu.length,
            selectedGpu.height,
            selectedGpu.thickness
          );
          setCompatibleCases(cases);
          setFilteredCases(cases); // Set filtered cases to all compatible cases initially

          // Find the most optimal case (smallest volume with good airflow)
          if (cases.length > 0) {
            // Sort cases by volume (if available) or overall size
            const sortedCases = [...cases].sort((a, b) => {
              // If volume data is available, use that
              if (a.volume && b.volume) {
                return a.volume - b.volume;
              }
              // Otherwise approximate by dimensions
              return (
                a.length * a.height * a.depth - b.length * b.height * b.depth
              );
            });

            // Select the first (smallest) compatible case as recommended
            setRecommendedCase(sortedCases[0]);
          } else {
            setRecommendedCase(null);
          }
        } catch (error) {
          console.error("Error fetching compatible cases:", error);
        } finally {
          setCaseLoading(false);
        }
      } else {
        setCompatibleCases([]);
        setFilteredCases([]);
        setRecommendedCase(null);
        setSelectedCase(null);
      }
    };

    fetchCompatibleCases();
  }, [selectedGpu]);

  // Search GPUs as user types
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const newTimeout = setTimeout(async () => {
      if (value) {
        const filteredGpus = await getFilteredGPUs(value, selectedCategory);
        setGpus(filteredGpus);
      } else {
        setGpus([]);
      }
    }, 500);

    setDebounceTimeout(newTimeout);
  };

  // Handle category changes
  const handleCategoryChange = async (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);

    if (searchText) {
      const filteredGpus = await getFilteredGPUs(searchText, newCategory);
      setGpus(filteredGpus);
    } else {
      setGpus([]);
    }
  };

  // When user selects a GPU
  const handleGpuSelection = (gpuItem) => {
    setSearchText(gpuItem.title);
    setSelectedGpu(gpuItem);
    setGpus([]); // Clear dropdown after selection
  };

  // Select a specific case
  const handleCaseSelection = (caseItem) => {
    setSelectedCase(caseItem);
    setShowAllCases(false);
  };

  // Function to get filtered GPUs from the database
  const getFilteredGPUs = async (partialMatch, selectedCategory) => {
    try {
      function separateNumberAndCharacter(input) {
        const result = input.replace(
          /(\d+)([a-zA-Z]+)|([a-zA-Z]+)(\d+)/,
          (match, num, char, charFirst, numFirst) => {
            if (num && char) {
              return `${num} ${char}`;
            } else if (charFirst && numFirst) {
              return `${charFirst} ${numFirst}`;
            }
          }
        );
        return result;
      }

      const match = separateNumberAndCharacter(partialMatch);

      if (selectedCategory === "All Brands") {
        let query = supabase
          .from("GPU")
          .select("*")
          .ilike("title", `%${match}%`);
        const { data, error } = await query;

        if (error) {
          console.error("Error fetching GPUs:", error);
          return [];
        }
        return data;
      } else {
        const { data: data1, error: error1 } = await supabase
          .from("GPU")
          .select("*")
          .ilike("title", `%${match}%`);

        const { data: data2, error: error2 } = await supabase
          .from("GPU")
          .select("*")
          .eq("category", selectedCategory);

        if (error1) {
          console.error("Error fetching GPUs:", error1);
          return [];
        }
        if (error2) {
          console.error("Error fetching categories:", error2);
          return [];
        }

        const intersection = data1?.filter((item1) =>
          data2.some((item2) => item1.image_id === item2.image_id)
        );

        return intersection;
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      return [];
    }
  };

  // Format the AI response content into better HTML
  const formatBuildResponse = (content) => {
    if (!content) return null;

    // Process the content by replacing markdown patterns with HTML elements
    let processedContent = content
      // Format component headings
      .replace(/### ([\d\.]+)?\s*([^\n]+)/g, (match, number, title) => {
        const componentNumber = number ? number.trim() : "";
        const componentTitle = title.trim();
        return `<div class="component-category">
          ${
            componentNumber
              ? `<span class="component-number">${componentNumber}</span>`
              : ""
          }
          <span class="component-title">${componentTitle}</span>
        </div>`;
      })
      // Format bold text for component names and specifications
      .replace(
        /\*\*([^*]+)\*\*/g,
        '<span class="component-highlight">$1</span>'
      )
      // Format bullet points in the cost summary section
      .replace(
        /- \*\*([^:]+):\*\* ([\$\d\.]+)/g,
        '<div class="cost-item"><span class="cost-label">$1:</span> <span class="cost-value">$2</span></div>'
      )
      // Add proper paragraph spacing
      .replace(/\n\n/g, "</p><p>")
      // Add component description styling
      .replace(
        /Reason: (.+?)(?=<\/p>|<div|$)/g,
        '<div class="component-description">$1</div>'
      );

    // Wrap the entire content in a div with proper structure
    processedContent = `<div class="build-content"><p>${processedContent}</p></div>`;

    // Add sources section if available
    if (sources && sources.length > 0) {
      const sourcesHtml = `
        <div class="sources-section">
          <div class="sources-title">Data Sources</div>
          <div class="sources-list">
            ${sources
              .map(
                (source, index) => `
              <div class="source-item">
                <span class="source-number">${index + 1}.</span>
                <a href="${
                  source.url
                }" target="_blank" rel="noopener noreferrer" class="source-link">
                  ${
                    source.title ||
                    source.url.replace(/(^\w+:|^)\/\//, "").split("/")[0]
                  }
                </a>
                ${
                  source.publishedDate
                    ? `<span class="source-date">(${source.publishedDate})</span>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
      processedContent += sourcesHtml;
    }

    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  // Get the latest AI response
  const latestAiMessage = messages
    .filter((message) => message.role === "assistant")
    .pop();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get GPU image
  const getGpuImage = () => {
    if (selectedGpu && selectedGpu.image_id) {
      return `/images-gpu/${selectedGpu.image_id}.jpg`;
    }
    return null;
  };

  // Get case image
  const getCaseImage = (caseItem) => {
    if (caseItem && caseItem.image_id) {
      return `/images/${caseItem.image_id}/1.jpg`;
    }
    return null;
  };

  // Get active case (either selected or recommended)
  const activeCase = selectedCase || recommendedCase;

  const handleCaseSearchChange = (e) => {
    setShowAllCases(true);
    const value = e.target.value.toLowerCase();
    setCaseSearchText(value);

    if (value.trim() === "") {
      setFilteredCases(compatibleCases);
    } else {
      const filtered = compatibleCases.filter((caseItem) =>
        caseItem.product_name.toLowerCase().includes(value)
      );
      setFilteredCases(filtered);
    }
  };

  // Generate a PC build based on selected GPU and budget
  const generateBuild = (e) => {
    e.preventDefault();

    if (!selectedGpu) {
      alert("Please select a GPU first");
      return;
    }

    // Create a more detailed prompt with clear budget instructions
    let prompt = `Generate a PC build with a budget of $${budget}. This budget is for CPU, motherboard, RAM, storage, power supply, and CPU cooler only.`;

    // Rest of your existing prompt generation code...

    // Add GPU information with detailed specs when available
    prompt += ` I already have selected a ${
      selectedGpu.title
    } GPU which costs $${
      selectedGpu.price || "(price unknown)"
    } and has dimensions of ${selectedGpu.length}mm length, ${
      selectedGpu.height
    }mm height, and uses ${selectedGpu.thickness} PCIe slots.`;

    // Add case information if available
    if (activeCase) {
      prompt += ` Based on GPU compatibility, I've selected the ${
        activeCase.product_name
      } case which costs $${activeCase.price || "unknown"} with dimensions of ${
        activeCase.length
      }mm × ${activeCase.height}mm × ${activeCase.depth}mm.`;
    } else {
      prompt += ` I still need recommendations for a compatible case that will fit this GPU.`;
    }

    // More specific component requests
    prompt += ` Please recommend:
  1. A suitable CPU that pairs well with my GPU
  2. An appropriate CPU cooler (if the CPU doesn't come with a good stock one)
  3. A compatible motherboard with the features I need
  4. RAM that matches the CPU/motherboard capabilities
  5. Fast SSD storage (preferably NVMe)
  6. A reliable power supply with enough wattage for the system`;

    if (!activeCase) {
      prompt += `
  7. A case that fits my GPU well and has good airflow`;
    }

    // Clearer format instructions
    prompt += `\n\nFor each component, include the specific model name, current price, and a brief reason for why you selected it. Please format each component section clearly and end with a total cost summary. The total build cost (excluding my GPU ${
      activeCase ? "and case" : ""
    }) should stay within my $${budget} budget.`;

    // Use append to send a message to the AI
    append({
      role: "user",
      content: prompt,
    }).catch((error) => {
      console.error("Error sending message:", error);
      handleRateLimitError(error);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl w-full mx-auto bg-zinc-900 rounded-xl shadow-2xl shadow-black/50 overflow-hidden border border-zinc-800">
        <div className="p-6 bg-gradient-to-r from-black to-zinc-900 border-b border-zinc-800">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-4xl">
              <Image
                src="/image.png"
                alt="PC Build Generator"
                width={50}
                height={50}
              />
            </span>{" "}
            Ai PC Build Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Pick out your GPU and select a compatible case, set your budget for
            the remaining components, and get a PC build recommendation with the
            best compatible hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left column - Form controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black p-4 rounded-lg shadow-inner border border-zinc-800">
              <label className="block mb-3 text-lg font-medium text-white">
                Select GPU Brand
              </label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-white p-2.5"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-black p-4 rounded-lg shadow-inner border border-zinc-800">
              <label className="block mb-3 text-lg font-medium text-white">
                Search GPU Model
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={handleSearchChange}
                  placeholder="e.g., RTX 3080, RX 6800 XT"
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-white"
                />
                {gpus.length > 0 && searchText && (
                  <div className="absolute z-20 w-full mt-1 bg-black border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {gpus.map((gpuItem, index) => (
                      <div
                        key={index}
                        className="p-2.5 cursor-pointer text-white hover:bg-zinc-800 border-b border-zinc-800 last:border-b-0"
                        onClick={() => handleGpuSelection(gpuItem)}
                      >
                        {gpuItem.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Case compatibility info */}
            {selectedGpu && (
              <div className="bg-black p-4 rounded-lg shadow-inner border border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-white">
                    Compatible Cases
                  </h3>
                  {compatibleCases.length > 1 && (
                    <button
                      onClick={() => setShowAllCases(!showAllCases)}
                      className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition"
                    >
                      {showAllCases ? "Hide" : "Show All"}
                    </button>
                  )}
                </div>
                {caseLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : compatibleCases.length > 0 ? (
                  <div className="text-zinc-400">
                    <p className="mb-2">
                      Found {compatibleCases.length} compatible cases
                    </p>

                    {/* Case search input */}
                    <div className="mb-2">
                      <input
                        type="text"
                        value={caseSearchText}
                        onChange={handleCaseSearchChange}
                        placeholder="Search cases..."
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-white text-sm"
                      />
                    </div>

                    {!showAllCases ? (
                      activeCase && (
                        <div className="text-white bg-zinc-800 p-2 rounded mb-2">
                          <div className="font-medium">
                            {activeCase.product_name}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                        {filteredCases.map((caseItem, index) => (
                          <div
                            key={index}
                            className={`text-white bg-zinc-800 p-2 rounded cursor-pointer hover:bg-zinc-700 transition ${
                              (selectedCase &&
                                selectedCase.image_id === caseItem.image_id) ||
                              (!selectedCase &&
                                recommendedCase &&
                                recommendedCase.image_id === caseItem.image_id)
                                ? "border border-white"
                                : ""
                            }`}
                            onClick={() => handleCaseSelection(caseItem)}
                          >
                            <div className="font-medium">
                              {caseItem.product_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-400">
                    No compatible cases found for this GPU
                  </p>
                )}
              </div>
            )}

            {/* Case Section */}
            <div className="bg-black p-4 rounded-lg shadow-inner border border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <label className="text-lg font-medium text-white">
                  Your Budget
                </label>
                <span className="text-white font-bold text-xl bg-zinc-900 px-3 py-1 rounded-md">
                  {formatCurrency(budget)}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-sm mt-2 text-zinc-400">
                <span>$500</span>
                <span>$10000</span>
              </div>
            </div>
            {/* Web Search Toggle */}
            <div className="bg-black p-4 rounded-lg shadow-inner border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-lg font-medium text-white block mb-1">
                    Use Web Search
                  </label>
                  <p className="text-zinc-500 text-sm">
                    Get real-time pricing data from online retailers
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 ml-2">
                  <input
                    type="checkbox"
                    id="toggle-web-search"
                    className="sr-only"
                    checked={useWebSearch}
                    onChange={() => setUseWebSearch(!useWebSearch)}
                  />
                  <label
                    htmlFor="toggle-web-search"
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                      useWebSearch ? "bg-white" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in-out ${
                        useWebSearch
                          ? "translate-x-6 bg-black"
                          : "translate-x-0 bg-zinc-900"
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={generateBuild}
              disabled={
                !selectedGpu ||
                chatStatus === "streaming" ||
                chatStatus === "submitted"
              }
              className="w-full p-4 bg-white text-black hover:bg-gray-200 font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {chatStatus === "streaming" || chatStatus === "submitted" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {useWebSearch
                    ? "Searching & Generating..."
                    : "Generating Build..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🔧</span> Generate PC Build
                </span>
              )}
            </button>
          </div>

          {/* Right column - Selected GPU and Build Results */}
          <div className="lg:col-span-2">
            {/* Selected GPU and Case Display */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* GPU Section */}
              {selectedGpu ? (
                <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-lg transition-all duration-300 border border-zinc-800">
                  <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">
                      Selected GPU
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center mb-4 bg-white">
                      {getGpuImage() ? (
                        <div className="w-48 h-48 relative bg-transparent rounded-lg overflow-hidden ">
                          <img
                            src={getGpuImage()}
                            alt={selectedGpu.title}
                            className="absolute inset-0 w-full h-full object-contain "
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-zinc-800/50 rounded-lg flex items-center justify-center border border-zinc-700">
                          <span className="text-zinc-500 text-sm">
                            No image available
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-center text-white font-medium mb-2">
                      {selectedGpu.title}
                    </h3>
                    {selectedGpu.price && (
                      <p className="text-center text-gray-300 text-sm mb-2">
                        {formatCurrency(selectedGpu.price)}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-zinc-400">
                      <div className="bg-zinc-800 rounded p-1">
                        <span className="block text-zinc-500">Length</span>
                        <span className="text-white">
                          {selectedGpu.length} mm
                        </span>
                      </div>
                      <div className="bg-zinc-800 rounded p-1">
                        <span className="block text-zinc-500">Height</span>
                        <span className="text-white">
                          {selectedGpu.height} mm
                        </span>
                      </div>
                      <div className="bg-zinc-800 rounded p-1">
                        <span className="block text-zinc-500">Slots</span>
                        <span className="text-white">
                          {selectedGpu.thickness}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-black rounded-xl p-6 flex flex-col items-center justify-center border border-zinc-800">
                  <div className="text-zinc-500 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-sm">Search and select a GPU to start</p>
                  </div>
                </div>
              )}

              {/* Case Section */}
              {activeCase ? (
                <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-lg transition-all duration-300 border border-zinc-800">
                  <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">
                      {selectedCase ? "Selected Case" : "Recommended Case"}
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center mb-4 bg-white">
                      {getCaseImage(activeCase) ? (
                        <div className="w-48 h-48 relative bg-transparent rounded-lg overflow-hidden">
                          <img
                            src={getCaseImage(activeCase)}
                            alt={activeCase.product_name}
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-zinc-800/50 rounded-lg flex items-center justify-center border border-zinc-700">
                          <span className="text-zinc-500 text-sm">
                            No image available
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-center text-white font-medium mb-2">
                      {activeCase.product_name}
                    </h3>
                  </div>
                </div>
              ) : (
                selectedGpu && (
                  <div className="flex-1 bg-black rounded-xl p-6 flex flex-col items-center justify-center border border-zinc-800">
                    <div className="text-zinc-500 text-center">
                      {caseLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                          <p className="text-sm">Finding compatible cases...</p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-4">📦</div>
                          <p className="text-sm">No compatible case found</p>
                        </>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
            {activeCase && caseSlug && (
              <SimplifiedCaseDisplay caseSlug={caseSlug} />
            )}
            {/* Build Results or Status Indication */}
            {(chatStatus === "streaming" || chatStatus === "submitted") &&
              !latestAiMessage && (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                  <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 flex items-center">
                    <h2 className="text-xl font-bold text-white">
                      {useWebSearch
                        ? "Searching & Generating..."
                        : "Generating Build..."}
                    </h2>
                  </div>
                  <div className="p-12 flex flex-col items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <svg
                        className="animate-spin h-12 w-12 text-white mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-zinc-400">
                        {useWebSearch
                          ? "Searching for current prices and creating your custom build..."
                          : "Creating your custom PC build recommendation..."}
                      </p>
                      <p className="text-zinc-500 text-sm mt-2">
                        {useWebSearch
                          ? "This may take longer as we fetch real-time data"
                          : "This may take a few moments"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {errorInfo.isError && (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800 mt-4">
                <div className="p-4 bg-gradient-to-r from-red-900/30 to-black border-b border-zinc-800 flex items-center">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span> Request Limit
                    Reached
                  </h2>
                </div>
                <div className="p-8 text-center">
                  <p className="text-zinc-300 mb-6">
                    {errorInfo.message ||
                      "Rate limit exceeded. Please try again later."}
                  </p>

                  <button
                    onClick={(e) => handleTryAgain(e)}
                    className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-medium rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            {latestAiMessage && (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800 mt-5">
                {/* The BuildResponseFormatter handles everything */}
                <BuildResponseFormatter
                  content={latestAiMessage.content}
                  selectedGpu={selectedGpu}
                  activeCase={activeCase || recommendedCase}
                  budget={budget}
                  useWebSearch={useWebSearch}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
