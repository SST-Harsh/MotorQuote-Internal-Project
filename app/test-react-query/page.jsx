'use client';

import { useQuery } from '@tanstack/react-query';

export default function TestReactQueryPage() {
  // Simple test query
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { message: 'React Query is working!' };
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">React Query Test Page</h1>

        {isLoading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">✅ {data?.message}</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Look at the bottom-right corner</strong> of your screen. You should see the
                React Query DevTools icon! 🎉
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2">The DevTools icon looks like:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A small floating button</li>
                <li>Usually has the React Query logo</li>
                <li>Located in the bottom-right corner</li>
                <li>Click it to open the DevTools panel</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <a href="/login" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
