import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
  structuredData?: object;
  // Dynamic OG image parameters
  dynamicOg?: {
    title: string;
    subtitle?: string;
    stats?: string;
  };
}

const BASE_URL = "https://wavebound.app";
const DEFAULT_OG_IMAGE = "https://wavebound.app/og-image.png";

// Generate dynamic OG image URL using a simple text-based approach
const generateDynamicOgUrl = (params: { title: string; subtitle?: string; stats?: string }) => {
  // Use a service like og-image.vercel.app or similar for dynamic OG images
  // For now, we'll use URL params that could be processed by an edge function
  const searchParams = new URLSearchParams();
  searchParams.set('title', params.title);
  if (params.subtitle) searchParams.set('subtitle', params.subtitle);
  if (params.stats) searchParams.set('stats', params.stats);
  
  // This would point to an OG image generation endpoint
  return `${BASE_URL}/api/og?${searchParams.toString()}`;
};

export const SEOHead = ({
  title = "Wavebound - AI-Powered Content Discovery for Musicians",
  description = "Discover viral music content trends, analyze your TikTok performance, and plan your content strategy with AI. Built for independent artists and music marketers.",
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  structuredData,
  dynamicOg,
}: SEOHeadProps) => {
  const fullTitle = title.includes("Wavebound") ? title : `${title} | Wavebound`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  
  // Use dynamic OG if provided, otherwise fall back to static
  const finalOgImage = dynamicOg 
    ? generateDynamicOgUrl(dynamicOg)
    : (ogImage || DEFAULT_OG_IMAGE);

  // Default organization structured data
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Wavebound",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": description,
    "url": BASE_URL,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl || BASE_URL} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Wavebound" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl || BASE_URL} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Additional Meta */}
      <meta name="theme-color" content="#6366f1" />
      <meta name="author" content="Wavebound" />
      <meta name="keywords" content="music marketing, TikTok analytics, viral content, music promotion, content planning, AI music tools, artist marketing, social media for musicians" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
