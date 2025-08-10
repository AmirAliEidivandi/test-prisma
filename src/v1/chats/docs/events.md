## Events Contract

Client → Server

- `send_message` payload:

  ```json
  {
    "chatId": "optional",
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
  { "chatId": "<CHAT_ID>", "page": 0, "limit": 20 }
  ```

Server → Client

- `chat_created`: `{ chatId, title, model }`
- `message_created`: پیام ذخیره‌شده کاربر
- `assistant_typing`: `{ chatId }` شروع استریم پاسخ
- `assistant_delta`: `{ chatId, delta }` تکه‌های پاسخ AI
- `assistant_complete`: پیام کامل AI (پس از ذخیره)
- `assistant_error`: `{ chatId, error }`
- `chats_list`: پاسخ صفحه‌بندی‌شده شامل `data` (لیست چت‌ها) و `meta`
- `messages_list`: پاسخ صفحه‌بندی‌شده شامل `data` (لیست پیام‌ها) و `meta` به‌همراه `chatId`

نکته: `role` یکی از `USER | ASSISTANT` است.
