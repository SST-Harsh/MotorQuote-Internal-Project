import Loader from '@/components/common/Loader';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] to-[#1a1f35]">
      <div className="text-center">
        <Loader />
        <p className="mt-4 text-white/70 text-sm">Authenticating...</p>
      </div>
    </div>
  );
}
