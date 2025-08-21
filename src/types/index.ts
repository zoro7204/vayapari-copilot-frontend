export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  since: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  customerId?: string; // Made optional
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  rate: number;
  totalAmount: number;
  grossAmount: number;
  discount: number;
  discountString: string;      // <-- ADDED
  profit: number;       // <-- ADDED
  costPrice: number;    // <-- ADDED
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'partial' | 'paid'; // Made optional
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface IntegrationSettings {
  whatsapp: {
    enabled: boolean;
    businessNumber: string;
    apiKey: string;
  };
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
}

export interface SummaryData {
  totalSales: number;
  totalOrders: number;
  customers: number;
  growthRate: number;
}

export interface NewOrderPayload {
  item: string;
  qty: number;
  rate: number;
  discount: string;
  customerName: string;
  customerPhone: string;
}

// Add this interface to your types/index.ts file if it's not already there
export interface Expense {
  id: string; // This is the unique timestamp
  expenseId?: string; // This will be the human-readable ID like EXP-001
  item: string;
  category: string;
  amount: number;
  date: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
  lastSoldDate?: string;
  createdAt?: string; 
  unitsSold?: number; 
  generatedRevenue?: number; 
}