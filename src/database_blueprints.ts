export const SQL_SCHEMA_BLUEPRINT = `-- ====================================================================
-- SS MOTORS POS DATABASE SCHEMA (MySQL Production-Ready)
-- Retailer of Tuk Tuk & Bicycle Spare Parts
-- ====================================================================

CREATE DATABASE IF NOT EXISTS ss_motors_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ss_motors_pos;

-- 1. USERS (RBAC)
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super-admin', 'store-manager', 'cashier') NOT NULL DEFAULT 'cashier',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CATEGORIES
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Tuk Tuk', 'Bicycle', 'Universal'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTS (INVENTORY)
CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_si VARCHAR(255) NULL, -- Sinhala Unicode name for receipts
    category_id INT UNSIGNED NOT NULL,
    brand VARCHAR(100) NULL,
    cost_price DECIMAL(12, 2) NOT NULL, -- To be strictly hidden from Cashiers 
    selling_price DECIMAL(12, 2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    KEY idx_product_barcode (barcode),
    KEY idx_product_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SUPPLIERS
CREATE TABLE suppliers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SHIFT_REGISTERS (SHIFT LIFE CYCLE)
CREATE TABLE shifts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    starting_float DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    expected_cash DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Calculated by system
    actual_cash DECIMAL(12, 2) NULL DEFAULT NULL,       -- Entered by Cashier
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    KEY idx_shift_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CUSTOMER_PROFILES (CREDIT / ණය ලෙජරය)
CREATE TABLE customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL UNIQUE,
    credit_limit DECIMAL(12, 2) NOT NULL DEFAULT 50000.00,
    outstanding_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Current ණය Amount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_customer_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SALES (BILLING ENDPOINT)
CREATE TABLE sales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(100) NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL,
    shift_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NULL, -- Optional client link for credit
    subtotal DECIMAL(12, 2) NOT NULL, -- Total of items before discounts
    discount_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Cumulative savings
    net_total DECIMAL(12, 2) NOT NULL, -- final cost to buyer
    cash_paid DECIMAL(12, 2) NOT NULL,
    balance_returned DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'credit', 'split') NOT NULL,
    status ENUM('completed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    KEY idx_sales_invoice (invoice_no),
    KEY idx_sales_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SALE_ITEMS (INDIVIDUAL LINES)
CREATE TABLE sale_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL, -- Current Selling Price
    cost_price_at_sale DECIMAL(12, 2) NOT NULL, -- Caught for historical exact Net Profit calculation
    line_discount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL, -- (unit_price * qty) - line_discount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    KEY idx_item_sale (sale_id),
    KEY idx_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. RETURNS_AND_REFUNDS
CREATE TABLE returns (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(100) NOT NULL,
    sale_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    returned_qty INT NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    KEY idx_return_invoice (invoice_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PURCHASE_ORDERS (DYNAMIC WEIGHTED AVG COSTING)
CREATE TABLE purchase_orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT UNSIGNED NOT NULL,
    order_no VARCHAR(100) NOT NULL UNIQUE,
    total_cost DECIMAL(12, 2) NOT NULL,
    status ENUM('ordered', 'received', 'cancelled') NOT NULL DEFAULT 'ordered',
    received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    qty INT NOT NULL,
    cost_price_per_unit DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. STOCK_ADJUSTMENTS (LOSSED, DAMAGED)
CREATE TABLE stock_adjustments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    qty_adjusted INT NOT NULL, -- Can be negative (loss/damage) or positive
    reason ENUM('damaged', 'lost', 'expired', 'audit_correction', 'other') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED DATA SETUP
-- ====================================================================

-- Seed Categories
INSERT INTO categories (id, name) VALUES 
(1, 'Tuk Tuk (ත්රීරෝද රථ)'),
(2, 'Bicycle (බයිසිකල්)'),
(3, 'Universal Spare Parts');

-- Seed Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES
(1, 'Bajaj Lanka Imports Ltd', 'Mr. Rohan Perera', '0771234567', 'rohan@bajajlanka.lk', 'Negombo Road, Colombo 13'),
(2, 'TVS Lanka Parts', 'Mr. Sunil Jayasinghe', '0714455667', 'sunil@tvslanka.lk', 'Colombo Road, Gampaha'),
(3, 'Cycle City Sri Lanka', 'Mr. Nisal De Silva', '0312233445', 'nisal@cyclecity.lk', 'Negombo');

-- Seed Users (Passwords represent hashed forms)
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Ariyapala (Admin)', 'admin@ssmotors.lk', '$2y$10$AdminHashSSMotors...', 'super-admin'),
(2, 'Bandara (Manager)', 'manager@ssmotors.lk', '$2y$10$ManagerHashSSMotors...', 'store-manager'),
(3, 'Chinthaka (Cashier)', 'cashier@ssmotors.lk', '$2y$10$CashierHashSSMotors...', 'cashier');

-- Seed Products
INSERT INTO products (sku, barcode, name_en, name_si, category_id, brand, cost_price, selling_price, stock_qty, reorder_level) VALUES
('SP-TUK-001', '8901234001', 'Bajaj Piston Kit 150cc', 'බජාජ් පිස්ටන් කට්ටලය 150cc', 1, 'Bajaj Genuine', 3200.00, 4800.00, 15, 3),
('SP-TUK-002', '8901234002', 'TVS Brake Pad Front', 'TVS ඉදිරිපස බ්‍රේක් පෑඩ්', 1, 'TVS Genuine', 950.00, 1450.00, 28, 5),
('SP-TUK-003', '8901234003', 'TVS Clutch Cable 3-Wheeler', 'TVS ක්ලච් කේබලය (ත්රීරෝද)', 1, 'TVS Genuine', 400.00, 680.00, 12, 4),
('SP-CYC-101', '8901234101', 'Shimano 7-Speed Bicycle Chain', 'ෂිමානෝ ගියර් දම්වැල', 2, 'Shimano', 1100.00, 1850.00, 8, 2),
('SP-CYC-102', '8901234102', 'Bicycle Pedal Alloy Set', 'බයිසිකල් ඇලෝයි පෙඩල් කට්ටලය', 2, 'DSI', 600.00, 1100.00, 20, 5),
('SP-UNI-201', '8901234201', 'Universal LED Bulb H4', 'යුනිවර්සල් LED බල්බය H4', 3, 'Philips', 1800.00, 3200.00, 35, 8),
('SP-TUK-004', '8901234004', 'Bajaj Air Filter Element', 'බජාජ් එයාර් ෆිල්ටරය', 1, 'Bajaj Genuine', 550.00, 950.00, 40, 10),
('SP-CYC-103', '8901234103', 'Bicycle Inner Tube 26 x 1.75', 'බයිසිකල් ටියුබ් 26 x 1.75', 2, 'DSI', 380.00, 650.00, 55, 12);
`;

