'use client';

import { type AssistantMessage } from '@/lib/types';

import AnswerCard from './AnswerCard';
import SourcesCard from './SourcesCard';
import TraceBar from './TraceBar';

export default function AssistantMessage({
  message,
}: {
  message: AssistantMessage;
}) {
  return (
    <div className='flex justify-center'>
      <div className='text-gray-900 w-full'>
        <TraceBar traceStep={message.traceStep} />
        <SourcesCard sources={message.sources} />
        <AnswerCard answer={message.content} sources={message.sources} />
      </div>
    </div>
  );
}
