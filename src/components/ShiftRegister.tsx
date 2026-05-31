import React, { useState } from "react";
import { FolderCheck, Lock, Unlock, Printer, RefreshCcw, DollarSign, ArrowRightLeft, UserCheck } from "lucide-react";
import { Shift } from "../types";

interface ShiftRegisterProps {
  activeShift: Shift | null;
  shiftHistory: Shift[];
  onOpenShift: (float: number) => void;
  onCloseShift: (actual: number) => void;
  userRole: string;
}

export default function ShiftRegister({
  activeShift,
  shiftHistory,
  onOpenShift,
  onCloseShift,
  userRole
}: ShiftRegisterProps) {
  const [startingFloat, setStartingFloat] = useState<string>("5000");
  const [endingCash, setEndingCash] = useState<string>("");
  const [reportModal, setReportModal] = useState<{ show: boolean, shift: Shift | null, type: "X" | "Z" }>({
    show: false,
    shift: null,
    type: "X"
  });

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const float = Number(startingFloat);
    if (isNaN(float) || float < 0) return;
    onOpenShift(float);
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = Number(endingCash);
    if (isNaN(actual) || actual < 0) return;
    onCloseShift(actual);
    setEndingCash("");
  };

  const triggerReport = (shift: Shift, type: "X" | "Z") => {
    setReportModal({ show: true, shift, type });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FolderCheck className="text-red-500" size={20} />
          Drawer Shift Register &amp; Floating Cash
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Control drawer cash registers, floats, shift discrepancies and print X &amp; Z summaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Shift Trigger Card */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            {activeShift ? <Unlock className="text-emerald-500" size={14} /> : <Lock className="text-red-500" size={14} />}
            Drawer Lock State
          </h3>

          {!activeShift ? (
            /* Open Shift Register */
            <form onSubmit={handleOpen} className="space-y-4">
              <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-amber-500 text-xs flex gap-2">
                <Lock size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Register Locked.</strong> Cashiers are unable to checkout or bill items without locking a starting float drawer balance as audit insurance.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Starting Float (රු.)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    රු.
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={startingFloat}
                    onChange={(e) => setStartingFloat(e.target.value)}
                    className="bg-slate-950 w-full rounded-lg pl-10 pr-4 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-100 font-mono text-sm font-bold"
                    placeholder="Enter starting cash..."
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer uppercase"
              >
                <Unlock size={13} />
                <span>Open Shift / Kick Drawer</span>
              </button>
            </form>
          ) : (
            /* Close Shift Register */
            <form onSubmit={handleClose} className="space-y-4">
              <div className="space-y-2 p-3 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cashier:</span>
                  <span className="font-bold text-slate-100">{activeShift.user_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Opened At:</span>
                  <span className="font-mono text-slate-300">{new Date(activeShift.opened_at).toTimeString().slice(0,5)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Expected Float:</span>
                  <span className="font-mono font-bold text-slate-100">රු. {activeShift.starting_float.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-444">Sales Expected:</span>
                  <span className="font-mono font-bold text-red-500">රු. {activeShift.expected_cash.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Actual Drawer Cash Count (රු.)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    රු.
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={endingCash}
                    onChange={(e) => setEndingCash(e.target.value)}
                    className="bg-slate-950 w-full rounded-lg pl-10 pr-4 py-2 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-100 font-mono text-sm font-bold"
                    placeholder="Physical cash count..."
                    required
                  />
                </div>
                <p className="text-[9px] text-slate-500">Count all notes &amp; coins physically present in the cash drawer drawer.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerReport(activeShift, "X")}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[10px] py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 shadow border border-slate-700 cursor-pointer uppercase"
                >
                  <Printer size={11} />
                  <span>X-Report</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 shadow cursor-pointer uppercase"
                >
                  <Lock size={11} />
                  <span>Close Drawer</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right column: Shift register logs */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            <ArrowRightLeft size={14} className="text-slate-400" />
            Historical Drawer EOD Shift Summaries
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5">Date / Shift ID</th>
                  <th className="py-2.5">Cashier</th>
                  <th className="py-2.5 text-right">Float</th>
                  <th className="py-2.5 text-right">Expected Drawer</th>
                  <th className="py-2.5 text-right">Physical Cash</th>
                  <th className="py-2.5 text-right">Short/Over</th>
                  <th className="py-2.5 text-center">Z-Report</th>
                </tr>
              </thead>
              <tbody>
                {shiftHistory.length > 0 ? (
                  shiftHistory.map((s) => {
                    const diff = s.actual_cash !== null ? s.actual_cash - s.expected_cash : null;
                    return (
                      <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-850/35">
                        <td className="py-3 font-mono font-bold text-slate-300">
                          #{s.id.toString().padStart(3, "0")}
                          <span className="block text-[9px] text-slate-500 font-normal mt-0.5">
                            {new Date(s.opened_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 text-slate-200">
                          <span className="text-xs font-semibold">{s.user_name}</span>
                          <span className="block text-[9px] text-slate-500 mt-0.5">
                            {s.status === "open" ? (
                              <span className="text-emerald-500 font-bold uppercase tracking-widest text-[8px] border border-emerald-500/20 px-1 py-0.2 rounded bg-emerald-950/20">
                                ACTIVE OPEN
                              </span>
                            ) : (
                              `Closed: ${new Date(s.closed_at || "").toTimeString().slice(0, 5)}`
                            )}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-300">රු. {s.starting_float.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-slate-300">රු. {s.expected_cash.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono text-slate-200">
                          {s.actual_cash !== null ? `රු. ${s.actual_cash.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          {diff !== null ? (
                            diff === 0 ? (
                              <span className="text-emerald-400 text-[11px]">Balanced</span>
                            ) : diff > 0 ? (
                              <span className="text-blue-400 text-[11px]">+{diff.toFixed(2)}</span>
                            ) : (
                              <span className="text-red-400 text-[11px] font-black">{diff.toFixed(2)}</span>
                            )
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {s.status === "closed" ? (
                            <button
                              onClick={() => triggerReport(s, "Z")}
                              className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/10 rounded-md font-bold tracking-tight text-[9px] cursor-pointer"
                            >
                              Z-Report
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Open</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500 font-sans italic">
                      No audited historical drawer registers detected in persistent databases.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* X/Z Shift Report Modal overlay */}
      {reportModal.show && reportModal.shift && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-black p-6 rounded-xl max-w-sm w-full font-mono text-xs shadow-2xl relative border-b-8 border-dashed border-stone-200" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <button
              onClick={() => setReportModal({ show: false, shift: null, type: "X" })}
              className="absolute top-4 right-4 text-stone-500 hover:text-black font-sans font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center font-sans">
              <span className="text-lg font-bold block">SS MOTORS</span>
              <span className="block text-[9px] font-bold uppercase tracking-wider border border-black/20 py-0.5 px-2 bg-stone-100 my-1 justify-center max-w-max mx-auto">
                {reportModal.type === "X" ? "X-Report (Shift Audit Summary)" : "Z-Report (End of Day Audit Close)"}
              </span>
              <p className="text-[10px] text-stone-500 mt-1">Negombo Rd, Pansal Junction, Haldanduwana</p>
            </div>
            <div className="my-2 border-t border-dashed border-stone-400"></div>

            <div className="space-y-0.5 text-[11px]">
              <div>Report Generated: {new Date().toLocaleDateString()} {new Date().toTimeString().slice(0,5)}</div>
              <div>Shift Ref: #SHF-{reportModal.shift.id.toString().padStart(3, "0")}</div>
              <div>Operator Name: {reportModal.shift.user_name}</div>
              <div>Status Logged: {reportModal.shift.status.toUpperCase()}</div>
              <div>Shift Start: {new Date(reportModal.shift.opened_at).toLocaleTimeString()}</div>
              {reportModal.shift.closed_at && (
                <div>Shift End: {new Date(reportModal.shift.closed_at).toLocaleTimeString()}</div>
              )}
            </div>
            <div className="my-2 border-t border-dashed border-stone-400"></div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>(A) Starting Cash Float:</span>
                <span className="font-bold">Rs. {reportModal.shift.starting_float.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(B) Gross Cash Sales:</span>
                <span className="font-bold">Rs. {(reportModal.shift.expected_cash - reportModal.shift.starting_float).toFixed(2)}</span>
              </div>
              <div className="border-t border-stone-300 my-1"></div>
              <div className="flex justify-between font-bold text-[12px]">
                <span>(C) EXPECTED DRAWER CASH (A+B):</span>
                <span>Rs. {reportModal.shift.expected_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>(D) ACTUAL PHYSICAL ENTERED:</span>
                <span className="font-bold">
                  Rs. {reportModal.shift.actual_cash !== null ? reportModal.shift.actual_cash.toFixed(2) : "UNAUDITED"}
                </span>
              </div>
              {reportModal.shift.actual_cash !== null && (
                <div className="flex justify-between border-t border-dashed border-stone-305 pt-1 font-bold">
                  <span>DISCREPANCY OVER/SHORT (D-C):</span>
                  <span className={reportModal.shift.actual_cash - reportModal.shift.expected_cash >= 0 ? "text-emerald-700" : "text-red-700 underline"}>
                    Rs. {(reportModal.shift.actual_cash - reportModal.shift.expected_cash).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="my-2 border-t border-dashed border-stone-400"></div>

            <div className="text-center font-sans text-stone-500 text-[9px] mt-4">
              SHIFT RECORD PERSISTED IN SYSTEM LOGS FOR SUPER-ADMIN REVIEW.
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 w-full bg-stone-900 text-white hover:bg-stone-850 font-sans font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer no-print focus:outline-none"
            >
              <Printer size={13} />
              <span>Print Audit Ticket</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
