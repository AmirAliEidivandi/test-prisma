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

- `list_chats` بدون payload
- `list_messages` payload:
  ```json
  { "chatId": "<CHAT_ID>" }
  ```

Server → Client

- `chat_created`: `{ chatId, title, model }`
- `message_created`: پیام ذخیره‌شده کاربر
- `assistant_typing`: `{ chatId }` شروع استریم پاسخ
- `assistant_delta`: `{ chatId, delta }` تکه‌های پاسخ AI
- `assistant_complete`: پیام کامل AI (پس از ذخیره)
- `assistant_error`: `{ chatId, error }`
- `chats_list`: آرایه‌ای از چت‌ها `{ id, title, model, createdAt, updatedAt }[]`
- `messages_list`: `{ chatId, messages }` که messages شامل `{ id, content, role, createdAt, chatId }[]` است

نکته: `role` یکی از `USER | ASSISTANT` است.
