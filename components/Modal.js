"use client";

import { useEffect, useState } from "react";
import CaseEndComponent from "./CaseComponent";

const Modal = ({ isOpen, onClose, url, id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract the result from the URL
  const result = url.split("abee/")[1];

  useEffect(() => {
    if (isOpen) {
      // Fetch the data when the modal is opened
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `https://backend-ochre-tau-58.vercel.app/case?name=${result}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const fetchedData = await response.json();
          setData(fetchedData); // Set the fetched data
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
      fetchData();

      // Disable scrolling when the modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Enable scrolling when the modal is closed
      document.body.style.overflow = "auto";
    }

    // Cleanup scroll effect on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 
                       text-xl sm:text-2xl text-gray-600 hover:text-gray-800 
                       focus:outline-none bg-white/50 hover:bg-white/75 
                       rounded-full p-2 transition-all duration-300"
          >
            ✕
          </button>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div
                  className="spinner w-10 h-10 sm:w-14 sm:h-14 
                                border-4 border-gray-300 border-t-blue-600 
                                rounded-full animate-spin"
                ></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-red-500 text-center p-4 text-sm sm:text-base">
                Error: {error}
              </div>
            )}

            {/* Render CaseDetails if data is available */}
            {!loading && data && (
              <div className="w-full">
                <CaseEndComponent data={data} id={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
