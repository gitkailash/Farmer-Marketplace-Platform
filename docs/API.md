# 📚 API Documentation

[![REST API](https://img.shields.io/badge/API-RESTful-orange)](https://restfulapi.net/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-6BA539?logo=openapi-initiative&logoColor=white)](https://swagger.io/specification/)
[![Swagger](https://img.shields.io/badge/Swagger-UI-85EA2D?logo=swagger&logoColor=black)](https://swagger.io/tools/swagger-ui/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![Postman](https://img.shields.io/badge/Postman-Collection-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

Complete API reference for the Farmer Marketplace Platform. This RESTful API connects farmers directly with buyers, providing comprehensive functionality for user management, product listings, orders, reviews, and multilingual content.

## 🚀 Quick Start

### Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.your-domain.com/api`

### Interactive Documentation
- **Swagger UI**: `http://localhost:5000/api/docs/ui`
- **OpenAPI Spec**: `http://localhost:5000/api/docs`
- **Postman Collection**: [Download Collection](./postman/farmer-marketplace.json)

### Health Check
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "uptime": "2d 14h 32m"
}
```

## 🔐 Authentication

The API uses [JWT (JSON Web Token)](https://jwt.io/) based authentication. Include the token in the Authorization header for protected endpoints.

### Authentication Header
```http
Authorization: Bearer <your-jwt-token>
```

### Getting Started
1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Use Token**: Include in Authorization header for protected endpoints

### Token Expiration
- **Default**: 7 days
- **Refresh**: Use `/api/auth/refresh` endpoint
- **Security**: Tokens are signed with HS256 algorithm

## 👥 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `BUYER` | End customers who purchase products | View products, create orders, submit reviews |
| `FARMER` | Product sellers and suppliers | Manage products, fulfill orders, view analytics |
| `ADMIN` | Platform administrators | Full access to all resources and management |

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔑 Authentication Endpoints

### Register User
Create a new user account (buyer or farmer).

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "BUYER",
  "profile": {
    "name": "John Doe",
    "phone": "+977-9841234567",
    "address": {
      "street": "Thamel Street",
      "city": "Kathmandu",
      "state": "Bagmati",
      "zipCode": "44600",
      "country": "Nepal"
    }
  },
  "preferences": {
    "language": "en",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "role": "BUYER",
      "profile": {
        "name": "John Doe",
        "phone": "+977-9841234567"
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### Login User
Authenticate user and receive JWT token.

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "role": "BUYER",
      "profile": {
        "name": "John Doe"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### Get User Profile
Retrieve current user's profile information.

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john.doe@example.com",
    "role": "BUYER",
    "profile": {
      "name": "John Doe",
      "phone": "+977-9841234567",
      "address": {
        "street": "Thamel Street",
        "city": "Kathmandu",
        "state": "Bagmati",
        "zipCode": "44600",
        "country": "Nepal"
      }
    },
    "preferences": {
      "language": "en",
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2024-01-20T08:15:00.000Z"
  }
}
```

### Refresh Token
Refresh JWT token before expiration.

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

## 🛒 Product Management

### List Products
Retrieve products with filtering, searching, and pagination.

```http
GET /api/products?category=Vegetables&search=tomato&page=1&limit=20&sortBy=price&sortOrder=asc
```

**Query Parameters:**
- `category` - Filter by product category
- `search` - Search in product name and description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `farmerId` - Filter by specific farmer
- `inStock` - Filter by stock availability (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field (name, price, createdAt, rating)
- `sortOrder` - Sort direction (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": {
        "en": "Fresh Organic Tomatoes",
        "ne": "ताजा जैविक टमाटर"
      },
      "description": {
        "en": "Locally grown organic tomatoes, pesticide-free",
        "ne": "स्थानीय रूपमा उत्पादित जैविक टमाटर, कीटनाशक रहित"
      },
      "price": 120,
      "unit": "kg",
      "category": {
        "en": "Vegetables",
        "ne": "तरकारी"
      },
      "images": [
        "https://cdn.example.com/products/tomatoes-1.jpg",
        "https://cdn.example.com/products/tomatoes-2.jpg"
      ],
      "stock": 50,
      "farmer": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Ram Bahadur",
        "rating": 4.8,
        "location": "Bhaktapur, Nepal"
      },
      "rating": 4.6,
      "reviewCount": 23,
      "isOrganic": true,
      "harvestDate": "2024-01-18T00:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Product Details
Retrieve detailed information about a specific product.

```http
GET /api/products/{productId}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": {
      "en": "Fresh Organic Tomatoes",
      "ne": "ताजा जैविक टमाटर"
    },
    "description": {
      "en": "Locally grown organic tomatoes, pesticide-free and rich in nutrients",
      "ne": "स्थानीय रूपमा उत्पादित जैविक टमाटर, कीटनाशक रहित र पोषक तत्वले भरपूर"
    },
    "price": 120,
    "unit": "kg",
    "category": {
      "en": "Vegetables",
      "ne": "तरकारी"
    },
    "images": [
      "https://cdn.example.com/products/tomatoes-1.jpg",
      "https://cdn.example.com/products/tomatoes-2.jpg",
      "https://cdn.example.com/products/tomatoes-3.jpg"
    ],
    "stock": 50,
    "farmer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Ram Bahadur",
      "email": "ram.bahadur@example.com",
      "phone": "+977-9841234568",
      "rating": 4.8,
      "reviewCount": 156,
      "location": "Bhaktapur, Nepal",
      "farmSize": "2 hectares",
      "experience": "15 years"
    },
    "rating": 4.6,
    "reviewCount": 23,
    "isOrganic": true,
    "certifications": ["Organic Nepal", "Fair Trade"],
    "harvestDate": "2024-01-18T00:00:00.000Z",
    "expiryDate": "2024-01-25T00:00:00.000Z",
    "nutritionalInfo": {
      "calories": 18,
      "protein": 0.9,
      "carbs": 3.9,
      "fiber": 1.2,
      "vitaminC": 14
    },
    "tags": ["organic", "local", "fresh", "pesticide-free"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-19T14:20:00.000Z"
  }
}
```

### Create Product (Farmer Only)
Create a new product listing.

```http
POST /api/products
Authorization: Bearer <farmer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": {
    "en": "Fresh Organic Carrots",
    "ne": "ताजा जैविक गाजर"
  },
  "description": {
    "en": "Sweet and crunchy organic carrots, perfect for cooking and salads",
    "ne": "मिठो र कुरकुरा जैविक गाजर, खाना पकाउन र सलादका लागि उत्तम"
  },
  "price": 80,
  "unit": "kg",
  "category": {
    "en": "Vegetables",
    "ne": "तरकारी"
  },
  "images": [
    "https://cdn.example.com/products/carrots-1.jpg",
    "https://cdn.example.com/products/carrots-2.jpg"
  ],
  "stock": 100,
  "isOrganic": true,
  "harvestDate": "2024-01-20T00:00:00.000Z",
  "tags": ["organic", "local", "fresh"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "name": {
      "en": "Fresh Organic Carrots",
      "ne": "ताजा जैविक गाजर"
    },
    "price": 80,
    "unit": "kg",
    "stock": 100,
    "farmer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Ram Bahadur"
    },
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### Update Product (Farmer/Admin Only)
Update an existing product.

```http
PUT /api/products/{productId}
Authorization: Bearer <farmer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "price": 85,
  "stock": 75,
  "description": {
    "en": "Sweet and crunchy organic carrots, freshly harvested this morning",
    "ne": "मिठो र कुरकुरा जैविक गाजर, आज बिहान ताजा काटिएको"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "name": {
      "en": "Fresh Organic Carrots",
      "ne": "ताजा जैविक गाजर"
    },
    "price": 85,
    "stock": 75,
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

### Delete Product (Farmer/Admin Only)
Delete a product listing.

```http
DELETE /api/products/{productId}
Authorization: Bearer <farmer-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## 📦 Order Management

### Create Order
Create a new order with multiple products.

```http
POST /api/orders
Authorization: Bearer <buyer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "quantity": 2,
      "priceAtTime": 120
    },
    {
      "productId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "quantity": 1,
      "priceAtTime": 85
    }
  ],
  "deliveryAddress": {
    "street": "Thamel Street, House No. 123",
    "city": "Kathmandu",
    "state": "Bagmati",
    "zipCode": "44600",
    "country": "Nepal"
  },
  "deliveryDate": "2024-01-22T10:00:00.000Z",
  "notes": "Please deliver in the morning"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "orderNumber": "ORD-2024-001234",
    "status": "PENDING",
    "items": [
      {
        "product": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": {
            "en": "Fresh Organic Tomatoes",
            "ne": "ताजा जैविक टमाटर"
          }
        },
        "quantity": 2,
        "priceAtTime": 120,
        "subtotal": 240
      },
      {
        "product": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d3",
          "name": {
            "en": "Fresh Organic Carrots",
            "ne": "ताजा जैविक गाजर"
          }
        },
        "quantity": 1,
        "priceAtTime": 85,
        "subtotal": 85
      }
    ],
    "totalAmount": 325,
    "deliveryFee": 50,
    "grandTotal": 375,
    "buyer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe"
    },
    "deliveryAddress": {
      "street": "Thamel Street, House No. 123",
      "city": "Kathmandu",
      "state": "Bagmati",
      "zipCode": "44600",
      "country": "Nepal"
    },
    "deliveryDate": "2024-01-22T10:00:00.000Z",
    "createdAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### List Orders
