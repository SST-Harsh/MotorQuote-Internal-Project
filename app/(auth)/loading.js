import Loader from '@/components/common/Loader';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))]">
      <div className="text-center">
        <Loader />
        <p className="mt-4 text-[rgb(var(--color-text-muted))] text-sm">Authenticating...</p>
      </div>
    </div>
  );
}
