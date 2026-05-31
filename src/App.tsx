import React, { useState, useEffect, useRef } from "react";
import { 
  ShoppingCart, Package, FolderCheck, Undo2, Code, Coins, 
  Search, Trash2, HelpCircle, Inbox, Plus, Minus, ArrowRight,
  ShieldCheck, AlertTriangle, Printer, RotateCcw, MonitorPlay, Save
} from "lucide-react";

import RoleController from "./components/RoleController";
import LoginModal from "./components/LoginModal";
import ReceiptPrinter from "./components/ReceiptPrinter";
import DatabaseBlueprints from "./components/DatabaseBlueprints";
import AdminConsole from "./components/AdminConsole";
import ShiftRegister from "./components/ShiftRegister";
import InventoryManager from "./components/InventoryManager";
import ReturnsCreditConsole from "./components/ReturnsCreditConsole";
import { Product, Category, Customer, Shift, CartItem, Sale } from "./types";

// Web Audio API Synthesizer for POS acoustic chime feedback
const playScannerChime = (type: "success" | "error") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (type === "success") {
      // Crisp, high-pitched short chirp for success scan
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime); // high chime frequency
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // short decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Double buzzing warning tones for error conditions
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(150, ctx.currentTime); // low buzz frequency
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(100, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32); // longer buzzer decay
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.32);
      osc2.stop(ctx.currentTime + 0.32);
    }
  } catch (err) {
    console.warn("User interaction policy suspended AudioContext browser output:", err);
  }
};

