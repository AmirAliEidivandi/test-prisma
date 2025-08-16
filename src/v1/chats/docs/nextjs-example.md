## Next.js Client Example

```tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = {
  id?: string;
  chat_id?: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt?: string;
};

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null); // کی‌کلاک AccessToken
  const socketRef = useRef<Socket | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const streamingBuffer = useRef<string>('');

  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/chats`
      : 'http://localhost:3000/chats';
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(endpoint, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
    });
    socketRef.current = socket;

    socket.on(
      'chat_created',
      (data: { chatId: string; title: string; model: string }) => {
        setChatId(data.chatId);
      },
    );

    socket.on('message_created', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('assistant_typing', () => {
      streamingBuffer.current = '';
    });

    socket.on(
      'assistant_delta',
      ({ delta }: { chatId: string; delta: string }) => {
        streamingBuffer.current += delta;
        const tempMsg: Message = {
          content: streamingBuffer.current,
          role: 'ASSISTANT',
        };
        setMessages((prev) => {
          const cloned = [...prev];
          const last = cloned[cloned.length - 1];
          if (last && last.role === 'ASSISTANT' && !last.id)
            cloned[cloned.length - 1] = tempMsg;
          else cloned.push(tempMsg);
          return cloned;
        });
      },
    );

    socket.on('assistant_complete', (msg: Message) => {
      setMessages((prev) => {
        const cloned = [...prev];
        const last = cloned[cloned.length - 1];
        if (last && last.role === 'ASSISTANT' && !last.id)
          cloned[cloned.length - 1] = msg;
        else cloned.push(msg);
        return cloned;
      });
      streamingBuffer.current = '';
    });

    socket.on('assistant_error', (err) =>
      console.error('assistant_error', err),
    );
    socket.on('chats_list', (chats) => console.log('chats_list', chats));
    socket.on(
      'messages_list',
      ({ chatId, messages }: { chatId: string; messages: Message[] }) => {
        setChatId(chatId);
        setMessages(messages);
      },
    );

    return () => socket.disconnect();
  }, [endpoint, token]);

  const send = (text: string, model = 'gpt-4o-mini') => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_message', {
      chatId: chatId || undefined,
      model,
      content: text,
    });
  };

  const loadChats = () => socketRef.current?.emit('list_chats');
  const loadMessages = (id: string) =>
    socketRef.current?.emit('list_messages', { chatId: id });

  return (
    <div>
      {/* UI برای گرفتن و ست کردن توکن */}
      {/* UI برای نمایش messages و ارسال پیام جدید */}
    </div>
  );
}
```
