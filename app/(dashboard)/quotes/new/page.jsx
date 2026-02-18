'use client';
import dynamic from 'next/dynamic';

const CreateQuote = dynamic(() => import('@/components/views/quotes/CreateQuote'), {
  ssr: false,
});

export default function NewQuotePage() {
  return <CreateQuote />;
}
