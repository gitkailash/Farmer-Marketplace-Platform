// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'BUYER' | 'FARMER';
  profile: {
    name: string;
    phone?: string;
    address?: string;
  };
  language?: 'en' | 'ne';
  localePreferences?: Partial<ILocalePreferences>;
  location?: {
    district: string;
    municipality: string;
    coordinates?: [number, number];
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

// Locale Preferences Types
export interface ILocalePreferences {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
  timeFormat: '12h' | '24h';
  numberFormat: '1,234.56' | '1.234,56' | '1 234,56' | '1234.56';
  currency: 'NPR' | 'USD' | 'EUR';
}

// User Types
export interface User {
  _id: string;
  email: string;
  role: 'VISITOR' | 'BUYER' | 'FARMER' | 'ADMIN';
  profile: {
    name: string;
    phone?: string;
    address?: string;
  };
  language: 'en' | 'ne';
  localePreferences: ILocalePreferences;
  lastLanguageUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Farmer {
  _id: string;
  userId: string;
  location: {
    district: string;
    municipality: string;
    coordinates?: [number, number];
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Multilingual field interface
export interface MultilingualField {
  en: string;
  ne?: string;
  _lastUpdated?: {
    en: Date | string;
    ne?: Date | string;
  };
}

// Product Types
export interface Product {
  _id: string;
  farmerId: string;
  name: MultilingualField;
  description: MultilingualField;
  category: {
    en: string;
    ne?: string;
  };
  price: number;
  unit: string;
  stock: number;
  images: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  farmer?: {
    _id: string;
    userId: {
      profile: {
        name: string;
        phone?: string;
        address?: string;
      };
    };
    rating: number;
    reviewCount: number;
    location: {
      district: string;
      municipality: string;
    };
  };
}

// Order Types
export interface Order {
  _id: string;
  buyerId: string;
  farmerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    _id: string;
    profile: {
      name: string;
      phone?: string;
      address?: string;
    };
  };
  farmer?: {
    _id: string;
    profile: {
      name: string;
    };
    location: {
      district: string;
      municipality: string;
    };
  };
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtTime: number;
  product?: {
    _id: string;
    name: string;
    unit: string;
    images: string[];
  };
}

// Message Types
export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  language: 'en' | 'ne'; // Language the message was written in
  isRead: boolean;
  moderationFlag?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  sender?: {
    _id: string;
    profile: {
      name: string;
    };
    role: 'BUYER' | 'FARMER';
  };
  receiver?: {
    _id: string;
    profile: {
      name: string;
    };
    role: 'BUYER' | 'FARMER';
  };
}

// Review Types
export interface Review {
  _id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: 'BUYER' | 'FARMER';
  rating: number;
  comment: string;
  isApproved: boolean;
  moderatedBy?: string;
  createdAt: string;
  reviewer?: {
    _id: string;
    profile: {
      name: string;
    };
  };
  reviewee?: {
    _id: string;
    profile: {
      name: string;
    };
  };
  order?: {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
  };
}

// Content Management Types
export interface GalleryItem {
  _id: string;
  title: MultilingualField;
  description?: MultilingualField;
  imageUrl: string;
  category: {
    en: string;
    ne?: string;
  };
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MayorMessage {
  _id: string;
  text: string;
  imageUrl?: string;
  scrollSpeed: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  _id: string;
  headline: MultilingualField | string; // Support both old and new format
  content?: MultilingualField | string;
  link?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  language: string;
  isActive: boolean;
  publishedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  type: 'ORDER_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_APPROVED' | 'ADMIN_ANNOUNCEMENT';
  title: string;
  message: string;
  language?: 'en' | 'ne'; // Language the notification was generated in
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Analytics Types
export interface AnalyticsData {
  overview: {
    users: {
      total: number;
      farmers: number;
      buyers: number;
      recent: number;
    };
    products: {
      total: number;
      published: number;
      recent: number;
    };
    orders: {
      total: number;
      completed: number;
      recent: number;
    };
    reviews: {
      total: number;
      approved: number;
      recent: number;
    };
    messages: {
      total: number;
    };
    revenue: {
      total: number;
      average: number;
    };
  };
  topFarmers: Array<{
    _id: string;
    userId: {
      _id: string;
      profile: { name: string };
      email: string;
    };
    location: {
      district: string;
      municipality: string;
    };
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  }>;
  timeSeriesData?: Array<{
    _id: string;
    orders: number;
    revenue: number;
  }>;
  generatedAt: string;
}

// Utility Types
export type UserRole = 'VISITOR' | 'BUYER' | 'FARMER' | 'ADMIN';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
export type ReviewerType = 'BUYER' | 'FARMER';
export type ModerationFlag = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'ORDER_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_APPROVED' | 'ADMIN_ANNOUNCEMENT';
export type NewsPriority = 'LOW' | 'NORMAL' | 'HIGH';