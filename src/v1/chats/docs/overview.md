## Overview

- Namespace: `/chats`
- Transport: Socket.IO
- Auth: توکن کی‌کلاک از طریق `auth: { token: 'Bearer <ACCESS_TOKEN>' }` یا هدر `Authorization`.
- Env های موردنیاز سمت بک‌اند:
  - `OPENAI_API_KEY`
  - `KEYCLOAK_PUBLIC_KEY` (PEM یا base64 خام)

حافظه مکالمه برای هر چت نگهداری می‌شود؛ در هر `send_message`، تاریخچه همان چت به مدل ارسال می‌گردد تا کانتکست حفظ شود.
