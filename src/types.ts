export type CategoryType = 'smartphones' | 'electronics' | 'accessories' | 'used_devices' | 'recharge_cards';

export interface Product {
  id: string;
  name: string;
  arabicName: string;
  category: CategoryType;
  brand: string;
  price: number;
  originalPrice?: number; // For discount display
  image: string;
  specs: string[]; // List of technical specifications
  description: string;
  isBestSeller?: boolean;
  isSpecialOffer?: boolean;
  isNewArrival?: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  avatar?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  linkText: string;
  colorTheme: string; // e.g., gradient classes
  productId?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'answered';
}

export type EmployeeRole = 'admin' | 'manager' | 'sales' | 'technician';

export type EmployeePermission = 
  | 'manage_products' 
  | 'manage_jobs' 
  | 'manage_bookings' 
  | 'manage_rates' 
  | 'manage_employees' 
  | 'manage_testimonials';

export interface Employee {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: EmployeeRole;
  permissions: EmployeePermission[];
  status: 'active' | 'suspended';
  lastActive?: string;
}