export default function App() {
  // Global Navigation tabs
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "shifts" | "returns" | "blueprints" | "analytics">("pos");

  // Core RBAC State (start empty to force initial login flow)
  const [currentRole, setRole] = useState<string>("");

  // Connection and offline syncing state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Database list states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  // POS Billing states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [focusScannerActive, setFocusScannerActive] = useState<boolean>(true);
  const [cartDiscount, setCartDiscount] = useState<number>(0); // Grand flat discount
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "credit">("cash");
  const [cashPaidInput, setCashPaidInput] = useState<string>("5000");
  const [holdCarts, setHoldCarts] = useState<any[]>([]); // Holds paused transactions

  // Advanced POS Options States
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0); // e.g. 0%, 5%, 15% VAT
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0); // Surcharge/ labor fee
  const [showCustomItemForm, setShowCustomItemForm] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>("");
  const [customItemPrice, setCustomItemPrice] = useState<string>("");

  // Quick Customer Registration
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustCreditLimit, setNewCustCreditLimit] = useState<string>("50000");

  // Feedback, drawers, print modals
  const [drawerKicked, setDrawerKicked] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [lastCompletedItems, setLastCompletedItems] = useState<CartItem[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Refs for element focus
  const barSearchRef = useRef<HTMLInputElement>(null);

  // Load Database Items on start or when role shifts
  const loadDatabase = () => {
    if (!currentRole) return;
    fetch(`/api/products?role=${currentRole}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((e) => console.error("Products error", e));

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((e) => console.error("Categories error", e));

    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch((e) => console.error("Customers error", e));

    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((data) => setSuppliers(data))
      .catch((e) => console.error("Suppliers error", e));

    fetch("/api/shifts")
      .then((res) => res.json())
      .then((data) => {
        setShifts(data);
        const active = data.find((s: Shift) => s.status === "open");
        setActiveShift(active || null);
      })
      .catch((e) => console.error("Shifts error", e));

    // Compile active sales
    const salesMock = [
      {
        id: 1,
        invoice_no: "SSM-25260530-0001",
        user_id: 3,
        user_name: "Chinthaka (Cashier)",
        shift_id: 1,
        customer_id: 1,
        customer_name: "Anura Priyantha (Tuk Tuk Owner)",
        subtotal: 19800.00,
        discount_total: 1350.00,
        net_total: 18450.00,
        cash_paid: 19000.00,
        balance_returned: 550.00,
        payment_method: "cash" as const,
        status: "completed" as const,
        created_at: "2026-05-30T10:15:00.000Z"
      }
    ];
    setSales(salesMock);
  };

  useEffect(() => {
    if (currentRole) {
      loadDatabase();
    } else {
      setCart([]);
      setCartDiscount(0);
      setSelectedCustomerId("");
    }

    // Check LocalStorage offline queues on load
    const stored = localStorage.getItem("ss_motors_offline_sales");
    if (stored) {
      setSyncQueue(JSON.parse(stored));
    }
  }, [currentRole]);

  // General keyboard F-keys shortcut listener hook
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
      } else if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCheckoutModal(true);
        } else {
          alert("Dynamic billing cart is empty! Add products first (F2 ignored).");
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        setCart([]);
        setCartDiscount(0);
        setSelectedCustomerId("");
      } else if (e.key === "F9") {
        e.preventDefault();
        triggerDrawerKick();
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [cart]);

  // Focus Scanner Event Hook for capturing barcode input automatically even when cursor is unfocused
  useEffect(() => {
    const handleGlobalScan = (e: KeyboardEvent) => {
      if (!focusScannerActive) return;
      if (activeTab !== "pos") return;

      // Ignore if user is pressing standard modifier key combinations (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.isContentEditable
      );

      // 1. If Enter is pressed, intercept it to process as a scanned barcode / exact SKU if in search context or body context
      if (e.key === "Enter") {
        const isFocusedInPOSSearch = activeEl === barSearchRef.current;
        const isNotFocusedInAnyInput = !isInput;

        if (isFocusedInPOSSearch || isNotFocusedInAnyInput) {
          const queryClean = searchQuery.trim();
          if (queryClean) {
            const matched = products.find(
              (p) => 
                (p.sku && p.sku.toUpperCase() === queryClean.toUpperCase()) || 
                (p.barcode && p.barcode === queryClean) ||
                (p.barcode && p.barcode.toUpperCase() === queryClean.toUpperCase())
            );
            if (matched) {
              e.preventDefault();
              handleAddProductToCart(matched);
              setSearchQuery("");
              return;
            } else {
              // Search query typed but no matching item exists was found (invalid barcode scan)
              e.preventDefault();
              playScannerChime("error");
            }
          }
        }
      }

      // 2. If user is NOT focused within any input field, and types a printable single character
      if (!isInput && e.key.length === 1) {
        // Automatically focus the search bar input
        barSearchRef.current?.focus();
        // Append the key to the current searchQuery state
        setSearchQuery((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleGlobalScan);
    return () => window.removeEventListener("keydown", handleGlobalScan);
  }, [focusScannerActive, activeTab, searchQuery, products, cart, activeShift]);

  const triggerDrawerKick = () => {
    setDrawerKicked(true);
    setTimeout(() => setDrawerKicked(false), 2400);
  };

  // Offline syncing handler
  const handleSyncOperation = () => {
    if (syncQueue.length === 0 || !isOnline) return;
    setIsSyncing(true);

    // Sync items sequentially to Express Checkout Engine
    const promises = syncQueue.map((salePayload) => {
      return fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...salePayload,
          shift_id: activeShift?.id // force bind to currently open cashier shift
        })
      });
    });

    Promise.all(promises)
      .then(() => {
        // Core clearance
        setSyncQueue([]);
        localStorage.removeItem("ss_motors_offline_sales");
        loadDatabase();
        triggerDrawerKick();
        alert("Success! All queued offline billing items synchronised to the PHP/Laravel databases successfully.");
      })
      .catch((err) => alert(`Syncing failed: ${err.message}`))
      .finally(() => setIsSyncing(false));
  };

  // Add Item to active cart
  const handleAddProductToCart = (prod: Product) => {
    if (!activeShift) {
      playScannerChime("error");
      alert("ERROR: POS Terminal is LOCKED. Cashiers must open a shift registry starting float first.");
      setActiveTab("shifts");
      return;
    }

    if (prod.stock_qty <= 0) {
      playScannerChime("error");
      alert(`Warning: '${prod.name_en}' has zero stock inventory! Distribute PO arrivals first.`);
      return;
    }

    const existing = cart.find((c) => c.id === prod.id);
    if (existing) {
      if (existing.qty >= prod.stock_qty) {
        playScannerChime("error");
        alert(`Overselling Block: Max available is ${prod.stock_qty} unit(s).`);
        return;
      }
      playScannerChime("success");
      setCart(cart.map((c) => c.id === prod.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      playScannerChime("success");
      setCart([...cart, {
        id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name_en: prod.name_en,
        name_si: prod.name_si,
        selling_price: prod.selling_price,
        qty: 1,
        discount: 0
      }]);
    }
    setSearchQuery("");
    barSearchRef.current?.focus();
  };

  // Adjust item quantity
  const handleAdjustCartQty = (id: number, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;

    const prod = products.find((p) => p.id === id);
    const maxQty = prod ? prod.stock_qty : 999;

    const targetQty = item.qty + delta;
    if (targetQty <= 0) {
      setCart(cart.filter((c) => c.id !== id));
    } else if (targetQty > maxQty) {
      alert(`Overselling Block: Max available stock is ${maxQty} unit(s).`);
    } else {
      setCart(cart.map((c) => c.id === id ? { ...c, qty: targetQty } : c));
    }
  };

  // Adjust line item customized savings / discounts
  const handleAdjustLineDiscount = (id: number, amountStr: string) => {
    const num = parseFloat(amountStr) || 0;
    setCart(cart.map((c) => c.id === id ? { ...c, discount: Math.max(0, num) } : c));
  };

  // Calculate Cumulative sums
  const calculateCartTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.qty), 0);
    const lineDiscounts = cart.reduce((acc, item) => acc + (item.discount || 0), 0);
    const grandDiscount = Number(cartDiscount) || 0;
    
    // Deduct savings
    const cumulativeDiscounts = lineDiscounts + grandDiscount;
    const baseTotal = Math.max(0, subtotal - cumulativeDiscounts);
    
    // Fitting surcharge & Taxes
    const fittingFee = Number(surchargeAmount) || 0;
    const totalBeforeTax = baseTotal + fittingFee;
    const taxAmount = totalBeforeTax * (taxRate / 100);
    const netTotal = totalBeforeTax + taxAmount;

    return {
      subtotal,
      cumulativeDiscounts,
      fittingFee,
      taxAmount,
      netTotal
    };
  };

  const { subtotal, cumulativeDiscounts, fittingFee, taxAmount, netTotal } = calculateCartTotals();

  // Open Shift from local UI
  const handleOpenShiftLocal = (float: number) => {
    fetch("/api/shifts/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starting_float: float,
        user_id: currentRole === "super-admin" ? 1 : currentRole === "store-manager" ? 2 : 3,
        user_name: currentRole === "super-admin" ? "Rohan (Admin)" : currentRole === "store-manager" ? "Bandara (Manager)" : "Chinthaka (Cashier)"
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((json) => { throw new Error(json.error); });
        return res.json();
      })
      .then((data) => {
        setActiveShift(data.shift);
        loadDatabase();
        triggerDrawerKick();
        alert("Drawer successfully unlocked. Welcome to Cash Terminal!");
        setActiveTab("pos");
      })
      .catch((e) => alert(e.message));
  };

  // Close Shift from local UI
  const handleCloseShiftLocal = (actual: number) => {
    if (!activeShift) return;
    fetch("/api/shifts/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: activeShift.id,
        actual_cash: actual
      })
    })
      .then((res) => res.json())
      .then(() => {
        setActiveShift(null);
        loadDatabase();
        alert("Register shift closed. EOD physical audited successfully.");
      })
      .catch((e) => alert(e.message));
  };

  // Checkout sale triggers
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const payload = {
      shift_id: activeShift.id,
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      payment_method: paymentMethod,
      cash_paid: Number(cashPaidInput),
      discount_total: cartDiscount,
      surcharge_amount: surchargeAmount,
      tax_rate: taxRate,
      cart: cart.map((c) => ({
        id: c.id,
        sku: c.sku,
        qty: c.qty,
        discount: c.discount,
        selling_price: c.selling_price,
        name_en: c.name_en
      }))
    };

    if (!isOnline) {
      // Offline implementation: append to local storage & deduct client quantities locally
      const queueItem = {
        ...payload,
        created_at: new Date().toISOString()
      };
      
      const nextQueue = [...syncQueue, queueItem];
      setSyncQueue(nextQueue);
      localStorage.setItem("ss_motors_offline_sales", JSON.stringify(nextQueue));

      // Local state adjustment to avoid double billing
      const updatedProducts = products.map((p) => {
        const cartMatch = cart.find((c) => c.id === p.id);
        if (cartMatch) {
          return { ...p, stock_qty: Math.max(0, p.stock_qty - cartMatch.qty) };
        }
        return p;
      });
      setProducts(updatedProducts);

      // Create a gorgeous simulated offline Sale to display instant Receipt ticket
      const simSaleId = Date.now();
      const simulatedSale: Sale = {
        id: simSaleId,
        invoice_no: `SSM-OFFLINE-${Date.now().toString().slice(-4)}`,
        user_id: activeShift.user_id,
        user_name: activeShift.user_name,
        shift_id: activeShift.id,
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        customer_name: selectedCustomerId ? (customers.find((c) => c.id === Number(selectedCustomerId))?.name || "") : null,
        subtotal,
        discount_total: cumulativeDiscounts,
        surcharge_amount: surchargeAmount,
        tax_amount: taxAmount,
        net_total: netTotal,
        cash_paid: Number(cashPaidInput),
        balance_returned: Math.max(0, Number(cashPaidInput) - netTotal),
        payment_method: paymentMethod,
        status: "completed",
        created_at: new Date().toISOString()
      };

      setLastCompletedItems(cart);
      setLastCompletedSale(simulatedSale);
      setCart([]);
      setCartDiscount(0);
      setSurchargeAmount(0);
      setTaxRate(0);
      setSelectedCustomerId("");
      setShowCheckoutModal(false);
      alert("Offline Mode Active: Sale has been queued in LocalStorage, client bills updated in state.");
      return;
    }

    // Online Mode Checkout
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((json) => { throw new Error(json.error || "Transaction aborted"); });
        }
        return res.json();
      })
      .then((data) => {
        // Complete checkout details
        setLastCompletedItems(cart);
        setLastCompletedSale(data.sale);
        setCart([]);
        setCartDiscount(0);
        setSurchargeAmount(0);
        setTaxRate(0);
        setSelectedCustomerId("");
        setShowCheckoutModal(false);
        loadDatabase();
        triggerDrawerKick();
      })
      .catch((e) => alert(e.message));
  };

  // Hold current active cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const holdItem = {
      id: Date.now(),
      cart,
      cartDiscount,
      selectedCustomerId,
      subtotal,
      time: new Date().toLocaleTimeString()
    };
    setHoldCarts([...holdCarts, holdItem]);
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomerId("");
    alert("Sale is preserved on pending drawer! You can resume it anytime.");
  };

  // Resume cart
  const handleResumeCart = (hold: any) => {
    setCart(hold.cart);
    setCartDiscount(hold.cartDiscount);
    setSelectedCustomerId(hold.selectedCustomerId);
    setHoldCarts(holdCarts.filter((h) => h.id !== hold.id));
  };

  // Quick Create Customer on POS
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCustName,
        phone: newCustPhone,
        credit_limit: parseFloat(newCustCreditLimit) || 50000
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((json) => { throw new Error(json.error); });
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          alert(`Successfully registered Customer Profile: ${data.customer.name}`);
          // Reload database or customers list
          loadDatabase();
          // Select newly created customer profile
          setSelectedCustomerId(data.customer.id.toString());
          // Clear states
          setNewCustName("");
          setNewCustPhone("");
          setNewCustCreditLimit("50000");
          setShowAddCustomerModal(false);
        }
      })
      .catch((err) => alert(`Failed to register customer: ${err.message}`));
  };

  // Add customized non-catalog item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;

    if (!activeShift) {
      alert("ERROR: POS Terminal is LOCKED. Cashiers must open a shift registry starting float first.");
      setActiveTab("shifts");
      return;
    }

    const price = parseFloat(customItemPrice) || 0;
    const itemUniqueId = Date.now(); // local timestamp unique id
    const customItem: CartItem = {
      id: itemUniqueId,
      sku: "SP-MISC-999",
      barcode: "MISC-999",
      name_en: customItemName,
      name_si: "විවිධ අමතර කොටස් (Misc Part)", // Sri Lankan Sinhala generic text
      selling_price: price,
      qty: 1,
      discount: 0
    };

    setCart([...cart, customItem]);
    setCustomItemName("");
    setCustomItemPrice("");
    setShowCustomItemForm(false);
    alert("Miscellaneous custom spare part successfully added to bill!");
  };

  // Filter products by searching strings or barcodes or category selector
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== null && p.category_id !== selectedCategoryFilter) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      p.name_en.toLowerCase().includes(q) ||
      (p.name_si && p.name_si.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Controller */}
      <RoleController
        currentRole={currentRole}
        setRole={setRole}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        syncQueueCount={syncQueue.length}
        onSync={handleSyncOperation}
        isSyncing={isSyncing}
      />

      {/* Main layout body containing content & navigation */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-64px)] overflow-hidden">
        {/* Navigation Rail / Sidebar */}
        <div className="lg:w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible shrink-0 animate-in fade-in">
          <span className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-zinc-500 px-2.5 mb-2">Navigation</span>
          
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "pos" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <ShoppingCart size={14} />
            <span>POS Billing</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "inventory" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <Package size={14} />
            <span>Inventory Stock</span>
          </button>

          <button
            onClick={() => setActiveTab("shifts")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "shifts" ? "bg-blue-600 text-white shadow-sm animate-in" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <FolderCheck size={14} />
            <span>Shift Registers</span>
            {activeShift && (
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping ml-auto"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("returns")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "returns" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <Undo2 size={14} />
            <span>Returns &amp; Credit</span>
          </button>

          <span className="hidden lg:block border-t border-zinc-800 my-2"></span>

          <span className="hidden lg:block text-[9px] font-bold uppercase tracking-widest text-zinc-500 px-2.5 mb-2">Developers</span>

          <button
            onClick={() => setActiveTab("blueprints")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "blueprints" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <Code size={14} />
            <span>SQL &amp; PHP Codes</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "analytics" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            <Coins size={14} />
            <span>Store Profit KPIs</span>
          </button>

          <span className="hidden lg:block border-t border-zinc-800 my-2"></span>

          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-amber-500 hover:text-amber-400 hover:bg-zinc-800/40"
            title="Show POS keyboard shortcuts and help guide"
          >
            <HelpCircle size={14} />
            <span>POS Help &amp; F-Keys</span>
          </button>
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-0.5 pb-2">
          {/* TAB: POS BILLING TERMINAL */}
          {activeTab === "pos" && (
            <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
              {/* Product Catalog Picker Grid */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-[300px]">
                {/* Search Bar header */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-md flex gap-2 shrink-0 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={15} />
                    <input
                      ref={barSearchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-950 w-full rounded-lg pl-9 pr-4 py-2 border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs font-sans placeholder-zinc-500 text-zinc-100"
                      placeholder={focusScannerActive ? "Focus Scanner ACTIVE - Just scan barcode or type anywhere..." : "Search parts by Name, SKU, or Scan Barcodes..."}
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded cursor-pointer font-bold transition-colors h-9 flex items-center"
                    >
                      Clear
                    </button>
                  )}
                  {/* Focus Scanner Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setFocusScannerActive(!focusScannerActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border h-9 select-none shrink-0 ${
                      focusScannerActive
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:bg-emerald-950/60"
                        : "bg-zinc-950 text-zinc-500 border-zinc-850 hover:bg-zinc-900 hover:text-zinc-400"
                    }`}
                    title="Toggle auto-focus barcode scanning mode (Captures scanner input automatically even when cursor is not focused)"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className={`h-1.5 w-1.5 rounded-full ${focusScannerActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                    </div>
                    <span className="hidden sm:inline">Scanner:</span>
                    <span>{focusScannerActive ? "ON" : "OFF"}</span>
                  </button>
                </div>

                {/* Quick Category Filtering Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-thin scrollbar-none">
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                      selectedCategoryFilter === null
                        ? "bg-blue-600 text-white border-blue-500 shadow-md"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    All Spare Parts
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                        selectedCategoryFilter === cat.id
                          ? "bg-blue-600 text-white border-blue-500 shadow-md"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Hold/Pause Carts bar */}
                {holdCarts.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 flex flex-wrap gap-2 items-center shrink-0 animate-in fade-in">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase">On-Hold Active Bills:</span>
                    {holdCarts.map((h, idx) => (
                      <button
                        key={h.id}
                        onClick={() => handleResumeCart(h)}
                        className="text-[9px] bg-amber-600 hover:bg-amber-500 text-white font-bold py-1 px-2.5 rounded-md shadow flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <span>Bill #{idx + 1} ({h.time})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Result parts listings */}
                <div className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock_qty <= p.reorder_level;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToCart(p)}
                          className="bg-zinc-950 border border-zinc-850 hover:border-blue-600/50 rounded-xl p-3 cursor-pointer shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[9px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 uppercase">
                                {p.sku}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isLowStock ? "bg-amber-950/60 text-amber-500" : "bg-zinc-900 text-zinc-500"
                              }`}>
                                {isLowStock ? `LOW: ${p.stock_qty}` : `Stock: ${p.stock_qty}`}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-100 mt-2 truncate leading-tight">
                              {p.name_en}
                            </h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                              {p.name_si || "—"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-900">
                            <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wide">SS Motors</span>
                            <span className="text-xs font-bold text-blue-500 font-mono">
                              රු. {p.selling_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-500 italic text-xs font-sans">
                        No Tuk Tuk or Bicycle spare parts found matching &quot;{searchQuery}&quot;. Try generic keywords.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Cart Checkout Panel */}
              <div className="w-full lg:w-96 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col overflow-hidden h-[540px] lg:h-full shrink-0 shadow-md">
                <div className="border-b border-zinc-800 pb-3 flex justify-between items-center shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-350 flex items-center gap-1.5">
                    <ShoppingCart size={14} className="text-blue-500" />
                    Billing Cart itemizer
                  </h3>
                  <div className="flex items-center space-x-1.5 font-sans">
                    <button
                      onClick={() => setShowCustomItemForm(true)}
                      className="text-[9px] uppercase font-extrabold text-blue-500 hover:text-blue-400 tracking-tight cursor-pointer"
                    >
                      + Custom Item
                    </button>
                    <span className="text-zinc-800 text-[10px]">|</span>
                    <button
                      onClick={() => { setCart([]); setCartDiscount(0); }}
                      className="text-[9px] uppercase font-extrabold text-zinc-500 hover:text-red-400 tracking-tight cursor-pointer"
                    >
                      Clear [F4]
                    </button>
                  </div>
                </div>

                {/* Cart list layout */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                  {cart.map((item) => {
                    const linkedProduct = products.find((p) => p.id === item.id);
                    const isLowStock = linkedProduct ? (linkedProduct.stock_qty <= linkedProduct.reorder_level) : false;
                    return (
                      <div
                        key={item.id}
                        className={`border p-2.5 rounded-lg space-y-2 transition-all ${
                          isLowStock
                            ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.12)] animate-[pulse_3s_infinite]"
                            : "bg-zinc-950 border-zinc-850"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="max-w-[70%]">
                            <p className="text-xs font-bold text-zinc-100 truncate">{item.name_en}</p>
                            <p className="text-[10px] text-zinc-400 font-sans truncate mt-0.2">{item.name_si || "Spare Part"}</p>
                            {isLowStock && (
                              <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-400 animate-pulse bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30 w-fit mt-1 select-none">
                                <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                                <span>Low stock alert: {linkedProduct?.stock_qty} left</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-200">
                            රු. {(item.selling_price * item.qty).toFixed(2)}
                          </span>
                        </div>

                        {/* Line discount controller + quantity adjuster */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-900 gap-2">
                          {/* Line flat discount input */}
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-tight">Line Disc:</span>
                            <input
                              type="number"
                              value={item.discount || ""}
                              onChange={(e) => handleAdjustLineDiscount(item.id, e.target.value)}
                              className="bg-zinc-900 w-14 rounded px-1.5 py-0.5 text-[10px] font-mono border border-zinc-800 focus:outline-none text-zinc-100 animate-fade-in"
                              placeholder="Rs"
                            />
                          </div>

                          {/* Adjust qty buttons */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleAdjustCartQty(item.id, -1)}
                              className="h-5 w-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-black text-zinc-100">{item.qty}</span>
                            <button
                              onClick={() => handleAdjustCartQty(item.id, 1)}
                              className="h-5 w-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length === 0 && (
                    <div className="text-center py-20 text-zinc-500 text-xs italic font-sans flex flex-col items-center justify-center space-y-2">
                      <Inbox size={26} className="text-zinc-650" />
                      <span>Cashier register cart is empty. Scan barcodes to list items.</span>
                    </div>
                  )}
                </div>

                {/* Checkout Summary panel */}
                <div className="border-t border-zinc-800 pt-3 space-y-2.5 shrink-0">
                  {/* Select credit customer profiles */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 font-sans">
                      <span>Customer linking (ණය ගිණුම)</span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="text-blue-500 hover:text-blue-400 text-[9.5px] font-extrabold uppercase tracking-wider flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>+ Register New</span>
                      </button>
                    </div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="bg-zinc-950 w-full rounded pl-2.5 pr-2.5 py-1.5 border border-zinc-800 text-xs focus:outline-none text-zinc-300 cursor-pointer"
                    >
                      <option value="">— Walk-in Cash Buyer —</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Debt Outstanding: රු.{c.outstanding_balance.toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Calculations receipts */}
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal amount:</span>
                      <span className="font-mono">රු. {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Cart Custom Discount (රු.):</span>
                      <input
                        type="number"
                        value={cartDiscount || ""}
                        onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                        className="bg-zinc-950 w-20 rounded text-right px-2 py-0.5 text-xs text-zinc-200 border border-zinc-805 font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Assemble / Fitting Labor:</span>
                      <input
                        type="number"
                        value={surchargeAmount || ""}
                        onChange={(e) => setSurchargeAmount(parseFloat(e.target.value) || 0)}
                        className="bg-zinc-950 w-20 rounded text-right px-2 py-0.5 text-xs text-zinc-200 border border-zinc-805 font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Regulatory Tax/VAT %:</span>
                      <select
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="bg-zinc-950 text-right px-1.5 py-0.5 text-xs text-zinc-200 border border-zinc-805 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="0">VAT Exempt (0%)</option>
                        <option value="5">NBT / Surch (5%)</option>
                        <option value="8">Lower Rate (8%)</option>
                        <option value="15">Sri Lanka VAT (15%)</option>
                      </select>
                    </div>

                    {taxAmount > 0 && (
                      <div className="flex justify-between text-zinc-500 text-[10px]">
                        <span>Computed VAT:</span>
                        <span className="font-mono">රු. {taxAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-dashed border-zinc-800">
                      <span>Total Savings (ලාභය):</span>
                      <span className="font-mono">රු. {cumulativeDiscounts.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Big bold PAY price display */}
                  <div className="bg-zinc-950 rounded-xl p-3.5 border border-zinc-850 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-zinc-500 block leading-none">Net Total Due</span>
                      <span className="text-xl font-black font-mono tracking-tight text-emerald-400 block mt-1.5">
                        රු. {netTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={handleHoldCart}
                        disabled={cart.length === 0}
                        className="text-[9px] uppercase font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-350 py-1 px-3 rounded cursor-pointer text-center"
                      >
                        Hold Cart
                      </button>
                    </div>
                  </div>

                  {/* Main trigger checkout Pay button */}
                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    disabled={cart.length === 0}
                    className={`w-full font-black text-xs py-3.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md uppercase tracking-wider ${
                      cart.length > 0
                        ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 cursor-pointer"
                        : "bg-zinc-850 text-zinc-650 cursor-not-allowed"
                    }`}
                  >
                    <span>Checkout [F2]</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INVENTORY STOCK */}
          {activeTab === "inventory" && (
            <InventoryManager
              products={products}
              categories={categories}
              suppliers={suppliers}
              onRefreshProducts={loadDatabase}
              userRole={currentRole}
            />
          )}

          {/* TAB: SHIFT REGISTERS */}
          {activeTab === "shifts" && (
            <ShiftRegister
              activeShift={activeShift}
              shiftHistory={shifts}
              onOpenShift={handleOpenShiftLocal}
              onCloseShift={handleCloseShiftLocal}
              userRole={currentRole}
            />
          )}

          {/* TAB: RETURNS & CREDIT LEDGERS */}
          {activeTab === "returns" && (
            <ReturnsCreditConsole
              customers={customers}
              sales={sales}
              products={products}
              onRefreshAll={loadDatabase}
              userRole={currentRole}
            />
          )}

          {/* TAB: SQL SCHEMA & LARAVEL CODES ARCHITECTURE */}
          {activeTab === "blueprints" && <DatabaseBlueprints />}

          {/* TAB: SUPER ADMIN ANALYTICS MARGINS */}
          {activeTab === "analytics" && (
            <AdminConsole userRole={currentRole} />
          )}
        </div>
      </div>

      {/* Cash Drawer simulation alert block overlay */}
      {drawerKicked && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400/20 z-50 animate-in slide-in-from-bottom duration-350">
          <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider">
            [SYS-DRAWER] ESC/POS Kickback Event: Drawer Opened.
          </p>
        </div>
      )}

      {/* Bill receipt printer modal */}
      {lastCompletedSale && (
        <ReceiptPrinter
          sale={lastCompletedSale}
          items={lastCompletedItems}
          currentCashier="Chinthaka (Cashier)"
          onClose={() => setLastCompletedSale(null)}
        />
      )}

      {/* Checkout Pay Dialog Overlay Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden text-zinc-100 shadow-2xl">
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-sm tracking-tight text-white">Checkout Payment Terminal</span>
              <button 
                type="button"
                onClick={() => setShowCheckoutModal(false)} 
                className="text-zinc-400 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4 font-sans text-xs">
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-850 flex justify-between items-center">
                <span className="text-zinc-400">Amount Net Due:</span>
                <span className="font-mono text-base font-black text-emerald-400">
                  රු. {netTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Methods select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Payment Instrument</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-3 rounded-lg cursor-pointer text-xs font-bold font-sans border transition-all ${
                      paymentMethod === "cash" 
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-md" 
                        : "bg-zinc-950 text-zinc-400 border-zinc-805 hover:bg-zinc-800"
                    }`}
                  >
                    Cash Tendered
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-3 rounded-lg cursor-pointer text-xs font-bold font-sans border transition-all ${
                      paymentMethod === "card" 
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-md" 
                        : "bg-zinc-950 text-zinc-400 border-zinc-805 hover:bg-zinc-800"
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`py-2 px-3 rounded-lg cursor-pointer text-xs font-bold font-sans border transition-all ${
                      paymentMethod === "bank_transfer" 
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-md" 
                        : "bg-zinc-950 text-zinc-400 border-zinc-805 hover:bg-zinc-800"
                    }`}
                  >
                    Bank Mobile Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCustomerId) {
                        alert("Please assign a Credit Customer Profile first in the Customer selection dropdown.");
                        return;
                      }
                      setPaymentMethod("credit");
                    }}
                    className={`py-2 px-3 rounded-lg cursor-pointer text-xs font-bold font-sans border transition-all ${
                      paymentMethod === "credit" 
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-md font-bold" 
                        : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800"
                    }`}
                  >
                    On Credit (ණය ගිණුම)
                  </button>
                </div>
              </div>

              {/* Cash Paid input if cashier cash */}
              {paymentMethod !== "credit" ? (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Cash Received (Tendered)</label>
                    <span className="font-mono text-[10px] text-zinc-400">Change: රු. {Math.max(0, Number(cashPaidInput || 0) - netTotal).toFixed(2)}</span>
                  </div>
                  <input
                    type="number"
                    value={cashPaidInput}
                    onChange={(e) => setCashPaidInput(e.target.value)}
                    className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 font-mono font-bold text-sm text-zinc-100 uppercase focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="E.g. 5000"
                    required
                  />
                  {/* Quick-select currency configurations */}
                  <div className="space-y-1 mt-1.5 font-sans">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">Tender denomination suggestions (රු.):</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCashPaidInput(Math.ceil(netTotal).toString())}
                        className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 font-bold font-mono text-[10px] py-1 px-2.5 rounded-md transition-all cursor-pointer shadow-sm"
                      >
                        Exact: රු. {Math.ceil(netTotal)}
                      </button>
                      {[100, 500, 1000, 5000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCashPaidInput(val.toString())}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-350 border border-zinc-700 font-bold font-mono text-[10px] py-1 px-2.5 rounded-md transition-all cursor-pointer shadow-sm"
                        >
                          රු. {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg animate-in fade-in space-y-1">
                  <span className="font-bold text-blue-400 block text-xs">Customer Credit Approval Active</span>
                  <p className="text-[11px] text-zinc-405 leading-relaxed">
                    This billing sale will be debited directly to **{customers.find(c => c.id === Number(selectedCustomerId))?.name}**'s ledger account. Cash tender is waived and unpaid debt balances will update inside live storage.
                  </p>
                </div>
              )}

              <div className="pt-3 flex space-x-2.5 justify-end border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold rounded-lg shadow-md cursor-pointer uppercase transition-colors"
                >
                  Complete Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Customer Registration Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden text-zinc-100 shadow-2xl">
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-white">Register Customer</span>
              <button 
                type="button" 
                onClick={() => setShowAddCustomerModal(false)} 
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} className="p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Customer Full Name (නම)*</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 font-bold text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  placeholder="E.g. Chinthaka Fernando"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Phone Number (දුරකථන අංකය)</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  placeholder="E.g. 0771234567"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Credit Bound Limit (ණය සීමාව)*</label>
                <input
                  type="number"
                  required
                  value={newCustCreditLimit}
                  onChange={(e) => setNewCustCreditLimit(e.target.value)}
                  className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  placeholder="50000"
                />
              </div>

              <div className="pt-3 flex space-x-2 justify-end border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded cursor-pointer shadow hover:bg-blue-500 text-[10px] uppercase"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Custom/Miscellaneous Item Adder Modal */}
      {showCustomItemForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden text-zinc-100 shadow-2xl">
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider text-white">Add Miscellaneous Item</span>
              <button 
                type="button" 
                onClick={() => setShowCustomItemForm(false)} 
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCustomItem} className="p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Spare Part Description (විස්තරය)*</label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 text-zinc-100 font-bold placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  placeholder="E.g. TVS Brake Cable Fitting / Labour Service"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Custom Selling Price (මිල ඝණන්)*</label>
                <input
                  type="number"
                  required
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="bg-zinc-950 w-full rounded pl-3 pr-3 py-2 border border-zinc-800 text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                  placeholder="E.g. 1500"
                />
              </div>

              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-2">
                * Note: Custom miscellaneous entries bypass standard SKU barcodes, have unlimited virtual stock, and default to 40% gross margins.
              </p>

              <div className="pt-3 flex space-x-2 justify-end border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowCustomItemForm(false)}
                  className="px-3.5 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded cursor-pointer shadow hover:bg-blue-500 text-[10px] uppercase"
                >
                  Append to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help Modal Overlay */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden text-zinc-100 shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-950/40 text-amber-500 rounded-lg border border-amber-500/25">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">POS Operator Reference Manual</h3>
                  <p className="text-[10px] text-zinc-500 font-sans">Learn hotkeys & barcode acoustic signals to maximize checkout speed</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowHelpModal(false)} 
                className="text-zinc-400 hover:text-white cursor-pointer bg-zinc-900 hover:bg-zinc-850 p-1 rounded-full transition-colors w-7 h-7 flex items-center justify-center border border-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Body of keycaps references */}
            <div className="p-5 space-y-5 text-xs">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block border-b border-zinc-800/80 pb-1.5">POS HOTKEY REGISTRY</span>
                
                <div className="space-y-2.5">
                  {/* F1 */}
                  <div className="flex items-start gap-4 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900">
                    <kbd className="px-2.5 py-1.5 bg-zinc-800 border-b-2 border-zinc-950 rounded-lg text-xs font-mono font-bold text-amber-400 shadow-inner select-none shrink-0 min-w-[42px] text-center">F1</kbd>
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-200 block">Toggle Reference Manual (Help)</span>
                      <p className="text-[10.5px] text-zinc-400 font-sans">Open or close this interactive keyboard shortcuts modal at any moment.</p>
                    </div>
                  </div>

                  {/* F2 */}
                  <div className="flex items-start gap-4 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900">
                    <kbd className="px-2.5 py-1.5 bg-zinc-800 border-b-2 border-zinc-950 rounded-lg text-xs font-mono font-bold text-blue-400 shadow-inner select-none shrink-0 min-w-[42px] text-center">F2</kbd>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-200">Submit Sale &amp; Checkout</span>
                        {cart.length > 0 && (
                          <span className="text-[8px] bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-extrabold uppercase animate-pulse">Ready</span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-zinc-400 font-sans">Directly triggers the Checkout Payment Terminal modal when products exist in the billing list.</p>
                    </div>
                  </div>

                  {/* F4 */}
                  <div className="flex items-start gap-4 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900">
                    <kbd className="px-2.5 py-1.5 bg-zinc-800 border-b-2 border-zinc-950 rounded-lg text-xs font-mono font-bold text-red-400 shadow-inner select-none shrink-0 min-w-[42px] text-center">F4</kbd>
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-200 block">Reset POS Card &amp; Cart</span>
                      <p className="text-[10.5px] text-zinc-400 font-sans">Clears all items, reset quantities, custom line discounts, and customer association instantly.</p>
                    </div>
                  </div>

                  {/* F9 */}
                  <div className="flex items-start gap-4 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900">
                    <kbd className="px-2.5 py-1.5 bg-zinc-800 border-b-2 border-zinc-950 rounded-lg text-xs font-mono font-bold text-emerald-400 shadow-inner select-none shrink-0 min-w-[42px] text-center">F9</kbd>
                    <div className="space-y-0.5">
                      <span className="font-bold text-zinc-200 block">Trigger Cash Drawer Kick</span>
                      <p className="text-[10.5px] text-zinc-400 font-sans">Sends a standard ESC/POS telemetry kickback event, simulating opening the secure physical till.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sound signals section */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block border-b border-zinc-800/80 pb-1.5">BARCODE ACOUSTIC SIGNALS</span>
                
                <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                  Avoid looking up at the screen! The POS workstation plays synthesized real-time audio cues based on the outcome of a scanned barcode or SKU entry.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex flex-col justify-between space-y-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-emerald-400 block">Success Chime</span>
                      <p className="text-[10px] text-zinc-400 font-sans leading-normal">High-pitched crisp chip indicating valid scan and successful addition to billing cart.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playScannerChime("success")}
                      className="px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded font-bold text-[9px] uppercase cursor-pointer transition-all text-center"
                    >
                      🔊 Test Chime
                    </button>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex flex-col justify-between space-y-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-400 block">Error Signal</span>
                      <p className="text-[10px] text-zinc-400 font-sans leading-normal">Double-buzzing alarming tone indicating invalid barcode, zero stock warning, or locked POS.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playScannerChime("error")}
                      className="px-2 py-1 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded font-bold text-[9px] uppercase cursor-pointer transition-all text-center"
                    >
                      🔊 Test Error Tone
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-zinc-950 border-t border-zinc-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer shadow hover:shadow-red-950/20 text-[10px] uppercase transition-colors"
              >
                Dismiss Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory secure login modal overlay if role session is empty */}
      {!currentRole && (
        <LoginModal 
          onLoginSuccess={(user) => {
            setRole(user.role);
          }} 
        />
      )}
    </div>
  );
}
