'use client';

import { Loader2 } from 'lucide-react';

export default function TraceBar({ traceStep }: { traceStep: string | null }) {
  if (!traceStep) {
    return null;
  }

  return (
    <div className='flex items-center text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200'>
      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
      <span>{traceStep}</span>
    </div>
  );
}
