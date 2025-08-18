import { Customer, Order, User } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Rajesh Kumar',
  email: 'rajesh@clothshop.com',
  role: 'owner'
};

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    email: 'priya.sharma@email.com',
    address: '123 MG Road, Bangalore',
    totalOrders: 5,
    totalSpent: 15000,
    since: '2024-01-15'
  },
  {
    id: '2',
    name: 'Amit Patel',
    phone: '+91 87654 32109',
    email: 'amit.patel@email.com',
    address: '456 FC Road, Pune',
    totalOrders: 3,
    totalSpent: 8500,
    since: '2024-01-15'
  },
  {
    id: '3',
    name: 'Sneha Reddy',
    phone: '+91 76543 21098',
    address: '789 Anna Salai, Chennai',
    totalOrders: 7,
    totalSpent: 22000,
    since: '2024-01-15'
  },
  {
    id: '4',
    name: 'Vikram Singh',
    phone: '+91 65432 10987',
    email: 'vikram.singh@email.com',
    address: '321 CP, New Delhi',
    totalOrders: 2,
    totalSpent: 4500,
    since: '2024-01-15'
  }
];

export const mockOrders: Order[] = [
  {
  id: 'ORD-001',
  customerId: '1',
  customerName: 'Priya Sharma',
  customerPhone: '+91 98765 43210',
  items: [
    { id: '1', name: 'Silk Saree', quantity: 1, price: 8000, color: 'Red' },
    { id: '2', name: 'Cotton Blouse', quantity: 2, price: 1500, size: 'M' }
  ],
  rate: 0,
  totalAmount: 11000,
  grossAmount: 11000,     // <-- ADD THIS
  discount: 0,            // <-- ADD THIS
  discountString: '',     // <-- ADD THIS
  profit: 0,              // <-- ADD THIS
  costPrice: 0,           // <-- ADD THIS
  status: 'confirmed',
  paymentStatus: 'paid',
  orderDate: '2024-03-15',
  deliveryDate: '2024-03-22',
  notes: 'Customer prefers evening delivery'
},
  {
    id: 'ORD-002',
    customerId: '2',
    customerName: 'Amit Patel',
    customerPhone: '+91 87654 32109',
    items: [
      { id: '3', name: 'Formal Shirt', quantity: 3, price: 1200, size: 'L' },
      { id: '4', name: 'Cotton Trousers', quantity: 2, price: 800, size: 'L' }
    ],
    rate: 0,
    totalAmount: 5200,
    grossAmount: 11000,     // <-- ADD THIS
    discount: 0,            // <-- ADD THIS
    discountString: '',     // <-- ADD THIS
    profit: 0,              // <-- ADD THIS
    costPrice: 0,           // <-- ADD THIS
    status: 'processing',
    paymentStatus: 'partial',
    orderDate: '2024-03-14',
    notes: 'Rush order for wedding'
  },
  {
    id: 'ORD-003',
    customerId: '3',
    customerName: 'Sneha Reddy',
    customerPhone: '+91 76543 21098',
    items: [
      { id: '5', name: 'Designer Lehenga', quantity: 1, price: 15000, color: 'Blue' }
    ],
    rate: 0,
    totalAmount: 15000,
    grossAmount: 11000,     // <-- ADD THIS
    discount: 0,            // <-- ADD THIS
    discountString: '',     // <-- ADD THIS
    profit: 0,              // <-- ADD THIS
    costPrice: 0,           // <-- ADD THIS
    status: 'pending',
    paymentStatus: 'pending',
    orderDate: '2024-03-16',
    deliveryDate: '2024-03-25'
  },
  {
    id: 'ORD-004',
    customerId: '4',
    customerName: 'Vikram Singh',
    customerPhone: '+91 65432 10987',
    items: [
      { id: '6', name: 'Kurta Set', quantity: 1, price: 2500, size: 'XL' },
      { id: '7', name: 'Nehru Jacket', quantity: 1, price: 2000, color: 'Black' }
    ],
    rate: 0,
    totalAmount: 4500,
    grossAmount: 11000,     // <-- ADD THIS
    discount: 0,            // <-- ADD THIS
    discountString: '',     // <-- ADD THIS
    profit: 0,              // <-- ADD THIS
    costPrice: 0,           // <-- ADD THIS
    status: 'completed',
    paymentStatus: 'paid',
    orderDate: '2024-03-10',
    deliveryDate: '2024-03-15'
  }
];