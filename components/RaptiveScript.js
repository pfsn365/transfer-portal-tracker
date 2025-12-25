'use client'

import Script from 'next/script'

export default function RaptiveScript() {
  return (
    <>
      <Script
        id="raptive-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.adthrive = window.adthrive || {};
            window.adthrive.cmd = window.adthrive.cmd || [];
            window.adthrive.plugin = 'adthrive-ads-3.9.0';
            window.adthrive.host = 'ads.adthrive.com';
            window.adthrive.siteId = '5e163f2211916d4860b8f332';
          `,
        }}
      />
      <Script
        id="raptive-loader"
        src="https://ads.adthrive.com/sites/5e163f2211916d4860b8f332/ads.min.js"
        strategy="afterInteractive"
        async
        defer
      />
    </>
  )
}
