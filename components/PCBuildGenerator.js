"use client";

import supabase from "@/Backend/supabase";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";

export default function PCBuildGenerator() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [budget, setBudget] = useState(1000);
  const [gpus, setGpus] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Brands");
  const [useWebSearch, setUseWebSearch] = useState(true);

  // Categories from your existing code
  const categories = [
    "ASL", "ASRock", "ASUS", "All Brands", "Biostar", "CORSAIR", "Colorful", 
    "ELSA", "EVGA", "GUNNIR", "Gainward", "Galax", "Gigabyte", "Huananzhi", 
    "INNO3D", "Intel", "KFA2", "KUROUTOSHIKOU", "Leadtek", "MAXSUN", "MSI", 
    "Manli", "Matrox", "NVIDIA", "Onda", "PNY", "Palit", "Point Of View", 
    "Sparkle", "Yeston", "Zogis", "Zotac", "emTek"
  ];

  // Use the useChat hook for AI integration
  const { messages, append, status, sources } = useChat({
    api: "/api/generate-build",
    id: "pc-build-generator",
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        buildParams: {
          gpu: selectedGpu,
          budget: budget,
          useWebSearch: useWebSearch,
        },
        messages: messages,
      };
    },
    onError: (error) => {
      console.error("Error generating build:", error);
      alert("Error generating build. Please try again.");
    },
  });

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
  }, []);

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

  // Improved formatBuildResponse function with source information
  const formatBuildResponse = (content) => {
    if (!content) return null;
    
    // Process the content by replacing markdown patterns with HTML elements
    let processedContent = content
      // Format component headings
      .replace(/### ([\d\.]+)?\s*([^\n]+)/g, (match, number, title) => {
        const componentNumber = number ? number.trim() : '';
        const componentTitle = title.trim();
        return `<div class="component-category">
          ${componentNumber ? `<span class="component-number">${componentNumber}</span>` : ''}
          <span class="component-title">${componentTitle}</span>
        </div>`;
      })
      // Format bold text for component names and specifications
      .replace(/\*\*([^*]+)\*\*/g, '<span class="component-highlight">$1</span>')
      // Format bullet points in the cost summary section
      .replace(/- \*\*([^:]+):\*\* ([\$\d\.]+)/g, 
        '<div class="cost-item"><span class="cost-label">$1:</span> <span class="cost-value">$2</span></div>')
      // Add proper paragraph spacing
      .replace(/\n\n/g, '</p><p>')
      // Add component description styling
      .replace(/Reason: (.+?)(?=<\/p>|<div|$)/g, 
        '<div class="component-description">$1</div>');
    
    // Wrap the entire content in a div with proper structure
    processedContent = `<div class="build-content"><p>${processedContent}</p></div>`;
    
    // Add sources section if available
    if (sources && sources.length > 0) {
      const sourcesHtml = `
        <div class="sources-section">
          <div class="sources-title">Data Sources</div>
          <div class="sources-list">
            ${sources.map((source, index) => `
              <div class="source-item">
                <span class="source-number">${index + 1}.</span>
                <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link">
                  ${source.title || source.url.replace(/(^\w+:|^)\/\//, '').split('/')[0]}
                </a>
                ${source.publishedDate ? `<span class="source-date">(${source.publishedDate})</span>` : ''}
              </div>
            `).join('')}
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

  // Generate a PC build based on selected GPU and budget
  const generateBuild = (e) => {
    e.preventDefault();

    if (!selectedGpu) {
      alert("Please select a GPU first");
      return;
    }

    // Create prompt
    const prompt = `Generate a PC build with a budget of $${budget}. I already have selected a ${
      selectedGpu.title
    } GPU which costs approximately $${
      selectedGpu.price || "(price unknown)"
    }. Please recommend compatible CPU, motherboard, RAM, storage, power supply, and case. For each component, include the name, price, and a brief reason for the selection. Make sure the total cost stays within my $${budget} budget.`;

    // Use append to send a message to the AI
    append({
      role: "user",
      content: prompt,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl w-full mx-auto bg-zinc-900 rounded-xl shadow-2xl shadow-black/50 overflow-hidden border border-zinc-800">
        <div className="p-6 bg-gradient-to-r from-black to-zinc-900 border-b border-zinc-800">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-4xl">💻</span> PC Build Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Select your GPU, set your budget, and get a complete PC build
            recommendation
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
                max="3000"
                step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-sm mt-2 text-zinc-400">
                <span>$500</span>
                <span>$3000</span>
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
                !selectedGpu || status === "streaming" || status === "submitted"
              }
              className="w-full p-4 bg-white text-black hover:bg-gray-200 font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {status === "streaming" || status === "submitted" ? (
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
                  {useWebSearch ? "Searching & Generating..." : "Generating Build..."}
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
            {/* Selected GPU Display */}
            {selectedGpu ? (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-6 transition-all duration-300 transform hover:scale-[1.01] border border-zinc-800">
                <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800">
                  <h2 className="text-xl font-bold text-white">Selected GPU</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center p-6">
                  <div className="w-full sm:w-1/2 flex justify-center mb-4 sm:mb-0">
                    {getGpuImage() ? (
                      <div className="w-64 h-64 relative bg-transparent rounded-lg overflow-hidden">
                        <img
                          src={getGpuImage()}
                          alt={selectedGpu.title}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-zinc-800/50 rounded-lg flex items-center justify-center border border-zinc-700">
                        <span className="text-zinc-500 text-lg">
                          No image available
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full sm:w-1/2 pl-0 sm:pl-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {selectedGpu.title}
                    </h3>
                    {selectedGpu.price && (
                      <p className="text-gray-300 text-lg font-bold mb-4">
                        {formatCurrency(selectedGpu.price)}
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-3 text-white">
                      <div className="flex items-center">
                        <div className="w-24 text-zinc-500">Length:</div>
                        <div className="font-medium">
                          {selectedGpu.length} mm
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-zinc-500">Height:</div>
                        <div className="font-medium">
                          {selectedGpu.height} mm
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-zinc-500">Thickness:</div>
                        <div className="font-medium">
                          {selectedGpu.thickness} slots
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-zinc-500">Brand:</div>
                        <div className="font-medium">
                          {selectedGpu.category}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black rounded-xl p-8 flex flex-col items-center justify-center mb-6 border border-zinc-800 h-64">
                <div className="text-zinc-500 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg">Search and select a GPU to start</p>
                </div>
              </div>
            )}

            {/* Build Results or Status Indication */}
            {(status === "streaming" || status === "submitted") &&
              !latestAiMessage && (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                  <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 flex items-center">
                    <h2 className="text-xl font-bold text-white">
                      {useWebSearch ? "Searching & Generating..." : "Generating Build..."}
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

            {status === "error" && (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                <div className="p-4 bg-gradient-to-r from-red-900/30 to-black border-b border-zinc-800 flex items-center">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span> Error
                    Generating Build
                  </h2>
                </div>
                <div className="p-8 text-center">
                  <p className="text-zinc-300 mb-4">
                    Sorry, we encountered an error while generating your PC
                    build.
                  </p>
                  <button
                    onClick={generateBuild}
                    className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {latestAiMessage && (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                <div className="p-4 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Your Custom PC Build
                  </h2>
                  <div className="flex items-center gap-2">
                    {useWebSearch && (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs font-medium">
                        Web Search Enabled
                      </span>
                    )}
                    <div className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium">
                      Budget: {formatCurrency(budget)}
                    </div>
                  </div>
                </div>
                <div className="p-6 text-white build-results">
                  <style jsx global>{`
                    .build-results .component-category {
                      margin-top: 1.5rem;
                      margin-bottom: 0.75rem;
                      font-size: 1.25rem;
                      font-weight: 700;
                      color: #ffffff;
                      display: flex;
                      align-items: center;
                      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                      padding-bottom: 0.5rem;
                    }

                    .build-results .component-category:first-child {
                      margin-top: 0;
                    }

                    .build-results .component-number {
                      background-color: rgba(255, 255, 255, 0.1);
                      color: #ffffff;
                      border-radius: 9999px;
                      width: 30px;
                      height: 30px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin-right: 0.75rem;
                      font-size: 1rem;
                      font-weight: 700;
                    }

                    .build-results .component-title {
                      flex: 1;
                    }

                    .build-results .component-highlight {
                      color: #ffffff;
                      font-weight: 600;
                      background: linear-gradient(
                        to right,
                        rgba(255, 255, 255, 0.1),
                        transparent
                      );
                      padding: 0.1rem 0.5rem;
                      border-radius: 0.25rem;
                      display: inline-block;
                      margin: 0.25rem 0;
                    }

                    .build-results .total-cost-title {
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      font-size: 1.25rem;
                      font-weight: 700;
                      color: #ffffff;
                      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                      padding-bottom: 0.5rem;
                    }

                    .build-results .cost-item {
                      display: flex;
                      justify-content: space-between;
                      margin: 0.5rem 0;
                      padding: 0.5rem;
                      border-radius: 0.25rem;
                      background-color: rgba(255, 255, 255, 0.05);
                    }

                    .build-results .cost-label {
                      color: #a1a1aa;
                    }

                    .build-results .cost-value {
                      font-weight: 600;
                      color: #ffffff;
                    }
                    
                    /* Additional styles for better markdown rendering */
                    .build-results p {
                      margin-bottom: 1rem;
                      line-height: 1.6;
                    }
                    
                    .build-results .build-content p {
                      margin: 0.75rem 0;
                    }

                    .build-results .component-description {
                      margin-top: 0.5rem;
                      margin-bottom: 1rem;
                      color: #a1a1aa;
                      font-size: 0.95rem;
                      line-height: 1.5;
                      padding-left: 0.5rem;
                      border-left: 2px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    /* Source styles */
                    .build-results .sources-section {
                      margin-top: 2rem;
                      padding-top: 1rem;
                      border-top: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    .build-results .sources-title {
                      font-size: 1rem;
                      font-weight: 600;
                      color: #a1a1aa;
                      margin-bottom: 0.75rem;
                    }
                    
                    .build-results .sources-list {
                      font-size: 0.85rem;
                      color: #a1a1aa;
                    }
                    
                    .build-results .source-item {
                      margin-bottom: 0.5rem;
                      display: flex;
                      align-items: baseline;
                    }
                    
                    .build-results .source-number {
                      margin-right: 0.5rem;
                      color: #a1a1aa;
                      font-size: 0.8rem;
                    }
                    
                    .build-results .source-link {
                      color: #a1a1aa;
                      text-decoration: underline;
                      text-decoration-color: rgba(255, 255, 255, 0.2);
                      text-underline-offset: 2px;
                      transition: all 0.2s ease;
                    }
                    
                    .build-results .source-link:hover {
                      color: #ffffff;
                      text-decoration-color: rgba(255, 255, 255, 0.5);
                    }
                    
                    .build-results .source-date {
                      font-size: 0.75rem;
                      margin-left: 0.5rem;
                      color: #71717a;
                    }
                  `}</style>
                  {formatBuildResponse(latestAiMessage.content)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}