export const LARAVEL_MIGRATION_BLUEPRINT = `<?php
// database/migrations/2026_05_31_000001_create_ss_motors_pos_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for SS MOTORS Point of Sale & Inventory
     */
    public function up(): void
    {
        // 1. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // 2. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->unique();
            $table->string('name_en');
            $table->string('name_si')->nullable(); // Sinhala details for ESC/POS Thermal Receipt
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->string('brand')->nullable();
            $table->decimal('cost_price', 12, 2); // Hidden from Cashiers via Serialization rules
            $table->decimal('selling_price', 12, 2);
            $table->integer('stock_qty')->default(0);
            $table->integer('reorder_level')->default(5);
            $table->timestamps();
        });

        // 3. Suppliers
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        // 4. Shift Registers
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->decimal('starting_float', 12, 2)->default(0.00);
            $table->decimal('expected_cash', 12, 2)->default(0.00);
            $table->decimal('actual_cash', 12, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });

        // 5. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable()->unique();
            $table->decimal('credit_limit', 12, 2)->default(50000.00);
            $table->decimal('outstanding_balance', 12, 2)->default(0.00); // ණය ලෙජරය ශේෂය
            $table->timestamps();
        });

        // 6. Sales Transaction Headers
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('shift_id')->constrained('shifts');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default(0.00);
            $table->decimal('net_total', 12, 2);
            $table->decimal('cash_paid', 12, 2);
            $table->decimal('balance_returned', 12, 2);
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'credit', 'split']);
            $table->enum('status', ['completed', 'refunded', 'partially_refunded'])->default('completed');
            $table->timestamps();
        });

        // 7. Sale Items Details
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('qty');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('cost_price_at_sale', 12, 2); // Captured to lock down Profit calculations permanently
            $table->decimal('line_discount', 12, 2)->default(0.00);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
        });

        // 8. Returns and Refunds
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->index();
            $table->foreignId('sale_id')->constrained('sales');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('returned_qty');
            $table->decimal('refund_amount', 12, 2);
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        // 9. Stock Adjustments (for damaged or audited losses)
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('user_id')->constrained('users');
            $table->integer('qty_adjusted');
            $table->enum('reason', ['damaged', 'lost', 'expired', 'audit_correction', 'other']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('returns');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
`;

