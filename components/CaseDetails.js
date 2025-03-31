import React, { useState } from "react";

const CaseDetails = ({ data, id }) => {
  const [imageLoading, setImageLoading] = useState(true); // State for image loading

  if (!data) return null;

  const { brand, detail, files, modes } = data;

  return (
    <div className="bg-white p-4">
      {/* Header Section */}
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 py-2">
        <div className="max-w-7xl flex items-center mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold">
            <a href="/">SFF Ready?</a>
          </h1>
        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-7xl mx-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="flex flex-col">
            <div className="flex justify-center">
              {imageLoading && (
                <div className="flex justify-center items-center">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={`/images/${id}/1.jpg`}
                alt={files.results[0]?.name}
                className={`object-contain max-h-72 sm:max-h-96 w-full ${
                  imageLoading ? "hidden" : "block"
                }`}
                onLoad={() => setImageLoading(false)} // Hide spinner once image is loaded
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base leading-6 sm:leading-8 border-collapse">
              <tbody>
                <tr>
                  <th className="font-bold text-left px-2 py-1">Name</th>
                  <td className="px-2 py-1">{detail.name}</td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">Brand</th>
                  <td className="px-2 py-1">
                    <a
                      href={brand.detail.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-500"
                    >
                      {brand.detail.name}
                    </a>
                  </td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">Volume (L)</th>
                  <td className="px-2 py-1">{modes.results[0]?.volume} L</td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">Materials</th>
                  <td className="px-2 py-1">Skeleton: Steel, Shell: Steel</td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">
                    Dimensions (mm)
                  </th>
                  <td className="px-2 py-1">
                    {`W: ${modes.results[0]?.width}, H: ${modes.results[0]?.height}, D: ${modes.results[0]?.depth}`}
                  </td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">GPU</th>
                  <td className="px-2 py-1">
                    Length: {modes.results[0]?.gpu_length} mm, Height:{" "}
                    {modes.results[0]?.gpu_height} mm
                  </td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">PSU</th>
                  <td className="px-2 py-1">
                    {`Type: ${
                      modes.results[0]?.psu_type === 3 ? "ATX 12V" : "Other"
                    }, Width: ${modes.results[0]?.psu_width}, Height: ${
                      modes.results[0]?.psu_height
                    }, Length: ${modes.results[0]?.psu_length}`}
                  </td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">USB-C</th>
                  <td className="px-2 py-1">
                    {modes.results[0]?.usb_c ? "Yes" : "No"}
                  </td>
                </tr>
                <tr>
                  <th className="font-bold text-left px-2 py-1">
                    Liquid Cooling
                  </th>
                  <td className="px-2 py-1">
                    {["240MM", "280MM", "360MM"].map((size) => (
                      <span
                        key={size}
                        className={`inline-block px-2 py-1 mx-1 text-xs text-white rounded ${
                          modes.results[0][`l${size}`.toLowerCase()]
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }`}
                      >
                        {size}
                      </span>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseDetails;
