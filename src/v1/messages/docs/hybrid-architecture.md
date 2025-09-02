# Hybrid Architecture: WebSocket + SSE

این پروژه از یک architecture ترکیبی استفاده می‌کند که بهترین جنبه‌های WebSocket و SSE را ترکیب می‌کند.

## 📊 Architecture Overview

### WebSocket: برای Management Operations

- مدیریت اتصالات
- عملیات چت (list_chats, list_messages)
- اطلاعات کاربری (usage_info)
- notifications و updates

### SSE: برای AI Streaming

- ارسال پیام و دریافت streaming response
- Regenerate پیام‌های assistant
- استاندارد صنعتی برای AI streaming

## 🚀 Client Implementation

### 1. WebSocket Connection

```javascript
const socket = io('http://localhost:3000/chats', {
  auth: {
    token: 'your-jwt-token', // Optional for anonymous users
  },
});

// Listen to usage info
socket.on('usage_info', (data) => {
  console.log('Usage:', data);
});

// List chats
socket.emit('list_chats', { page: 0, limit: 20 });
socket.on('chats_list', (data) => {
  console.log('Chats:', data);
});
```

### 2. SSE for Message Streaming

```javascript
async function sendMessage(chatId, model, content) {
  const response = await fetch('/api/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer your-token', // Optional
      'x-anon-id': 'anonymous-id', // For anonymous users
    },
    body: JSON.stringify({
      chat_id: chatId,
      model: model,
      content: content,
      temperature: 0.7,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const event = line.slice(7);
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        handleSSEEvent(event, data);
      }
    }
  }
}

function handleSSEEvent(event, data) {
  switch (event) {
    case 'assistant_typing':
      console.log('Assistant is typing...');
      break;
    case 'assistant_delta':
      console.log('Delta:', data.delta);
      // Append delta to UI
      break;
    case 'assistant_complete':
      console.log('Message completed:', data);
      break;
    case 'assistant_error':
      console.error('Error:', data.error);
      break;
    case 'usage_info':
      console.log('Usage updated:', data);
      break;
  }
}
```

### 3. Better SSE Implementation with EventSource

```javascript
function sendMessageWithEventSource(chatId, model, content) {
  // Send the message first
  fetch('/api/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer your-token',
    },
    body: JSON.stringify({ chat_id: chatId, model, content }),
  }).then((response) => {
    // Create EventSource for streaming response
    const eventSource = new EventSource(`/api/v1/messages/send`, {
      headers: {
        Authorization: 'Bearer your-token',
      },
    });

    eventSource.addEventListener('assistant_delta', (event) => {
      const data = JSON.parse(event.data);
      appendDeltaToUI(data.delta);
    });

    eventSource.addEventListener('assistant_complete', (event) => {
      const data = JSON.parse(event.data);
      finalizeMessage(data);
      eventSource.close();
    });

    eventSource.addEventListener('assistant_error', (event) => {
      const data = JSON.parse(event.data);
      showError(data.error);
      eventSource.close();
    });
  });
}
```

## 🧪 Testing SSE

Test endpoint برای بررسی SSE:

```bash
curl -X POST http://localhost:3000/api/v1/messages/test-sse \
  -H "Content-Type: application/json"
```

یا با JavaScript:

```javascript
const eventSource = new EventSource('/api/v1/messages/test-sse');

eventSource.addEventListener('test_message', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Test ${data.counter}: ${data.message}`);
});

eventSource.addEventListener('test_complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Test completed:', data.message);
  eventSource.close();
});
```

## 🔧 Error Handling

### WebSocket Errors

```javascript
socket.on('assistant_error', (data) => {
  switch (data.code) {
    case 'ANON_LIMIT_REACHED':
      showLoginPrompt();
      break;
    case 'INSUFFICIENT_BALANCE':
      showTopUpPrompt();
      break;
    default:
      showGenericError(data.error);
  }
});
```

### SSE Errors

```javascript
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  // Implement reconnection logic
  setTimeout(() => {
    reconnectSSE();
  }, 5000);
};
```

## 📋 Event Types

### WebSocket Events

- `list_chats` / `chats_list`
- `list_messages` / `messages_list`
- `usage_info`

### SSE Events

- `assistant_typing`: شروع تایپ assistant
- `assistant_delta`: هر تکه از پاسخ
- `assistant_complete`: تکمیل پاسخ
- `assistant_error`: خطا در پردازش
- `assistant_regenerating`: شروع regenerate
- `assistant_regenerated`: تکمیل regenerate
- `usage_info`: به‌روزرسانی usage (برای anonymous users)

## 🛡️ Security Headers

Headers مورد نیاز برای SSE:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-token', // اختیاری
  'x-anon-id': 'anonymous-id', // برای کاربران anonymous
  'Cache-Control': 'no-cache'
}
```

## 🔄 Migration از WebSocket خالص

برای migration از کد قبلی:

1. **WebSocket**: فقط برای management operations
2. **SSE**: برای message sending و streaming
3. **Authentication**: هر دو روش از همان token استفاده می‌کنند
4. **Anonymous users**: با x-anon-id header شناسایی می‌شوند

## 💡 Best Practices

1. **Connection Management**: WebSocket connection را alive نگه دارید
2. **Error Handling**: هر دو channel رو مانیتور کنید
3. **Reconnection**: برای SSE reconnection logic پیاده کنید
4. **Cleanup**: EventSource ها را درست close کنید
5. **Performance**: از chunked transfer encoding استفاده کنید
