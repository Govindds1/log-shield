"use client";
import React, { useState } from "react";
import { Upload, ShieldAlert, CheckCircle, Terminal } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function LogShield() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    // This is where we talk to your FastAPI backend
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/scan", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error scanning file:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results
    ? Object.entries(
      results.details.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

  const calculateScore = () => {
    if (!results) return 100;
    // Every threat found reduces the score by 5 points
    const score = 100 - (results.threats_found * 5);
    return Math.max(score, 0); // Ensure it doesn't go below 0
  };

  const healthScore = calculateScore();

  const exportPDF = () => {
    const doc = new jsPDF();

    // Title & Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("LogShield Security Audit Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Security Health Score: ${healthScore}%`, 14, 38);

    // Threat Table
    const tableRows = results.details.map((t: any) => [
      t.type,
      t.ip,
      t.line.substring(0, 50) + "..."
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Type', 'Attacker IP', 'Log Fragment']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] } // Blue header
    });

    doc.save("logshield-report.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            LogShield AI
          </h1>
          <p className="text-slate-400">
            Instant Security Audit for Nginx/Apache Logs
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
            Micro-SaaS MVP
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">

        {/* Upload Zone */}
        {!results && (
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center hover:border-blue-500/50 transition-colors bg-slate-900/50">
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={handleUpload}
              accept=".log,text/plain"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <Upload className="mx-auto mb-4 text-blue-500" size={48} />
              <h2 className="text-xl font-semibold mb-2">
                Upload your .log file
              </h2>
              <p className="text-slate-500 mb-6">
                Drag and drop or click to browse
              </p>
              <div className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium transition-all inline-block">
                {loading ? "Analyzing..." : "Select Log File"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center mb-3">
                    <ShieldAlert className="text-blue-400" size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Instant Detection</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">Identifies SQLi, XSS, and Directory Traversal attacks in milliseconds.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center mb-3">
                    <Terminal className="text-purple-400" size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Actionable Ban List</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">Get pre-written iptables commands to block malicious IPs instantly.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center mb-3">
                    <CheckCircle className="text-green-400" size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Zero-Trust Privacy</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">Logs are processed in-memory and never stored on our servers.</p>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Results View */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-sm">Lines Scanned</p>
                <p className="text-2xl font-bold">{results.total_lines}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-sm">Threats Found</p>
                <p
                  className={`text-2xl font-bold ${results.threats_found > 0 ? "text-red-500" : "text-green-500"}`}
                >
                  {results.threats_found}
                </p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 border-t-4 border-t-blue-500">
                <p className="text-slate-400 text-sm">Security Health</p>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-bold ${healthScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {healthScore}%
                  </p>
                  <p className="text-xs text-slate-500 mb-1">
                    {healthScore > 80 ? 'Excellent' : 'Risk Detected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <button
                onClick={() => setResults(null)}
                className="text-sm text-slate-500 hover:text-white underline"
              >
                Scan another file
              </button>

              <button
                onClick={exportPDF}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                <CheckCircle size={16} className="text-green-400" />
                Download PDF Report
              </button>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-64">
              <h3 className="text-sm font-medium text-slate-400 mb-4">
                Threat Distribution
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>


            {/* Threat Details Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldAlert className="text-red-500" size={18} />
                  Detected Vulnerabilities
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Log Snippet</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.details.map((threat: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-mono">
                            {threat.type}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {threat.country}
                        </td>

                        <td className="px-6 py-4 text-slate-300 font-mono text-xs truncate max-w-[300px]">
                          {threat.line}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              const cmd = `sudo iptables -A INPUT -s ${threat.ip} -j DROP`;
                              navigator.clipboard.writeText(cmd);
                              alert(`Copied ban command for ${threat.ip}`);
                            }}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Terminal size={14} />
                            Copy Ban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
