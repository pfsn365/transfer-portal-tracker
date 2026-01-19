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
          "https://www.tiktok.com/@pfsn365",
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
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.profootballnetwork.com/?s={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://www.profootballnetwork.com/cfb-hq/#webpage",
        "url": "https://www.profootballnetwork.com/cfb-hq",
        "name": "College Football HQ - CFB Tools, Playoff Bracket & Transfer Portal",
        "description": "Your destination for college football tools and data at PFSN. Access comprehensive CFB resources including the transfer portal, playoff bracket, standings, and more.",
        "inLanguage": "en-US",
        "isPartOf": {
          "@id": "https://www.profootballnetwork.com/#website"
        }
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://www.profootballnetwork.com/cfb-hq/#sportsorg",
        "name": "CFB HQ",
        "description": "College Football Headquarters - Comprehensive tools and data for college football fans",
        "sport": "American Football",
        "url": "https://www.profootballnetwork.com/cfb-hq",
        "parentOrganization": {
          "@id": "https://www.profootballnetwork.com/#organization"
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
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.profootballnetwork.com/cfb-hq/power-rankings-builder/#softwareapplication",
        "name": "CFB Power Rankings Builder",
        "description": "Create and customize your own college football power rankings. Drag and drop teams, save rankings, and download shareable images.",
        "url": "https://www.profootballnetwork.com/cfb-hq/power-rankings-builder",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/#dataset",
        "name": "College Football Transfer Portal Database",
        "description": "Real-time database of college football players in the transfer portal, including status, former school, new school, position, class, and conference information.",
        "url": "https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker",
        "keywords": ["CFB Transfer Portal", "College Football Transfers", "NCAA Transfer Portal", "Transfer Portal Database"],
        "temporalCoverage": "2025/..",
        "isAccessibleForFree": true,
        "license": "https://www.profootballnetwork.com/terms-of-service",
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        },
        "includedInDataCatalog": {
          "@type": "DataCatalog",
          "name": "PFSN Sports Data"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://www.profootballnetwork.com/cfb-hq/standings/#dataset",
        "name": "College Football Standings Database",
        "description": "Current college football conference standings for all FBS and FCS divisions, including win-loss records and conference standings.",
        "url": "https://www.profootballnetwork.com/cfb-hq/standings",
        "keywords": ["CFB Standings", "College Football Standings", "Conference Standings", "FBS Standings", "FCS Standings"],
        "isAccessibleForFree": true,
        "license": "https://www.profootballnetwork.com/terms-of-service",
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://www.profootballnetwork.com/cfb-hq/stat-leaders/#dataset",
        "name": "College Football Statistical Leaders Database",
        "description": "Top statistical leaders in college football including passing, rushing, receiving, and defensive statistics for FBS and FCS.",
        "url": "https://www.profootballnetwork.com/cfb-hq/stat-leaders",
        "keywords": ["CFB Stats", "College Football Statistics", "Stat Leaders", "Passing Leaders", "Rushing Leaders"],
        "isAccessibleForFree": true,
        "license": "https://www.profootballnetwork.com/terms-of-service",
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.profootballnetwork.com/cfb-hq/#breadcrumb",
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
            "name": "College Football HQ",
            "item": "https://www.profootballnetwork.com/cfb-hq/"
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
