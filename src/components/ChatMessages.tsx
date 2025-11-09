'use client';

import { useEffect, useRef } from 'react';

import AssistantMessage from '@/components/AssistantMessage';
import UserMessage from '@/components/UserMessage';
import { type ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className='flex items-center justify-center mb-4'>
        <p className='text-3xl font-semibold text-center'>Hello!</p>
      </div>
    );
  }

  return (
    <div className='overflow-y-auto space-y-4'>
      {messages.map((message, i) => {
        const isAssistant = message.role === 'assistant';
        const isLast = i === messages.length - 1;

        return (
          <div
            key={message.id}
            className={cn(
              'transition-opacity duration-200',
              isAssistant && !isLast && 'border-b border-gray-200 pb-4',
              isLast && 'mb-8'
            )}
          >
            {isAssistant ? (
              <AssistantMessage message={message} />
            ) : (
              <UserMessage message={message} />
            )}
          </div>
        );
      })}
      <div ref={chatBottomRef} />
    </div>
  );
}
