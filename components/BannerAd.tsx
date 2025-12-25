'use client';

export default function BannerAd() {
  return (
    <div className="w-full bg-gray-100 border-y border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div
          id="adthrive-ad-slot"
          className="min-h-[90px] sm:min-h-[250px] flex items-center justify-center"
          data-adthrive-ad-type="banner"
        >
          {/* Raptive/AdThrive will inject ad content here */}
          <div className="text-gray-400 text-sm">Advertisement</div>
        </div>
      </div>
    </div>
  );
}
