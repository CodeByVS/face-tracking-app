'use client';

import dynamic from 'next/dynamic';

// Dynamically import the FaceTracker component with SSR disabled
const FaceTracker = dynamic(
  () => import('@/components/FaceTracker'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <FaceTracker />
    </div>
  );
}
