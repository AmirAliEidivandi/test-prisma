# 🚀 Enhanced Exception Handling System

## 📁 Structure

```
exceptions/
├── base/
│   ├── base-exception.interface.ts     # Base interfaces
│   └── domain-exception.abstract.ts    # Abstract base class
├── domains/
│   ├── auth.exception.ts              # Authentication exceptions
│   ├── common.exception.ts            # Common exceptions
│   ├── product.exception.ts           # Product-specific exceptions
│   └── validation.exception.ts        # Validation exceptions
├── index.ts                           # Export all exceptions
└── README.md                          # This file
```

## 🎯 Quick Start

```typescript
import {
  ProductException,
  AuthException,
  ValidationException,
} from '@exceptions';

// Product not found
throw ProductException.notFound('product-id');

// Unauthorized access
throw AuthException.unauthorized();

// Validation failed
throw ValidationException.requiredField('email');
```

## ✨ Key Benefits

- ✅ **Domain-specific**: Each business domain has its own exceptions
- ✅ **Type-safe**: Compile-time validation of error codes
- ✅ **Consistent**: All exceptions follow the same pattern
- ✅ **I18n ready**: Automatic localization support
- ✅ **Factory methods**: Easy-to-use static methods
- ✅ **Rich context**: Include relevant data in exceptions

## 🌍 Response Format

All exceptions return consistent JSON responses:

```json
{
  "domain": "product",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "message": "محصول یافت نشد",
  "payload": { "productId": "abc123" },
  "timestamp": "2025-01-20T10:30:00.000Z",
  "path": "/api/v1/products/abc123",
  "method": "GET"
}
```

## 🛠️ Creating New Domain Exception

1. **Create exception class:**

```typescript
// src/common/exceptions/domains/order.exception.ts
export class OrderException extends DomainException {
  static readonly DOMAIN = 'order';
  readonly domain = OrderException.DOMAIN;

  static readonly CODES = {
    NOT_FOUND: 'NOT_FOUND',
    CANCELLED: 'CANCELLED',
  } as const;

  // Factory methods
  static notFound(id: string): OrderException {
    return new OrderException('NOT_FOUND', HttpStatus.NOT_FOUND, undefined, {
      orderId: id,
    });
  }
}
```

2. **Export in index.ts:**

```typescript
export * from './domains/order.exception';
```

3. **Add i18n messages:**

```json
// src/i18n/en/exception.json
{
  "errors": {
    "order": {
      "NOT_FOUND": "Order not found",
      "CANCELLED": "Order has been cancelled"
    }
  }
}
```

That's it! 🎉
