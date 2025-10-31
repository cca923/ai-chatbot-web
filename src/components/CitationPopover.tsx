import { Globe } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Source } from '@/lib/types';

export default function CitationPopover({
  source,
}: {
  source: Source;
  children: React.ReactNode;
}) {
  const domain = new URL(source.url).hostname;

  return (
    <Popover>
      <PopoverTrigger
        asChild
        className='ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 cursor-pointer align-middle'
      >
        <span>{domain}</span>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-3 shadow-lg'>
        <a
          href={source.url}
          target='_blank'
          rel='noopener noreferrer'
          className='block group'
        >
          <div className='flex items-center mb-1'>
            <Globe className='h-4 w-4 mr-2 text-gray-500' />
            <span className='text-xs text-gray-500 truncate'>{domain}</span>
          </div>
          <div className='text-sm font-medium text-gray-900 group-hover:underline truncate'>
            {source.title}
          </div>
        </a>
      </PopoverContent>
    </Popover>
  );
}
