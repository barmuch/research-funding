# Expense API Documentation

## Overview
API endpoints untuk mengelola pengeluaran aktual (actual expenses) dalam workspace. Semua endpoint memerlukan autentikasi JWT dan akses ke workspace yang bersangkutan.

## Endpoints

### 1. GET /api/expenses
Mengambil daftar pengeluaran dari workspace tertentu dengan pagination dan filter.

**Query Parameters:**
- `workspaceId` (required): ID workspace
- `planType` (optional): Filter berdasarkan jenis plan
- `startDate` (optional): Filter tanggal mulai (ISO 8601)
- `endDate` (optional): Filter tanggal akhir (ISO 8601)
- `limit` (optional): Jumlah data per halaman (default: 50, max: 100)
- `offset` (optional): Offset untuk pagination (default: 0)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": {
    "expenses": [
      {
        "id": "507f1f77bcf86cd799439011",
        "workspaceId": "507f1f77bcf86cd799439012",
        "planType": "research-materials",
        "amount": 150000,
        "note": "Pembelian buku referensi",
        "date": "2025-08-01T10:00:00.000Z",
        "createdBy": {
          "id": "507f1f77bcf86cd799439013",
          "email": "user@example.com",
          "name": "John Doe"
        },
        "createdAt": "2025-08-01T10:00:00.000Z",
        "updatedAt": "2025-08-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "summary": {
      "totalExpenses": 25,
      "totalAmount": 5000000,
      "byPlanType": [
        {
          "planType": "research-materials",
          "total": 2000000,
          "count": 10
        },
        {
          "planType": "transportation",
          "total": 1500000,
          "count": 8
        },
        {
          "planType": "other",
          "total": 1500000,
          "count": 7
        }
      ]
    }
  }
}
```

### 2. POST /api/expenses
Menambahkan pengeluaran baru ke workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "workspaceId": "507f1f77bcf86cd799439012",
  "planType": "research-materials", // optional, default: "other"
  "amount": 150000,
  "note": "Pembelian buku referensi", // optional
  "date": "2025-08-01T10:00:00.000Z" // optional, default: current time
}
```

**Validation Rules:**
- `workspaceId`: Required, valid ObjectId format
- `planType`: Optional, must exist in workspace plans or be "other"
- `amount`: Required, must be positive number > 0
- `note`: Optional, max 500 characters
- `date`: Optional, valid ISO 8601 date

**Response:**
```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "expense": {
      "id": "507f1f77bcf86cd799439011",
      "workspaceId": "507f1f77bcf86cd799439012",
      "planType": "research-materials",
      "amount": 150000,
      "note": "Pembelian buku referensi",
      "date": "2025-08-01T10:00:00.000Z",
      "createdBy": {
        "id": "507f1f77bcf86cd799439013",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-01T10:00:00.000Z"
    }
  }
}
```

### 3. GET /api/expenses/[id]
Mengambil detail pengeluaran berdasarkan ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Expense retrieved successfully",
  "data": {
    "expense": {
      "id": "507f1f77bcf86cd799439011",
      "workspaceId": "507f1f77bcf86cd799439012",
      "planType": "research-materials",
      "amount": 150000,
      "note": "Pembelian buku referensi",
      "date": "2025-08-01T10:00:00.000Z",
      "createdBy": {
        "id": "507f1f77bcf86cd799439013",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-01T10:00:00.000Z"
    }
  }
}
```

### 4. PUT /api/expenses/[id]
Mengupdate pengeluaran berdasarkan ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planType": "transportation", // optional
  "amount": 200000, // optional
  "note": "Tiket pesawat Jakarta-Bali", // optional
  "date": "2025-08-02T08:00:00.000Z" // optional
}
```

**Validation Rules:**
- Semua field optional
- `planType`: Must exist in workspace plans or be "other"
- `amount`: Must be positive number > 0
- `note`: Max 500 characters
- `date`: Valid ISO 8601 date

**Response:**
```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": {
    "expense": {
      "id": "507f1f77bcf86cd799439011",
      "workspaceId": "507f1f77bcf86cd799439012",
      "planType": "transportation",
      "amount": 200000,
      "note": "Tiket pesawat Jakarta-Bali",
      "date": "2025-08-02T08:00:00.000Z",
      "createdBy": {
        "id": "507f1f77bcf86cd799439013",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-02T09:00:00.000Z"
    }
  }
}
```

### 5. DELETE /api/expenses/[id]
Menghapus pengeluaran berdasarkan ID.

**Authorization Rules:**
- Hanya creator pengeluaran atau owner workspace yang bisa menghapus

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {
    "deletedExpense": {
      "id": "507f1f77bcf86cd799439011",
      "planType": "transportation",
      "amount": 200000,
      "date": "2025-08-02T08:00:00.000Z"
    }
  }
}
```

### 6. GET /api/workspaces/[workspaceId]/plan-types
Mengambil daftar plan types yang tersedia di workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Plan types retrieved successfully",
  "data": {
    "planTypes": [
      "accommodation",
      "other",
      "research-materials",
      "transportation"
    ],
    "totalPlans": 3
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "amount": ["Amount must be greater than 0"],
    "planType": ["Plan type does not exist in this workspace"]
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "You do not have access to this workspace"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Expense not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create expense"
}
```

## Example Usage

### Create an Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "workspaceId": "507f1f77bcf86cd799439012",
    "planType": "research-materials",
    "amount": 150000,
    "note": "Pembelian buku referensi",
    "date": "2025-08-01T10:00:00.000Z"
  }'
```

### Get Expenses with Filters
```bash
curl "http://localhost:3000/api/expenses?workspaceId=507f1f77bcf86cd799439012&planType=research-materials&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update an Expense
```bash
curl -X PUT http://localhost:3000/api/expenses/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 200000,
    "note": "Update: Buku tambahan untuk referensi"
  }'
```

### Delete an Expense
```bash
curl -X DELETE http://localhost:3000/api/expenses/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
