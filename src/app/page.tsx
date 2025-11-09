'use client';

import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

import ChatMessages from '@/components/ChatMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/store/chatStore';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const { messages, isLoading, startStream } = useChatStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      startStream(query);
      setQuery('');
    }
  };

  return (
    <div
      className={`flex flex-col h-screen max-w-4xl px-4 py-8 mx-auto 
        ${messages?.length === 0 ? 'justify-center' : 'justify-between'}`}
    >
      <ChatMessages messages={messages} />
      <form
        onSubmit={handleSubmit}
        className='w-full flex items-center gap-2 rounded-full p-4 border border-gray-300 shadow-xs'
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ask anything...'
          disabled={isLoading}
          className='flex-1 border-0 outline-none shadow-none focus-visible:ring-0'
        />
        <Button
          type='submit'
          size='icon'
          disabled={isLoading}
          className='rounded-full cursor-pointer'
        >
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}
