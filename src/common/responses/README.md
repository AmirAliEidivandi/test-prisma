# 🚀 Response Management System

## 📋 Overview

Our response management system provides:

- **Consistent API responses** across all endpoints
- **Multi-language support** with automatic i18n
- **Domain-specific response builders** for better organization
- **Standardized success messages** with proper HTTP status codes
- **Pagination support** for list endpoints

## 🎯 Core Concepts

### 1. Response Structure

All API responses follow this consistent format:

```json
{
  "success": true,
  "message": "محصول با موفقیت ایجاد شد",
  "data": {
    /* actual response data */
  },
  "meta": {
    /* optional metadata */
  },
  "timestamp": "2025-01-20T10:30:00.000Z",
  "statusCode": 201
}
```

### 2. Response Types

#### Basic Response

```typescript
interface IBaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  timestamp: string;
  statusCode: number;
}
```

#### Paginated Response

```typescript
interface IPaginatedResponse<T> extends IBaseResponse<T[]> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

## 🛠️ Usage Examples

### Creating Domain Response Class

```typescript
// src/common/responses/domains/order.response.ts
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ResponseBuilder } from '../base/response-builder.abstract';

@Injectable()
export class OrderResponse extends ResponseBuilder {
  readonly domain = 'order';

  constructor(i18n: I18nService) {
    super(i18n);
  }

  created<T>(order: T): IBaseResponse<T> {
    return this.createSuccessResponse('CREATED', {
      data: order,
      statusCode: HttpStatus.CREATED,
    });
  }

  cancelled(): IBaseResponse<null> {
    return this.createSuccessResponse('CANCELLED', {
      data: null,
      statusCode: HttpStatus.OK,
    });
  }
}
```

### Using in Service

```typescript
// src/v1/orders/orders.service.ts
@Injectable()
export class OrdersService {
  private orderResponse: OrderResponse;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.orderResponse = new OrderResponse(this.i18n);
  }

  async create(createOrderDto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: createOrderDto,
    });

    return this.orderResponse.created(order);
  }

  async cancel(id: string) {
    await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return this.orderResponse.cancelled();
  }
}
```

### Controller Integration

```typescript
// src/v1/orders/orders.controller.ts
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto); // Returns formatted response
  }

  @Delete(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id); // Returns formatted response
  }
}
```

## 🌍 Multi-language Messages

### Adding Success Messages

Add messages to both language files:

```json
// src/i18n/en/success.json
{
  "order": {
    "CREATED": "Order created successfully",
    "CANCELLED": "Order cancelled successfully",
    "UPDATED": "Order updated successfully"
  }
}

// src/i18n/fa/success.json
{
  "order": {
    "CREATED": "سفارش با موفقیت ایجاد شد",
    "CANCELLED": "سفارش با موفقیت لغو شد",
    "UPDATED": "سفارش با موفقیت بروزرسانی شد"
  }
}
```

## 📊 Response Examples

### Single Resource Response

#### Request:

```bash
GET /api/v1/products/123
x-custom-lang: fa
```

#### Response:

```json
{
  "success": true,
  "message": "محصول با موفقیت دریافت شد",
  "data": {
    "id": "123",
    "name": "محصول نمونه",
    "price": 15000,
    "status": "ACTIVE"
  },
  "timestamp": "2025-01-20T10:30:00.000Z",
  "statusCode": 200
}
```

### Paginated List Response

#### Request:

```bash
GET /api/v1/products?page=0&limit=10
x-custom-lang: en
```

#### Response:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "123",
      "name": "Sample Product",
      "price": 15000
    }
  ],
  "meta": {
    "total": 100,
    "page": 0,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2025-01-20T10:30:00.000Z",
  "statusCode": 200
}
```

### Delete Response

#### Request:

```bash
DELETE /api/v1/products/123
x-custom-lang: fa
```

#### Response:

```json
{
  "success": true,
  "message": "محصول با موفقیت حذف شد",
  "data": null,
  "timestamp": "2025-01-20T10:30:00.000Z",
  "statusCode": 200
}
```

## 🎨 Best Practices

### ✅ Do:

- Use domain-specific response classes
- Provide meaningful success messages
- Include relevant data in responses
- Use appropriate HTTP status codes
- Follow consistent response structure

### ❌ Don't:

- Return raw data without formatting
- Mix different response formats
- Forget to add i18n messages
- Use generic messages for specific actions
- Omit success indicators

## 🔧 Creating New Domain Response

1. **Create response class:**

```typescript
// src/common/responses/domains/payment.response.ts
export class PaymentResponse extends ResponseBuilder {
  readonly domain = 'payment';

  processed<T>(payment: T): IBaseResponse<T> {
    return this.createSuccessResponse('PROCESSED', {
      data: payment,
      statusCode: HttpStatus.OK,
    });
  }

  refunded(): IBaseResponse<null> {
    return this.createSuccessResponse('REFUNDED', {
      data: null,
      statusCode: HttpStatus.OK,
    });
  }
}
```

2. **Export in index.ts:**

```typescript
export * from './domains/payment.response';
```

3. **Add i18n messages:**

```json
// Both en/success.json and fa/success.json
{
  "payment": {
    "PROCESSED": "Payment processed successfully", // "پرداخت با موفقیت انجام شد"
    "REFUNDED": "Payment refunded successfully" // "مبلغ با موفقیت بازگردانده شد"
  }
}
```

This system ensures consistent, professional, and user-friendly API responses! 🎉
