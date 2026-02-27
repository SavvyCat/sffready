"use client";
import { useState } from "react";

export default function RequestCasePage() {
  const [formData, setFormData] = useState({
    product_name: "",
    url: "",
    eol: false,
    // Dimensions
    width: "",
    depth: "",
    gpu_height: "",
    volume: "",
    // Motherboard
    mb_atx: false,
    mb_matx: false,
    mb_itx: false,
    // PSU
    psu_atx: false,
    psu_sfxl: false,
    psu_sfx: false,
    psu_flex: false,
    // CPU
    cpu_height: "",
    l120: false,
    l140: false,
    l240: false,
    l280: false,
    l360: false,
    // Materials
    material: "Steel",
    // Release Year
    release_year: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageLoading(true);
      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // Convert form data to FormData for file upload
      const submitData = new FormData();

      // Append all text/number/boolean fields
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Append single image
      if (image) {
        submitData.append(`image_0`, image);
      }

      const response = await fetch("/api/request-case", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Request submitted successfully! We'll review it soon.");
        // Reset form
        setFormData({
          product_name: "",
          url: "",
          eol: false,
          width: "",
          depth: "",
          gpu_height: "",
          volume: "",
          mb_atx: false,
          mb_matx: false,
          mb_itx: false,
          psu_atx: false,
          psu_sfxl: false,
          psu_sfx: false,
          psu_flex: false,
          cpu_height: "",
          l120: false,
          l140: false,
          l240: false,
          l280: false,
          l360: false,
          material: "Steel",
          release_year: "",
        });
        setImage(null);
        setImagePreview(null);
      } else {
        setMessage(`Error: ${result.error || "Something went wrong"}`);
      }
    } catch (error) {
      setMessage("Error submitting request. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Request to Add a PC Case
        </h1>
        <p className="text-gray-600 mb-4">
          Help us expand our database by submitting a PC case. Please fill in as
          many details as possible.
        </p>

        {message && (
          <div
            className={`p-4 mb-6 rounded-md ${
              message.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Cooler Master NR200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product URL *
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="eol"
                  checked={formData.eol}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  End of Life (EOL)
                </label>
              </div>
            </div>
          </section>

          {/* Case Dimensions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Case Dimensions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (mm) *
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depth (mm) *
                </label>
                <input
                  type="number"
                  name="depth"
                  value={formData.depth}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (mm) *
                </label>
                <input
                  type="number"
                  name="gpu_height"
                  value={formData.gpu_height}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume (L)
                </label>
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Motherboard Support */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Motherboard Support
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="mb_atx"
                  checked={formData.mb_atx}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">ATX</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="mb_matx"
                  checked={formData.mb_matx}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Micro-ATX</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="mb_itx"
                  checked={formData.mb_itx}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Mini-ITX</label>
              </div>
            </div>
          </section>

          {/* PSU Support */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Power Supply Support
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="psu_atx"
                  checked={formData.psu_atx}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">ATX</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="psu_sfxl"
                  checked={formData.psu_sfxl}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">SFX-L</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="psu_sfx"
                  checked={formData.psu_sfx}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">SFX</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="psu_flex"
                  checked={formData.psu_flex}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Flex</label>
              </div>
            </div>
          </section>

          {/* CPU Cooling */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              CPU Cooling Support
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max CPU Cooler Height (mm)
                </label>
                <input
                  type="number"
                  name="cpu_height"
                  value={formData.cpu_height}
                  onChange={handleChange}
                  min="0"
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liquid Cooling Support
                </label>
                <div className="grid grid-cols-5 gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="l120"
                      checked={formData.l120}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">120mm</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="l140"
                      checked={formData.l140}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">140mm</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="l240"
                      checked={formData.l240}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">240mm</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="l280"
                      checked={formData.l280}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">280mm</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="l360"
                      checked={formData.l360}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">360mm</label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Materials & Panels */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Materials & Panels
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Construction Material:
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Steel">Steel</option>
                <option value="Aluminum">Aluminum</option>
                <option value="Plastic">Plastic</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </section>

          {/* Release Year */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Release Year
            </h2>
            <div>
              <input
                type="text"
                name="release_year"
                value={formData.release_year}
                onChange={handleChange}
                className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(example: 2020)"
              />
            </div>
          </section>

          {/* Images */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Image *
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Case Image (required)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!image}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload one image showing the PC case
              </p>

              {/* Image Preview with Loading Spinner */}
              {imageLoading && (
                <div className="mt-4 flex justify-center items-center h-48 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}

              {!imageLoading && imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden max-w-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto object-contain max-h-96"
                    />
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Image uploaded successfully
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 text-white font-semibold rounded-md shadow-md transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
