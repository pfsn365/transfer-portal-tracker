export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#website",
        "url": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "name": "CFB Transfer Portal Tracker",
        "description": "Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference. The most comprehensive CFB transfer portal tracker.",
        "publisher": {
          "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ],
        "inLanguage": "en-US"
      },
      {
        "@type": "Organization",
        "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#organization",
        "name": "Pro Football Network",
        "url": "https://www.profootballnetwork.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.profootballnetwork.com/wp-content/uploads/2021/01/PFN-Logo-2021.png",
          "width": 600,
          "height": 60
        },
        "sameAs": [
          "https://twitter.com/PFN365",
          "https://www.facebook.com/PFN365",
          "https://www.youtube.com/profootballnetwork"
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#webpage",
        "url": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "name": "CFB Transfer Portal Tracker - College Football Portal News",
        "isPartOf": {
          "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#website"
        },
        "about": {
          "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#organization"
        },
        "description": "Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference. The most comprehensive CFB transfer portal tracker.",
        "inLanguage": "en-US",
        "potentialAction": [
          {
            "@type": "ReadAction",
            "target": [
              "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker"
            ]
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://profootballnetwork.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "CFB Hub",
            "item": "https://profootballnetwork.com/cfb-hq"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Transfer Portal Tracker",
            "item": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker"
          }
        ]
      },
      {
        "@type": "Dataset",
        "name": "College Football Transfer Portal Database",
        "description": "Real-time database of college football players in the transfer portal, including status, former school, new school, position, class, and conference information. Updated hourly with live transfer portal data.",
        "url": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "keywords": [
          "CFB Transfer Portal",
          "College Football Transfers",
          "NCAA Transfer Portal",
          "Transfer Portal Database",
          "College Football Recruiting"
        ],
        "creator": {
          "@id": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker/#organization"
        },
        "includedInDataCatalog": {
          "@type": "DataCatalog",
          "name": "Pro Football Network Sports Data"
        },
        "temporalCoverage": "2024/..",
        "distribution": [
          {
            "@type": "DataDownload",
            "encodingFormat": "text/csv",
            "contentUrl": "https://profootballnetwork.com/cfb-hq/transfer-portal-tracker"
          }
        ],
        "isAccessibleForFree": true,
        "license": "https://profootballnetwork.com/terms-of-service"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