Retrieve user's orders with filtering and pagination.

```http
GET /api/orders?status=PENDING&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by order status (PENDING, ACCEPTED, COMPLETED, CANCELLED)
- `farmerId` - Filter by specific farmer (for buyers)
- `buyerId` - Filter by specific buyer (for farmers/admins)
- `dateFrom` - Filter orders from date (ISO format)
- `dateTo` - Filter orders to date (ISO format)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (createdAt, totalAmount, status)
- `sortOrder` - Sort direction (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "orderNumber": "ORD-2024-001234",
      "status": "PENDING",
      "totalAmount": 325,
      "deliveryFee": 50,
      "grandTotal": 375,
      "itemCount": 2,
      "buyer": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe"
      },
      "farmer": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Ram Bahadur"
      },
      "deliveryDate": "2024-01-22T10:00:00.000Z",
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Order Details
Retrieve detailed information about a specific order.

```http
GET /api/orders/{orderId}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "orderNumber": "ORD-2024-001234",
    "status": "ACCEPTED",
    "items": [
      {
        "product": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": {
            "en": "Fresh Organic Tomatoes",
            "ne": "ताजा जैविक टमाटर"
          },
          "images": ["https://cdn.example.com/products/tomatoes-1.jpg"]
        },
        "quantity": 2,
        "priceAtTime": 120,
        "subtotal": 240
      }
    ],
    "totalAmount": 325,
    "deliveryFee": 50,
    "grandTotal": 375,
    "buyer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "phone": "+977-9841234567"
    },
    "farmer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Ram Bahadur",
      "phone": "+977-9841234568"
    },
    "deliveryAddress": {
      "street": "Thamel Street, House No. 123",
      "city": "Kathmandu",
      "state": "Bagmati",
      "zipCode": "44600",
      "country": "Nepal"
    },
    "deliveryDate": "2024-01-22T10:00:00.000Z",
    "notes": "Please deliver in the morning",
    "statusHistory": [
      {
        "status": "PENDING",
        "timestamp": "2024-01-20T10:30:00.000Z",
        "note": "Order placed"
      },
      {
        "status": "ACCEPTED",
        "timestamp": "2024-01-20T14:15:00.000Z",
        "note": "Order accepted by farmer"
      }
    ],
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:15:00.000Z"
  }
}
```

### Update Order Status (Farmer Only)
Update order status (accept, complete, cancel).

```http
PUT /api/orders/{orderId}/status
Authorization: Bearer <farmer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "ACCEPTED",
  "note": "Order confirmed. Will be ready for delivery on scheduled date."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "status": "ACCEPTED",
    "updatedAt": "2024-01-20T14:15:00.000Z"
  }
}
```

## ⭐ Review System

### Submit Review
Submit a review for a completed order.

```http
POST /api/reviews
Authorization: Bearer <buyer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "64f8a1b2c3d4e5f6a7b8c9d4",
  "farmerId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "rating": 5,
  "comment": {
    "en": "Excellent quality tomatoes! Fresh and delicious. Will order again.",
    "ne": "उत्कृष्ट गुणस्तरको टमाटर! ताजा र स्वादिष्ट। फेरि अर्डर गर्नेछु।"
  },
  "productQuality": 5,
  "deliveryService": 4,
  "communication": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "rating": 5,
    "comment": {
      "en": "Excellent quality tomatoes! Fresh and delicious. Will order again.",
      "ne": "उत्कृष्ट गुणस्तरको टमाटर! ताजा र स्वादिष्ट। फेरि अर्डर गर्नेछु।"
    },
    "productQuality": 5,
    "deliveryService": 4,
    "communication": 5,
    "buyer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe"
    },
    "farmer": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Ram Bahadur"
    },
    "order": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "orderNumber": "ORD-2024-001234"
    },
    "status": "PENDING_APPROVAL",
    "createdAt": "2024-01-23T10:30:00.000Z"
  }
}
```

### List Reviews
Retrieve reviews with filtering and pagination.

```http
GET /api/reviews?farmerId=64f8a1b2c3d4e5f6a7b8c9d2&status=APPROVED&page=1&limit=10
```

**Query Parameters:**
- `farmerId` - Filter by specific farmer
- `buyerId` - Filter by specific buyer
- `orderId` - Filter by specific order
- `status` - Filter by review status (PENDING_APPROVAL, APPROVED, REJECTED)
- `minRating` - Minimum rating filter (1-5)
- `maxRating` - Maximum rating filter (1-5)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (rating, createdAt)
- `sortOrder` - Sort direction (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "rating": 5,
      "comment": {
        "en": "Excellent quality tomatoes! Fresh and delicious.",
        "ne": "उत्कृष्ट गुणस्तरको टमाटर! ताजा र स्वादिष्ट।"
      },
      "productQuality": 5,
      "deliveryService": 4,
      "communication": 5,
      "buyer": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "avatar": "https://cdn.example.com/avatars/john-doe.jpg"
      },
      "farmer": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Ram Bahadur"
      },
      "status": "APPROVED",
      "createdAt": "2024-01-23T10:30:00.000Z",
      "approvedAt": "2024-01-23T15:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Update Review (Before Approval)
Update a review that hasn't been approved yet.

```http
PUT /api/reviews/{reviewId}
Authorization: Bearer <buyer-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": {
    "en": "Good quality tomatoes, but delivery was slightly delayed.",
    "ne": "राम्रो गुणस्तरको टमाटर, तर डेलिभरी अलि ढिलो भयो।"
  },
  "deliveryService": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "rating": 4,
    "comment": {
      "en": "Good quality tomatoes, but delivery was slightly delayed.",
      "ne": "राम्रो गुणस्तरको टमाटर, तर डेलिभरी अलि ढिलो भयो।"
    },
    "deliveryService": 3,
    "updatedAt": "2024-01-23T16:45:00.000Z"
  }
}
```

## 💬 Messaging System

### Send Message
Send a message to another user.

```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipientId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "subject": "Question about tomatoes",
  "content": "Hi, I'm interested in your organic tomatoes. Are they available for delivery this week?",
  "orderId": "64f8a1b2c3d4e5f6a7b8c9d4"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d6",
    "subject": "Question about tomatoes",
    "content": "Hi, I'm interested in your organic tomatoes. Are they available for delivery this week?",
    "sender": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe"
    },
    "recipient": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Ram Bahadur"
    },
    "isRead": false,
    "createdAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### List Messages
