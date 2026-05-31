import React, { useState, useRef } from "react";
import { X, Upload, Download, Check, AlertTriangle, FileCode, ArrowRight, Loader2, ListPlus } from "lucide-react";
import { Product, Category } from "../types";

interface XmlSyncModalProps {
  products: Product[];
  categories: Category[];
  userRole: string;
  onClose: () => void;
  onRefresh: () => void;
}

interface ParsedImportItem {
  id?: number;
  sku: string;
  barcode: string;
  name_en: string;
  name_si: string;
  category_id: number;
  brand: string;
  cost_price?: number;
  selling_price: number;
  stock_qty: number;
  reorder_level: number;
}

interface ChangeAnalysis {
  type: "create" | "update" | "identical";
  item: ParsedImportItem;
  existingItem?: Product;
  changes: {
    field: string;
    oldVal: any;
    newVal: any;
  }[];
}

export default function XmlSyncModal({ products, categories, userRole, onClose, onRefresh }: XmlSyncModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisList, setAnalysisList] = useState<ChangeAnalysis[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [stats, setStats] = useState({ created: 0, updated: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to escape or unescape XML entity strings safely
  const unescapeXml = (str: string): string => {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  };

  // Helper to format currency
  const formatPrice = (val?: number) => {
    if (val === undefined) return "—";
    return `LKR ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleXmlFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleXmlFile(e.target.files[0]);
    }
  };

  // Parser logic
  const handleXmlFile = (file: File) => {
    if (file.type !== "text/xml" && !file.name.endsWith(".xml")) {
      setErrorMsg("Unsupported file format. Please upload a valid .xml file.");
      return;
    }

    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Parse error check
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error("Well-formedness check failed. The file is not valid XML.");
        }

        const productElements = xmlDoc.querySelectorAll("product");
        if (productElements.length === 0) {
          throw new Error("No <product> elements found in this XML.");
        }

        const parsedItems: ParsedImportItem[] = [];

        productElements.forEach((el, index) => {
          const getTagValue = (tag: string): string => {
            const item = el.querySelector(tag);
            return item ? item.textContent?.trim() || "" : "";
          };

          const sku = getTagValue("sku");
          const barcode = getTagValue("barcode");
          const name_en = getTagValue("name_en");

          if (!sku && !barcode && !name_en) {
            // Skip empty mock nodes
            return;
          }

          if (!sku) {
            throw new Error(`Product at index ${index + 1} is missing a required <sku> tag value.`);
          }

          parsedItems.push({
            id: getTagValue("id") ? Number(getTagValue("id")) : undefined,
            sku: sku,
            barcode: barcode || sku, // fallback barcode to SKU if missing
            name_en: name_en || "Imported Part",
            name_si: getTagValue("name_si"),
            category_id: getTagValue("category_id") ? Number(getTagValue("category_id")) : 1,
            brand: getTagValue("brand") || "Generic",
            cost_price: getTagValue("cost_price") ? Number(getTagValue("cost_price")) : undefined,
            selling_price: getTagValue("selling_price") ? Number(getTagValue("selling_price")) : 0,
            stock_qty: getTagValue("stock_qty") ? Number(getTagValue("stock_qty")) : 0,
            reorder_level: getTagValue("reorder_level") ? Number(getTagValue("reorder_level")) : 5,
          });
        });

        // Perform side-by-side comparison with currently loaded products
        analyzeChanges(parsedItems);
      } catch (err: any) {
        setErrorMsg(err.message || "An error occurred while reading or parsing the XML file.");
      }
    };

    reader.readAsText(file);
  };

  // Compare products XML vs Database
  const analyzeChanges = (imported: ParsedImportItem[]) => {
    const analysis: ChangeAnalysis[] = [];

    imported.forEach((item) => {
      // Find matching item in existing DB: first by SKU, then by Barcode, or by ID
      let existing: Product | undefined;
      
      if (item.sku) {
        existing = products.find((p) => p.sku.trim().toUpperCase() === item.sku.trim().toUpperCase());
      }
      if (!existing && item.barcode) {
        existing = products.find((p) => p.barcode && p.barcode.trim() === item.barcode.trim());
      }
      if (!existing && item.id) {
        existing = products.find((p) => p.id === item.id);
      }

      if (!existing) {
        // This is a new product
        analysis.push({
          type: "create",
          item,
          changes: []
        });
      } else {
        // Check for modifications
        const changes: ChangeAnalysis["changes"] = [];

        if (item.name_en && item.name_en !== existing.name_en) {
          changes.push({ field: "Name (EN)", oldVal: existing.name_en, newVal: item.name_en });
        }
        if (item.name_si !== undefined && item.name_si !== existing.name_si) {
          changes.push({ field: "Name (SI)", oldVal: existing.name_si || "—", newVal: item.name_si });
        }
        if (item.brand !== undefined && item.brand !== existing.brand) {
          changes.push({ field: "Brand", oldVal: existing.brand || "—", newVal: item.brand });
        }
        if (item.selling_price !== undefined && Number(item.selling_price) !== existing.selling_price) {
          changes.push({ field: "Selling Price", oldVal: existing.selling_price, newVal: Number(item.selling_price) });
        }
        if (item.cost_price !== undefined && existing.cost_price !== undefined && Number(item.cost_price) !== existing.cost_price) {
          changes.push({ field: "Cost Price", oldVal: existing.cost_price, newVal: Number(item.cost_price) });
        }
        if (item.stock_qty !== undefined && Number(item.stock_qty) !== existing.stock_qty) {
          changes.push({ field: "In Stock Qty", oldVal: existing.stock_qty, newVal: Number(item.stock_qty) });
        }
        if (item.reorder_level !== undefined && Number(item.reorder_level) !== existing.reorder_level) {
          changes.push({ field: "Reorder Trigger Level", oldVal: existing.reorder_level, newVal: Number(item.reorder_level) });
        }
        if (item.category_id !== undefined && Number(item.category_id) !== existing.category_id) {
          const oldCat = categories.find((c) => c.id === existing!.category_id)?.name || `ID #${existing.category_id}`;
          const newCat = categories.find((c) => c.id === Number(item.category_id))?.name || `ID #${item.category_id}`;
          changes.push({ field: "Category", oldVal: oldCat, newVal: newCat });
        }

        analysis.push({
          type: changes.length > 0 ? "update" : "identical",
          item,
          existingItem: existing,
          changes
        });
      }
    });

    setAnalysisList(analysis);
    setStep("preview");
  };

  // Submit bulk imports to backend
  const handleConfirmSync = () => {
    setIsSyncing(true);

    const itemsToPost = analysisList
      .filter((analysis) => analysis.type !== "identical")
      .map((analysis) => {
        const payload: any = { ...analysis.item };
        // Attach DB ID to trigger put/update instead of create if matches existing
        if (analysis.existingItem) {
          payload.id = analysis.existingItem.id;
        }
        return payload;
      });

    if (itemsToPost.length === 0) {
      // Nothing is modified or created
      setStats({ created: 0, updated: 0, total: 0 });
      setStep("complete");
      setIsSyncing(false);
      return;
    }

    fetch(`/api/products/bulk?role=${userRole}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: itemsToPost })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Synchronization request failed.");
        return res.json();
      })
      .then((data) => {
        const created = analysisList.filter((a) => a.type === "create").length;
        const updated = analysisList.filter((a) => a.type === "update").length;
        setStats({ created, updated, total: itemsToPost.length });
        setStep("complete");
        onRefresh();
      })
      .catch((err) => {
        setErrorMsg(err.message || "Unable to complete bulk XML sync.");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  // Dynamic values summary computations
  const creations = analysisList.filter((a) => a.type === "create");
  const updates = analysisList.filter((a) => a.type === "update");
  const identicals = analysisList.filter((a) => a.type === "identical");

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full text-zinc-100 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header Block */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-950/20 text-red-500 rounded-lg border border-red-500/10">
              <FileCode size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">XML Inventory Synchronizer</h3>
              <p className="text-[11px] text-zinc-400">Manage large inventory sheets, sync SKUs and update stock levels with automated auditing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-full cursor-pointer hover:bg-zinc-850"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic content screen */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
          {errorMsg && (
            <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-3 items-start mb-5 font-sans leading-relaxed">
              <AlertTriangle className="shrink-0 mt-0.5 text-red-500" size={15} />
              <div className="space-y-1">
                <span className="font-bold block">Validation Check Unsuccessful</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-6">
              {/* Drag and Drop Zone Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all h-64 select-none ${
                  dragActive
                    ? "border-red-500 bg-red-950/5/20 text-red-400"
                    : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/30 text-zinc-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 text-red-500 shadow-xl">
                  <Upload size={28} />
                </div>

                <div className="space-y-1 max-w-sm">
                  <span className="text-xs font-bold text-zinc-100 block">Select or Drag your XML inventory sheet here</span>
                  <span className="text-[10px] text-zinc-500 block leading-relaxed">Accepts full-backup or partial stock updates. Will parse sku, barcode, stock quantity, and current selling price automatically.</span>
                </div>
              </div>

              {/* Guide card box explaining the schema */}
              <div className="bg-zinc-950/40 border border-zinc-850/80 rounded-xl p-4 space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                  <ListPlus size={12} className="text-red-500" />
                  XML Schema Format Reference
                </span>
                
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  The uploaded XML file must match standard structured fields. Perfect to integrate with external order management files, accounting sheets, and supplier catalogs. Refer to the schema structure example:
                </p>

                <pre className="p-3 bg-zinc-950 rounded border border-zinc-800 text-[10px] font-mono text-zinc-300 leading-normal overflow-x-auto whitespace-pre">
{`<?xml version="1.0" encoding="UTF-8"?>
<inventory>
  <product>
    <sku>SP-TUK-001</sku>
    <barcode>8901234001</barcode>
    <name_en>Bajaj Genuine Brake Shoe</name_en>
    <name_si>බජාජ් බ්‍රේක් සපත්තු කට්ටලය</name_si>
    <category_id>1</category_id>
    <brand>Bajaj Genuine</brand>
    <cost_price>1200.00</cost_price>
    <selling_price>1650.00</selling_price>
    <stock_qty>45</stock_qty>
    <reorder_level>5</reorder_level>
  </product>
</inventory>`}
                </pre>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6">
              {/* File details overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <div className="font-sans">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 block">Uploaded Document Source</span>
                  <span className="text-xs font-bold text-zinc-200 mt-0.5 block font-mono">{fileName}</span>
                </div>
                {/* Stats badge filters columns */}
                <div className="flex items-center gap-2">
                  <span className="text-2xs bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold font-mono">
                    +{creations.length} New Parts
                  </span>
                  <span className="text-2xs bg-blue-950/40 border border-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold font-mono">
                    {updates.length} Modified
                  </span>
                  <span className="text-2xs bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-1 rounded font-mono">
                    {identicals.length} Unchanged
                  </span>
                </div>
              </div>

              {/* Split list preview comparison container */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block border-b border-zinc-800 pb-1.5">Detailed Modifications Registry</span>

                {creations.length === 0 && updates.length === 0 && (
                  <div className="text-center py-10 bg-zinc-950/20 rounded-xl border border-zinc-850">
                    <span className="text-xs text-zinc-500">Every item listed in this XML already perfectly matches the database content. No changes required.</span>
                  </div>
                )}

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {/* Render newly created parts */}
                  {creations.map((c, i) => (
                    <div key={`c-${i}`} className="border-l-2 border-emerald-500 bg-emerald-950/5 rounded-r-lg border border-y-zinc-850 border-r-zinc-850 p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono tracking-wider uppercase">NEW PART</span>
                          <span className="font-mono text-xs font-bold text-zinc-300">{c.item.sku}</span>
                          {c.item.brand && <span className="text-[10px] text-zinc-500">({c.item.brand})</span>}
                        </div>
                        <span className="text-xs font-semibold text-zinc-100 block">{c.item.name_en}</span>
                        {c.item.name_si && <span className="text-2xs text-zinc-400 block font-sans">{c.item.name_si}</span>}
                      </div>

                      <div className="flex items-center gap-6 text-right font-mono">
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans">Initial Stock</span>
                          <span className="text-xs font-bold text-zinc-300">{c.item.stock_qty} Set</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 block uppercase font-sans">Price tag</span>
                          <span className="text-xs font-bold text-emerald-400">{formatPrice(c.item.selling_price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Render modified entries */}
                  {updates.map((u, i) => (
                    <div key={`u-${i}`} className="border-l-2 border-blue-500 bg-blue-950/5 rounded-r-lg border border-y-zinc-855 border-r-zinc-855 p-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/40 pb-1.5">
                        <div className="font-sans">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-400 font-mono tracking-wider">MODIFIED</span>
                            <span className="font-mono text-xs font-bold text-zinc-300">{u.item.sku}</span>
                          </div>
                          <span className="text-xs font-bold text-zinc-100 mt-1 block">{u.existingItem?.name_en}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono max-sm:text-left">Item Reference ID: #{u.existingItem?.id}</span>
                      </div>

                      {/* Display field alterations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-0.5">
                        {u.changes.map((chg, chi) => (
                          <div key={chi} className="bg-zinc-950/40 p-2 rounded border border-zinc-850 flex flex-col justify-between text-2xs space-y-1">
                            <span className="text-zinc-500 font-bold block">{chg.field}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded truncate max-w-[90px] font-mono">{chg.oldVal}</span>
                              <ArrowRight size={11} className="text-zinc-500 shrink-0" />
                              <span className="text-blue-400 bg-blue-950/20 border border-blue-900/30 px-1 py-0.5 rounded truncate max-w-[90px] font-bold font-mono">{chg.newVal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Silent message if any identical skip list is long */}
                  {identicals.length > 0 && (
                    <div className="text-[10.5px] text-zinc-500 font-sans italic text-right pr-2">
                       + Ignored {identicals.length} un-altered products from parsing list.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
              <div className="p-4 bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Check size={36} className="animate-pulse" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <span className="text-sm font-bold text-white block">Database Handshake Complete</span>
                <span className="text-xs text-zinc-400 leading-relaxed block">
                  The XML payload has been successfully validated, parsed, and merged. Stock balances and descriptive names have been updated safely.
                </span>
              </div>

              {/* Summarized telemetry stats */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm bg-zinc-950/40 border border-zinc-850/80 p-3.5 rounded-xl font-mono text-center">
                <div>
                  <span className="text-[18px] font-black text-emerald-400 block">{stats.created}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-sans">Created</span>
                </div>
                <div>
                  <span className="text-[18px] font-black text-blue-400 block">{stats.updated}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-sans">Modified</span>
                </div>
                <div>
                  <span className="text-[18px] font-black text-zinc-200 block">{stats.total}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-sans">Total Synced</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Row */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/30 flex justify-between items-center shrink-0">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all hover:bg-zinc-800 cursor-pointer"
              >
                Close Dialog
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-red-950/20"
              >
                Choose Local XML
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all hover:bg-zinc-800 cursor-pointer"
                disabled={isSyncing}
              >
                Change Document
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 shadow-lg select-none cursor-pointer"
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-white" />
                    <span>Processing Synchronizer...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Apply {creations.length + updates.length} Changes Now</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-red-950/20"
              >
                Dismiss View
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