export const PHP_CONTROLLER_BLUEPRINT = `<?php
// app/Http/Controllers/API/CheckoutController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\\Sale;
use App\Models\\SaleItem;
use App\Models\\Product;
use App\Models\\Shift;
use App\Models\\Customer;
use Exception;

class CheckoutController extends Controller
{
    /**
     * Handles Point of Sale Transaction with database locks, stock checks, and ledger recording.
     * Accessible only with authenticated cashier/admin sessions.
     */
    public function processCheckout(Request $request)
    {
        // 1. Rigorous Data Validation
        $validated = $request->validate([
            'shift_id'       => 'required|integer',
            'customer_id'    => 'nullable|integer',
            'payment_method' => 'required|in:cash,card,bank_transfer,credit,split',
            'cash_paid'      => 'required|numeric|min:0',
            'discount_total' => 'required|numeric|min:0',
            'cart'           => 'required|array|min:1',
            'cart.*.id'       => 'required|integer|exists:products,id',
            'cart.*.qty'      => 'required|integer|min:1',
            'cart.*.discount' => 'required|numeric|min:0',
        ]);

        // 2. High-integrity Database Transaction execution
        try {
            $result = DB::transaction(function () use ($validated, $request) {
                // Confirm selected shift register is active
                $shift = Shift::lockForUpdate()->find($validated['shift_id']);
                if (!$shift || $shift->status !== 'open') {
                    throw new Exception("Shift register is closed or has expired. Please open a new shift first.");
                }

                $subtotal = 0.00;
                $cumulative_savings = $validated['discount_total'];
                $line_items = [];

                // Process and lock each product row sequentially to prevent race conditions (Overselling)
                foreach ($validated['cart'] as $item) {
                    $product = Product::lockForUpdate()->find($item['id']);

                    if ($product->stock_qty < $item['qty']) {
                        throw new Exception("Insufficient stock for product '{$product->name_en}'. Current stock is {$product->stock_qty} unit(s).");
                    }

                    $line_original = $product->selling_price * $item['qty'];
                    $line_item_discount = $item['discount'];
                    $line_calculated = $line_original - $line_item_discount;

                    $subtotal += $line_original;
                    $cumulative_savings += $line_item_discount;

                    $line_items[] = [
                        'product_id'          => $product->id,
                        'qty'                 => $item['qty'],
                        'unit_price'          => $product->selling_price,
                        'cost_price_at_sale'  => $product->cost_price, // Captures profit ledger correctly for Admins
                        'line_discount'       => $line_item_discount,
                        'line_total'          => $line_calculated,
                        'product_instance'    => $product
                    ];
                }

                // Calculate ultimate amounts
                $net_total = $subtotal - $cumulative_savings;
                $balance_returned = 0.00;

                if ($validated['payment_method'] === 'credit') {
                    if (empty($validated['customer_id'])) {
                        throw new Exception("Customer Profile is required for Credit (ණය) transactions.");
                    }
                    // Validate outstanding balance constraints
                    $customer = Customer::lockForUpdate()->find($validated['customer_id']);
                    if (!$customer) {
                        throw new Exception("Invalid customer profile specified.");
                    }
                    if (($customer->outstanding_balance + $net_total) > $customer->credit_limit) {
                        throw new Exception("Credit limit exceeded. Outstanding: rරු. {$customer->outstanding_balance}, Limit: රු. {$customer->credit_limit}");
                    }
                    
                    // Add outstanding balance to ledger
                    $customer->increment('outstanding_balance', $net_total);
                } else {
                    $balance_returned = max(0, $validated['cash_paid'] - $net_total);
                }

                // Generate a unique sequential invoice number
                $lastSale = Sale::orderBy('id', 'desc')->first();
                $lastId = $lastSale ? $lastSale->id : 0;
                $invoice_no = "SSM-" . date('Ymd') . "-" . str_pad($lastId + 1, 4, '0', STR_PAD_LEFT);

                // Create Transaction Header Record
                $sale = Sale::create([
                    'invoice_no'       => $invoice_no,
                    'user_id'          => auth()->id() ?? 3, // Fallback dummy to Cashier Chinthaka if unauthenticated
                    'shift_id'         => $shift->id,
                    'customer_id'      => $validated['customer_id'],
                    'subtotal'         => $subtotal,
                    'discount_total'   => $cumulative_savings,
                    'net_total'        => $net_total,
                    'cash_paid'        => $validated['cash_paid'],
                    'balance_returned' => $balance_returned,
                    'payment_method'   => $validated['payment_method'],
                    'status'           => 'completed'
                ]);

                // Create Line record rows AND commit stock inventory deductions
                foreach ($line_items as $line) {
                    SaleItem::create([
                        'sale_id'            => $sale->id,
                        'product_id'         => $line['product_id'],
                        'qty'                => $line['qty'],
                        'unit_price'         => $line['unit_price'],
                        'cost_price_at_sale' => $line['cost_price_at_sale'],
                        'line_discount'      => $line['line_discount'],
                        'line_total'         => $line['line_total'],
                    ]);

                    // Inventory Reduction execution
                    $line['product_instance']->decrement('stock_qty', $line['qty']);
                }

                // Update Shift ledger values
                if (in_array($validated['payment_method'], ['cash', 'split'])) {
                    $cashAddition = $validated['payment_method'] === 'cash' ? $net_total : $validated['cash_paid'] - $balance_returned;
                    $shift->increment('expected_cash', $cashAddition);
                }

                return [
                    'status' => 'success',
                    'message' => 'Transaction compiled successfully.',
                    'invoice_no' => $invoice_no,
                    'net_total' => $net_total,
                    'balance' => $balance_returned,
                    'savings' => $cumulative_savings,
                    'sale_id' => $sale->id
                ];
            });

            return response()->json($result, 201);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Checkout failed: ' . $e->getMessage()
            ], 422);
        }
    }
}
`;