Retrieve user's messages with filtering.

```http
GET /api/messages?type=received&isRead=false&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` - Message type (sent, received, all)
- `isRead` - Filter by read status (true, false)
- `conversationWith` - Filter messages with specific user
- `orderId` - Filter messages related to specific order
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "subject": "Question about tomatoes",
      "content": "Hi, I'm interested in your organic tomatoes...",
      "sender": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "avatar": "https://cdn.example.com/avatars/john-doe.jpg"
      },
      "recipient": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Ram Bahadur"
      },
      "isRead": false,
      "order": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "orderNumber": "ORD-2024-001234"
      },
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Mark Message as Read
Mark a message as read.

```http
PUT /api/messages/{messageId}/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d6",
    "isRead": true,
    "readAt": "2024-01-20T14:30:00.000Z"
  }
}
```

## 🌐 Content Management

### Get Gallery Items
Retrieve gallery items for homepage display.

```http
GET /api/content/gallery?category=farming&isActive=true&limit=10
```

**Query Parameters:**
- `category` - Filter by gallery category
- `isActive` - Filter by active status (true, false)
- `language` - Language preference (en, ne)
- `limit` - Number of items to return (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "title": {
        "en": "Organic Farming in Bhaktapur",
        "ne": "भक्तपुरमा जैविक खेती"
      },
      "description": {
        "en": "Local farmers practicing sustainable organic farming methods",
        "ne": "स्थानीय किसानहरूले दिगो जैविक खेती विधिहरू अभ्यास गर्दै"
      },
      "imageUrl": "https://cdn.example.com/gallery/organic-farming-bhaktapur.jpg",
      "category": {
        "en": "Farming",
        "ne": "खेती"
      },
      "order": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Mayor Message
Retrieve active mayor message for homepage display.

```http
GET /api/content/mayor?language=en
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d8",
    "text": {
      "en": "Welcome to our Farmer Marketplace! Supporting local farmers and providing fresh produce to our community.",
      "ne": "हाम्रो किसान बजारमा स्वागत छ! स्थानीय किसानहरूलाई सहयोग गर्दै र हाम्रो समुदायलाई ताजा उत्पादन प्रदान गर्दै।"
    },
    "imageUrl": "https://cdn.example.com/mayor/mayor-photo.jpg",
    "scrollSpeed": 50,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get News Items
Retrieve news items with multilingual support.

```http
GET /api/content/news?language=en&priority=HIGH&limit=5
```

**Query Parameters:**
- `language` - Language preference (en, ne)
- `priority` - Filter by priority (LOW, NORMAL, HIGH)
- `isActive` - Filter by active status (true, false)
- `limit` - Number of items to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d9",
      "headline": {
        "en": "New Agricultural Technology Center Opens in Kathmandu",
        "ne": "काठमाडौंमा नयाँ कृषि प्रविधि केन्द्र खोलियो"
      },
      "summary": {
        "en": "Modern agricultural technology center launched to support farmers with advanced farming methods.",
        "ne": "उन्नत कृषि विधिहरूद्वारा किसानहरूलाई सहयोग गर्न आधुनिक कृषि प्रविधि केन्द्र सुरु गरियो।"
      },
      "link": "https://www.moald.gov.np/",
      "priority": "HIGH",
      "publishedAt": "2024-01-20T08:00:00.000Z",
      "createdAt": "2024-01-20T07:30:00.000Z"
    }
  ]
}
```

## 🔧 Admin Endpoints

### Get Platform Analytics
Retrieve platform statistics and analytics (Admin only).

```http
GET /api/admin/analytics?period=30d
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `period` - Time period (7d, 30d, 90d, 1y)
- `startDate` - Custom start date (ISO format)
- `endDate` - Custom end date (ISO format)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalFarmers": 320,
      "totalBuyers": 890,
      "totalAdmins": 5,
      "totalProducts": 2150,
      "totalOrders": 5680,
      "totalRevenue": 2850000,
      "averageOrderValue": 502
    },
    "growth": {
      "newUsers": 45,
      "newOrders": 123,
      "revenueGrowth": 12.5,
      "userGrowth": 8.2
    },
    "topProducts": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Fresh Organic Tomatoes",
        "orderCount": 156,
        "revenue": 187200
      }
    ],
    "topFarmers": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Ram Bahadur",
        "orderCount": 89,
        "revenue": 125600,
        "rating": 4.8
      }
    ],
    "ordersByStatus": {
      "PENDING": 23,
      "ACCEPTED": 45,
      "COMPLETED": 1890,
      "CANCELLED": 12
    },
    "revenueByMonth": [
      {
        "month": "2024-01",
        "revenue": 285000,
        "orders": 568
      }
    ]
  }
}
```

### Manage Users
List and manage platform users (Admin only).

```http
GET /api/admin/users?role=FARMER&isActive=true&page=1&limit=20
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `role` - Filter by user role (BUYER, FARMER, ADMIN)
- `isActive` - Filter by active status (true, false)
- `search` - Search in name and email
- `registeredFrom` - Filter users registered from date
- `registeredTo` - Filter users registered to date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "email": "ram.bahadur@example.com",
      "role": "FARMER",
      "profile": {
        "name": "Ram Bahadur",
        "phone": "+977-9841234568"
      },
      "isActive": true,
      "stats": {
        "totalProducts": 15,
        "totalOrders": 89,
        "totalRevenue": 125600,
        "rating": 4.8
      },
      "createdAt": "2024-01-10T10:30:00.000Z",
      "lastLogin": "2024-01-20T08:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 320,
    "pages": 16,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🌍 Translation Management

### Get Translations
Retrieve translations for a specific namespace and language.

```http
GET /api/translations?namespace=common&language=en
```

**Query Parameters:**
- `namespace` - Translation namespace (common, auth, products, etc.)
- `language` - Language code (en, ne)
- `key` - Specific translation key
- `search` - Search in translation keys and values

**Response (200):**
```json
{
  "success": true,
  "data": {
    "namespace": "common",
    "language": "en",
    "translations": {
      "buttons.save": "Save",
      "buttons.cancel": "Cancel",
      "buttons.delete": "Delete",
      "messages.success": "Operation completed successfully",
      "messages.error": "An error occurred",
      "navigation.home": "Home",
      "navigation.products": "Products",
      "navigation.orders": "Orders"
    },
    "lastUpdated": "2024-01-20T10:30:00.000Z"
  }
}
```

### Update Translation (Admin Only)
Update or create translation entries.

```http
PUT /api/translations
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "namespace": "common",
  "language": "ne",
  "translations": {
    "buttons.save": "सेभ गर्नुहोस्",
    "buttons.cancel": "रद्द गर्नुहोस्",
    "buttons.delete": "मेटाउनुहोस्"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Translations updated successfully",
  "data": {
    "namespace": "common",
    "language": "ne",
    "updatedKeys": 3,
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

## 📊 Rate Limiting

The API implements rate limiting to ensure fair usage and prevent abuse.

### Rate Limits
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Registration**: 3 registrations per hour per IP
- **Password Reset**: 3 attempts per hour per email

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Too many requests",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## 🔍 Error Handling

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Missing or invalid token
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

### Validation Error Example
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

## 📱 SDKs and Tools

### Official SDKs
- **JavaScript/Node.js**: [farmer-marketplace-js-sdk](https://github.com/your-org/farmer-marketplace-js-sdk)
- **Python**: [farmer-marketplace-python-sdk](https://github.com/your-org/farmer-marketplace-python-sdk)

### Development Tools
- **Postman Collection**: [Download Collection](./postman/farmer-marketplace.json)
- **OpenAPI Spec**: [Download Spec](http://localhost:5000/api/docs)
- **Insomnia Collection**: [Download Collection](./insomnia/farmer-marketplace.json)

### Code Examples

**JavaScript/Node.js:**
```javascript
const FarmerMarketplace = require('farmer-marketplace-sdk');

const client = new FarmerMarketplace({
  baseURL: 'https://api.your-domain.com',
  apiKey: 'your-api-key'
});

// Get products
const products = await client.products.list({
  category: 'Vegetables',
  limit: 10
});

// Create order
const order = await client.orders.create({
  items: [
    { productId: '64f8a1b2c3d4e5f6a7b8c9d1', quantity: 2 }
  ],
  deliveryAddress: {
    street: 'Thamel Street',
    city: 'Kathmandu'
  }
});
```

**Python:**
```python
from farmer_marketplace import FarmerMarketplace

client = FarmerMarketplace(
    base_url='https://api.your-domain.com',
    api_key='your-api-key'
)

# Get products
products = client.products.list(
    category='Vegetables',
    limit=10
)

# Create order
order = client.orders.create({
    'items': [
        {'productId': '64f8a1b2c3d4e5f6a7b8c9d1', 'quantity': 2}
    ],
    'deliveryAddress': {
        'street': 'Thamel Street',
        'city': 'Kathmandu'
    }
})
```

## 🆘 Support

### Getting Help
- **Documentation**: [https://docs.your-domain.com](https://docs.your-domain.com)
- **API Status**: [https://status.your-domain.com](https://status.your-domain.com)
- **Support Email**: api-support@your-domain.com
- **Developer Forum**: [https://forum.your-domain.com](https://forum.your-domain.com)

### Reporting Issues
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/farmer-marketplace/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-org/farmer-marketplace/discussions)
- **Security Issues**: security@your-domain.com

### API Changelog
- **v1.2.0** (2024-01-20): Added multilingual support for all content
- **v1.1.0** (2024-01-15): Enhanced review system with detailed ratings
- **v1.0.0** (2024-01-01): Initial API release

---

**Built with ❤️ for farmers and buyers in Nepal**

For more information, visit our [main documentation](../README.md) or explore the [interactive API documentation](http://localhost:5000/api/docs/ui).