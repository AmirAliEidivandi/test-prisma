# User-Profile Microservice Integration via Kafka

## Overview

این سیستم integration بین این microservice (test-prisma) و profile microservice را از طریق Kafka پیاده‌سازی می‌کند.

## Architecture Flow

```
Client Request → Users Service → Kafka (create-user) → Profile Microservice
                      ↓
Database Storage ← Users Service ← Kafka (create-user-response) ← Profile Microservice
```

## Components

### 1. Kafka Topics

- `create-user`: برای ارسال درخواست ایجاد profile
- `create-user-response`: برای دریافت پاسخ با profileId

### 2. DTOs

- `CreateUserDto`: شامل اطلاعات کاربر برای ایجاد
- `UserProfileResponseDto`: پاسخ دریافتی از profile microservice

### 3. Database Schema

```sql
model User {
  id               String       @id @default(uuid())
  profileId        String?      @unique @map("profile_id")  -- از profile microservice
  jobPosition      String?      @map("job_position")        -- local storage
  phone            String?      @map("phone")               -- local storage
  address          String?      @map("address")             -- local storage
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")
}
```

## Request/Response Flow

### 1. Create User Request

```json
POST /v1/users
{
  "firstName": "احمد",
  "lastName": "محمدی",
  "email": "ahmad@example.com",
  "nationalCode": 1234567890,
  "birthDate": "1990-01-01",
  "jobPosition": "مهندس نرم‌افزار",
  "phone": "09123456789",
  "address": "تهران، خیابان آزادی"
}
```

### 2. Kafka Message to Profile Service

```json
{
  "requestId": "uuid-generated",
  "firstName": "احمد",
  "lastName": "محمدی",
  "email": "ahmad@example.com",
  "nationalCode": 1234567890,
  "birthDate": "1990-01-01"
}
```

### 3. Profile Service Response

```json
{
  "requestId": "uuid-generated",
  "id": "profile-uuid-from-mongo",
  "firstName": "احمد",
  "lastName": "محمدی",
  "email": "ahmad@example.com",
  "nationalCode": 1234567890,
  "birthDate": "1990-01-01"
}
```

### 4. Local Database Storage

```json
{
  "id": "local-uuid",
  "profileId": "profile-uuid-from-mongo",
  "jobPosition": "مهندس نرم‌افزار",
  "phone": "09123456789",
  "address": "تهران، خیابان آزادی",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### 1. Timeout Handling

- درخواست‌ها 30 ثانیه timeout دارند
- در صورت timeout، خطای "Kafka request timeout" برگردانده می‌شود

### 2. Validation

- پاسخ دریافتی از Kafka validate می‌شود
- در صورت invalid data، خطای validation برگردانده می‌شود

### 3. Database Constraints

- profileId باید unique باشد
- در صورت duplicate، خطای "User with this profile already exists" برگردانده می‌شود

## Health Check

```
GET /v1/users/health/kafka
```

Response:

```json
{
  "pendingRequests": 2,
  "isHealthy": true
}
```

## Logging

سیستم logging کاملی برای tracking ارتباطات Kafka:

- ارسال درخواست
- دریافت پاسخ
- خطاها و timeout ها
- عملیات database

## Configuration

Environment variables مورد نیاز:

```env
DATABASE_URL=postgresql://...
KAFKA_HOST=localhost
KAFKA_PORT=9092
SECRET=your-encryption-secret
```

## Testing

برای تست integration:

1. مطمئن شوید Kafka و Profile microservice فعال هستند
2. درخواست POST به `/v1/users` ارسال کنید
3. logs را برای track کردن جریان کار بررسی کنید
4. health check endpoint را برای monitoring استفاده کنید
