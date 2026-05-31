import React, { useState, useRef, useEffect } from "react";
import { Printer, X, Settings, LayoutGrid, FileText, Check, Plus, Minus, Info, Scaling, Tag } from "lucide-react";
import { Product } from "../types";

interface BarcodeLabelPrinterProps {
  product: Product | null;
  onClose: () => void;
}

// Full standard Code 39 encoding map
const CODE39_PATTERNS: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "110100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100",
  "A": "100001001", "B": "001001001", "C": "110001000", "D": "000011001",
  "E": "100011000", "F": "001011000", "G": "000001101", "H": "100001100",
  "I": "001001100", "J": "000011100", "K": "100000011", "L": "001000011",
  "M": "110000010", "N": "000010011", "O": "100010010", "P": "001010010",
  "Q": "000000111", "R": "100000110", "S": "001000110", "T": "000010110",
  "U": "110000001", "V": "001100001", "W": "110100000", "X": "001101000",
  "Y": "111100000", "Z": "001111000",
  "-": "000110010", ".": "110110010", " ": "011110000", "*": "001101000",
  "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010"
};

// Generates an SVG path or dynamic rects for Code 39
// flanking string with asterisks automatically
function BarcodeSVG({ value, showText = true, height = 50 }: { value: string; showText?: boolean; height?: number }) {
  const code = (value || "").trim().toUpperCase();
  if (!code) return <div className="text-xs text-red-500 font-mono">No Barcode</div>;

  // Code 39 required flanking asterisks
  const fullString = `*${code}*`;
  
  // Verify characters exist in map, replace unmappable characters with empty strings or spaces
  const segments: boolean[] = [];

  for (let cidx = 0; cidx < fullString.length; cidx++) {
    const char = fullString[cidx];
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) continue;

    // 9 elements per character (5 bars, 4 spaces)
    for (let elIdx = 0; elIdx < 9; elIdx++) {
      const isBar = elIdx % 2 === 0;
      const isWide = pattern[elIdx] === "1";
      const count = isWide ? 3 : 1;
      
      for (let i = 0; i < count; i++) {
        segments.push(isBar);
      }
    }
    // Inter-character gap (always 1 narrow space)
    segments.push(false);
  }

  // Remove the very last trailing spacing element
  if (segments.length > 0) {
    segments.pop();
  }

  // Draw the barcode using SVG
  const barWidth = 1.6; // Width scale in SVG pixels
  const svgWidth = segments.length * barWidth + 20; // 10px padding left and right

  return (
    <div className="flex flex-col items-center">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="text-black max-w-full"
      >
        <g transform="translate(10, 0)">
          {segments.map((isBar, idx) => {
            if (!isBar) return null;
            return (
              <rect
                key={idx}
                x={idx * barWidth}
                y={0}
                width={barWidth}
                height={height - (showText ? 14 : 0)}
                fill="black"
              />
            );
          })}
        </g>
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-[0.25em] font-extrabold text-black mt-1">
          {code}
        </span>
      )}
    </div>
  );
}

