import React, { useState } from "react";
import { Undo2, History, CreditCard, Search, DollarSign, UserPlus, Receipt, Scale } from "lucide-react";
import { Supplier, Customer, Sale, Product } from "../types";

interface ReturnsCreditConsoleProps {
  customers: Customer[];
  sales: Sale[];
  products: Product[];
  onRefreshAll: () => void;
  userRole: string;
}

export default function ReturnsCreditConsole({
  customers,
  sales,
  products,
  onRefreshAll,
  userRole
}: ReturnsCreditConsoleProps) {
  const [activeTab, setActiveTab] = useState<"returns" | "customers" | "history">("returns");

  // Refund lookup
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [refundProduct, setRefundProduct] = useState("");
  const [refundQty, setRefundQty] = useState("1");
  const [refundReason, setRefundReason] = useState("damaged");

  // Create Customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custLimit, setCustLimit] = useState("50000");

  // Payoff credit
  const [payoffCustomer, setPayoffCustomer] = useState<Customer | null>(null);
  const [payoffAmount, setPayoffAmount] = useState("");

  const handleInvoiceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = invoiceQuery.trim();
    if (!sanitized) return;

    // Search sales
    const found = sales.find((s) => s.invoice_no === sanitized || s.invoice_no.endsWith(sanitized));
    if (found) {
      // Load details of sale items
      fetch(`/api/products`) // just to get names, but we'll fetch items or display
        .then(() => {
          setSelectedInvoice(found);
          // Set primary product first
        })
        .catch((err) => alert(err.message));
    } else {
      alert(`Invoice with reference ID '${sanitized}' was not matched in sales databases.`);
    }
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !refundProduct) return;

    const payload = {
      invoice_no: selectedInvoice.invoice_no,
      item_id: Number(refundProduct),
      returned_qty: Number(refundQty),
      reason: refundReason
    };

    fetch(`/api/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((j) => { throw new Error(j.error || "Refund aborted."); });
        }
        return res.json();
      })
      .then((json) => {
        alert(`Processed! Refunded amount is රු. ${json.refund.toFixed(2)}. Inventory stock restocked.`);
        onRefreshAll();
        setSelectedInvoice(null);
        setInvoiceQuery("");
      })
      .catch((e) => alert(e.message));
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;

    const payload = {
      name: custName,
      phone: custPhone,
      credit_limit: parseFloat(custLimit) || 50000.00,
      outstanding_balance: 0.00
    };

    fetch(`/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not register customer.");
        return res.json();
      })
      .then(() => {
        onRefreshAll();
        setShowCustomerModal(false);
        setCustName("");
        setCustPhone("");
        alert("New Customer Ledger profile created successfully!");
      })
      .catch((e) => alert(e.message));
  };

  const handlePayoffCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoffCustomer) return;
    const amountNum = parseFloat(payoffAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (amountNum > payoffCustomer.outstanding_balance) {
      alert("Paying off more than the outstanding credit is not permitted.");
      return;
    }

    // Since payoff is a special endpoint, we can adjust the customer outstanding balance directly via products post or simulate
    const updatedCustomer = {
      ...payoffCustomer,
      // Since it's a mock state update, we edit via standard endpoint or handle on server.
      // Let's create a server direct payoff simulation update:
      outstanding_balance: payoffCustomer.outstanding_balance - amountNum
    };

    // We can POST this back to customers table
    fetch(`/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updatedCustomer,
        id: payoffCustomer.id,
        // Send fields that will update
      })
    })
      .then(() => {
        alert(`Recorded! රු. ${amountNum.toFixed(2)} payoff logged to ledger.`);
        onRefreshAll();
        setPayoffCustomer(null);
        setPayoffAmount("");
      })
      .catch((e) => alert(e.message));
  };

  return (
    <div className="space-y-6">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-800 gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("returns")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "returns" ? "bg-red-650 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Undo2 size={13} />
            <span>Returns &amp; refunds</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "customers" ? "bg-red-655 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard size={13} />
            <span>ණය ලෙජරය (Credit Ledger)</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history" ? "bg-red-655 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History size={13} />
            <span>Overall Sales Register</span>
          </button>
        </div>

        <div>
          {activeTab === "customers" && (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer shadow-md"
            >
              <UserPlus size={13} />
              <span>Create Customer (ණය)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Area 1: Returns and Refunds Module */}
      {activeTab === "returns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lookup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <Search size={14} className="text-slate-400" />
              Search Bill Invoice Receipt
            </h3>

            <form onSubmit={handleInvoiceSearch} className="space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Enter the exact **Bill Invoice Reference Number** printed on the thermal ticket (e.g. `SSM-20260530-0001` or any invoice number generated during current run).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceQuery}
                  onChange={(e) => setInvoiceQuery(e.target.value)}
                  className="bg-slate-950 flex-1 rounded-lg pl-3 pr-3 py-2 border border-slate-850 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-100"
                  placeholder="e.g. SSM-20260530-0001"
                  required
                />
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-500 text-white font-bold text-xs px-4 rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow"
                >
                  <Search size={13} />
                  <span>Lookup</span>
                </button>
              </div>
            </form>

            {selectedInvoice && (
              <div className="mt-5 p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-sans animate-in fade-in duration-200">
                <div className="flex justify-between border-b border-slate-800 pb-2 text-xs">
                  <span className="font-bold text-red-500">Receipt #{selectedInvoice.invoice_no}</span>
                  <span className="font-mono text-slate-400">{new Date(selectedInvoice.created_at).toLocaleDateString()}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold uppercase text-slate-100">{selectedInvoice.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier Operator:</span>
                    <span>{selectedInvoice.user_name}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-mono text-red-500 font-bold">
                    <span>Net Total Paid:</span>
                    <span>රු. {selectedInvoice.net_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refund process panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <Undo2 size={14} className="text-red-500" />
              Process Refund Return
            </h3>

            {selectedInvoice ? (
              <form onSubmit={handleProcessRefund} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Select Purchased Item to Refund</label>
                  <select
                    value={refundProduct}
                    onChange={(e) => setRefundProduct(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-2 border border-slate-850 text-xs focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">— Choose purchased product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name_en}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Qty to Return</label>
                    <input
                      type="number"
                      min="1"
                      value={refundQty}
                      onChange={(e) => setRefundQty(e.target.value)}
                      className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-850 text-xs font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Refund Type / Motive</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="bg-slate-950 w-full rounded pl-3 pr-3 py-2 border border-slate-850 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="damaged">Damaged part replacement</option>
                      <option value="exchange">Customer Exchange request</option>
                      <option value="wrong_part">Incorrect size/part purchased</option>
                      <option value="voided">System Billing Error Correction</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-red-955/20 border border-red-500/10 rounded-lg text-[10px] text-amber-500 leading-relaxed">
                  <strong>SYSTEM RESTOCK LOGS:</strong> This action will return items sequentially to inventory stock AND dynamically deduct cash from the register shifts (or decrease outstanding customer credits if card was originally credited).
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md cursor-pointer uppercase"
                  >
                    <Undo2 size={13} />
                    <span>Process Return &amp; Refund</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-sans italic border-2 border-dashed border-slate-800 rounded-lg">
                Please lookup a valid Bill Receipt invoice to initiate the return manager screen...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Area 2: Customer Credit Ledger (ණය ලෙජරය) */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer list accounts table */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <CreditCard size={14} className="text-slate-400" />
              Active Credit Accounts (ණය ශේෂ ලැයිස්තුව)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-801 text-slate-400 uppercase text-[10px] tracking-wider font-sans">
                    <th className="py-2.5">Customer Name</th>
                    <th className="py-2.5">Mobile Contact</th>
                    <th className="py-2.5 text-right font-sans">Credit Max Limit</th>
                    <th className="py-2.5 text-right font-sans">Outstanding Debt</th>
                    <th className="py-2.5 text-right">Action Cash Book</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-850 hover:bg-slate-850/20">
                      <td className="py-3 font-semibold text-slate-100">{c.name}</td>
                      <td className="py-3 font-mono text-slate-400">{c.phone || "—"}</td>
                      <td className="py-3 text-right font-mono text-slate-300">රු. {c.credit_limit.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-bold text-red-400">රු. {c.outstanding_balance.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        {c.outstanding_balance > 0 ? (
                          <button
                            onClick={() => setPayoffCustomer(c)}
                            className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/10 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Pay Ledger Debt
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic px-2">Fully Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payoff ledger debt */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-330 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-500" />
              Record Credit Receipt (ණය පියවීම)
            </h3>

            {payoffCustomer ? (
              <form onSubmit={handlePayoffCredit} className="space-y-4 font-sans text-xs">
                <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-lg text-emerald-400">
                  <span className="font-bold block text-xs">Paying Account: {payoffCustomer.name}</span>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Outstanding balance: <strong>රු. {payoffCustomer.outstanding_balance.toFixed(2)}</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Payoff Incoming Cash (රු.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={payoffCustomer.outstanding_balance}
                    value={payoffAmount}
                    onChange={(e) => setPayoffAmount(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 py-2 border border-slate-850 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-100"
                    placeholder="E.g. 5000.00"
                    required
                  />
                  <p className="text-[9px] text-slate-500">Decreases customer ledger balance instantly details.</p>
                </div>

                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setPayoffCustomer(null); setPayoffAmount(""); }}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded text-xs shadow-md cursor-pointer uppercase"
                  >
                    Log cash receipt
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg leading-relaxed">
                Choose a customer on the left outstanding grid who has a pending debt balance to record direct payoffs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Area 3: Overall Sales Invoice Register */}
      {activeTab === "history" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            <History size={14} className="text-slate-400" />
            Overall Invoices Audit History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 pr-2">Date</th>
                  <th className="py-2.5 pr-2">Invoice No</th>
                  <th className="py-2.5 pr-2">Cashier</th>
                  <th className="py-2.5 pr-2">Customer Rec</th>
                  <th className="py-2.5 text-right">Discount</th>
                  <th className="py-2.5 text-right pr-4">Net Total Paid</th>
                  <th className="py-2.5 text-center">Payment</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-slate-850/50 hover:bg-slate-850/15">
                    <td className="py-3 pr-2 text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-2 font-mono font-bold text-red-500">{s.invoice_no}</td>
                    <td className="py-3 pr-2 text-slate-200">{s.user_name}</td>
                    <td className="py-3 pr-2 text-slate-300">{s.customer_name || "Walk-in Cash Client"}</td>
                    <td className="py-3 text-right font-mono text-emerald-400">රු. {s.discount_total.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-100 pr-4">රු. {s.net_total.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                        s.payment_method === "cash" ? "bg-emerald-950 border-emerald-500/20 text-emerald-400" :
                        s.payment_method === "card" ? "bg-blue-950 border-blue-500/20 text-blue-400" :
                        s.payment_method === "credit" ? "bg-red-950 border-red-500/20 text-red-400" :
                        "bg-slate-950 border-slate-700 text-slate-400"
                      }`}>
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-stone-900 text-stone-400 border border-stone-850 font-bold">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Creation Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-805 rounded-xl max-w-sm w-full overflow-hidden text-slate-100 shadow-2xl">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-bold text-sm tracking-tight">Create Customer Ledger Profile</span>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Customer Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-850 text-xs focus:outline-none text-slate-100"
                  placeholder="e.g. Priyantha Motors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Phone Mobile Link</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-850 text-xs font-mono focus:outline-none"
                  placeholder="e.g. 0771234567"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Default Credit Max Limit (රු.)</label>
                <input
                  type="number"
                  value={custLimit}
                  onChange={(e) => setCustLimit(e.target.value)}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-850 text-xs font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="bg-slate-800 text-slate-350 text-xs py-1.5 px-3 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white text-xs font-bold py-1.5 px-4 rounded shadow-md cursor-pointer uppercase"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
