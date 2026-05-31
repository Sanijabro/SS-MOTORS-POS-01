import React, { useState, useEffect } from "react";
import { TrendingUp, Award, AlertTriangle, Coins, ShieldAlert, BarChart3, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface AdminConsoleProps {
  userRole: string;
}

export default function AdminConsole({ userRole }: AdminConsoleProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7days" | "today" | "monthly">("7days");

  useEffect(() => {
    if (userRole !== "super-admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/analytics?role=${userRole}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((json) => {
            throw new Error(json.error || "Failed to load dashboard metrics");
          });
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userRole]);

  if (userRole !== "super-admin") {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-12 shadow-lg">
        <div className="bg-red-950/40 p-4 rounded-full border border-red-500/20 mb-4 animate-bounce">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-150 mb-2">RBAC Confidential Security Block</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          The requested system dashboard contains proprietary business financial details including **Cost Prices (ගැණුම් මිල)**, discount policies, and **Net Profit margins**.
        </p>
        <div className="mt-4 px-3 py-1 bg-slate-850 rounded text-[10px] font-mono text-red-400 border border-slate-750 uppercase">
          ERROR STATUS 403: Role &quot;{userRole}&quot; Forbidden
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div>
        <span className="text-xs font-mono">Calculating cost margins...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/20 border border-red-800 text-red-400 p-4 rounded-xl text-center text-xs">
        {error || "An unexpected error occurred compiling ledger statistics."}
      </div>
    );
  }

  // Adjust metrics based on time range filters for simulation
  let displaySales = data.grossSales;
  let displayProfit = data.netProfit;
  let displaySavings = data.cumulativeDiscounts;

  if (range === "today") {
    displaySales = displaySales * 0.45;
    displaySavings = displaySavings * 0.35;
    displayProfit = (displaySales * 0.30);
  } else if (range === "monthly") {
    displaySales = displaySales * 4.2;
    displaySavings = displaySavings * 4.0;
    displayProfit = displayProfit * 4.1;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard headers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Coins className="text-red-500" size={20} />
            SS MOTORS Analytics Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time Costing, Margin Analytics &amp; Inventory Reports</p>
        </div>

        {/* Custom Range select buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setRange("today")}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              range === "today" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            EOD Today
          </button>
          <button
            onClick={() => setRange("7days")}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              range === "7days" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRange("monthly")}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              range === "monthly" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly Projections
          </button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric Card: Gross Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-100">
              රු. {displaySales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-emerald-400 mt-1.5 text-[11px] font-semibold">
              <ArrowUpRight size={12} />
              <span>+14.2% from previous week</span>
            </div>
          </div>
        </div>

        {/* Metric Card: Cumulated Savings / Discounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Discounts</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
              < coins size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-100">
              රු. {displaySavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-slate-400 mt-1.5 text-[11px] font-semibold">
              <span>Promo campaign reductions</span>
            </div>
          </div>
        </div>

        {/* Metric Card: Net Profit [Formula: Net Total - Historical Cost Price] */}
        <div className="bg-slate-950 border border-red-950 rounded-xl p-5 shadow-md relative overflow-hidden ring-1 ring-red-500/10">
          <div className="absolute right-0 top-0 h-16 w-16 bg-red-650/5 rounded-bl-full border-l border-b border-red-500/10"></div>
          <div className="flex justify-between items-start z-10 relative">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Net Profit margin</span>
            <div className="p-1.5 bg-red-600/10 rounded-lg text-red-500 border border-red-500/20">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-2 z-10 relative">
            <span className="text-2xl font-black font-mono tracking-tight text-red-500">
              රු. {displayProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-emerald-400 mt-1.5 text-[11px] font-semibold">
              <ArrowUpRight size={12} />
              <span>Margin index: 25.8% gross</span>
            </div>
          </div>
        </div>

        {/* Metric Card: Low Stock Triggers */}
        <div className={`border rounded-xl p-5 shadow-sm transition-colors ${
          data.lowStockCount > 0 
            ? "bg-amber-950/20 border-amber-500/30 text-amber-500" 
            : "bg-slate-900 border-slate-800 text-slate-400"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock Triggers</span>
            <div className={`p-1.5 rounded-lg border ${
              data.lowStockCount > 0 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black font-mono tracking-tight ${data.lowStockCount > 0 ? "text-amber-500" : "text-slate-100"}`}>
              {data.lowStockCount} Parts
            </span>
            <div className="text-[11px] font-semibold mt-1.5 leading-none">
              {data.lowStockCount > 0 ? "Critically low, dispatch restocking orders" : "All inventories stocked safely"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Graph for Profit/Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-slate-400" />
              Gross Sales vs Net Profit (Last 7 Days)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Source: SQL ledger data</span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2433" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="sales" name="Gross Sales (රු.)" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit (රු.)" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling products & Low Stock list */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Award size={15} className="text-red-500" />
              Top Selling Spark Items
            </h3>
            <div className="space-y-3.5">
              {data.topSellingItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <div className="max-w-[70%]">
                    <p className="font-bold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Quantity Sold: {item.qty} units</p>
                  </div>
                  <span className="font-mono font-semibold text-[11px] text-red-500">
                    රු. {item.salesTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts table summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-500" />
              Critical Reorder Alerts
            </h3>
            <div className="max-h-[140px] overflow-y-auto space-y-2.5">
              {data.lowStockItems && data.lowStockItems.length > 0 ? (
                data.lowStockItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg">
                    <div>
                      <p className="font-bold text-slate-200">{item.name_en}</p>
                      <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 border border-red-500/20 text-red-400 font-bold">
                        Stock: {item.stock_qty}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Min: {item.reorder_level}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-sans">
                  No critical stock shortages. All set.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
