export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.profootballnetwork.com/#organization",
        "name": "PFSN",
        "legalName": "Pro Football Network Inc.",
        "alternateName": ["Pro Football Network", "Pro Football & Sports Network", "PFSN", "PFSN365"],
        "url": "https://www.profootballnetwork.com/",
        "foundingDate": "2019",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bristol",
          "addressRegion": "CT",
          "addressCountry": "US"
        },
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.profootballnetwork.com/#logo",
          "url": "https://statico.profootballnetwork.com/wp-content/uploads/2025/03/24154810/PFSN-Google-Icon-Black-White-112.png",
          "contentUrl": "https://statico.profootballnetwork.com/wp-content/uploads/2025/03/24154810/PFSN-Google-Icon-Black-White-112.png",
          "caption": "PFSN",
          "width": 560,
          "height": 560
        },
        "sameAs": [
          "https://www.wikidata.org/wiki/Q137636516",
          "https://twitter.com/PFSN365",
          "https://www.facebook.com/PFSN365",
          "https://www.instagram.com/pfsn365/",
          "https://www.linkedin.com/company/pfsn365",
          "https://www.youtube.com/c/profootballnetwork",
          "https://www.tiktok.com/@pfn365",
          "https://www.threads.com/@pfsn365",
          "https://bsky.app/profile/did:plc:ymwh7dihf5ra32e5ms5jjaar",
          "https://apple.news/TNZRJixlpTJCDE_GPUJK2Lw",
          "https://muckrack.com/media-outlet/profootballnetwork",
          "https://theorg.com/org/pro-football-network",
          "https://www.crunchbase.com/organization/pro-football-network",
          "https://www.glassdoor.com/Overview/Working-at-Pro-Football-Network-EI_IE6573271.11,31.htm",
          "https://flipboard.com/@PFN365",
          "https://www.newsbreak.com/m/pro-football-network-299253692"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.profootballnetwork.com/#website",
        "url": "https://www.profootballnetwork.com/",
        "name": "PFSN",
        "alternateName": "Pro Football Network",
        "inLanguage": "en-US",
        "publisher": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#webpage",
        "url": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "name": "CFB Transfer Portal Tracker - College Football Portal News",
        "description": "Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference. The most comprehensive CFB transfer portal tracker.",
        "inLanguage": "en-US",
        "isPartOf": {
          "@id": "https://www.profootballnetwork.com/#website"
        },
        "about": {
          "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#softwareapplication"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#softwareapplication",
        "name": "CFB Transfer Portal Tracker",
        "description": "Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference.",
        "url": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        },
        "publisher": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#dataset",
        "name": "College Football Transfer Portal Database",
        "description": "Real-time database of college football players in the transfer portal, including status, former school, new school, position, class, and conference information. Updated hourly with live transfer portal data.",
        "url": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "keywords": ["CFB Transfer Portal", "College Football Transfers", "NCAA Transfer Portal", "Transfer Portal Database", "College Football Recruiting"],
        "temporalCoverage": "2024/..",
        "isAccessibleForFree": true,
        "license": "https://www.profootballnetwork.com/terms-of-service",
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        },
        "includedInDataCatalog": {
          "@type": "DataCatalog",
          "name": "PFSN Sports Data"
        },
        "distribution": {
          "@type": "DataDownload",
          "encodingFormat": "text/html",
          "contentUrl": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.profootballnetwork.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "College Football",
            "item": "https://www.profootballnetwork.com/cfb-hq/"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Transfer Portal Tracker",
            "item": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker"
          }
        ]
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
