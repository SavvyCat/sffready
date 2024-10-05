"use client";
import getFilteredCases from "@/Backend/Data/GetDataBasesOn";
import getFilteredGPUs from "@/Backend/Data/GetGpu";
import { useState, useEffect } from "react";
import { CiCoffeeCup } from "react-icons/ci";

export default function Home() {
  const [cases, setCases] = useState([]);
  const [length, setLength] = useState(285);
  const [height, setHeight] = useState(112);
  const [thickness, setThickness] = useState(2);
  const [searchText, setSearchText] = useState("");
  const [gpus, setGpus] = useState([]);
  const [selectedGpu, setSelectedGpu] = useState(null); // State to hold the selected GPU
  const [visibleCount, setVisibleCount] = useState(8);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const loadMore = () => {
    setVisibleCount((prevCount) => prevCount + 8);
  };

  useEffect(() => {
    async function getData() {
      const filteredCases = await getFilteredCases(length, height, thickness);
      setCases(filteredCases);
    }
    getData();
  }, [length, height, thickness]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const newTimeout = setTimeout(async () => {
      if (value) {
        const filteredGpus = await getFilteredGPUs(value);
        setGpus(filteredGpus);
      } else {
        setGpus([]);
      }
    }, 500);

    setDebounceTimeout(newTimeout);
  };

  const handleLengthChange = (e) => {
    let value = e.target.value.replace(/^0+/, "").replace(/-/g, "");
    setLength(value === "" ? "0" : value);
  };

  const handleHeightChange = (e) => {
    let value = e.target.value.replace(/^0+/, "").replace(/-/g, "");
    setHeight(value === "" ? "0" : value);
  };

  const handleThicknessChange = (e) => {
    let value = e.target.value.replace(/^0+/, "").replace(/-/g, "");
    setThickness(value === "" ? "0" : value);
  };

  const handleGpuSelection = (gpuItem) => {
    setSearchText(gpuItem.title);
    setSelectedGpu(gpuItem);
    setLength(gpuItem.length);
    setHeight(gpuItem.height);
    setThickness(gpuItem.thickness);
  };

  useEffect(() => {
    // Adding the Google Analytics script to the head
    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=G-7BZ2TFND29`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-7BZ2TFND29');
    `;
    document.head.appendChild(script2);

    // Track route changes (optional for SPAs)
    const handleRouteChange = (url) => {
      window.gtag("config", "G-7BZ2TFND29", {
        page_path: url,
      });
    };

    // Listen to route changes
    window.addEventListener("routeChangeComplete", handleRouteChange);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("routeChangeComplete", handleRouteChange);
    };
  }, []);

  const gpuimagelocation = `/images-gpu/${selectedGpu?.image_id}.jpg`;

  const BuyMeACoffeeButton = () => {
    return (
      <div className="flex items-center justify-center gap-5">
        <h1 className="font-bold texl-xl">Support Us</h1>
        <a
          href="https://buymeacoffee.com/danieloliveira"
          className="bg-blue-500 text-white p-3 border rounded-lg text-lg flex gap-2 font-semibold hover:bg-blue-700"
        >
          <div className="flex justify-center items-center">
            <CiCoffeeCup size={35} />
          </div>
          <h1 className="text-center mt-0.5 ">Buy Creator Coffee</h1>
        </a>
        <a href="https://www.instagram.com/sffbuild">
          <h1 className="font-bold texl-xl">@sffbuild</h1>
        </a>
      </div>
    );
  };
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100  relative ">
      <div className="absolute top-0 w-full flex justify-center items-center z-50">
        <h1 className="font-bold sm:text-7xl text-5xl flex justify-center items-center mt-20">
          SFF Ready?
        </h1>
      </div>
      <div className="mb-[2rem]"></div>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl z-10">
        <div className="flex justify-center lg:mb-10 mb-20 mt-32">
          {" "}
          {/* Adjusted margin-top to push content down */}
          {selectedGpu ? (
            <img
              src={gpuimagelocation}
              alt="Selected GPU"
              className="w-[25rem]"
            />
          ) : (
            <div className="mt-[10px] mb-[20px] ">
              <video autoPlay muted loop width="600">
                <source src="/v2.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
        <div className="flex justify-center items-center">
          <div className="w-4/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 mb-6">
              <div className="flex flex-col justify-center items-center">
                <label className="block text-lg font-bold text-gray-700">
                  Length (mm)
                </label>
                <input
                  type="number"
                  value={length}
                  min="0"
                  onChange={handleLengthChange}
                  className="text-center mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col justify-center items-center">
                <label className="block text-lg font-bold text-gray-700">
                  Height (mm)
                </label>
                <input
                  type="number"
                  value={height}
                  min="0"
                  onChange={handleHeightChange}
                  className="text-center mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col justify-center items-center">
                <label className="block text-lg font-bold text-gray-700">
                  Thickness (slots)
                </label>
                <input
                  type="number"
                  value={thickness}
                  min="0"
                  onChange={handleThicknessChange}
                  className="text-center mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-10">
          <div className="w-8/12">
            <div className="mb-6">
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                placeholder=" Search GPU"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex flex-col gap-10">
              <div className="bg-gray-100 p-4 rounded-lg shadow-inner max-h-64 overflow-y-auto">
                {gpus.length && searchText.length > 0 ? (
                  <ul>
                    {gpus?.map((gpuItem, index) => (
                      <li
                        key={index}
                        className="p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleGpuSelection(gpuItem)} // Select GPU on click
                      >
                        {gpuItem.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">
                    Check your GPU dimensions to see a list of compatible cases.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cases.slice(0, visibleCount).map((caseItem, index) => {
              const imagelocation1 = `/images/${caseItem.image_id}/1.jpg`;
              //const imagelocation1 = `https://github.com/MariooY2/Redditfreelance4/blob/main/public/images/${caseItem.image_id}/1.jpg?raw=true`;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300"
                >
                  <a href={caseItem.url}>
                    <img
                      src={imagelocation1}
                      alt={`Case Image ${index + 1}`}
                      className="w-full h-48 object-cover bg-slate-200"
                    />
                  </a>
                  <p className="flex justify-center items-center text-sm">
                    {caseItem.product_name}
                  </p>
                </div>
              );
            })}
          </div>
          {visibleCount < cases.length && (
            <div className="flex justify-center mt-5">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Load More
              </button>
            </div>
          )}
          {visibleCount > 8 && <BuyMeACoffeeButton />}
        </div>
        <div className="border-8 border-black mt-6 h-44">
          <img
            src="https://via.placeholder.com/300"
            alt="Placeholder"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
