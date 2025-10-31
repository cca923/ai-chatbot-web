'use client';

import { Globe } from 'lucide-react';

import { type Source } from '@/lib/types';

export default function SourcesCard({ sources }: { sources: Source[] }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const handleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='flex flex-row overflow-x-auto space-x-3 pb-2 mb-4'>
      {sources.map((source) => (
        <div
          key={source.id}
          onClick={() => handleClick(source.url)}
          role='link'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleClick(source.url);
            }
          }}
          className='block p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0 w-64'
        >
          <div className='flex items-center mb-1'>
            <Globe className='h-4 w-4 mr-2 text-gray-500' />
            <span className='text-xs text-gray-500 truncate'>
              {new URL(source.url).hostname}
            </span>
          </div>
          <div className='text-sm font-medium text-blue-700 truncate'>
            {source.title}
          </div>
        </div>
      ))}
    </div>
  );
}
