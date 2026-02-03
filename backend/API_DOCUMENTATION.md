# Farmer Marketplace Platform API Documentation

## Overview

The Farmer Marketplace Platform API provides a comprehensive RESTful interface for connecting farmers directly with buyers. This documentation covers all available endpoints, authentication methods, and data models.

## 🚀 Quick Start

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.farmermarketplace.com/api`

### Interactive Documentation
- **Swagger UI**: `http://localhost:3000/api/docs/ui`
- **JSON Spec**: `http://localhost:3000/api/docs`

### Health Check
- **Endpoint**: `GET http://localhost:3000/api`
- **Response**: API status and version information

## 🔐 Authentication

The API uses JWT (JSON Web Token) based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting Started
1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Use Token**: Include in Authorization header for protected endpoints

## 📚 API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/register` - Register new user (buyer/farmer)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Product Management
- `GET /api/products` - List all products (with search/filter)
- `POST /api/products` - Create new product (farmers only)
- `GET /api/products/{id}` - Get product details
- `PUT /api/products/{id}` - Update product (owner/admin only)
- `DELETE /api/products/{id}` - Delete product (owner/admin only)
- `GET /api/products/farmer/{farmerId}` - Get farmer's products

### Order Management
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/accept` - Accept order (farmer only)
- `PUT /api/orders/{id}/complete` - Complete order (farmer only)
- `PUT /api/orders/{id}/cancel` - Cancel order

### Review System
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Submit review (after completed order)
- `GET /api/reviews/{id}` - Get review details
- `PUT /api/reviews/{id}/approve` - Approve review (admin only)
- `GET /api/reviews/farmer/{farmerId}` - Get farmer reviews

### Messaging
- `GET /api/messages` - List user's messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/{userId}` - Get conversation
- `PUT /api/messages/{id}/read` - Mark message as read

### Content Management
- `GET /api/content/gallery` - Get gallery items
- `POST /api/content/gallery` - Create gallery item (admin only)
- `GET /api/content/mayor` - Get mayor message
- `PUT /api/content/mayor` - Update mayor message (admin only)
- `GET /api/content/news` - Get news items
- `POST /api/content/news` - Create news item (admin only)

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/analytics` - Get platform analytics
- `PUT /api/admin/users/{id}/role` - Update user role
- `GET /api/admin/audit-logs` - Get audit logs

## 🔍 Using the Interactive Documentation

### Swagger UI Features

1. **Browse Endpoints**: All endpoints are organized by category (Authentication, Products, Orders, etc.)

2. **Try It Out**: Click "Try it out" on any endpoint to test it directly from the browser

3. **Authentication**: 
   - Click the "Authorize" button (🔒) at the top
   - Enter your JWT token in the format: `Bearer <token>`
   - All subsequent requests will include the token

4. **Request/Response Examples**: Each endpoint shows:
   - Required parameters and request body format
   - Expected response structure
   - HTTP status codes and their meanings

5. **Data Models**: Scroll down to see all data schemas (User, Product, Order, etc.)

### Testing Workflow

1. **Start with Authentication**:
   ```bash
   POST /api/auth/register
   # Register as BUYER or FARMER
   
   POST /api/auth/login
   # Get your JWT token
   ```

2. **Authorize in Swagger**:
   - Copy the token from login response
   - Click "Authorize" button
   - Paste token with "Bearer " prefix

3. **Test Endpoints**:
   - Try creating products (as farmer)
   - Browse products (as buyer)
   - Create orders and test the workflow

## 📊 Data Models

### Core Entities

#### User
```json
{
  "_id": "string",
  "email": "user@example.com",
  "role": "BUYER|FARMER|ADMIN",
  "profile": {
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

#### Product
```json
{
  "_id": "string",
  "farmerId": "string",
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "category": "Vegetables",
  "price": 4.99,
  "unit": "kg",
  "stock": 50,
  "images": ["url1", "url2"],
  "status": "DRAFT|PUBLISHED|INACTIVE"
}
```

#### Order
```json
{
  "_id": "string",
  "buyerId": "string",
  "farmerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": 3,
      "priceAtTime": 4.99
    }
  ],
  "totalAmount": 14.97,
  "status": "PENDING|ACCEPTED|COMPLETED|CANCELLED",
  "deliveryAddress": "456 Oak St"
}
```

## 🛠 Development Tools

### Postman Collection
You can import the API specification into Postman:
1. Open Postman
2. Click "Import"
3. Use URL: `http://localhost:3000/api/docs`
4. Postman will create a collection with all endpoints

### cURL Examples

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "password123",
    "role": "FARMER",
    "profile": {
      "name": "John Farmer",
      "phone": "+1234567890"
    }
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "password123"
  }'
```

#### Create Product (with token)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes",
    "category": "Vegetables",
    "price": 4.99,
    "unit": "kg",
    "stock": 50,
    "images": ["https://example.com/tomato.jpg"]
  }'
```

## 🔧 Error Handling

### Standard Response Format
```json
{
  "success": boolean,
  "data": object | array,
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## 🚦 Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Authentication endpoints**: 5 requests per minute per IP
- **General endpoints**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin

## 📝 Changelog

### Version 1.0.0
- Initial API release
- Complete CRUD operations for all entities
- JWT authentication system
- Role-based access control
- Comprehensive Swagger documentation
- Input validation and sanitization
- Error handling and logging

## 🤝 Support

For API support and questions:
- **Documentation**: `http://localhost:3000/api/docs/ui`
- **Health Check**: `http://localhost:3000/api`
- **Issues**: Report bugs and feature requests through your development team

---

**Happy coding! 🚀**