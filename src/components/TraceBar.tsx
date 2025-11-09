'use client';

import { Loader2 } from 'lucide-react';

export default function TraceBar({ traceStep }: { traceStep: string | null }) {
  if (!traceStep) {
    return null;
  }

  return (
    <div className='flex items-center text-sm text-gray-500 mb-4'>
      <Loader2 size={20} className='mr-2 animate-spin' />
      <span>{traceStep}</span>
    </div>
  );
}
