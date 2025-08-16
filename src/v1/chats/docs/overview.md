## Overview

- Namespace: `/chats`
- Transport: Socket.IO
- Auth: توکن کی‌کلاک از طریق `auth: { token: 'Bearer <ACCESS_TOKEN>' }` یا هدر `Authorization`.
- Env های موردنیاز سمت بک‌اند:
  - `OPENAI_API_KEY`
  - `KEYCLOAK_PUBLIC_KEY` (PEM یا base64 خام)

حافظه مکالمه برای هر چت نگهداری می‌شود؛ در هر `send_message`، تاریخچه همان چت به مدل ارسال می‌گردد تا کانتکست حفظ شود.

### Anonymous Access (Guest)

- بدون توکن نیز اتصال و گفتگو مجاز است اما با محدودیت سفت و سخت: حداکثر 10 تعامل (5 پیام کاربر + 5 پاسخ AI).
- پس از رسیدن به سقف، رویداد خطا با کد `ANON_LIMIT_REACHED` ارسال می‌شود و ادامه گفتگو ممکن نیست تا زمانی که کاربر وارد شود.
- شمارش مصرف میهمان در Redis با کلید `anon:<anonId>:usage` نگهداری می‌شود و TTL پیش‌فرض یک سال است. بنابراین حتی ماه‌ها بعد هم همان محدودیت اعمال می‌شود.

شناسه میهمان (Anonymous Id) چگونه به‌دست می‌آید؟

- اولویت 1: هدر `x-anon-id` (فقط در محیط‌هایی که بتوانید هدر سفارشی بفرستید: Postman/Node SSR)
- اولویت 2: کوکی `anon_id` (در مرورگر توصیه می‌شود)
- اولویت 3: اثرانگشت ساده از `ip + user-agent` (Fallback، ضعیف‌تر است)

توصیه برای Frontend (Next.js/Browser):

- یک UUID پایدار تولید کنید و در کوکی `anon_id` ست کنید؛ سپس سوکت را متصل کنید. مثال:
  - `document.cookie = "anon_id=<UUID>; path=/; max-age=31536000; SameSite=Lax"`
- اگر در محیط Node (SSR) یا ابزارهای تست هستید و امکان هدر دارید، می‌توانید `x-anon-id: <UUID>` را بفرستید.

نمایش سهمیه باقی‌مانده:

- رویداد `usage_info` را صدا بزنید یا منتظر ارسال خودکار آن پس از هر افزایش مصرف بمانید. پاسخ: `{ used, limit, remaining, isAnonymous }`.
