import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Order, ApiResponse, PaginatedResponse } from '../types/api';

export interface OrderCreateRequest {
  farmerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryAddress: string;
  notes?: string;
}

export const orderService = {
  // Create new order
  createOrder: async (orderData: OrderCreateRequest): Promise<ApiResponse<Order>> => {
    return apiPost<Order>('/orders', orderData);
  },

  // Get user's orders (buyer or farmer)
  getMyOrders: async (): Promise<ApiResponse<Order[]>> => {
    return apiGet<Order[]>('/orders');
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiGet<Order>(`/orders/${id}`);
  },

  // Accept order (farmer only)
  acceptOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiPut<Order>(`/orders/${id}/status`, { status: 'ACCEPTED' });
  },

  // Complete order (farmer only)
  completeOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiPut<Order>(`/orders/${id}/status`, { status: 'COMPLETED' });
  },

  // Cancel order
  cancelOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiDelete<Order>(`/orders/${id}`);
  },

  // Update order status
  updateOrderStatus: async (id: string, status: Order['status']): Promise<ApiResponse<Order>> => {
    return apiPut<Order>(`/orders/${id}/status`, { status });
  },

  // Get orders by status
  getOrdersByStatus: async (status: Order['status']): Promise<ApiResponse<Order[]>> => {
    return apiGet<Order[]>(`/orders?status=${status}`);
  },

  // Get order history with pagination
  getOrderHistory: async (page = 1, limit = 20): Promise<PaginatedResponse<Order>> => {
    return apiGet<Order[]>(`/orders/history?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Order>>;
  },
};