"use client";
import getFilteredCases from "@/Backend/Data/GetDataBasesOn";
import getFilteredGPUs from "@/Backend/Data/GetGpu";
import { useState, useEffect } from "react";

export default function Home() {
  const [cases, setCases] = useState([]);
  const [length, setLength] = useState(285);
  const [height, setHeight] = useState(112);
  const [thickness, setThickness] = useState(2);
  const [searchText, setSearchText] = useState("");
  const [gpus, setGpus] = useState([]);
  const [selectedGpu, setSelectedGpu] = useState(null); // State to hold the selected GPU

  useEffect(() => {
    async function getData() {
      const filteredCases = await getFilteredCases(length, height, thickness);
      setCases(filteredCases);
    }
    getData();
  }, [length, height, thickness]);

  const handleLengthChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0) setLength(value);
  };

  const handleHeightChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0) setHeight(value);
  };

  const handleThicknessChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0) setThickness(value);
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (value) {
      const filteredGpus = await getFilteredGPUs(value);
      setGpus(filteredGpus);
    } else {
      setGpus([]); // Clear results if the search input is empty
      //setSelectedGpu(null);
    }
  };

  const handleGpuSelection = (gpuItem) => {
    // Set the selected GPU and update dimensions
    setSelectedGpu(gpuItem);
    setLength(gpuItem.length); // Assuming `length` is a property of the GPU
    setHeight(gpuItem.height); // Assuming `height` is a property of the GPU
    setThickness(gpuItem.thickness); // Assuming `thickness` is a property of the GPU
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
              src={selectedGpu.image_url}
              alt="Selected GPU"
              className="w-[25rem]"
            />
          ) : (
            <div className="mt-[-50px] mb-[-90px]">
              <video autoPlay muted loop width="600">
                <source src="/Video.mp4" type="video/mp4" />
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
                  className="mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col justify-center items-center">
                <label className="block text-lg font-bold text-gray-700">
                  Thickness(slots)
                </label>
                <input
                  type="number"
                  value={thickness}
                  min="0"
                  onChange={handleThicknessChange}
                  className="mt-1 block w-2/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    {gpus.map((gpuItem, index) => (
                      <li
                        key={index}
                        className="p-2 border-b border-gray-300 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleGpuSelection(gpuItem)} // Select GPU on click
                      >
                        {gpuItem.title}{" "}
                        {/* Adjust this to match your GPU property name */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No GPUs found.</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cases.map((caseItem, index) => {
              const imagelocation1 = `/images/${caseItem.image_id}/1.jpg`;
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
        </div>
      </div>
    </div>
  );
}
