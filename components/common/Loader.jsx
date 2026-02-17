'use client';
import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="h-[50vh] w-full flex flex-col items-center justify-center gap-3 z-50">
      <Loader2 size={48} className="text-[rgb(var(--color-primary))] animate-spin" />
      <p className="text-sm font-medium text-[rgb(var(--color-text-muted))] animate-pulse">
        Loading...
      </p>
    </div>
  );
}
