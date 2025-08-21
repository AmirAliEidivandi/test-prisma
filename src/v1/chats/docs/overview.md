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

### Models & Pricing Configuration

- لیست مدل‌ها از یک enum کوچک تأمین می‌شود: `src/common/enums/model.enum.ts`
  - مدل‌های فعلی (نمونه): `gpt-4o`, `gpt-4o-mini`, `gpt-4`, `o3`, `o1`, و مدل‌های DeepSeek (مثلاً: `deepseek-chat`)
- قیمت‌گذاری در `src/common/config/pricing/pricing.config.ts` تعریف شده است.
  - `user_token_cost_per_1k`: هزینه هر 1000 توکن پیام کاربر
  - `assistant_token_cost_per_1k`: هزینه هر 1000 توکن خروجی دستیار
  - می‌توانید با ENV override کنید: مثلا `PRICE_GPT4O_USER_PER_1K`, `PRICE_GPT4O_ASSISTANT_PER_1K` و ...
- Endpoint `GET /api/v1/chats/models` همین enum را به فرانت باز می‌گرداند.
  - انتخاب مدل DeepSeek کافی است؛ سرویس به‌صورت خودکار به `api.deepseek.com` با `DEEPSEEK_API_KEY` سوییچ می‌کند.

Debit کیف‌پول (فقط کاربران احراز هویت‌شده):

- بعد از ذخیره پیام کاربر، دِبیت با reason: `AI_CHAT_USER_MESSAGE`
- بعد از تکمیل پاسخ AI، دِبیت با reason: `AI_CHAT_ASSISTANT_OUTPUT` (با تخمین ساده توکن خروجی)
  - این دِبیت‌ها از طریق Kafka به سرویس پرداخت ارسال می‌شوند.
