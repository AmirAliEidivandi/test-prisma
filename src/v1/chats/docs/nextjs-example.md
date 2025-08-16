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
  const [anonId, setAnonId] = useState<string | null>(null); // برای مهمان
  const [quota, setQuota] = useState<{
    used: number;
    limit: number | null;
    remaining: number | null;
    isAnonymous: boolean;
  } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const streamingBuffer = useRef<string>('');

  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/chats`
      : 'http://localhost:3000/chats';
  }, []);

  // ایجاد anon_id پایدار
  useEffect(() => {
    const cookie = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('anon_id='));
    if (cookie) setAnonId(decodeURIComponent(cookie.split('=')[1]));
    else {
      const id = crypto.randomUUID();
      document.cookie = `anon_id=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
      setAnonId(id);
    }
  }, []);

  // اتصال کاربر لاگین‌شده
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

  // اتصال مهمان در صورت نبود token
  useEffect(() => {
    if (token) return;
    if (!anonId) return;
    const socket = io(endpoint, {
      transports: ['websocket'],
      extraHeaders: { 'x-anon-id': anonId },
    });
    socketRef.current = socket;

    socket.on('usage_info', (info) => setQuota(info));
    socket.emit('usage_info'); // گرفتن وضعیت اولیه کوئوتا

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
  }, [endpoint, anonId, token]);

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
      {quota?.isAnonymous && (
        <div>
          Remaining: {quota.remaining} / {quota.limit} (used: {quota.used})
        </div>
      )}
      {/* UI برای گرفتن و ست کردن توکن */}
      {/* UI برای نمایش messages و ارسال پیام جدید */}
    </div>
  );
}
```
