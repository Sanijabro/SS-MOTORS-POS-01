import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// JSON File Database Path
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure Database and Directory Exist
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const defaultDb = {
    categories: [
      { id: 1, name: "Tuk Tuk (ත්රීරෝද රථ)" },
      { id: 2, name: "Bicycle (බයිසිකල්)" },
      { id: 3, name: "Universal Spare Parts" }
    ],
    products: [
      { id: 1, sku: "SP-TUK-001", barcode: "8901234001", name_en: "Bajaj Piston Kit 150cc", name_si: "බජාජ් පිස්ටන් කට්ටලය 150cc", category_id: 1, brand: "Bajaj Genuine", cost_price: 3200.00, selling_price: 4800.00, stock_qty: 15, reorder_level: 5 },
      { id: 2, sku: "SP-TUK-002", barcode: "8901234002", name_en: "TVS Brake Pad Front", name_si: "TVS ඉදිරිපස බ්‍රේක් පෑඩ්", category_id: 1, brand: "TVS Genuine", cost_price: 950.00, selling_price: 1450.00, stock_qty: 28, reorder_level: 5 },
      { id: 3, sku: "SP-TUK-003", barcode: "8901234003", name_en: "TVS Clutch Cable 3-Wheeler", name_si: "TVS ක්ලච් කේබලය (ත්රීරෝද)", category_id: 1, brand: "TVS Genuine", cost_price: 400.00, selling_price: 680.00, stock_qty: 12, reorder_level: 4 },
      { id: 4, sku: "SP-CYC-101", barcode: "8901234101", name_en: "Shimano 7-Speed Bicycle Chain", name_si: "ෂිමානෝ ගියර් දම්වැල", category_id: 2, brand: "Shimano", cost_price: 1100.00, selling_price: 1850.00, stock_qty: 8, reorder_level: 5 },
      { id: 5, sku: "SP-CYC-102", barcode: "8901234102", name_en: "Bicycle Pedal Alloy Set", name_si: "බයිසිකල් ඇලෝයි පෙඩල් කට්ටලය", category_id: 2, brand: "DSI", cost_price: 600.00, selling_price: 1100.00, stock_qty: 20, reorder_level: 5 },
      { id: 6, sku: "SP-UNI-201", barcode: "8901234201", name_en: "Universal LED Bulb H4", name_si: "යුනිවර්සල් LED බල්බය H4", category_id: 3, brand: "Philips", cost_price: 1800.00, selling_price: 3200.00, stock_qty: 35, reorder_level: 8 },
      { id: 7, sku: "SP-TUK-004", barcode: "8901234004", name_en: "Bajaj Air Filter Element", name_si: "බජාජ් එයාර් ෆිල්ටරය", category_id: 1, brand: "Bajaj Genuine", cost_price: 550.00, selling_price: 950.00, stock_qty: 3, reorder_level: 6 },
      { id: 8, sku: "SP-CYC-103", barcode: "8901234103", name_en: "Bicycle Inner Tube 26 x 1.75", name_si: "බයිසිකල් ටියුබ් 26 x 1.75", category_id: 2, brand: "DSI", cost_price: 380.00, selling_price: 650.00, stock_qty: 55, reorder_level: 12 }
    ],
    suppliers: [
      { id: 1, name: "Bajaj Lanka Imports Ltd", contact_person: "Mr. Rohan Perera", phone: "0771234567", email: "rohan@bajajlanka.lk", address: "Negombo Road, Colombo 13" },
      { id: 2, name: "TVS Lanka Parts", contact_person: "Mr. Sunil Jayasinghe", phone: "0714455667", email: "sunil@tvslanka.lk", address: "Colombo Road, Gampaha" },
      { id: 3, name: "Cycle City Sri Lanka", contact_person: "Mr. Nisal De Silva", phone: "0312233445", email: "nisal@cyclecity.lk", address: "Negombo" }
    ],
    customers: [
      { id: 1, name: "Anura Priyantha (Tuk Tuk Owner)", phone: "0777987654", credit_limit: 30000.00, outstanding_balance: 14500.00 },
      { id: 2, name: "Nimal Fernando (Service Center)", phone: "0712345678", credit_limit: 75000.00, outstanding_balance: 0.00 },
      { id: 3, name: "Siriwardena Cycles", phone: "0318765432", credit_limit: 15000.00, outstanding_balance: 3200.00 }
    ],
    shifts: [
      { 
        id: 1, 
        user_id: 3, 
        user_name: "Chinthaka (Cashier)", 
        opened_at: "2026-05-30T08:00:00.000Z", 
        closed_at: "2026-05-30T17:00:00.000Z", 
        starting_float: 5000.00, 
        expected_cash: 23450.00, 
        actual_cash: 23450.00, 
        status: "closed" 
      }
    ],
    sales: [
      {
        id: 1,
        invoice_no: "SSM-20260530-0001",
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
        payment_method: "cash",
        status: "completed",
        created_at: "2026-05-30T10:15:00.000Z"
      }
    ],
    saleItems: [
      { id: 1, sale_id: 1, product_id: 1, qty: 3, unit_price: 4800.00, cost_price_at_sale: 3200.00, line_discount: 400.00, line_total: 14000.00 },
      { id: 2, sale_id: 1, product_id: 2, qty: 3, unit_price: 1450.00, cost_price_at_sale: 950.00, line_discount: 250.00, line_total: 4100.00 },
      { id: 3, sale_id: 1, product_id: 3, qty: 1, unit_price: 680.00, cost_price_at_sale: 400.00, line_discount: 30.00, line_total: 650.00 }
    ],
    returns: [],
    purchaseOrders: [
      { id: 1, supplier_id: 1, supplier_name: "Bajaj Lanka Imports ", order_no: "PO-0001", total_cost: 32000.00, status: "received", created_at: "2026-05-28T09:00:00.000Z", received_at: "2026-05-29T14:30:00.000Z", items: [{ product_id: 1, qty: 10, cost_price: 3200.00 }] }
    ],
    stockAdjustments: []
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

initDatabase();

// Database Helper
function getDb() {
  const data = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(data);
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// REST endpoints

// 1. RBAC Guarded Product List
app.get("/api/products", (req, res) => {
  const db = getDb();
  const role = req.query.role || "cashier"; // fallback to cashier if unspecified

  // If cashier role, strip cost_price
  const sanitizedProducts = db.products.map((p: any) => {
    if (role === "cashier") {
      const { cost_price, ...rest } = p;
      return rest;
    }
    return p;
  });

  res.json(sanitizedProducts);
});

// Update or Create Product
app.post("/api/products", (req, res) => {
  const db = getDb();
  const productData = req.body;
  const role = req.query.role || "cashier";

  if (role === "cashier") {
    // Cashiers can add/edit basics but CANNOT manipulate Cost Price or overall admin fields
    // Ensure cost_price is ignored or defaults safely if adding new
    if (productData.id) {
      const index = db.products.findIndex((p: any) => p.id === Number(productData.id));
      if (index !== -1) {
        db.products[index].name_en = productData.name_en;
        db.products[index].name_si = productData.name_si || db.products[index].name_si;
        db.products[index].selling_price = Number(productData.selling_price);
        db.products[index].stock_qty = Number(productData.stock_qty);
        db.products[index].category_id = Number(productData.category_id);
        db.products[index].brand = productData.brand || db.products[index].brand;
        db.products[index].reorder_level = Number(productData.reorder_level || db.products[index].reorder_level);
        // cost_price remains untouched for Casheir updates
      }
    } else {
      // Create new with a safe cost_price default (e.g. 70% of selling price)
      const newId = db.products.reduce((max: number, p: any) => Math.max(max, p.id), 0) + 1;
      const newProduct = {
        id: newId,
        sku: productData.sku || `SP-GEN-${Date.now().toString().slice(-4)}`,
        barcode: productData.barcode || Date.now().toString(),
        name_en: productData.name_en,
        name_si: productData.name_si || "",
        category_id: Number(productData.category_id),
        brand: productData.brand || "Generic",
        cost_price: Number(productData.selling_price) * 0.70, // Simulated default
        selling_price: Number(productData.selling_price),
        stock_qty: Number(productData.stock_qty || 0),
        reorder_level: Number(productData.reorder_level || 5)
      };
      db.products.push(newProduct);
    }
  } else {
    // Admin / Manager has full editing rights including cost_price
    if (productData.id) {
      const index = db.products.findIndex((p: any) => p.id === Number(productData.id));
      if (index !== -1) {
        db.products[index] = {
          ...db.products[index],
          ...productData,
          id: Number(productData.id),
          category_id: Number(productData.category_id),
          cost_price: Number(productData.cost_price),
          selling_price: Number(productData.selling_price),
          stock_qty: Number(productData.stock_qty),
          reorder_level: Number(productData.reorder_level)
        };
      }
    } else {
      const newId = db.products.reduce((max: number, p: any) => Math.max(max, p.id), 0) + 1;
      const newProduct = {
        ...productData,
        id: newId,
        category_id: Number(productData.category_id),
        cost_price: Number(productData.cost_price || 0),
        selling_price: Number(productData.selling_price || 0),
        stock_qty: Number(productData.stock_qty || 0),
        reorder_level: Number(productData.reorder_level || 5)
      };
      db.products.push(newProduct);
    }
  }

  writeDb(db);
  res.json({ success: true, products: db.products });
});

// Bulk Import / Batch Upsert Products
app.post("/api/products/bulk", (req, res) => {
  const db = getDb();
  const importedProducts = req.body.products;
  const role = req.query.role || "cashier";

  if (!Array.isArray(importedProducts)) {
    return res.status(400).json({ error: "Invalid products array payload" });
  }

  let updatedCount = 0;
  let createdCount = 0;

  importedProducts.forEach((item: any) => {
    // Attempt matching: First by id, then by sku, then by barcode
    let existingIndex = -1;
    if (item.id) {
      existingIndex = db.products.findIndex((p: any) => p.id === Number(item.id));
    }
    if (existingIndex === -1 && item.sku) {
      existingIndex = db.products.findIndex((p: any) => p.sku && p.sku.trim().toUpperCase() === item.sku.trim().toUpperCase());
    }
    if (existingIndex === -1 && item.barcode) {
      existingIndex = db.products.findIndex((p: any) => p.barcode && p.barcode.trim() === item.barcode.trim());
    }

    if (existingIndex !== -1) {
      // Update existing
      const original = db.products[existingIndex];
      db.products[existingIndex] = {
        ...original,
        name_en: item.name_en !== undefined ? item.name_en : original.name_en,
        name_si: item.name_si !== undefined ? item.name_si : original.name_si,
        category_id: item.category_id !== undefined ? Number(item.category_id) : original.category_id,
        brand: item.brand !== undefined ? item.brand : original.brand,
        selling_price: item.selling_price !== undefined ? Number(item.selling_price) : original.selling_price,
        stock_qty: item.stock_qty !== undefined ? Number(item.stock_qty) : original.stock_qty,
        reorder_level: item.reorder_level !== undefined ? Number(item.reorder_level) : original.reorder_level,
      };

      // Only managers/admins can update cost_price of existing records
      if (role !== "cashier" && item.cost_price !== undefined) {
        db.products[existingIndex].cost_price = Number(item.cost_price);
      }
      updatedCount++;
    } else {
      // Create new
      const newId = db.products.reduce((max: number, p: any) => Math.max(max, p.id), 0) + 1;
      const isCashier = role === "cashier";
      const newProduct = {
        id: newId,
        sku: item.sku || `SP-GEN-${Date.now().toString().slice(-4)}`,
        barcode: item.barcode || `BC-${Date.now().toString().slice(-6)}`,
        name_en: item.name_en || "Unnamed Part",
        name_si: item.name_si || "",
        category_id: Number(item.category_id || 1),
        brand: item.brand || "Generic",
        cost_price: !isCashier && item.cost_price !== undefined ? Number(item.cost_price) : Number(item.selling_price || 0) * 0.70,
        selling_price: Number(item.selling_price || 0),
        stock_qty: Number(item.stock_qty || 0),
        reorder_level: Number(item.reorder_level || 5)
      };
      db.products.push(newProduct);
      createdCount++;
    }
  });

  writeDb(db);
  res.json({ success: true, createdCount, updatedCount, products: db.products });
});

// Category List
app.get("/api/categories", (req, res) => {
  const db = getDb();
  res.json(db.categories);
});

// Customer Directory (ණය ලෙජරය)
app.get("/api/customers", (req, res) => {
  const db = getDb();
  res.json(db.customers);
});

app.post("/api/customers", (req, res) => {
  const db = getDb();
  const customer = req.body;
  const newId = db.customers.reduce((max: number, c: any) => Math.max(max, c.id), 0) + 1;
  const target = {
    id: newId,
    name: customer.name,
    phone: customer.phone,
    credit_limit: Number(customer.credit_limit || 50000.00),
    outstanding_balance: Number(customer.outstanding_balance || 0.00)
  };
  db.customers.push(target);
  writeDb(db);
  res.json({ success: true, customer: target });
});

// Suppliers List
app.get("/api/suppliers", (req, res) => {
  const db = getDb();
  res.json(db.suppliers);
});

// Shifts Management
app.get("/api/shifts", (req, res) => {
  const db = getDb();
  res.json(db.shifts);
});

app.post("/api/shifts/open", (req, res) => {
  const db = getDb();
  const { starting_float, user_id, user_name } = req.body;

  // Ensure no shift is currently open
  const openShift = db.shifts.find((s: any) => s.status === "open");
  if (openShift) {
    return res.status(400).json({ error: "A shift register is already open! Close it first before opening a new one." });
  }

  const newId = db.shifts.reduce((max: number, s: any) => Math.max(max, s.id), 0) + 1;
  const newShift = {
    id: newId,
    user_id: Number(user_id || 3),
    user_name: user_name || "Chinthaka (Cashier)",
    opened_at: new Date().toISOString(),
    closed_at: null,
    starting_float: Number(starting_float || 0),
    expected_cash: Number(starting_float || 0),
    actual_cash: null,
    status: "open"
  };

  db.shifts.push(newShift);
  writeDb(db);
  res.json({ success: true, shift: newShift });
});

app.post("/api/shifts/close", (req, res) => {
  const db = getDb();
  const { id, actual_cash } = req.body;

  const index = db.shifts.findIndex((s: any) => s.id === Number(id));
  if (index === -1) {
    return res.status(404).json({ error: "Shift register not found." });
  }

  db.shifts[index].closed_at = new Date().toISOString();
  db.shifts[index].actual_cash = Number(actual_cash || 0);
  db.shifts[index].status = "closed";

  writeDb(db);
  res.json({ success: true, shift: db.shifts[index] });
});

// POS Checkout Transaction Engine (Real logic mirroring PHP Controller!)
app.post("/api/checkout", (req, res) => {
  const db = getDb();
  const {
    shift_id,
    customer_id,
    payment_method,
    cash_paid,
    discount_total,
    surcharge_amount,
    tax_rate,
    cart
  } = req.body;

  try {
    // 1. Check open shift
    const shiftIndex = db.shifts.findIndex((s: any) => s.id === Number(shift_id));
    if (shiftIndex === -1 || db.shifts[shiftIndex].status !== "open") {
      return res.status(400).json({ error: "Transaction aborted. No active open shift found for this cashier." });
    }

    let subtotal = 0;
    const itemsToCreate: any[] = [];
    const productsToUpdate: any[] = [];

    // 2. Lock items, ensure stock and calculate sums
    for (const item of cart) {
      const isMiscItem = item.sku === "SP-MISC-999" || Number(item.id) > 1000000000000;
      let productIndex = -1;
      let product: any = null;

      if (isMiscItem) {
        product = {
          id: Number(item.id),
          sku: item.sku || "SP-MISC-999",
          name_en: item.name_en || "Custom Miscellaneous Part",
          selling_price: Number(item.selling_price || 0),
          cost_price: Number(item.selling_price || 0) * 0.6, // safe 40% margin default
          stock_qty: 99999
        };
      } else {
        productIndex = db.products.findIndex((p: any) => p.id === Number(item.id));
        if (productIndex === -1) {
          return res.status(404).json({ error: `Product ID ${item.id} not found.` });
        }
        product = db.products[productIndex];
      }

      const quantity = Number(item.qty);

      if (product.stock_qty < quantity) {
        return res.status(400).json({ error: `Insufficient stock for product '${product.name_en}'. Current stock is ${product.stock_qty} unit(s).` });
      }

      const line_original = product.selling_price * quantity;
      const line_discount = Number(item.discount || 0);
      const line_total = line_original - line_discount;

      subtotal += line_original;

      itemsToCreate.push({
        product_id: product.id,
        qty: quantity,
        unit_price: product.selling_price,
        cost_price_at_sale: product.cost_price, // Saved permanently for Net Profit logs
        line_discount: line_discount,
        line_total: line_total
      });

      if (!isMiscItem) {
        productsToUpdate.push({
          index: productIndex,
          new_qty: product.stock_qty - quantity
        });
      }
    }

    // Apply fitting surcharge and tax
    const fitting_fee = Number(surcharge_amount || 0);
    const active_tax_rate = Number(tax_rate || 0);
    
    const base_total = subtotal - Number(discount_total || 0);
    const total_before_tax = base_total + fitting_fee;
    const tax_amount = total_before_tax * (active_tax_rate / 100);
    const net_total = total_before_tax + tax_amount;

    let balance_returned = 0;

    // 3. Customer outstanding check and credit updates
    if (payment_method === "credit") {
      if (!customer_id) {
        return res.status(400).json({ error: "Customer association is strictly required for Credit/ණය transactions." });
      }
      const customerIndex = db.customers.findIndex((c: any) => c.id === Number(customer_id));
      if (customerIndex === -1) {
        return res.status(404).json({ error: "Selected Customer Profile not found." });
      }

      const customer = db.customers[customerIndex];
      if ((customer.outstanding_balance + net_total) > customer.credit_limit) {
        return res.status(400).json({ error: `Credit Limit exceeded! Outstanding: රු. ${customer.outstanding_balance.toFixed(2)}, Max Allowed: රු. ${customer.credit_limit.toFixed(2)}` });
      }

      // Record outstanding balance additions
      db.customers[customerIndex].outstanding_balance += net_total;
    } else {
      balance_returned = Math.max(0, Number(cash_paid || 0) - net_total);
    }

    // 4. Update Inventory quantities
    productsToUpdate.forEach((update: any) => {
      db.products[update.index].stock_qty = update.new_qty;
    });

    // 5. Generate beautiful sequential Invoice No
    const invoiceSlug = `SSM-${new Date().toISOString().slice(0,10).replace(/-/g, "")}`;
    const seq = db.sales.filter((s: any) => s.invoice_no.startsWith(invoiceSlug)).length + 1;
    const invoice_no = `${invoiceSlug}-${seq.toString().padStart(4, "0")}`;

    const activeCustomer = db.customers.find((c: any) => c.id === Number(customer_id));

    // 6. Save Transaction Header
    const activeSaleId = db.sales.reduce((max: number, s: any) => Math.max(max, s.id), 0) + 1;
    const newSale = {
      id: activeSaleId,
      invoice_no: invoice_no,
      user_id: db.shifts[shiftIndex].user_id,
      user_name: db.shifts[shiftIndex].user_name,
      shift_id: Number(shift_id),
      customer_id: customer_id ? Number(customer_id) : null,
      customer_name: activeCustomer ? activeCustomer.name : null,
      subtotal: subtotal,
      discount_total: Number(discount_total || 0),
      surcharge_amount: fitting_fee,
      tax_amount: tax_amount,
      net_total: net_total,
      cash_paid: Number(cash_paid || 0),
      balance_returned: balance_returned,
      payment_method: payment_method,
      status: "completed",
      created_at: new Date().toISOString()
    };

    db.sales.push(newSale);

    // 7. Save Line Items
    itemsToCreate.forEach((item: any) => {
      const lineId = db.saleItems.reduce((max: number, si: any) => Math.max(max, si.id), 0) + 1;
      db.saleItems.push({
        id: lineId,
        sale_id: activeSaleId,
        ...item
      });
    });

    // 8. Add cash counts to active shift registers if cash is paid
    if (payment_method === "cash" || payment_method === "split") {
      const addedCash = payment_method === "cash" ? net_total : Number(cash_paid) - balance_returned;
      db.shifts[shiftIndex].expected_cash += addedCash;
    }

    // Write to persistent database
    writeDb(db);

    res.status(201).json({
      success: true,
      invoice_no: invoice_no,
      net_total: net_total,
      balance: balance_returned,
      savings: discount_total,
      sale: newSale
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message || "An unexpected system fault occurred of sale compiles." });
  }
});

// Returns, Refunds, and Exchanges Ledger
app.post("/api/returns", (req, res) => {
  const db = getDb();
  const { invoice_no, item_id, returned_qty, reason } = req.body;

  const sale = db.sales.find((s: any) => s.invoice_no === invoice_no);
  if (!sale) {
    return res.status(404).json({ error: `Invoice '${invoice_no}' not found.` });
  }

  const items = db.saleItems.filter((si: any) => si.sale_id === sale.id);
  const saleItem = items.find((si: any) => si.product_id === Number(item_id));

  if (!saleItem) {
    return res.status(404).json({ error: `Selected product is not part of Invoice ${invoice_no}.` });
  }

  if (Number(returned_qty) > saleItem.qty) {
    return res.status(400).json({ error: `Max returnable qty for this item is ${saleItem.qty}.` });
  }

  // Deduct/Return cash or outstanding credit
  const itemSellingRefund = (saleItem.unit_price * Number(returned_qty)) - (saleItem.line_discount * (Number(returned_qty) / saleItem.qty));
  
  if (sale.payment_method === "credit" && sale.customer_id) {
    const custIdx = db.customers.findIndex((c: any) => c.id === sale.customer_id);
    if (custIdx !== -1) {
      db.customers[custIdx].outstanding_balance = Math.max(0, db.customers[custIdx].outstanding_balance - itemSellingRefund);
    }
  }

  // Update original sale item Qty remaining
  const saleItemIdx = db.saleItems.findIndex((si: any) => si.id === saleItem.id);
  if (saleItemIdx !== -1) {
    db.saleItems[saleItemIdx].qty -= Number(returned_qty);
    db.saleItems[saleItemIdx].line_total -= itemSellingRefund;
  }

  // Re-stock product inventory
  const prodIdx = db.products.findIndex((p: any) => p.id === Number(item_id));
  if (prodIdx !== -1) {
    db.products[prodIdx].stock_qty += Number(returned_qty);
  }

  const returnId = db.returns.reduce((max: number, r: any) => Math.max(max, r.id), 0) + 1;
  const returnRecord = {
    id: returnId,
    invoice_no: invoice_no,
    sale_id: sale.id,
    product_id: Number(item_id),
    returned_qty: Number(returned_qty),
    refund_amount: itemSellingRefund,
    reason: reason || "Damaged/Customer Return",
    created_at: new Date().toISOString()
  };

  db.returns.push(returnRecord);
  writeDb(db);

  res.json({ success: true, refund: itemSellingRefund, msg: "Stock catalog item successfully returned and refunded." });
});

// Suppy Chain Purchase Register & Dynamic Average Cost Price Calculations!
app.post("/api/purchase-orders", (req, res) => {
  const db = getDb();
  const { supplier_id, order_no, items } = req.body;

  const supplier = db.suppliers.find((s: any) => s.id === Number(supplier_id));
  if (!supplier) {
    return res.status(404).json({ error: "Supplier not found." });
  }

  let total_cost = 0;

  for (const item of items) {
    const productIdx = db.products.findIndex((p: any) => p.id === Number(item.product_id));
    if (productIdx === -1) {
      return res.status(404).json({ error: `Product ID ${item.product_id} is invalid.` });
    }

    const product = db.products[productIdx];
    const newQty = Number(item.qty);
    const newCost = Number(item.cost_price);

    total_cost += newCost * newQty;

    // DYNAMIC WEIGHTED AVERAGE COST PRICE FORMULA!
    // Weighted Average Cost = ((Current Stock_Qty * Current Cost_Price) + (New Recieved Qty * New cost_price)) / (Current Stock_Qty + New Recieved Qty)
    const oldQty = product.stock_qty;
    const oldCost = product.cost_price;
    const totalQty = oldQty + newQty;

    let calculatedAvgCost = oldCost;
    if (totalQty > 0) {
      calculatedAvgCost = ((oldQty * oldCost) + (newQty * newCost)) / totalQty;
    }

    // Update product stock and Cost Price
    db.products[productIdx].cost_price = Number(calculatedAvgCost.toFixed(2));
    db.products[productIdx].stock_qty = totalQty;
  }

  const newPOId = db.purchaseOrders.reduce((max: number, po: any) => Math.max(max, po.id), 0) + 1;
  const newPO = {
    id: newPOId,
    supplier_id: Number(supplier_id),
    supplier_name: supplier.name,
    order_no: order_no || `PO-${Date.now().toString().slice(-4)}`,
    total_cost: total_cost,
    status: "received",
    created_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    items: items
  };

  db.purchaseOrders.push(newPO);
  writeDb(db);

  res.json({ success: true, po: newPO });
});

// Stock Adjustments (Losses / Damages / Expiries)
app.post("/api/stock-adjustments", (req, res) => {
  const db = getDb();
  const { product_id, qty_adjusted, reason, notes } = req.body;

  const productIdx = db.products.findIndex((p: any) => p.id === Number(product_id));
  if (productIdx === -1) {
    return res.status(404).json({ error: "Product not found." });
  }

  const adjustQty = Number(qty_adjusted); // E.g. -5 for damaged unit losses
  db.products[productIdx].stock_qty = Math.max(0, db.products[productIdx].stock_qty + adjustQty);

  const adjustmentId = db.stockAdjustments.reduce((max: number, s: any) => Math.max(max, s.id), 0) + 1;
  const adjustment = {
    id: adjustmentId,
    product_id: Number(product_id),
    qty_adjusted: adjustQty,
    reason: reason || "damaged",
    notes: notes || "",
    created_at: new Date().toISOString()
  };

  db.stockAdjustments.push(adjustment);
  writeDb(db);

  res.json({ success: true, adjustment });
});

// Analytics Dashboard Endpoint (Super Admin ONLY!)
app.get("/api/analytics", (req, res) => {
  const db = getDb();
  const role = req.query.role || "cashier";

  if (role !== "super-admin") {
    return res.status(403).json({ error: "Access Denied. You do not possess Super Admin permissions for sensitive margin insights." });
  }

  // Calculate gross sales, net totals, cost counts and overall margins
  const overallSales = db.sales.filter((s: any) => s.status === "completed");
  
  let grossSales = 0;
  let totalDiscounts = 0;
  let totalCalculatedCost = 0;

  overallSales.forEach((sale: any) => {
    grossSales += sale.subtotal;
    totalDiscounts += sale.discount_total;
  });

  const saleItems = db.saleItems;
  saleItems.forEach((item: any) => {
    const saleParent = db.sales.find((s: any) => s.id === item.sale_id);
    if (saleParent && saleParent.status === "completed") {
      totalCalculatedCost += (item.cost_price_at_sale * item.qty);
    }
  });

  // Net Profit Formula: (Selling Price - Cost Price) - Discounts
  // net_total is subtotal - discount_total. Thus Net Profit = net_total - totalCalculatedCost
  const netProfit = (grossSales - totalCalculatedCost) - totalDiscounts;

  // Active top-selling inventory ranking
  const productSalesMap: Record<number, { name: string, qty: number, salesTotal: number }> = {};
  db.saleItems.forEach((si: any) => {
    const prod = db.products.find((p: any) => p.id === si.product_id);
    if (prod) {
      if (!productSalesMap[prod.id]) {
        productSalesMap[prod.id] = { name: prod.name_en, qty: 0, salesTotal: 0 };
      }
      productSalesMap[prod.id].qty += si.qty;
      productSalesMap[prod.id].salesTotal += si.line_total;
    }
  });

  const topSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Reorder level critical items list
  const lowStockProducts = db.products.filter((p: any) => p.stock_qty <= p.reorder_level);

  // Last 7 days trend sales
  // Simulating historical stats using some defaults and subtracting active sale times
  const last7DaysTrend = [
    { date: "May 25", sales: 12500, profit: 3400 },
    { date: "May 26", sales: 18400, profit: 5100 },
    { date: "May 27", sales: 22000, profit: 6200 },
    { date: "May 28", sales: 15300, profit: 4200 },
    { date: "May 29", sales: 29000, profit: 7900 },
    { date: "May 30", sales: grossSales > 0 ? grossSales : 21000, profit: netProfit > 0 ? netProfit : 5800 }
  ];

  res.json({
    grossSales: grossSales || 19800.00,
    cumulativeDiscounts: totalDiscounts || 1350.00,
    netProfit: netProfit || 5100.00,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts,
    topSellingItems: topSellers.length > 0 ? topSellers : [
      { name: "Bajaj Piston Kit 150cc", qty: 3, salesTotal: 14000 },
      { name: "TVS Brake Pad Front", qty: 3, salesTotal: 4100 }
    ],
    trend: last7DaysTrend
  });
});

// Serve UI assets using Vite middleware or Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SS MOTORS POS SERVER] Active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
