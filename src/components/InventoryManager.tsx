import React, { useState, useEffect } from "react";
import { Package, Truck, Plus, AlertCircle, RefreshCw, Barcode, Trash2, EyeOff, Wrench, Download, Upload } from "lucide-react";
import { Product, Category, Supplier } from "../types";
import BarcodeLabelPrinter from "./BarcodeLabelPrinter";
import XmlSyncModal from "./XmlSyncModal";

interface InventoryManagerProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onRefreshProducts: () => void;
  userRole: string;
}

export default function InventoryManager({
  products,
  categories,
  suppliers,
  onRefreshProducts,
  userRole
}: InventoryManagerProps) {
  // Products catalogs editing
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);
  const [showXmlImportModal, setShowXmlImportModal] = useState(false);

  const handleExportXml = () => {
    const escapeXml = (unsafe: string) => {
      if (!unsafe) return "";
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<inventory>\n';
    const xmlFooter = '</inventory>';
    const xmlItems = products.map(p => `  <product>
    <id>${p.id}</id>
    <sku>${escapeXml(p.sku)}</sku>
    <barcode>${escapeXml(p.barcode || "")}</barcode>
    <name_en>${escapeXml(p.name_en)}</name_en>
    <name_si>${escapeXml(p.name_si || "")}</name_si>
    <category_id>${p.category_id}</category_id>
    <brand>${escapeXml(p.brand || "")}</brand>
    <cost_price>${p.cost_price || 0}</cost_price>
    <selling_price>${p.selling_price || 0}</selling_price>
    <stock_qty>${p.stock_qty || 0}</stock_qty>
    <reorder_level>${p.reorder_level || 5}</reorder_level>
  </product>`).join('\n');

    const xmlString = xmlHeader + xmlItems + '\n' + xmlFooter;
    const blob = new Blob([xmlString], { type: "text/xml;charset=utf-8;" });
    const filename = `ss_motors_inventory_${new Date().toISOString().slice(0, 10)}.xml`;

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const escapeCsv = (unsafe: string | number | undefined | null) => {
      if (unsafe === undefined || unsafe === null) return '""';
      const str = String(unsafe);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = [
      "ID",
      "SKU",
      "Barcode",
      "Name (EN)",
      "Name (SI)",
      "Category ID",
      "Brand",
      "Cost Price",
      "Selling Price",
      "Stock Quantity",
      "Reorder Level"
    ];

    const rows = products.map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.sku),
      escapeCsv(p.barcode || ""),
      escapeCsv(p.name_en),
      escapeCsv(p.name_si || ""),
      escapeCsv(p.category_id),
      escapeCsv(p.brand || ""),
      escapeCsv(p.cost_price || 0),
      escapeCsv(p.selling_price || 0),
      escapeCsv(p.stock_qty || 0),
      escapeCsv(p.reorder_level || 5)
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `ss_motors_inventory_${new Date().toISOString().slice(0, 10)}.csv`;

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Supplier Purchase Orders
  const [showPODialog, setShowPODialog] = useState(false);
  const [poSupplier, setPoSupplier] = useState<string>("1");
  const [poNumber, setPoNumber] = useState<string>("");
  const [poProduct, setPoProduct] = useState<string>("1");
  const [poCost, setPoCost] = useState<string>("");
  const [poQty, setPoQty] = useState<string>("");

  // Stock adjustments
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<string>("1");
  const [adjustQty, setAdjustQty] = useState<string>("-1");
  const [adjustReason, setAdjustReason] = useState<string>("damaged");
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  // Initialize PO default number on open
  useEffect(() => {
    if (showPODialog) {
      setPoNumber(`PO-${Date.now().toString().slice(-5)}`);
    }
  }, [showPODialog]);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...editingProduct,
      category_id: Number(editingProduct.category_id || 1),
      selling_price: Number(editingProduct.selling_price || 0),
      cost_price: userRole === "cashier" ? undefined : Number(editingProduct.cost_price || 0),
      stock_qty: Number(editingProduct.stock_qty || 0),
      reorder_level: Number(editingProduct.reorder_level || 5)
    };

    fetch(`/api/products?role=${userRole}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save product catalogue item.");
        return res.json();
      })
      .then(() => {
        onRefreshProducts();
        setShowProductDialog(false);
        setEditingProduct(null);
        setErr(null);
      })
      .catch((e) => setErr(e.message));
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyInt = parseInt(poQty);
    const costPriceNum = parseFloat(poCost);

    if (isNaN(qtyInt) || qtyInt <= 0 || isNaN(costPriceNum) || costPriceNum <= 0) {
      alert("Invalid Purchase Order Cost Price or Quantity counts.");
      return;
    }

    const poPayload = {
      supplier_id: Number(poSupplier),
      order_no: poNumber,
      items: [
        {
          product_id: Number(poProduct),
          qty: qtyInt,
          cost_price: costPriceNum
        }
      ]
    };

    fetch(`/api/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poPayload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not log purchase order restocking.");
        return res.json();
      })
      .then(() => {
        onRefreshProducts();
        setShowPODialog(false);
        setPoQty("");
        setPoCost("");
        alert("Purchase Order processed successfully! Weighted Average Cost Price recalculated automatically.");
      })
      .catch((e) => alert(e.message));
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyAdjustedNum = parseInt(adjustQty);

    if (isNaN(qtyAdjustedNum) || qtyAdjustedNum === 0) {
      alert("Invalid Adjust quantity value.");
      return;
    }

    const payload = {
      product_id: Number(adjustProduct),
      qty_adjusted: qtyAdjustedNum,
      reason: adjustReason,
      notes: adjustNotes
    };

    fetch(`/api/stock-adjustments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to post stock adjustment.");
        return res.json();
      })
      .then(() => {
        onRefreshProducts();
        setShowAdjustDialog(false);
        setAdjustNotes("");
        alert("Stock adjustment recorded and inventory balances audited in database!");
      })
      .catch((e) => alert(e.message));
  };

  const startCreateProduct = () => {
    const defaultSKU = `SP-GEN-${Date.now().toString().slice(-4)}`;
    const defaultBarcode = `89012340${products.length + 1}`;
    setEditingProduct({
      sku: defaultSKU,
      barcode: defaultBarcode,
      name_en: "",
      name_si: "",
      category_id: 1,
      brand: "",
      cost_price: 100,
      selling_price: 150,
      stock_qty: 15,
      reorder_level: 5
    });
    setErr(null);
    setShowProductDialog(true);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setErr(null);
    setShowProductDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="text-red-500" size={20} />
            Inventory &amp; Supply Chain Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Edit catalog parts, handle barcode scanning, log purchase orders, and audit stock adjustments</p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export XML button */}
          <button
            onClick={handleExportXml}
            className="bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer"
            title="Export full inventory product catalog as an XML backup sheet"
          >
            <Download size={13} />
            <span>Export XML</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer"
            title="Export full inventory product catalog as a CSV spreadsheet sheet"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Import XML button */}
          <button
            onClick={() => setShowXmlImportModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer"
            title="Import or update inventory stock from structured XML backup sheets"
          >
            <Upload size={13} />
            <span>Import XML</span>
          </button>

          {/* Stock adjustments dialog button */}
          <button
            onClick={() => setShowAdjustDialog(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer"
          >
            <Wrench size={13} />
            <span>Audit Adjustment</span>
          </button>

          {/* PO Restock button */}
          <button
            onClick={() => setShowPODialog(true)}
            className="bg-slate-850 hover:bg-slate-800 text-red-400 border border-red-950 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer"
          >
            <Truck size={13} />
            <span>PO restock (Avg Costing)</span>
          </button>

          {/* Add product button */}
          <button
            onClick={startCreateProduct}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Spare Part</span>
          </button>
        </div>
      </div>

      {/* Main Stock Products table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="p-3">SKU &amp; Barcode</th>
                <th className="p-3">Part Description</th>
                <th className="p-3">Category / Brand</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const getCategoryName = (id: number) => {
                  return categories.find((c) => c.id === id)?.name || "Universal";
                };

                const isLow = p.stock_qty <= p.reorder_level;

                return (
                  <tr key={p.id} className="border-b border-slate-850 hover:bg-slate-850/20">
                    {/* SKU & Barcode */}
                    <td className="p-3 font-mono">
                      <span className="font-bold text-slate-200 block">{p.sku}</span>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Barcode size={10} className="text-slate-400" />
                        <span>{p.barcode || "N/A"}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-3">
                      <span className="font-semibold text-slate-100 block">{p.name_en}</span>
                      <span className="text-[11px] text-slate-400 font-sans block mt-0.5">{p.name_si || "—"}</span>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className="text-slate-300 block">{getCategoryName(p.category_id)}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{p.brand || "Bajaj Universal"}</span>
                    </td>

                    {/* Dynamic Cost Price (Strictly hidden for Casheir!) */}
                    <td className="p-3 text-right font-mono text-slate-300">
                      {userRole === "cashier" ? (
                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 flex items-center justify-end space-x-1 select-none">
                          <EyeOff size={10} />
                          <span>Confidential</span>
                        </span>
                      ) : (
                        `රු. ${(p.cost_price || 0).toFixed(2)}`
                      )}
                    </td>

                    {/* Selling price */}
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      රු. {p.selling_price.toFixed(2)}
                    </td>

                    {/* Quantities */}
                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold text-sm ${isLow ? "text-amber-500" : "text-slate-100"}`}>
                        {p.stock_qty}
                      </span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Min: {p.reorder_level}</span>
                    </td>

                    {/* Stocks alert indicators */}
                    <td className="p-3 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 bg-amber-950 border border-amber-600/20 text-amber-500 text-[9px] font-bold uppercase rounded-full">
                          Restock Alert
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/20 text-emerald-500 text-[9px] font-bold uppercase rounded-full">
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Edit triggers */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5 pt-0.5">
                        <button
                          onClick={() => setSelectedLabelProduct(p)}
                          className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 text-blue-400 hover:text-blue-300 px-2 py-1 rounded flex items-center space-x-1 transition-colors cursor-pointer"
                          title="Print Barcode Label"
                        >
                          <Barcode size={12} />
                          <span className="hidden sm:inline">Label</span>
                        </button>
                        <button
                          onClick={() => startEditProduct(p)}
                          className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part Creation / Editing Dialog */}
      {showProductDialog && editingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm">
                {editingProduct.id ? "Modify Catalogue Spare Part" : "Add Spare Part to SSM Database"}
              </span>
              <button
                onClick={() => { setShowProductDialog(false); setEditingProduct(null); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              {err && (
                <div className="p-3 bg-red-950/20 border border-red-800 text-red-400 rounded-lg text-xs">
                  {err}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">SKU Code (Unique ID)</label>
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Barcode Index</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Name EN (English Description)</label>
                <input
                  type="text"
                  value={editingProduct.name_en}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Name SI (Sinhala text for Receipts)</label>
                <input
                  type="text"
                  value={editingProduct.name_si}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name_si: e.target.value })}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="e.g. බජාජ් පිස්ටන්..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category Tag</label>
                  <select
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Brand Maker</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none"
                    placeholder="e.g. Bajaj Genuine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Selling Price (රු.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.selling_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, selling_price: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
                {userRole !== "cashier" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Cost Price (Confidential) (රු.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: e.target.value })}
                      className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono font-bold focus:outline-none"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Cost Price (CONFIDENTIAL)</label>
                    <span className="block text-xs text-slate-500 p-1.5 bg-slate-950 border border-dashed border-slate-850 text-center font-bold">
                      RBAC LOCKED
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={editingProduct.stock_qty}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_qty: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Min Reorder Level</label>
                  <input
                    type="number"
                    value={editingProduct.reorder_level}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reorder_level: e.target.value })}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex space-x-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowProductDialog(false); setEditingProduct(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded shadow-md cursor-pointer uppercase"
                >
                  Save Catalogue Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Purchase Order (Restocking + Weighted Average Costing calculation!) Dialog */}
      {showPODialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <Truck size={16} className="text-red-500" />
                Purchase Restock Order (Avg Costing)
              </span>
              <button onClick={() => setShowPODialog(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handlePOSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Supplier Account</label>
                  <select
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">PO Number (Auto)</label>
                  <input
                    type="text"
                    value={poNumber}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none text-slate-400"
                    readOnly
                  />
                </div>
              </div>

              {/* Dynamic Restocking items select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Selected Spare Part to Restock</label>
                <select
                  value={poProduct}
                  onChange={(e) => setPoProduct(e.target.value)}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_en} (Current Qty: {p.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">New Batch Purchase Cost (රු.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={poCost}
                    onChange={(e) => setPoCost(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono font-bold focus:outline-none"
                    placeholder="E.g. 3100.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">New Received Qty</label>
                  <input
                    type="number"
                    value={poQty}
                    onChange={(e) => setPoQty(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    placeholder="E.g. 20"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 text-[10px] leading-relaxed">
                <strong>WEIGHTED AVERAGE COST PRICE RULE:</strong>
                <p className="mt-1">
                  The system will merge outstanding stocks and the incoming PO batch. Cost Price will update dynamically:
                  <code className="block mt-1 font-mono text-[9px] bg-slate-950 p-1 rounded text-slate-300">
                    Avg_Cost = ((Old_Qty * Old_Cost) + (PO_Qty * PO_Cost)) / (Old_Qty + PO_Qty)
                  </code>
                </p>
              </div>

              <div className="pt-3 flex space-x-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPODialog(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded shadow-md cursor-pointer uppercase flex items-center space-x-1"
                >
                  <Truck size={11} />
                  <span>Log Restock PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock adjustment (Losses / Damages) Dialog */}
      {showAdjustDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                <Wrench size={16} className="text-amber-500" />
                Audit Log Stock Adjustment
              </span>
              <button onClick={() => setShowAdjustDialog(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Target Spare Part</label>
                <select
                  value={adjustProduct}
                  onChange={(e) => setAdjustProduct(e.target.value)}
                  className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_en} (Stock: {p.stock_qty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Qty Adjustment (Negative/Positive)</label>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs font-mono focus:outline-none"
                    placeholder="E.g. -5 for damaged units log"
                    required
                  />
                  <p className="text-[8px] text-slate-500 mt-1">Negative to deduct, positive to adjust up.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Reason</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="bg-slate-950 w-full rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="damaged">Damaged / Broken Parts</option>
                    <option value="lost">Lost / Missing Units</option>
                    <option value="expired">Expired / Corroded Goods</option>
                    <option value="audit_correction">Audit Physical Count Correction</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Notes &amp; Description</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="bg-slate-950 w-full h-20 rounded pl-3 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none resize-none"
                  placeholder="E.g. Discovered broken piston rings during box unbagging."
                  required
                />
              </div>

              <div className="pt-3 flex space-x-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdjustDialog(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded shadow-md cursor-pointer uppercase"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Printing Module Options */}
      {selectedLabelProduct && (
        <BarcodeLabelPrinter
          product={selectedLabelProduct}
          onClose={() => setSelectedLabelProduct(null)}
        />
      )}

      {/* XML Sync Modal Overlay */}
      {showXmlImportModal && (
        <XmlSyncModal
          products={products}
          categories={categories}
          userRole={userRole}
          onClose={() => setShowXmlImportModal(false)}
          onRefresh={onRefreshProducts}
        />
      )}
    </div>
  );
}
