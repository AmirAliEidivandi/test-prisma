# Nginx WebSocket Setup Guide

## 🔧 Configuration تکمیل شد!

Nginx config شما حالا WebSocket رو کاملاً support می‌کنه.

## 🚀 Frontend Connection

### 1. WebSocket Connection از Frontend

```javascript
// اتصال از طریق nginx
const socket = io('http://apit.aradgbk.com/chats', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'], // Fallback to polling
  auth: {
    token: 'your-jwt-token', // اختیاری برای anonymous users
  },
  path: '/ai-core/socket.io',
});

// یا برای namespace مخصوص
const socket = io('http://apit.aradgbk.com/ai-core/chats', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### 2. SSE Connection از Frontend

```javascript
// SSE requests هم از طریق nginx
async function sendMessage(chatId, model, content) {
  const response = await fetch(
    'http://apit.aradgbk.com/ai-core/api/v1/messages/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer your-token',
        'x-anon-id': 'anonymous-id',
      },
      body: JSON.stringify({
        chat_id: chatId,
        model: model,
        content: content,
        temperature: 0.7,
      }),
    },
  );

  // Handle SSE response...
}
```

### 3. Test Connection

```javascript
// Test WebSocket
const testSocket = io('http://apit.aradgbk.com/ai-core/chats');

testSocket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');

  // Test usage info
  testSocket.emit('usage_info');
});

testSocket.on('usage_info', (data) => {
  console.log('📊 Usage info received:', data);
});

testSocket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
});

testSocket.on('connect_error', (error) => {
  console.error('🚨 Connection error:', error);
});
```

### 4. Test SSE

```bash
# Test از طریق nginx
curl -X POST http://apit.aradgbk.com/ai-core/api/v1/messages/test-sse \
  -H "Content-Type: application/json"
```

## 🔍 Troubleshooting

### اگر WebSocket وصل نمی‌شه:

1. **Check nginx logs:**

   ```bash
   # Check nginx error logs
   tail -f /var/log/nginx/error.log
   ```

2. **Check ai-core service:**

   ```bash
   # Check if ai-core is running
   kubectl get pods -n aradgbk-test | grep ai-core

   # Check ai-core logs
   kubectl logs -f deployment/ai-core-dev -n aradgbk-test
   ```

3. **Test direct connection:**
   ```javascript
   // Test direct connection (bypass nginx)
   const directSocket = io('http://ai-core-dev.aradgbk-test.svc:3000/chats');
   ```

### Common Issues:

1. **502 Bad Gateway**: ai-core service down
2. **404 Not Found**: Path مشکل داره
3. **Connection timeout**: Firewall یا network issue

## 📊 Performance Tips

### Nginx Tuning برای WebSocket:

```nginx
# اگر WebSocket connections زیاد شد، این رو اضافه کنید:
events {
  worker_connections 1024;  # از 500 به 1024 افزایش
  use epoll;                # بهتر برای Linux
  multi_accept on;          # Accept multiple connections
}

http {
  # Keep-alive برای WebSocket
  keepalive_timeout 65;
  keepalive_requests 100;
}
```

### Frontend Optimization:

```javascript
const socket = io('http://apit.aradgbk.com/ai-core/chats', {
  // Connection options
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,

  // Transport options
  transports: ['websocket', 'polling'],
  upgrade: true,

  // Performance
  forceNew: false,
  multiplex: true,
});
```

## 🧪 Complete Test Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>AI Core WebSocket Test</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  </head>
  <body>
    <h1>AI Core Connection Test</h1>
    <div id="status">Connecting...</div>
    <div id="messages"></div>

    <script>
      const status = document.getElementById('status');
      const messages = document.getElementById('messages');

      // Connect to WebSocket
      const socket = io('http://apit.aradgbk.com/ai-core/chats');

      socket.on('connect', () => {
        status.innerHTML = '✅ WebSocket Connected!';
        messages.innerHTML += '<p>Connected to WebSocket</p>';

        // Test usage info
        socket.emit('usage_info');
      });

      socket.on('usage_info', (data) => {
        messages.innerHTML += `<p>📊 Usage: ${JSON.stringify(data)}</p>`;
      });

      socket.on('disconnect', () => {
        status.innerHTML = '❌ WebSocket Disconnected';
      });

      socket.on('connect_error', (error) => {
        status.innerHTML = '🚨 Connection Error';
        messages.innerHTML += `<p>Error: ${error}</p>`;
      });

      // Test SSE
      async function testSSE() {
        try {
          const response = await fetch(
            'http://apit.aradgbk.com/ai-core/api/v1/messages/test-sse',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            messages.innerHTML += `<p>📡 SSE: ${chunk}</p>`;
          }

          messages.innerHTML += '<p>✅ SSE Test Complete</p>';
        } catch (error) {
          messages.innerHTML += `<p>🚨 SSE Error: ${error}</p>`;
        }
      }

      // Test SSE after 2 seconds
      setTimeout(testSSE, 2000);
    </script>
  </body>
</html>
```

## ✅ نتیجه

حالا frontend می‌تونه:

1. ✅ از طریق `http://apit.aradgbk.com/ai-core/chats` به WebSocket وصل بشه
2. ✅ از طریق `http://apit.aradgbk.com/ai-core/api/v1/messages/*` SSE استفاده کنه
3. ✅ همه authentication و security features کار کنن
4. ✅ Load balancing و proxy features nginx رو داشته باشه

🎉 **Hybrid Architecture شما آماده production هست!**
