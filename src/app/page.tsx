'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import AssistantMessage from '@/components/AssistantMessage';
import UserMessage from '@/components/UserMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type ChatMessage } from '@/lib/types';
import { useChatStore } from '@/store/chatStore';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const { history, isLoading, startStream } = useChatStore();

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      startStream(query);
      setQuery('');
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <div className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4'>
        {history.length === 0 && (
          <div className='flex justify-center items-center h-full'>
            <p className='text-gray-500'>Ask me anything to get started...</p>
          </div>
        )}

        {history.map((message: ChatMessage) => {
          if (message.role === 'user') {
            return <UserMessage key={message.id} message={message} />;
          }
          if (message.role === 'assistant') {
            return <AssistantMessage key={message.id} message={message} />;
          }
          return null;
        })}
        <div ref={chatBottomRef} />
      </div>

      <div className='p-4 md:p-6 bg-white border-t border-gray-200 shadow-sm sticky bottom-0'>
        <form
          onSubmit={handleSubmit}
          className='flex items-center max-w-3xl mx-auto gap-2'
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask me anything...'
            disabled={isLoading}
            className='flex-1'
          />
          <Button type='submit' disabled={isLoading}>
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </div>
    </div>
  );
}
