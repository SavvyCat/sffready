"use client";

const Modal = ({ isOpen, onClose, url }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl mx-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="text-4xl absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            X
          </button>
          <div className="flex justify-center items-center p-4">
            {" "}
            {/* Added padding */}
            <iframe
              className="w-full h-[18rem] md:h-[60vh] lg:h-[80vh]" // Adjusted height for responsiveness
              src={url}
              title="Embedded Website"
              frameBorder="0" // Added to ensure proper iframe border
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
