'use client';

import { type UserMessage } from '@/lib/types';

export default function UserMessage({ message }: { message: UserMessage }) {
  return (
    <div className='flex justify-start'>
      <div className='text-2xl font-semibold'>
        <p>{message.content}</p>
      </div>
    </div>
  );
}
