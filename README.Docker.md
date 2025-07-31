# 🐳 راهنمای Docker

این راهنما نحوه استفاده از Docker برای پروژه NestJS شما را توضیح می‌دهد.

## 📁 فایل‌های Docker

### `Dockerfile`

- **Multi-stage build** برای بهینه‌سازی اندازه image
- **Security best practices** با استفاده از non-root user
- **Health check** برای monitoring
- **Optimized caching** برای سرعت build بیشتر

### `.dockerignore`

- حذف فایل‌های غیرضروری از Docker context
- کاهش اندازه image نهایی
- بهبود سرعت build

### `docker-compose.yml`

- تنظیم کامل محیط development
- شامل PostgreSQL، Redis، MinIO
- Health checks برای همه services
- Network isolation برای امنیت

## 🚀 نحوه استفاده

### 1. Build کردن Image

```bash
# Build production image
docker build -t nestjs-app .

# Build with tag مشخص
docker build -t nestjs-app:v1.0.0 .
```

### 2. اجرای Container

```bash
# اجرای simple
docker run -p 3000:3000 nestjs-app

# اجرای با environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NODE_ENV=production \
  nestjs-app
```

### 3. استفاده از Docker Compose

```bash
# شروع همه services
docker-compose up -d

# دیدن logs
docker-compose logs -f

# متوقف کردن services
docker-compose down

# پاک کردن volumes
docker-compose down -v
```

## ⚙️ Environment Variables

این متغیرها را در فایل `.env` یا docker-compose تنظیم کنید:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Keycloak
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# Kafka
KAFKA_BROKER_URL=localhost:9092
KAFKA_CLIENT_ID=nestjs-app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🔧 دیتابیس Setup

### Prisma Migrations

```bash
# اجرای migrations در container
docker exec nestjs-app npx prisma migrate reset --force
docker exec nestjs-app npx prisma migrate deploy

# Seed کردن دیتا
docker exec nestjs-app npx prisma db seed
```

## 📊 Monitoring و Health Check

### Health Check Endpoint

```bash
# چک کردن health
curl http://localhost:3000/health

# Docker health status
docker ps --filter "name=nestjs-app"
```

### Logs مشاهده کردن

```bash
# Container logs
docker logs nestjs-app -f

# Docker compose logs
docker-compose logs app -f
```

## 🏗️ Production Deployment

### 1. CI/CD Pipeline

```yaml
# مثال GitHub Actions
- name: Build Docker Image
  run: |
    docker build -t ${{ secrets.REGISTRY }}/nestjs-app:${{ github.sha }} .
    docker push ${{ secrets.REGISTRY }}/nestjs-app:${{ github.sha }}
```

### 2. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nestjs-app
  template:
    metadata:
      labels:
        app: nestjs-app
    spec:
      containers:
        - name: nestjs-app
          image: your-registry/nestjs-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```

## 🛠️ Troubleshooting

### مشاکل رایج

1. **Build Error**: بررسی کنید تمام dependencies در `package.json` موجود باشند
2. **Database Connection**: اطمینان حاصل کنید `DATABASE_URL` صحیح است
3. **Permission Issues**: از non-root user استفاده می‌کنیم، فایل permissions را بررسی کنید

### Debug Commands

```bash
# ورود به container
docker exec -it nestjs-app sh

# بررسی Node.js version
docker exec nestjs-app node --version

# بررسی Prisma schema
docker exec nestjs-app npx prisma introspect
```

## 📈 بهینه‌سازی

### کاهش اندازه Image

- از Alpine Linux استفاده می‌کنیم
- Multi-stage build برای حذف dev dependencies
- .dockerignore برای exclude کردن فایل‌های غیرضروری

### بهبود Performance

- Layer caching برای dependencies
- Health checks برای load balancer
- Non-root user برای امنیت

---

**نکته**: این Dockerfile آماده production است و تمام best practices رعایت شده. برای استفاده در محیط توسعه می‌توانید از `docker-compose.yml` استفاده کنید.
