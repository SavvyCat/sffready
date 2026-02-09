"use client";
import { useEffect, useState } from "react";

export default function AdminPendingCases() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState("pending");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setMessage("Incorrect password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Failed to login. Please try again.");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify');
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingRequests();
    }
  }, [isAuthenticated, filter]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pending-cases?status=${filter}`);
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Error fetching requests");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setEditData({
      product_name: request.product_name || "",
      url: request.url || "",
      eol: request.eol || false,
      width: request.width ?? "",
      depth: request.depth ?? "",
      gpu_height: request.gpu_height ?? "",
      volume: request.volume ?? "",
      mb_atx: request.mb_atx || false,
      mb_matx: request.mb_matx || false,
      mb_itx: request.mb_itx || false,
      psu_atx: request.psu_atx || false,
      psu_sfxl: request.psu_sfxl || false,
      psu_sfx: request.psu_sfx || false,
      psu_flex: request.psu_flex || false,
      cpu_height: request.cpu_height ?? "",
      l120: request.l120 || false,
      l140: request.l140 || false,
      l240: request.l240 || false,
      l280: request.l280 || false,
      l360: request.l360 || false,
      material: request.material || "Steel",
      release_year: request.release_year || "",
    });
  };

  const handleEditChange = (e) => {
    if (selectedRequest?.status !== "pending") return;
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id: selectedRequest.id,
        product_name: editData.product_name,
        url: editData.url,
        eol: editData.eol,
        width: parseFloat(editData.width) || null,
        depth: parseFloat(editData.depth) || null,
        gpu_height: parseFloat(editData.gpu_height) || null,
        volume: parseFloat(editData.volume) || null,
        mb_atx: editData.mb_atx,
        mb_matx: editData.mb_matx,
        mb_itx: editData.mb_itx,
        psu_atx: editData.psu_atx,
        psu_sfxl: editData.psu_sfxl,
        psu_sfx: editData.psu_sfx,
        psu_flex: editData.psu_flex,
        cpu_height: parseFloat(editData.cpu_height) || null,
        l120: editData.l120,
        l140: editData.l140,
        l240: editData.l240,
        l280: editData.l280,
        l360: editData.l360,
        material: editData.material,
        release_year: editData.release_year || null,
      };

      const response = await fetch("/api/admin/update-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Changes saved successfully");
        // Update the request in the list
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id ? { ...r, ...payload } : r
          )
        );
        setSelectedRequest((prev) => ({ ...prev, ...payload }));
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("Error saving changes");
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch("/api/admin/approve-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Case approved and added to database! (ID: ${result.imageId})`);
        setRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequest(null);
        setEditData(null);
        setTimeout(() => fetchPendingRequests(), 500);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("Error approving case");
      console.error("Error:", error);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    try {
      const response = await fetch("/api/admin/reject-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Request rejected");
        setRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequest(null);
        setEditData(null);
        setTimeout(() => fetchPendingRequests(), 500);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("Error rejecting request");
      console.error("Error:", error);
    }
  };

  const isPending = selectedRequest?.status === "pending";
  const inputClass = `w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${!isPending ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`;
  const checkboxClass = `h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${!isPending ? "cursor-not-allowed" : ""}`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Admin Login
          </h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {message && (
              <p className="text-red-600 text-sm mb-4">{message}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Case Requests
          </h1>
          <button
            onClick={fetchPendingRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {["pending", "approved", "rejected", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === tab
                  ? tab === "pending"
                    ? "border-blue-600 text-blue-600"
                    : tab === "approved"
                    ? "border-green-600 text-green-600"
                    : tab === "rejected"
                    ? "border-red-600 text-red-600"
                    : "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

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

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner border-blue-500 border-t-transparent w-12 h-12 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No {filter} requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openModal(request)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {request.product_name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Dimensions:</span>{" "}
                    {request.width || "-"} x {request.depth || "-"} x{" "}
                    {request.gpu_height || "-"} mm
                  </p>
                  <p>
                    <span className="font-medium">Material:</span>{" "}
                    {request.material || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Submitted:</span>{" "}
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  {request.image_id && (
                    <p>
                      <span className="font-medium">Case ID:</span>{" "}
                      {request.image_id}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(request);
                  }}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedRequest && editData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Case Request
                </h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setEditData(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Image */}
                {selectedRequest.images && (
                  <div className="flex justify-center border rounded-lg overflow-hidden max-h-64">
                    <img
                      src={JSON.parse(selectedRequest.images)[0]}
                      alt={selectedRequest.product_name}
                      className="object-contain max-h-64"
                    />
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        name="product_name"
                        value={editData.product_name}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        name="url"
                        value={editData.url}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="eol"
                        checked={editData.eol}
                        onChange={handleEditChange}
                        className={checkboxClass}
                      />
                      <label className="text-sm text-gray-700">End of Life (EOL)</label>
                    </div>
                  </div>
                </div>

                {/* Case Dimensions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    Case Dimensions
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        name="width"
                        value={editData.width}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Depth (mm)
                      </label>
                      <input
                        type="number"
                        name="depth"
                        value={editData.depth}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        name="gpu_height"
                        value={editData.gpu_height}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Volume (L)
                      </label>
                      <input
                        type="number"
                        name="volume"
                        value={editData.volume}
                        onChange={handleEditChange}
                        step="0.1"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Motherboard Support */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    Motherboard Support
                  </h3>
                  <div className="flex gap-6">
                    {[
                      { name: "mb_atx", label: "ATX" },
                      { name: "mb_matx", label: "Micro-ATX" },
                      { name: "mb_itx", label: "Mini-ITX" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={editData[item.name]}
                          onChange={handleEditChange}
                          className={checkboxClass}
                        />
                        <label className="text-sm text-gray-700">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PSU Support */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    Power Supply Support
                  </h3>
                  <div className="flex gap-6">
                    {[
                      { name: "psu_atx", label: "ATX" },
                      { name: "psu_sfxl", label: "SFX-L" },
                      { name: "psu_sfx", label: "SFX" },
                      { name: "psu_flex", label: "Flex" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={editData[item.name]}
                          onChange={handleEditChange}
                          className={checkboxClass}
                        />
                        <label className="text-sm text-gray-700">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CPU Cooling */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    CPU Cooling Support
                  </h3>
                  <div className="space-y-3">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Max CPU Cooler Height (mm)
                      </label>
                      <input
                        type="number"
                        name="cpu_height"
                        value={editData.cpu_height}
                        onChange={handleEditChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        Liquid Cooling Support
                      </label>
                      <div className="flex gap-6">
                        {[
                          { name: "l120", label: "120mm" },
                          { name: "l140", label: "140mm" },
                          { name: "l240", label: "240mm" },
                          { name: "l280", label: "280mm" },
                          { name: "l360", label: "360mm" },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name={item.name}
                              checked={editData[item.name]}
                              onChange={handleEditChange}
                              className={checkboxClass}
                            />
                            <label className="text-sm text-gray-700">{item.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materials & Release Year */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">
                    Materials & Release Year
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Main Construction Material
                      </label>
                      <select
                        name="material"
                        value={editData.material}
                        onChange={handleEditChange}
                        className={inputClass}
                      >
                        <option value="Steel">Steel</option>
                        <option value="Aluminum">Aluminum</option>
                        <option value="Plastic">Plastic</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Release Year
                      </label>
                      <input
                        type="text"
                        name="release_year"
                        value={editData.release_year}
                        onChange={handleEditChange}
                        placeholder="e.g., 2020"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Save & Action Buttons - Only show for pending requests */}
                {selectedRequest.status === "pending" && (
                  <div className="pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`w-full py-2 rounded-md text-white font-semibold transition-colors ${
                        saving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
                    >
                      Approve & Add to Database
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="flex-1 bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Status Message for Non-Pending Requests */}
                {selectedRequest.status !== "pending" && (
                  <div className="pt-4 border-t">
                    <p
                      className={`text-center py-3 font-semibold rounded-md ${
                        selectedRequest.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      This request has been {selectedRequest.status}
                      {selectedRequest.status === "approved" &&
                        selectedRequest.image_id &&
                        ` (Case ID: ${selectedRequest.image_id})`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
