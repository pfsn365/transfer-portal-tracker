'use client';

export default function BannerAd() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div
        className="w-full min-h-[90px] sm:min-h-[250px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded"
        id="adthrive_collapse_ref"
      >
        {/* Raptive/AdThrive will inject ad content here */}
      </div>
    </div>
  );
}
