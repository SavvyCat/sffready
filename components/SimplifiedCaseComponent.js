import { useEffect, useState } from "react";

const SimplifiedCaseDisplay = ({ caseSlug }) => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!caseSlug) {
      setLoading(false);
      return;
    }

    const fetchCaseDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://backend-ochre-tau-58.vercel.app/case?name=${caseSlug}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch case details (${response.status})`);
        }

        const data = await response.json();
        setCaseData(data);
      } catch (err) {
        console.error("Error fetching case details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseSlug]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="spinner w-8 h-8 border-4 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading case details: {error}
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-4 text-gray-500">No case information available</div>
    );
  }

  // Extract the specific data we want to display
  const modeInfo = caseData.modes.results[0] || {};

  return (
    <div className="bg-white rounded-lg p-4 mt-4 border border-zinc-800">
      <h3 className="text-xl font-bold text-black mb-4">Case Specifications</h3>

      <div className="w-full overflow-x-auto">
        <table className="w-full leading-8 border-collapse">
          <tbody>
            <tr>
              <th scope="row" rowSpan={3}>
                Size
              </th>
              <th scope="row"></th>
              <th scope="col">Width(MM)</th>
              <th scope="col">Height(MM)</th>
              <th scope="col">Length(MM)</th>
              <th scope="col">Volume(L)</th>
            </tr>
            <tr>
              <th scope="row">Body</th>
              <td>{modeInfo.width}</td>
              <td>{modeInfo.depth}</td>
              <td>{modeInfo.height}</td>
              <td>{modeInfo.volume}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimplifiedCaseDisplay;
