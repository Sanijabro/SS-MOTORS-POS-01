import React, { useRef } from "react";
import { Printer, X, CreditCard, ChevronDown } from "lucide-react";
import { Sale, CartItem } from "../types";

interface ReceiptPrinterProps {
  sale: Sale | null;
  items: CartItem[];
  currentCashier: string;
  onClose: () => void;
}

export default function ReceiptPrinter({
  sale,
  items,
  currentCashier,
  onClose
}: ReceiptPrinterProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a style element to optimize for thermal roll output
      const style = document.createElement("style");
      style.innerHTML = `
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
    }
  };

  // Format date and time
  const saleDate = new Date(sale.created_at);
  const formattedDate = saleDate.toISOString().slice(0, 10);
  const formattedTime = saleDate.toTimeString().slice(0, 5);

  // Total savings
  const totalSavings = sale.discount_total;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 my-auto">
        {/* Header toolbar */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Printer size={18} className="text-red-500" />
            <span className="font-semibold text-sm">ESC/POS Thermal Bill (80mm)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-full cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Receipt Container simulating thermal receipt */}
        <div className="p-6 bg-slate-950 flex flex-col items-center">
          <div
            ref={printRef}
            className="bg-white text-black p-5 font-mono text-xs w-[76mm] shadow-lg relative border-b-8 border-dashed border-white"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              lineHeight: "1.4",
              color: "#1c1917"
            }}
          >
            {/* Rigid ESC/POS simulated layout */}
            <div className="text-center">
              <span className="text-lg font-bold block tracking-wider font-sans">SS MOTORS</span>
              <span className="text-[10px] block font-sans">මීගමු පාර, පන්සල් හංදිය (හාල්දඩුවන)</span>
              <span className="text-[10px] block font-sans">දුරකථන: 031-2244556, 077-1234567</span>
            </div>
            <div className="my-2 border-t border-dashed border-stone-400"></div>

            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>දිනය (Date): {formattedDate}</span>
                <span>වේලාව (Time): {formattedTime}</span>
              </div>
              <div>බිල්පත් අංකය (Bill No): #{sale.invoice_no.split("-").pop() || sale.invoice_no}</div>
              <div>კැෂියර් (Cashier): {sale.user_name || currentCashier}</div>
            </div>
            <div className="my-2 border-t border-dashed border-stone-400"></div>

            {/* Table Header */}
            <div className="grid grid-cols-12 font-bold mb-1">
              <div className="col-span-6">භාණ්ඩ විස්තරය (Item)</div>
              <div className="col-span-3 text-center">ප්රමාණය (Qty)</div>
              <div className="col-span-3 text-right">මිල (Price)</div>
            </div>
            <div className="border-t border-dashed border-stone-400 my-1"></div>

            {/* List items */}
            <div className="space-y-2 my-2">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold font-sans text-[11px]">
                    {item.name_si || item.name_en}
                  </div>
                  {item.name_si && (
                    <div className="text-[9px] text-stone-500 font-sans tracking-tight">
                      {item.name_en}
                    </div>
                  )}
                  <div className="flex justify-between pl-2 text-[11px]">
                    <span className="col-span-6 text-stone-600">
                      {item.qty} x {item.selling_price.toFixed(2)}
                    </span>
                    <span className="col-span-3 text-right">
                      {(item.selling_price * item.qty - item.discount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Calculations totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>භාණ්ඩ එකතුව (Subtotal):</span>
                <span>{sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>වට්ටම (Discount):</span>
                <span>{sale.discount_total.toFixed(2)}</span>
              </div>
              {sale.surcharge_amount && sale.surcharge_amount > 0 ? (
                <div className="flex justify-between text-stone-700">
                  <span>සවි කිරීම් ගාස්තු (Fitting Surcharge):</span>
                  <span>{sale.surcharge_amount.toFixed(2)}</span>
                </div>
              ) : null}
              {sale.tax_amount && sale.tax_amount > 0 ? (
                <div className="flex justify-between text-stone-700">
                  <span>බදු එකතුව (Tax Amount):</span>
                  <span>{sale.tax_amount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="border-t border-stone-400 my-1"></div>
              <div className="flex justify-between font-bold text-[13px]">
                <span>මුළු මුදල (Net Total):</span>
                <span>රු. {sale.net_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>ගෙවූ මුදල (Paid):</span>
                <span>රු. {sale.cash_paid.toFixed(2)}</span>
              </div>
              {sale.payment_method !== "credit" ? (
                <div className="flex justify-between">
                  <span>ඉතිරි මුදල (Balance):</span>
                  <span>රු. {sale.balance_returned.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-red-655 font-bold">
                  <span>ණය ගිණුමට (Outstanding):</span>
                  <span>රු. {sale.net_total.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Custome delighted savings savings */}
            <div className="flex justify-between text-[11px] font-bold">
              <span>මෙම මිලදී ගැනීමෙන් ඔබට ලැබුණු</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span>මුළු ලාභය (Total Savings):</span>
              <span>රු. {totalSavings.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Sthuthiy bar */}
            <div className="text-center font-bold tracking-wider my-1">
              <span className="block font-sans">ස්තූතියි! නැවත පැමිණෙන්න.</span>
              <span className="block text-[8px] font-mono text-stone-500 mt-1">POWERED BY SS-MOTORS POS v1.0</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 bg-slate-850 border-t border-slate-750 flex flex-row space-x-3 justify-end no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-750 text-slate-300 rounded hover:bg-slate-800 transition-colors text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-semibold text-xs transition-all flex items-center space-x-2 shadow-md cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Receipt & Kick Drawer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