export default function BarcodeLabelPrinter({ product, onClose }: BarcodeLabelPrinterProps) {
  const [printCopies, setPrintCopies] = useState<number>(5);
  const [columnsNum, setColumnsNum] = useState<number>(3); // 1 = continuous roll, 2 or 3 = Avery label sheet
  
  // Custom design toggles
  const [showEnName, setShowEnName] = useState<boolean>(true);
  const [showSiName, setShowSiName] = useState<boolean>(true);
  const [showSKU, setShowSKU] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showPartBrand, setShowPartBrand] = useState<boolean>(true);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(50);
  
  // Custom label size settings
  const [labelWidth, setLabelWidth] = useState<number>(50); // width in mm
  const [labelHeight, setLabelHeight] = useState<number>(30); // height in mm

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Default copies matches available inventory stock
  useEffect(() => {
    if (product) {
      setPrintCopies(Math.max(1, product.stock_qty));
    }
  }, [product]);

  if (!product) return null;

  const barcodeValue = product.barcode || product.sku || "N/A";

  const handleTriggerPrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const style = document.createElement("style");
    // Formulates highly optimized print-styles for sheets or continuous printer rolls
    style.innerHTML = `
      @media print {
        body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Hide all UI elements outside our printable class */
        body > *:not(.barcode-label-print-overlay) {
          display: none !important;
        }
        
        .barcode-label-print-overlay {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .label-grid-container {
          display: grid !important;
          grid-template-columns: repeat(${columnsNum}, 1fr) !important;
          width: 100% !important;
          box-sizing: border-box !important;
          border: none !important;
          margin: 0 !important;
          padding: 5mm !important;
          gap: 4mm !important;
        }

        .label-card-sticker {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          background: white !important;
          color: black !important;
          border: 1px dashed #cccccc !important;
          border-radius: 2px !important;
          padding: 2.5mm !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          width: ${labelWidth}mm !important;
          height: ${labelHeight}mm !important;
          margin: 0 auto !important;
        }
        
        /* Remove borders during actual production print */
        .label-card-sticker-no-border {
          border: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  // Generate an array of labels matching copy count
  const labelsCountArray = Array.from({ length: printCopies });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-805 rounded-2xl max-w-4xl w-full text-zinc-100 shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto max-h-[90vh]">
        
        {/* Settings and Customizers Column (Left) */}
        <div className="w-full md:w-[350px] bg-zinc-950 border-r border-zinc-800/80 p-5 flex flex-col justify-between overflow-y-auto max-h-[40vh] md:max-h-none">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">SS Motors Utility</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Printer size={16} className="text-red-500 animate-pulse" />
                Barcode Label Printshop
              </h3>
            </div>

            {/* Part brief description */}
            <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Selected Spare Part</span>
              <div className="text-xs font-bold text-zinc-100 line-clamp-1">{product.name_en}</div>
              <div className="text-[11px] text-zinc-400 font-sans line-clamp-1">{product.name_si || "—"}</div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-800/80 font-mono">
                <span>SKU: {product.sku}</span>
                <span>Qty: {product.stock_qty}</span>
              </div>
            </div>

            {/* Print Settings controls */}
            <div className="space-y-3">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest block border-b border-zinc-800 pb-1">Print Constraints</span>
              
              {/* Output Copies */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-semibold block">Print Quantity (Copies):</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                    className="p-1 px-2.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-zinc-900 border border-zinc-800 rounded text-center w-16 py-1 text-xs text-white font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setPrintCopies(printCopies + 1)}
                    className="p-1 px-2.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer text-xs font-bold"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintCopies(product.stock_qty)}
                    className="text-[9px] uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-1.5 px-2 border border-zinc-800 rounded font-bold"
                    title="Set to match quantity currently In Stock"
                  >
                    Stock Match
                  </button>
                </div>
              </div>

              {/* Layout layout printer columns */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-semibold block">Print Layout Target:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 1, label: "Roll (1c)", desc: "Continuous" },
                    { val: 2, label: "Sheet (2c)", desc: "Dual column" },
                    { val: 3, label: "Sheet (3c)", desc: "Triple Avery" }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setColumnsNum(preset.val)}
                      className={`py-1.5 px-2 rounded border text-[10px] uppercase font-bold flex flex-col items-center justify-center cursor-pointer transition-all ${
                        columnsNum === preset.val
                          ? "bg-red-950/40 border-red-500/50 text-red-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[8px] text-zinc-500 font-normal lowercase">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Settings */}
              <div className="space-y-1.5 p-2 bg-zinc-900/40 rounded border border-zinc-850">
                <label className="text-[9.5px] text-zinc-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                  <Scaling size={11} className="text-zinc-500" />
                  Sticker Sizing (mm)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-[8.5px] text-zinc-500 block">Label Width</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={labelWidth}
                        onChange={(e) => setLabelWidth(Math.max(20, parseInt(e.target.value) || 50))}
                        className="bg-zinc-950 border border-zinc-800 rounded text-center w-full py-0.5 text-2xs text-white font-mono"
                      />
                      <span className="text-[8px] text-zinc-500">mm</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-zinc-500 block">Label Height</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="number"
                        min="15"
                        max="80"
                        value={labelHeight}
                        onChange={(e) => setLabelHeight(Math.max(15, parseInt(e.target.value) || 30))}
                        className="bg-zinc-950 border border-zinc-800 rounded text-center w-full py-0.5 text-2xs text-white font-mono"
                      />
                      <span className="text-[8px] text-zinc-500">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Label Content customizers */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest block border-b border-zinc-800 pb-1 pt-1">Toggle Fields</span>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-2xs font-medium text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showEnName}
                      onChange={(e) => setShowEnName(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-655 focus:ring-0 cursor-pointer"
                    />
                    <span>English Name</span>
                  </label>
                  <label className="flex items-center space-x-2 text-2xs font-medium text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSiName}
                      onChange={(e) => setShowSiName(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-655 focus:ring-0 cursor-pointer"
                    />
                    <span>Sinhala Name (විස්තරය)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-2xs font-medium text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSKU}
                      onChange={(e) => setShowSKU(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-655 focus:ring-0 cursor-pointer"
                    />
                    <span>SKU Code Reference</span>
                  </label>
                  <label className="flex items-center space-x-2 text-2xs font-medium text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPartBrand}
                      onChange={(e) => setShowPartBrand(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-655 focus:ring-0 cursor-pointer"
                    />
                    <span>Part Brand / Maker</span>
                  </label>
                  <label className="flex items-center space-x-2 text-2xs font-medium text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-655 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-emerald-400 font-bold">Selling Price Tag</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80">
            <span className="text-[9px] text-zinc-500 leading-relaxed font-sans block flex items-start gap-1">
              <Info size={11} className="shrink-0 mt-0.5 text-zinc-400" />
              Thermal sticky labels can be scanned by standard laser readers directly. Sized precisely at {labelWidth}mm x {labelHeight}mm.
            </span>
          </div>
        </div>

        {/* Live Preview Pane (Right) */}
        <div className="flex-1 bg-zinc-850 p-6 flex flex-col justify-between overflow-hidden min-h-[350px]">
          {/* Top toolbar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xs font-bold uppercase py-0.5 px-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">Live Stamp Preview</span>
              <span className="text-2xs text-zinc-500">Printing {printCopies} sticker copies total</span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-full cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Interactive virtual sticker visual preview */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-xl p-6 flex items-center justify-center overflow-y-auto max-h-[50vh] md:max-h-none scrollbar-thin">
            
            {/* The single-sticker real life card simulation */}
            <div
              className="bg-white text-black rounded-sm shadow-2xl flex flex-col items-center justify-between p-3 select-none"
              style={{
                width: `${labelWidth * 4.5}px`, // scaled for visual impact on screen
                height: `${labelHeight * 4.5}px`, // scaled for visual impact on screen
                color: "#000000",
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
            >
              {/* Sticker Content Structure */}
              <div className="w-full flex justify-between items-start border-b border-stone-200 pb-1">
                <div className="text-left font-sans leading-tight">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide block text-stone-500">SS MOTORS</span>
                  {showPartBrand && (
                    <span className="text-[8px] uppercase tracking-wide font-bold block text-stone-400 mt-0.5">{product.brand || "BAJAJ GENUINE"}</span>
                  )}
                </div>
                {showSKU && (
                  <span className="font-mono text-[9px] bg-stone-100 border border-stone-200 px-1 rounded font-bold text-stone-700">
                    {product.sku}
                  </span>
                )}
              </div>

              {/* Descriptions block */}
              <div className="w-full text-center space-y-0.5 flex-1 flex flex-col justify-center py-1">
                {showEnName && (
                  <div className="font-sans text-[11px] font-extrabold text-stone-850 line-clamp-1">
                    {product.name_en}
                  </div>
                )}
                {showSiName && product.name_si && (
                  <div className="font-sans text-[10px] font-bold text-stone-500 tracking-tight line-clamp-1">
                    {product.name_si}
                  </div>
                )}
              </div>

              {/* Barcode block rendering Code 39 SVG representation */}
              <div className="w-full">
                <BarcodeSVG value={barcodeValue} showText={true} height={42} />
              </div>

              {/* Bottom tag: LKR Price info */}
              {showPrice && (
                <div className="w-full flex justify-between items-center border-t border-stone-100 pt-1 mt-1 text-[11px]">
                  <span className="text-[8px] text-stone-400 uppercase font-extrabold">Auto Price Index</span>
                  <span className="font-mono font-black text-[12px] text-black">
                    රු. {product.selling_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Action trigger buttons at the bottom of panel */}
          <div className="pt-4 border-t border-zinc-800/80 mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all hover:bg-zinc-800 cursor-pointer"
            >
              Discard Layout
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black transition-all flex items-center space-x-2 shadow-lg hover:shadow-red-950/20 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Printer size={14} />
              <span>Send To Print Engine ({printCopies} Copies)</span>
            </button>
          </div>

        </div>

      </div>

      {/* Hidden layout compiled strictly for printer paper output loop */}
      <div className="hidden">
        <div ref={printAreaRef} className="barcode-label-print-overlay">
          <div className="label-grid-container">
            {labelsCountArray.map((_, idx) => (
              <div
                key={idx}
                className="label-card-sticker label-card-sticker-no-border"
                style={{
                  width: `${labelWidth}mm`,
                  height: `${labelHeight}mm`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  background: "white",
                  color: "black",
                  padding: "2mm",
                  overflow: "hidden",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }}
              >
                {/* Product/SS Motors brand logo */}
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "0.5px solid #222222", paddingBottom: "0.5mm", marginBottom: "0.5mm" }}>
                  <div style={{ textAlign: "left", lineHeight: "1" }}>
                    <span style={{ fontSize: "7px", fontWeight: "900", display: "block", letterSpacing: "0.2px" }}>SS MOTORS</span>
                    {showPartBrand && (
                      <span style={{ fontSize: "5.5px", fontWeight: "700", display: "block", color: "#555", marginTop: "0.1mm" }}>
                        {(product.brand || "BAJAJ GENUINE").toUpperCase()}
                      </span>
                    )}
                  </div>
                  {showSKU && (
                    <span style={{ fontSize: "6.5px", fontWeight: "bold", padding: "0.1mm 0.5mm", border: "0.5px solid #444", borderRadius: "1px", background: "#f5f5f5" }}>
                      {product.sku}
                    </span>
                  )}
                </div>

                {/* English & Sinhalese titles */}
                <div style={{ width: "100%", textAlign: "center", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {showEnName && (
                    <div style={{ fontSize: "8.5px", fontWeight: "900", color: "#000", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {product.name_en}
                    </div>
                  )}
                  {showSiName && product.name_si && (
                    <div style={{ fontSize: "7.5px", fontWeight: "bold", color: "#444", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginTop: "0.1mm" }}>
                      {product.name_si}
                    </div>
                  )}
                </div>

                {/* The vector barcode SVG */}
                <div style={{ width: "100%", margin: "0.5mm 0" }}>
                  <BarcodeSVG value={barcodeValue} showText={true} height={32} />
                </div>

                {/* Bottom detail row */}
                {showPrice && (
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #222222", paddingTop: "0.5mm", marginTop: "0.5mm" }}>
                    <span style={{ fontSize: "5.5px", fontWeight: "800", color: "#555" }}>PRICE VALUE</span>
                    <span style={{ fontSize: "9px", fontWeight: "900", color: "#000" }}>
                      රු. {product.selling_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