export const FOLDER_STRUCTURE_REFERENCE = `SS MOTORS POS FOLDER LAYOUT
├── backend-laravel/          # PHP Laravel API Service
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Controller.php
│   │   │   │   └── API/
│   │   │   │       ├── CheckoutController.php     # POS Checkout API Endpoint
│   │   │   │       ├── ShiftController.php        # registers start/end counts
│   │   │   │       ├── AnalyticsController.php    # Gross/Net margins (Admin only)
│   │   │   │       └── InventoryController.php    # stock level tracker
│   │   │   └── Middleware/
│   │   │       └── VerifyRBACRole.php            # guards cost price visibility
│   │   ├── Models/
│   │   │   ├── Product.php                        # hidden cost_price attribute
│   │   │   ├── Sale.php
│   │   │   ├── SaleItem.php
│   │   │   ├── Shift.php
│   │   │   ├── Customer.php                       # Credit Limit properties
│   │   │   └── Supplier.php
│   ├── database/
│   │   ├── migrations/                            # Relational Mysql Migrations
│   │   └── seeders/                               # Bajaj/TVS/Bicycle data seeding
│   ├── routes/
│   │   └── api.php                                # RBAC guarded API endpoints
│   └── tests/
│
├── frontend-react/           # Client-side Interface
│   ├── public/
│   │   └── styles/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pos/
│   │   │   │   ├── BillingTerminal.tsx           # Cart Grid, Search, Shortcuts
│   │   │   │   ├── RegisterShiftDialog.tsx       # start/end float triggers
│   │   │   │   └── ThermalReceiptPrinter.tsx     # 80mm ESC/POS layout matching
│   │   │   ├── admin/
│   │   │   │   ├── MetricsVisualizer.tsx         # charts for Sales vs Net Profit
│   │   │   │   └── InventoryLedger.tsx           # SKU, Reorder alerts
│   │   │   └── ui/
│   │   │       └── rbac-controller.tsx           # developer role selection
│   │   ├── context/
│   │   │   └── ActivePOSContext.tsx              # dynamic online/offline queue state
│   │   ├── hooks/
│   │   │   ├── useLocalStorageSync.ts            # IndexedDB offline engine
│   │   │   └── useKeyboardShortcuts.ts           # captures F-keys
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── index.css                             # custom font theme configuration
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── tsconfig.json
`;
