import QuoteDetailPage from '@/components/views/quotes/QuoteDetailPage';

export default async function QuotePage({ params }) {
  const { id } = await params;
  return <QuoteDetailPage quoteId={id} />;
}
