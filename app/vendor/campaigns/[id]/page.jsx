import { Suspense } from 'react';
import CampaignDetailView from './CampaignDetailView';

function Fallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#007BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CampaignDetailView />
    </Suspense>
  );
}
