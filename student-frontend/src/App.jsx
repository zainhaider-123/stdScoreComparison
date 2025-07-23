import { useState } from "react";

function App() {
  const [score, setScore] = useState("");
  const [factor, setFactor] = useState("");
  const [chartType, setChartType] = useState("violin");
  const [summary, setSummary] = useState(null);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  const scoreOptions = ["MathScore", "ReadingScore", "WritingScore", "AvgScore"];
  const factorOptions = [
    "Gender",
    "EthnicGroup",
    "LunchType",
    "ParentEduc",
    "TestPrep",
    "IsFirstChild"
  ];
  const chartTypes = ["violin", "box", "bar"];

  const handleCompare = async () => {
    if (!score || !factor || !chartType) {
      setError("Please select all dropdowns.");
      return;
    }

    setError("");
    setSummary(null);
    setImage(null);

    try {
      const response = await fetch("http://127.0.0.1:3000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ score, factor, chart_type: chartType })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSummary(data.summary);
        setImage(data.image);
      }
    } catch (err) {
      setError("Error fetching data from server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-6 text-center">Student Score Comparison</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Score</option>
            {scoreOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <select
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Factor</option>
            {factorOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Chart Type</option>
            {chartTypes.map((type) => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCompare}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Compare
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {summary && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
            <div className="overflow-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-3 py-1">Group</th>
                    {Object.keys(Object.values(summary)[0]).map((key) => (
                      <th key={key} className="border px-3 py-1">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary).map(([group, stats]) => (
                    <tr key={group}>
                      <td className="border px-3 py-1 font-medium">{group}</td>
                      {Object.values(stats).map((value, i) => (
                        <td key={i} className="border px-3 py-1">{value.toFixed(2)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {image && (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Comparison Chart</h2>
            <img
              src={`data:image/png;base64,${image}`}
              alt="Comparison Chart"
              className="mx-auto border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
