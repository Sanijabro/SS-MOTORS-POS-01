export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name_en: string;
  name_si?: string;
  category_id: number;
  brand?: string;
  cost_price?: number; // Optional as it will be strictly omitted for Cashier roles
  selling_price: number;
  stock_qty: number;
  reorder_level: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  credit_limit: number;
  outstanding_balance: number;
}

export interface Shift {
  id: number;
  user_id: number;
  user_name: string;
  opened_at: string;
  closed_at: string | null;
  starting_float: number;
  expected_cash: number;
  actual_cash: number | null;
  status: 'open' | 'closed';
}

export interface CartItem {
  id: number;
  sku: string;
  barcode: string;
  name_en: string;
  name_si?: string;
  selling_price: number;
  qty: number;
  discount: number; // Item-specific flat discount
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Sale {
  id: number;
  invoice_no: string;
  user_id: number;
  user_name: string;
  shift_id: number;
  customer_id: number | null;
  customer_name: string | null;
  subtotal: number;
  discount_total: number;
  surcharge_amount?: number;
  tax_amount?: number;
  net_total: number;
  cash_paid: number;
  balance_returned: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'split';
  status: 'completed' | 'refunded' | 'partially_refunded';
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  qty: number;
  unit_price: number;
  cost_price_at_sale: number;
  line_discount: number;
  line_total: number;
}
