'use client';

import ReactMarkdown from 'react-markdown';

import { type Source } from '@/lib/types';

import CitationPopover from './CitationPopover';

const CITATION_REGEX = /#citation-(\d+)/;

export default function AnswerCard({
  answer,
  sources,
}: {
  answer: string;
  sources: Source[];
}) {
  if (!answer) {
    return null;
  }

  return (
    <div className='prose prose-sm max-w-none'>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const citationMatch = href ? CITATION_REGEX.exec(href) : null;

            if (citationMatch) {
              const sourceId = parseInt(citationMatch[1], 10);
              const source = sources.find((s) => s.id === sourceId);

              if (source) {
                return (
                  <CitationPopover source={source}>{children}</CitationPopover>
                );
              }
            }

            return (
              <a
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                {children}
              </a>
            );
          },
        }}
      >
        {answer}
      </ReactMarkdown>
    </div>
  );
}
