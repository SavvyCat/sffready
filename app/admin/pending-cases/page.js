"use client";
import { useEffect, useState } from "react";

export default function AdminPendingCases() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all

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
        setPassword(""); // Clear password field
      } else {
        setMessage("Incorrect password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Failed to login. Please try again.");
    }
  };

  // Check if already authenticated on page load
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

  const handleApprove = async (id) => {
    try {
      const response = await fetch("/api/admin/approve-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Case approved and added to database! (ID: ${result.imageId})`);

        // Remove the approved case from the pending list immediately
        setRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequest(null);

        // Also refresh from server to ensure sync
        setTimeout(() => {
          fetchPendingRequests();
        }, 500);
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
        setMessage("❌ Request rejected and removed from pending list");

        // Remove the rejected case from the pending list immediately
        setRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequest(null);

        // Also refresh from server to ensure sync
        setTimeout(() => {
          fetchPendingRequests();
        }, 500);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("Error rejecting request");
      console.error("Error:", error);
    }
  };

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
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "approved"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "rejected"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "all"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            All
          </button>
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
            <p className="text-gray-600 text-lg">No pending requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}
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
                    <span className="font-medium">GPU Length:</span>{" "}
                    {request.length}mm
                  </p>
                  <p>
                    <span className="font-medium">GPU Height:</span>{" "}
                    {request.height}mm
                  </p>
                  <p>
                    <span className="font-medium">Slots:</span> {request.slots}
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
                    setSelectedRequest(request);
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
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedRequest.product_name}
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {/* Image */}
                {selectedRequest.images && (
                  <div className="mb-4">
                    <div className="flex border-2 border-black justify-center items-center max-h-96">
                      <div className="flex justify-center w-full h-full">
                        <img
                          src={JSON.parse(selectedRequest.images)[0]}
                          width="800"
                          height="800"
                          alt={selectedRequest.product_name}
                          className="object-contain max-h-96"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Table */}
                <div className="w-full overflow-x-auto mb-4">
                  <table className="w-full leading-8 border-collapse">
                    <tbody>
                      <tr className="border">
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Name
                        </th>
                        <td colSpan={4} className="border px-2 py-1">
                          {selectedRequest.product_name}
                        </td>
                      </tr>
                      <tr className="border">
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Source
                        </th>
                        <td colSpan={4} className="border px-2 py-1">
                          <a
                            href={selectedRequest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Link
                          </a>
                        </td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={2} className="border px-2 py-1 bg-gray-100">
                          Size
                        </th>
                        <th scope="row" className="border px-2 py-1 bg-gray-50"></th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Width(MM)</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Height(MM)</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Length(MM)</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Volume(L)</th>
                      </tr>
                      <tr className="border">
                        <th scope="row" className="border px-2 py-1 bg-gray-50">Body</th>
                        <td className="border px-2 py-1">{selectedRequest.width || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.depth || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.gpu_height || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.volume || "-"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={2} className="border px-2 py-1 bg-gray-100">
                          Material
                        </th>
                        <th scope="row" className="border px-2 py-1 bg-gray-50">Skeleton</th>
                        <td colSpan={4} className="border px-2 py-1">
                          {selectedRequest.skeleton_material === 3 ? "Steel" : "Unknown"}
                        </td>
                      </tr>
                      <tr className="border">
                        <th scope="row" className="border px-2 py-1 bg-gray-50">Shell</th>
                        <td colSpan={4} className="border px-2 py-1">
                          {selectedRequest.shell_material === 3 ? "Steel" : "Unknown"}
                        </td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={2} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Side Panel
                        </th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Open</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Solid</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Mesh</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Transparent</th>
                      </tr>
                      <tr className="border">
                        <td className="border px-2 py-1">{selectedRequest.open_panel ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{selectedRequest.solid_panel ? "Yes" : "No"}</td>
                        <td className={`border px-2 py-1 ${selectedRequest.mesh_panel ? "bg-zinc-600 text-white" : ""}`}>
                          {selectedRequest.mesh_panel ? "Yes" : "No"}
                        </td>
                        <td className="border px-2 py-1">{selectedRequest.transparent_panel ? "Yes" : "No"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={2} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Extra
                        </th>
                        <th scope="row" colSpan={2} className="border px-2 py-1 bg-gray-50">EOL</th>
                        <th scope="row" colSpan={2} className="border px-2 py-1 bg-gray-50">USB-C</th>
                      </tr>
                      <tr className="border">
                        <td colSpan={2} className="border px-2 py-1">{selectedRequest.eol ? "Yes" : "No"}</td>
                        <td colSpan={2} className={`border px-2 py-1 ${selectedRequest.usb_c ? "bg-zinc-600 text-white" : ""}`}>
                          {selectedRequest.usb_c ? "Yes" : "No"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Motherboard & PSU Table */}
                <div className="w-full overflow-x-auto mb-4">
                  <table className="w-full leading-8 border-collapse">
                    <tbody>
                      <tr className="border">
                        <th scope="row" rowSpan={4} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Motherboard
                        </th>
                        <th scope="col" colSpan={4} className="border px-2 py-1 bg-gray-50">
                          Type
                        </th>
                      </tr>
                      <tr className="border">
                        <td colSpan={4} className="border px-2 py-1">M-ATX</td>
                      </tr>
                      <tr className="border">
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-50">
                          Width(MM)
                        </th>
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-50">
                          Length(MM)
                        </th>
                      </tr>
                      <tr className="border">
                        <td colSpan={2} className="border px-2 py-1">{selectedRequest.motherboard_width || "-"}</td>
                        <td colSpan={2} className="border px-2 py-1">{selectedRequest.motherboard_length || "-"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={4} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          Power Supply
                        </th>
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-50">
                          Type
                        </th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Width(MM)</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Height(MM)</th>
                      </tr>
                      <tr className="border">
                        <td colSpan={2} className="border px-2 py-1">ATX 12V</td>
                        <td className="border px-2 py-1">{selectedRequest.psu_width || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.psu_height || "-"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="col" colSpan={4} className="border px-2 py-1 bg-gray-50">
                          Length(MM)
                        </th>
                      </tr>
                      <tr className="border">
                        <td colSpan={4} className="border px-2 py-1">{selectedRequest.psu_length || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CPU & GPU Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full leading-8 border-collapse">
                    <tbody>
                      <tr className="border">
                        <th scope="row" rowSpan={2} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          CPU
                        </th>
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-50">
                          Height (MM)
                        </th>
                        <th scope="col" colSpan={3} className="border px-2 py-1 bg-gray-50">
                          Liquid Cooling
                        </th>
                      </tr>
                      <tr className="border">
                        <td colSpan={2} className="border px-2 py-1">{selectedRequest.cpu_height || "-"}</td>
                        <td colSpan={2} className="border px-2 py-1">
                          {selectedRequest.l240 && (
                            <span className="bg-zinc-600 text-white px-2 py-1 m-1 text-sm rounded">240MM</span>
                          )}
                          {selectedRequest.l280 && (
                            <span className="bg-zinc-600 text-white px-2 py-1 m-1 text-sm rounded">280MM</span>
                          )}
                          {selectedRequest.l360 && (
                            <span className="bg-zinc-600 text-white px-2 py-1 m-1 text-sm rounded">360MM</span>
                          )}
                        </td>
                      </tr>
                      <tr className="border">
                        <th scope="row" rowSpan={6} colSpan={2} className="border px-2 py-1 bg-gray-100">
                          GPU
                        </th>
                        <th scope="col" colSpan={2} className="border px-2 py-1 bg-gray-50">
                          PCI-E Riser
                        </th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Width (MM)</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Height (MM)</th>
                      </tr>
                      <tr className="border">
                        <td colSpan={2} className="border px-2 py-1">{selectedRequest.pcie_riser ? "Yes" : "No"}</td>
                        <td className="border px-2 py-1">{selectedRequest.gpu_width || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.gpu_height || "-"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="col" colSpan={4} className="border px-2 py-1 bg-gray-50">
                          Length (MM)
                        </th>
                      </tr>
                      <tr className="border">
                        <td colSpan={4} className="border px-2 py-1">{selectedRequest.gpu_length || "-"}</td>
                      </tr>
                      <tr className="border">
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Slots</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Low Profile Slots</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Extra Slots</th>
                        <th scope="col" className="border px-2 py-1 bg-gray-50">Extra Low Profile Slots</th>
                      </tr>
                      <tr className="border">
                        <td className="border px-2 py-1">{selectedRequest.slot || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.low_profile_slot || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.extra_slot || "-"}</td>
                        <td className="border px-2 py-1">{selectedRequest.extra_low_profile_slot || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons - Only show for pending requests */}
                {selectedRequest.status === "pending" && (
                  <div className="flex gap-4 pt-6 border-t">
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
                  <div className="pt-6 border-t">
                    <p className={`text-center py-3 font-semibold rounded-md ${
                      selectedRequest.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      This request has already been {selectedRequest.status}
                      {selectedRequest.status === "approved" && selectedRequest.image_id &&
                        ` (Case ID: ${selectedRequest.image_id})`
                      }
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
