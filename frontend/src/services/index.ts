// Export all API services
export { authService } from './authService';
export { productService } from './productService';
export { orderService } from './orderService';
export { messageService } from './messageService';
export { reviewService } from './reviewService';
export { notificationService } from './notificationService';
export { adminService } from './adminService';
export { 
  galleryService, 
  mayorService, 
  newsService, 
  featuredProductsService,
  adminGalleryService,
  adminMayorService,
  adminNewsService
} from './contentService';

// Export translation services
export { default as translationService } from './translationService';
export { default as translationCacheService } from './translationCacheService';

// Export the main API client
export { default as api, apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

// Export service types
export type { ProductFilters, ProductCreateRequest } from './productService';
export type { OrderCreateRequest } from './orderService';
export type { MessageCreateRequest, MessageThread } from './messageService';
export type { ReviewCreateRequest, FarmerRating } from './reviewService';
export type { NotificationCreateRequest } from './notificationService';