## Events Contract

Client → Server

- `send_message` payload:

  ```json
  {
    "chat_id": "optional",
    "model": "gpt-4o-mini",
    "content": "متن پیام کاربر",
    "temperature": 0.7
  }
  ```

  اگر `chatId` خالی باشد، ابتدا چت ساخته می‌شود و رویداد `chat_created` ارسال می‌گردد.

- `list_chats` payload:
  ```json
  { "page": 0, "limit": 20 }
  ```
- `list_messages` payload:
  ```json
  { "chat_id": "<CHAT_ID>", "page": 0, "limit": 20 }
  ```
- `usage_info` بدون payload (برای دریافت سهمیه باقی‌مانده کاربر ناشناس)

Server → Client

- `chat_created`: `{ chat_id, title, model }`
- `message_created`: پیام ذخیره‌شده کاربر
- `assistant_typing`: `{ chat_id }` شروع استریم پاسخ
- `assistant_delta`: `{ chat_id, delta }` تکه‌های پاسخ AI
- `assistant_complete`: پیام کامل AI (پس از ذخیره)
- `assistant_error`: `{ chat_id, error }`
- `chats_list`: پاسخ صفحه‌بندی‌شده شامل `data` (لیست چت‌ها) و `meta`
- `messages_list`: پاسخ صفحه‌بندی‌شده شامل `data` (لیست پیام‌ها) و `meta` به‌همراه `chat_id`
- `usage_info`: `{ used, limit, remaining, isAnonymous }`

Costs & Billing (authenticated users only):

- دو دِبیت انجام می‌شود:
  - بلافاصله بعد از `message_created`: هزینه توکن‌های پیام کاربر بر اساس `user_token_cost_per_1k`
  - بعد از `assistant_complete`: هزینه توکن‌های پاسخ دستیار بر اساس `assistant_token_cost_per_1k`

نکته: `role` یکی از `USER | ASSISTANT` است.
