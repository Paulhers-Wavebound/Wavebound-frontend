import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Share2, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import blogViralTiktok from "@/assets/blog-viral-tiktok.jpg";
import blogTiktokVsReels from "@/assets/blog-tiktok-vs-reels.jpg";
import blogAnalyzePerformance from "@/assets/blog-analyze-performance.jpg";
import blogPostingTimes from "@/assets/blog-posting-times.jpg";
import BlogStatCard from "@/components/blog/BlogStatCard";
import BlogTikTokEmbed from "@/components/blog/BlogTikTokEmbed";
import BlogVideoGrid from "@/components/blog/BlogVideoGrid";
import BlogStatsRow from "@/components/blog/BlogStatsRow";

// Map slugs to imported images
const blogImages: Record<string, string> = {
  "how-to-go-viral-on-tiktok-as-a-musician-2026": blogViralTiktok,
  "best-posting-times-for-musicians-on-tiktok": blogPostingTimes,
  "tiktok-vs-instagram-reels-for-musicians": blogTiktokVsReels,
  "how-to-analyze-your-tiktok-performance": blogAnalyzePerformance,
};

// Extended section types for data-driven content
interface BlogSection {
  type: "intro" | "heading" | "subheading" | "paragraph" | "list" | "numbered-list" | "callout" | "quote" | "stat-card" | "stats-row" | "tiktok-embed" | "video-grid";
  content: string;
  items?: string[];
  // For stat-card
  statValue?: string;
  statLabel?: string;
  statDescription?: string;
  statIcon?: 'trending' | 'chart' | 'users' | 'views' | 'likes' | 'comments';
  statColor?: 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose';
  // For stats-row
  stats?: Array<{ value: string; label: string }>;
  statsSource?: string;
  // For tiktok-embed
  tiktokUrl?: string;
  handle?: string;
  hook?: string;
  views?: number;
  likes?: number;
  multiplier?: string;
  followers?: number;
  caption?: string;
  // For video-grid
  gridTitle?: string;
  gridDescription?: string;
  videos?: Array<{
    url: string;
    handle: string;
    hook?: string;
    views: number;
    multiplier: string;
    contentStyle?: string;
  }>;
}

interface BlogPostData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishDate: string;
  image: string;
  metaDescription: string;
  author: {
    name: string;
    role: string;
  };
  sections: BlogSection[];
}

const blogPostsContent: Record<string, BlogPostData> = {
  "how-to-go-viral-on-tiktok-as-a-musician-2026": {
    slug: "how-to-go-viral-on-tiktok-as-a-musician-2026",
    title: "How to Go Viral on TikTok as a Musician in 2026",
    excerpt: "The algorithm has changed. Here's what's actually working for independent artists right now.",
    category: "TikTok Strategy",
    readTime: "12 min read",
    publishDate: "Jan 3, 2026",
    image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&h=600&fit=crop",
    metaDescription: "Learn the latest TikTok strategies for musicians in 2026. Data-backed tips from analyzing 15,000+ viral short form music posts.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "If you're still using 2024 strategies, you're already behind. The algorithm has evolved, and what worked two years ago might actually hurt you today. We analyzed 3,723 viral short form music posts to find what actually works." },
      
      { type: "stats-row", content: "", stats: [
        { value: "3,728", label: "Videos Analyzed" },
        { value: "1.2M", label: "Avg Views/Video" },
        { value: "13.4%", label: "Avg Engagement" },
        { value: "71x", label: "Avg Multiplier" }
      ], statsSource: "Data from Wavebound's viral video database — creators who outperformed their baseline by 10x or more." },

      { type: "heading", content: "The Content Style Rankings: What Tends to Perform" },
      { type: "paragraph", content: "Different formats show varying performance levels. Here's how content styles performed in our database, though individual results vary significantly:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "313x", label: "Meme" },
        { value: "196x", label: "Production" },
        { value: "133x", label: "Live + Hook" },
        { value: "109x", label: "Studio Lip-Sync" }
      ], statsSource: "Average performance multiplier by content style. Note: averages are skewed by outliers — individual results vary widely." },

      { type: "callout", content: "Important caveat: These are averages from a curated database of already-viral content. Most memes don't go viral — but the ones that do, perform exceptionally well." },

      { type: "heading", content: "The 1-Second Rule: Hooks That Actually Work" },
      { type: "paragraph", content: "The old '3-second rule' is dead. Attention spans have compressed. Here are real examples of hooks that achieved 1,000x+ multipliers:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@teetheviolinist/video/7540588409463639327", handle: "teetheviolinist", hook: "Your orchestra teacher wasn't ready for this one 😂🎻", views: 6400000, likes: 1300000, multiplier: "4,958x", followers: 39100 },

      { type: "paragraph", content: "This hook works because it creates immediate intrigue — what did they play that would shock an orchestra teacher? It combines curiosity with humor, and the emoji signals the emotional payoff." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@nikikinimusic/video/7549130453492550934", handle: "nikikinimusic", hook: "when the budget is non-existent", views: 1500000, likes: 118500, multiplier: "1,867x", followers: 10200 },

      { type: "paragraph", content: "Turning a limitation into a hook. With only 10K followers, this video hit 1.5M views. The 'no budget' angle creates instant relatability — every creator knows this feeling." },

      { type: "heading", content: "Production Value: More Nuanced Than You'd Think" },
      { type: "paragraph", content: "Conventional wisdom says higher production = better results. The data suggests it's more nuanced:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "74x", label: "Medium Effort Avg" },
        { value: "62x", label: "Low Effort Avg" },
        { value: "60x", label: "High Effort Avg" },
        { value: "1,230", label: "Medium Effort Videos" }
      ], statsSource: "Average multiplier by effort level. Sample sizes: 1,610 Low, 1,230 Medium, 663 High effort videos." },

      { type: "callout", content: "Medium effort tends to outperform slightly — but the differences are modest. What matters more is content-format fit: high production works for some styles, authenticity for others." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@prodsicc/video/7540158307105852686", handle: "prodsicc", hook: "No verbal hook — pure production showcase", views: 10400000, likes: 1200000, multiplier: "5,662x", followers: 22100 },

      { type: "paragraph", content: "@prodsicc achieved the highest multiplier in our database (5,662x) with pure production content — no verbal hook, no trending sound, just compelling music creation. With 22K followers, this video hit 10.4M views." },

      { type: "heading", content: "Posting Timing: Some Patterns Emerge" },
      { type: "paragraph", content: "We analyzed posting patterns across 3,728 viral videos. Some timing patterns appear, though content quality matters far more:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "Tuesday", label: "Highest Avg (115x)" },
        { value: "Friday", label: "2nd Best (109x)" },
        { value: "Saturday", label: "Weekend (96x)" },
        { value: "Monday", label: "Lowest (41x)" }
      ], statsSource: "Average performance multiplier by day (UTC). Note: sample bias may affect results — viral videos may cluster on certain days." },

      { type: "paragraph", content: "Tuesday and Friday show slightly higher averages, but the variance within each day is enormous. A great video on Monday will outperform a mediocre one on Tuesday every time." },

      { type: "heading", content: "Real Examples: What 100x+ Performance Looks Like" },
      
      { type: "video-grid", content: "", gridTitle: "Elite Performers (100+ Viral Score)", gridDescription: "Verified examples from our database showing diverse paths to viral success", videos: [
        { url: "https://www.tiktok.com/@sonsofmystro/video/7549218651623197965", handle: "sonsofmystro", hook: "STREAM VIVALDI ROCK", views: 2400000, multiplier: "6,916x", contentStyle: "Instrument Performance" },
        { url: "https://www.tiktok.com/@kanekalon_kindle/video/7538256991010016525", handle: "kanekalon_kindle", hook: "No hook — pure energy", views: 2500000, multiplier: "6,272x", contentStyle: "Studio Lip-Sync" },
        { url: "https://www.tiktok.com/@emma.aire/video/7569113859928100126", handle: "emma.aire", hook: "I gotta stop looking at people like this 😂", views: 2100000, multiplier: "3,089x", contentStyle: "Selfie Lip-Sync" }
      ] },

      { type: "heading", content: "The Story Hook: Highest Engagement Format" },
      
      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@heysarahdoran/video/7573566986127543582", handle: "heysarahdoran", hook: "Shortly after we got engaged, my fiancé told me the one thing he would love more than anything is if I sang to him at our wedding...", views: 4400000, likes: 736500, multiplier: "2,207x", followers: 65200 },

      { type: "paragraph", content: "Story hooks create narrative tension. Viewers stay to see the resolution. This video achieved 736K likes with a 16.7% engagement rate — far above the 13.4% average." },

      { type: "heading", content: "What This Means For You" },
      { type: "paragraph", content: "The old playbook of 'make great music and hope it goes viral' doesn't work. Success on TikTok in 2026 requires:" },
      { type: "numbered-list", content: "", items: [
        "Speed — Hook viewers in under 1 second with curiosity + emotion",
        "Authenticity — Medium effort outperforms over-produced content",
        "Format experimentation — The highest performers defy templates",
        "Timing — Post on weekends, especially Saturday, and early morning (5-8am)",
        "Story hooks — Narrative tension drives the highest engagement rates"
      ] },

      { type: "callout", content: "Every video in this analysis is available in Wavebound's Explore library. Filter by viral score, content style, and multiplier to study what works in your genre." },
    ],
  },
  "best-posting-times-for-musicians-on-tiktok": {
    slug: "best-posting-times-for-musicians-on-tiktok",
    title: "The Best Posting Times for Musicians on TikTok (Data-Backed)",
    excerpt: "We analyzed 2,814 viral music posts to find the optimal posting windows.",
    category: "Data & Analytics",
    readTime: "8 min read",
    publishDate: "Jan 1, 2026",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=600&fit=crop",
    metaDescription: "Discover the best times to post music content on TikTok based on analysis of 2,814 viral posts.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "You've probably seen articles claiming 'post at 7pm on Tuesday for maximum engagement.' Those articles are guessing. We analyzed 2,814 viral short form music posts with verified timestamps to find what actually works." },
      
      { type: "stats-row", content: "", stats: [
        { value: "3,728", label: "Videos Analyzed" },
        { value: "318x", label: "Peak Hour Avg" },
        { value: "115x", label: "Best Day Avg" },
        { value: "41x", label: "Lowest Day Avg" }
      ], statsSource: "Performance multiplier analysis of viral short form music posts with verified posting timestamps. Results may reflect sample bias." },

      { type: "heading", content: "Day of Week Patterns" },
      { type: "paragraph", content: "Our data shows some variation by day, though individual video quality matters far more than posting day:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "115x", label: "Tuesday (426 videos)" },
        { value: "109x", label: "Friday (491 videos)" },
        { value: "96x", label: "Saturday (335 videos)" },
        { value: "41x", label: "Monday (836 videos)" }
      ], statsSource: "Average performance multiplier by day of week. High Monday volume with lower avg may indicate oversaturation." },

      { type: "callout", content: "Important nuance: Monday has 2.5x more videos than Saturday in our sample, but lower average performance. This could mean Monday is oversaturated, or that creators posting on Monday are less strategic. Correlation ≠ causation." },

      { type: "paragraph", content: "The full day-of-week ranking: Tuesday (115x) → Friday (109x) → Saturday (96x) → Sunday (75x) → Thursday (70x) → Wednesday (47x) → Monday (41x). But remember: a great video on any day beats a mediocre one on the 'best' day." },

      { type: "heading", content: "Peak Hours: Early Morning Shows Promise" },
      { type: "paragraph", content: "Hour-by-hour analysis reveals some patterns, though sample sizes vary significantly:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "318x", label: "5am UTC (57 videos)" },
        { value: "152x", label: "2pm UTC (119 videos)" },
        { value: "139x", label: "8am UTC (52 videos)" },
        { value: "137x", label: "9pm UTC (171 videos)" }
      ], statsSource: "Average performance multiplier by posting hour (UTC). Small sample sizes at some hours mean high variance." },

      { type: "paragraph", content: "The 5am UTC slot shows the highest average (318x), but with only 57 videos, this could be noise. The 9pm UTC slot (137x with 171 videos) may be more reliable. As always, test what works for your specific audience." },

      { type: "heading", content: "Genre Patterns in Our Data" },
      { type: "paragraph", content: "Different genres show different average performance, though this may reflect our sample composition rather than platform preferences:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "388x", label: "R&B + Pop" },
        { value: "222x", label: "Pop" },
        { value: "168x", label: "Rock + Alternative" },
        { value: "157x", label: "African" }
      ], statsSource: "Average performance by genre combination. Sample sizes vary (12-94 videos per genre). Results may not generalize." },

      { type: "callout", content: "These genre averages should be taken with caution — they reflect our specific sample of viral videos, not platform-wide trends. Your mileage may vary significantly." },

      { type: "heading", content: "The Honest Truth About Timing" },
      { type: "paragraph", content: "Here's what the data actually suggests — with appropriate caveats:" },
      
      { type: "subheading", content: "What Might Help" },
      { type: "numbered-list", content: "", items: [
        "Midweek (Tuesday-Friday) shows slightly higher averages than Monday in our data",
        "Early morning UTC times show promise, possibly catching multiple time zones",
        "Consistency matters more than chasing 'optimal' times — the algorithm learns your patterns",
        "Testing is essential — your audience may differ from our sample"
      ] },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@athousandmadthings/video/7565848653101796630", handle: "athousandmadthings", hook: "No hook — pure performance", views: 6700000, likes: 160000, multiplier: "1,633x", followers: 21300 },

      { type: "paragraph", content: "This live performance video from @athousandmadthings hit 6.7M views with a pure performance approach — no verbal hook, no trending sound. This is a reminder that great content transcends timing optimization." },

      { type: "heading", content: "Realistic Takeaways" },
      { type: "numbered-list", content: "", items: [
        "Don't obsess over timing — content quality matters 10x more",
        "If you have flexibility, Tuesday-Friday may have slight edges over Monday",
        "Test different times and track YOUR results over 2-4 weeks",
        "Consistency helps the algorithm learn when to push your content",
        "These patterns come from a curated sample of viral content — your results may differ"
      ] },

      { type: "callout", content: "Use Wavebound's Explore library to filter viral videos by posting day and time. Study what's working in your specific genre." },
    ],
  },
  "music-content-ideas-that-actually-work": {
    slug: "music-content-ideas-that-actually-work",
    title: "Music Content Ideas That Actually Get Views (Data-Backed)",
    excerpt: "We analyzed 3,728 viral videos to find patterns in what content formats tend to perform well.",
    category: "Content Ideas",
    readTime: "15 min read",
    publishDate: "Dec 28, 2025",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=600&fit=crop",
    metaDescription: "Data-backed content ideas for musicians. Patterns from 3,728 viral videos — with appropriate caveats.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "We've all been there. You know you need to post, but you have no idea what to create. We analyzed 3,728 viral short form music posts to identify patterns — though remember, what works varies significantly by niche and execution." },
      
      { type: "stats-row", content: "", stats: [
        { value: "3,728", label: "Videos Analyzed" },
        { value: "313x", label: "Meme Avg" },
        { value: "196x", label: "Production Avg" },
        { value: "133x", label: "Live + Hook Avg" }
      ], statsSource: "Average performance multiplier by content style. These are averages from viral content — individual results vary widely." },

      { type: "heading", content: "Format Performance Patterns" },
      { type: "paragraph", content: "Different formats show different average performance levels. But averages can be misleading — a well-executed 'average' format often beats a poorly-executed 'top' format:" },

      { type: "stats-row", content: "", stats: [
        { value: "313x", label: "Meme (32 videos)" },
        { value: "196x", label: "Production (45 videos)" },
        { value: "133x", label: "Live + Hook (87 videos)" },
        { value: "109x", label: "Studio Lip-Sync (69 videos)" }
      ], statsSource: "Sample sizes shown. Smaller samples = higher variance. Production and Live + Hook have more examples and may be more reliable benchmarks." },

      { type: "callout", content: "Important: These are averages from already-viral content. Most memes don't go viral. The question isn't 'what format is best?' but 'what format fits my skills and audience?'" },

      { type: "heading", content: "1. Meme Content (313x Average, 32 videos)" },
      { type: "paragraph", content: "Meme-style content shows the highest average, but with only 32 examples, this is a high-variance category. Here's an example:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@bb.flowerss/video/7570159645088697613", handle: "bb.flowerss", hook: "Meme format — no verbal hook needed", views: 5100000, likes: 176300, multiplier: "2,899x", followers: 22100 },

      { type: "paragraph", content: "@bb.flowerss hit 5.1M views with a meme format. But remember: for every viral meme, many more don't land. Memes require strong cultural awareness and timing." },

      { type: "heading", content: "2. Hook Statement Videos (78x Average, 74 videos)" },
      { type: "paragraph", content: "Hook statements — text or verbal hooks that create curiosity — are a more common and perhaps more reliable format:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@bodhikitt/video/7533692998350130463", handle: "bodhikitt", hook: "This post is proof you have an eclectic taste in music because you just happened upon a Black queer singer-songwriter who makes songs that settle in your chest like a deep breath of fresh air.", views: 1200000, likes: 95200, multiplier: "1,669x", followers: 95200 },

      { type: "paragraph", content: "This hook works because it's personal, specific, and creates a sense of discovery. The viewer feels they're part of something special." },

      { type: "heading", content: "3. Live Performance + Hook (133x Average, 87 videos)" },
      { type: "paragraph", content: "Live performance combined with a hook statement shows strong, consistent performance:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@teetheviolinist/video/7540588409463639327", handle: "teetheviolinist", hook: "Your orchestra teacher wasn't ready for this one 😂🎻", views: 6400000, likes: 1300000, multiplier: "4,958x", followers: 39100 },

      { type: "video-grid", content: "", gridTitle: "More Live Performance Examples", gridDescription: "Verified examples from our database", videos: [
        { url: "https://www.tiktok.com/@athousandmadthings/video/7565848653101796630", handle: "athousandmadthings", hook: "No hook — pure performance energy", views: 6700000, multiplier: "1,633x", contentStyle: "Live Performance" },
        { url: "https://www.tiktok.com/@yeemz.cello/video/7507331461570120990", handle: "yeemz.cello", hook: "No hook — cello performance", views: 2100000, multiplier: "1,820x", contentStyle: "Selfie Performance" }
      ] },

      { type: "heading", content: "4. Production/BTS Content (196x Average, 45 videos)" },
      { type: "paragraph", content: "Production and behind-the-scenes content shows strong performance. One notable example:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@prodsicc/video/7540158307105852686", handle: "prodsicc", hook: "No verbal hook — pure production showcase", views: 10400000, likes: 1200000, multiplier: "5,662x", followers: 22100 },

      { type: "paragraph", content: "@prodsicc achieved 5,662x their typical performance with pure production content — but this is an exceptional outlier. Most production videos perform closer to the 196x average." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@scoobystackz/video/7525699656110624030", handle: "scoobystackz", hook: "BTS studio session", views: 2000000, likes: 89000, multiplier: "1,784x", followers: 6289 },

      { type: "heading", content: "5. Story-Driven Content" },
      { type: "paragraph", content: "Story hooks often drive high engagement because viewers stay to see the resolution. This format can be powerful when executed well:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@heysarahdoran/video/7573566986127543582", handle: "heysarahdoran", hook: "Shortly after we got engaged, my fiancé told me the one thing he would love more than anything is if I sang to him at our wedding...", views: 4400000, likes: 736500, multiplier: "2,207x", followers: 65200 },

      { type: "paragraph", content: "This video achieved a 16.7% engagement rate — above the 13.4% average. Story hooks create emotional investment." },

      { type: "heading", content: "6. Genre-Blending Performance" },
      { type: "paragraph", content: "Content that crosses genre boundaries often stands out. Classical-rock, electronic-folk, or unexpected mashups can capture attention:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@sonsofmystro/video/7549218651623197965", handle: "sonsofmystro", hook: "STREAM VIVALDI ROCK", views: 2400000, likes: 178400, multiplier: "6,916x", followers: 71100 },

      { type: "paragraph", content: "@sonsofmystro's classical-rock crossover achieved a very high multiplier. Genre-blending may help content stand out in crowded feeds." },

      { type: "heading", content: "7. Relatability Hooks" },
      { type: "paragraph", content: "Turning limitations or common experiences into hooks creates instant connection:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@nikikinimusic/video/7549130453492550934", handle: "nikikinimusic", hook: "when the budget is non-existent", views: 1500000, likes: 118500, multiplier: "1,867x", followers: 10200 },

      { type: "heading", content: "Production Quality: A Nuanced View" },
      { type: "paragraph", content: "The relationship between production effort and performance isn't straightforward:" },

      { type: "stats-row", content: "", stats: [
        { value: "74x", label: "Medium Effort" },
        { value: "62x", label: "Low Effort" },
        { value: "60x", label: "High Effort" }
      ], statsSource: "Average multiplier by effort level. Sample: 1,230 Medium, 1,610 Low, 663 High effort videos." },

      { type: "callout", content: "Medium effort shows a slight edge, but differences are modest. Focus on content-audience fit rather than production value alone." },

      { type: "heading", content: "Realistic Content Strategy" },
      { type: "numbered-list", content: "", items: [
        "Start with what suits your skills — don't force formats that feel unnatural",
        "Test different approaches and track YOUR results over time",
        "Add hooks when possible — curiosity-building text can help any format",
        "Don't overproduce if authenticity is your strength",
        "Remember: these are patterns from viral content, not guarantees"
      ] },

      { type: "callout", content: "Explore Wavebound's library to see examples in your specific genre. Filter by content style to find inspiration that fits your approach." },
    ],
  },
  "tiktok-vs-instagram-reels-for-musicians": {
    slug: "tiktok-vs-instagram-reels-for-musicians",
    title: "TikTok vs Instagram Reels: Where Should Musicians Focus in 2026?",
    excerpt: "We analyzed 5,605 viral videos across both platforms. Here's what the data says.",
    category: "Platform Strategy",
    readTime: "10 min read",
    publishDate: "Dec 25, 2025",
    image: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=1200&h=600&fit=crop",
    metaDescription: "Data from 5,605 viral videos reveals which platform performs better for musicians in 2026.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "Both TikTok and Instagram Reels want musicians on their platforms. But they're not identical — and the data reveals significant differences in performance, engagement, and discovery potential." },
      
      { type: "stats-row", content: "", stats: [
        { value: "5,610", label: "Total Videos" },
        { value: "3,728", label: "TikTok Videos" },
        { value: "1,882", label: "Reels Videos" },
        { value: "2.5x", label: "TikTok Engagement Edge" }
      ], statsSource: "Wavebound's viral video database comparing TikTok and Instagram Reels performance." },

      { type: "heading", content: "The Numbers: TikTok vs Reels" },
      { type: "paragraph", content: "Here's the performance data from our database. Important caveat: these are already-viral videos, so they represent the ceiling, not typical performance:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "1.2M", label: "TikTok Avg Views" },
        { value: "950K", label: "Reels Avg Views" },
        { value: "13.4%", label: "TikTok Engagement" },
        { value: "5.3%", label: "Reels Engagement" }
      ], statsSource: "Average views and engagement rate (likes/views) for viral short form music posts. This reflects our sample of high-performers, not platform-wide averages." },

      { type: "callout", content: "TikTok's average engagement rate (13.4%) is 2.5x higher than Reels (5.3%) in our sample. But this compares viral videos to viral videos — the platforms have different user behaviors." },

      { type: "paragraph", content: "Both platforms can deliver significant reach. TikTok shows higher engagement in our data, but Reels may be better suited for certain content types and audiences." },

      { type: "heading", content: "Top Performers: TikTok" },
      { type: "paragraph", content: "Here are real examples of elite TikTok performance from our database:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@prodsicc/video/7540158307105852686", handle: "prodsicc", hook: "Production showcase", views: 10400000, likes: 1200000, multiplier: "5,662x", followers: 22100 },

      { type: "video-grid", content: "", gridTitle: "More TikTok Elite Performers", gridDescription: "Creators who achieved 1,000x+ their typical performance", videos: [
        { url: "https://www.tiktok.com/@sonsofmystro/video/7549218651623197965", handle: "sonsofmystro", hook: "STREAM VIVALDI ROCK", views: 2400000, multiplier: "6,916x", contentStyle: "Instrument Performance" },
        { url: "https://www.tiktok.com/@teetheviolinist/video/7540588409463639327", handle: "teetheviolinist", hook: "Your orchestra teacher wasn't ready", views: 6400000, multiplier: "4,958x", contentStyle: "Live Performance" },
        { url: "https://www.tiktok.com/@emma.aire/video/7569113859928100126", handle: "emma.aire", hook: "I gotta stop looking at people like this", views: 2100000, multiplier: "3,089x", contentStyle: "Selfie Lip-Sync" }
      ] },

      { type: "heading", content: "Top Performers: Instagram Reels" },
      { type: "paragraph", content: "Reels can also deliver massive reach. Here are verified examples:" },

      { type: "stats-row", content: "", stats: [
        { value: "9.2M", label: "Top Reel Views" },
        { value: "1,806x", label: "Top Multiplier" },
        { value: "102.6", label: "Top Viral Score" },
        { value: "83,910", label: "Creator Followers" }
      ], statsSource: "Top performing Instagram Reel in our database: @stephencastillo13 with a Selfie Lip-Sync." },

      { type: "video-grid", content: "", gridTitle: "Instagram Reels Elite Performers", gridDescription: "Verified high-performers from our Reels database", videos: [
        { url: "https://www.instagram.com/reel/DTD4ncsEdq0/", handle: "stephencastillo13", hook: "Emotional lip-sync", views: 9169757, multiplier: "1,806x", contentStyle: "Selfie Lip-Sync" },
        { url: "https://www.instagram.com/reel/DEliBPFR40n/", handle: "publicworksnj", hook: "Pro camera performance", views: 9337471, multiplier: "853x", contentStyle: "Pro Camera Lip-Sync" },
        { url: "https://www.instagram.com/reel/DMG46nxtut4/", handle: "official.adjustthesails", hook: "The 30 year old emo dude's wife...", views: 6828818, multiplier: "239x", contentStyle: "Meme" }
      ] },

      { type: "heading", content: "Content Style Comparison" },
      { type: "paragraph", content: "Different content styles perform differently on each platform:" },
      
      { type: "subheading", content: "Works Better on TikTok:" },
      { type: "list", content: "", items: [
        "Production/BTS content — 335x average on TikTok vs limited Reels data",
        "Meme content — 1,168x average, native to TikTok culture",
        "Hook statement videos — The platform's format encourages text hooks",
        "Experimental/hybrid formats — TikTok rewards originality more"
      ] },

      { type: "subheading", content: "Works Better on Reels:" },
      { type: "list", content: "", items: [
        "Pro camera lip-sync — More polished aesthetic fits Instagram",
        "Cinematic edits — Instagram audience expects higher production",
        "Story-driven content — Kiesza's comeback story hit 3.9M views",
        "Lifestyle-adjacent music content — Cross-pollination with fashion/beauty"
      ] },

      { type: "heading", content: "The Discovery Algorithm Difference" },
      { type: "paragraph", content: "TikTok's algorithm appears more aggressive about showing content to non-followers. Our data shows a significant ceiling difference:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "13,196x", label: "TikTok Max Multiplier" },
        { value: "1,806x", label: "Reels Max Multiplier" },
        { value: "71x", label: "TikTok Avg Multiplier" },
        { value: "14x", label: "Reels Avg Multiplier" }
      ], statsSource: "Maximum and average performance multiplier achieved on each platform in our database." },

      { type: "callout", content: "TikTok's ceiling appears much higher — but this doesn't mean Reels is 'worse.' The platforms serve different purposes, and our sample may not fully represent Reels' potential." },

      { type: "heading", content: "Platform Strategy: Consider Your Goals" },
      { type: "paragraph", content: "Rather than a rigid 70/30 split, consider what you're optimizing for:" },

      { type: "subheading", content: "Consider TikTok-first if you:" },
      { type: "list", content: "", items: [
        "Want maximum viral potential (our data shows higher ceilings)",
        "Create production/BTS content or experimental formats",
        "Target younger audiences (16-34)",
        "Are building an audience from scratch",
        "Are comfortable with lower production polish"
      ] },

      { type: "subheading", content: "Consider Reels-first if you:" },
      { type: "list", content: "", items: [
        "Already have an established Instagram following",
        "Create polished, cinematic content",
        "Target 25+ demographics",
        "Want to cross-pollinate with fashion/lifestyle audiences",
        "Prefer story-driven, emotionally resonant content"
      ] },

      { type: "heading", content: "The Nuanced Bottom Line" },
      { type: "numbered-list", content: "", items: [
        "In our data, TikTok shows higher engagement (13.4% vs 5.3%) and higher viral ceiling (13,196x vs 1,806x)",
        "But our sample may not fully represent either platform — these are curated viral videos",
        "Reels likely performs better for polished content and audiences already on Instagram",
        "Cross-posting works, but adapt content for each platform's native format",
        "Test both — the 'best' platform depends on your specific content and audience"
      ] },

      { type: "callout", content: "Explore viral content from both platforms in Wavebound's library. Filter by platform to study what works in your specific genre." },
    ],
  },
  "how-to-analyze-your-tiktok-performance": {
    slug: "how-to-analyze-your-tiktok-performance",
    title: "How to Actually Analyze Your TikTok Performance (Beyond Views)",
    excerpt: "We analyzed 3,100+ viral videos to reveal which metrics actually predict success.",
    category: "Data & Analytics",
    readTime: "10 min read",
    publishDate: "Jan 30, 2026",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    metaDescription: "Data from 3,100+ viral short form music posts reveals which TikTok metrics actually predict success — and which are just vanity numbers.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "Every artist has had a video hit 100K views with zero impact on their career. Views are vanity metrics — they feel good but don't necessarily translate to fans, streams, or revenue. We analyzed 3,728 viral short form music posts to find patterns, though individual results vary widely." },
      
      { type: "stats-row", content: "", stats: [
        { value: "3,728", label: "Videos Analyzed" },
        { value: "556x", label: "Elite Tier Avg" },
        { value: "13.4%", label: "Avg Engagement" },
        { value: "71x", label: "Overall Avg" }
      ], statsSource: "Data from Wavebound's viral video database. Note: this is a curated sample of high-performers, not platform-wide data." },

      { type: "heading", content: "The Viral Score Framework" },
      { type: "paragraph", content: "Not all viral videos are equal. We developed a viral score (0-100+) that measures how much a video outperformed the creator's typical content. Here's how different tiers perform in our data:" },

      { type: "stats-row", content: "", stats: [
        { value: "90-100+", label: "Elite Tier" },
        { value: "556x", label: "Avg Multiplier" },
        { value: "2.7M", label: "Avg Views" },
        { value: "373", label: "Videos" }
      ], statsSource: "Elite tier (90+ viral score): These videos massively outperform the creator's baseline." },

      { type: "paragraph", content: "Videos scoring 90+ in our viral score achieve an average 556x performance multiplier — meaning they get 556 times more views than the creator's typical video. But note: these are exceptional outliers." },

      { type: "callout", content: "Key context: The gap between tiers is massive. Elite performers (90+) average 556x. Strong performers (70-89) average only 24x. This shows how rare true breakout performance is." },

      { type: "stats-row", content: "", stats: [
        { value: "24x", label: "Strong (70-89)" },
        { value: "4x", label: "Moderate (50-69)" },
        { value: "1x", label: "Low (<50)" },
        { value: "2,356", label: "Strong Tier Videos" }
      ], statsSource: "Average performance multiplier by viral score tier across 3,728 videos." },

      { type: "heading", content: "Follower Size and Performance" },
      { type: "paragraph", content: "Smaller creators show higher average multipliers in our data — but interpret this carefully:" },

      { type: "stats-row", content: "", stats: [
        { value: "77x", label: "Nano (1K-10K)" },
        { value: "69x", label: "Micro (10K-100K)" },
        { value: "58x", label: "Mid (100K-1M)" },
        { value: "35x", label: "Mega (1M+)" }
      ], statsSource: "Average performance multiplier by follower tier. Note: larger creators have higher baselines, making large multipliers harder to achieve." },

      { type: "paragraph", content: "Nano creators (1K-10K followers) average 77x multipliers vs 35x for mega creators. But this is partly mathematical: if you typically get 100 views, 100K views is 1,000x. If you typically get 1M views, 100K views is 0.1x. Larger creators need proportionally larger numbers to achieve high multipliers." },

      { type: "callout", content: "Important nuance: This doesn't mean small creators 'perform better' in absolute terms. It means the multiplier metric favors smaller baselines. Both metrics matter." },

      { type: "heading", content: "Engagement Rate Patterns" },
      { type: "paragraph", content: "Engagement rate (likes ÷ views) shows how much viewers connected with content. Our database averages 13.4%, but this varies by format and creator size." },

      { type: "paragraph", content: "In our sample, the overall average engagement is 13.4%. Videos significantly above or below this may indicate different audience dynamics — but 'good' engagement depends heavily on your content type and goals." },

      { type: "heading", content: "Content Styles in Our Data" },
      { type: "paragraph", content: "Different content formats show varying performance levels, though individual execution matters more than format choice:" },

      { type: "stats-row", content: "", stats: [
        { value: "313x", label: "Meme" },
        { value: "196x", label: "Production" },
        { value: "133x", label: "Live + Hook" },
        { value: "78x", label: "Lyric Video" }
      ], statsSource: "Average multiplier by content style. Memes show highest average but represent only ~1% of our sample." },

      { type: "paragraph", content: "Meme content shows the highest average (313x), but only 32 videos in our database use this style. Production content (196x with 45 videos) may be more reliably replicable. The key insight: there's no single 'best' format — execution and audience fit matter most." },

      { type: "heading", content: "Real Examples: Elite Performers" },
      { type: "paragraph", content: "Let's look at actual videos that achieved elite viral scores. Each demonstrates a different path to massive outperformance:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@prodsicc/video/7540158307105852686", handle: "prodsicc", hook: "Production showcase with no verbal hook", views: 10400000, likes: 1200000, multiplier: "5,662x", followers: 22100, caption: "A producer with 22K followers hitting 10.4M views through pure production content." },

      { type: "paragraph", content: "@prodsicc achieved a 5,662x multiplier with pure production content — no verbal hook, no trend riding, just compelling music creation. With 22K followers, this video hit 10.4M views and 1.2M likes. Viral score: 107.5 (Elite tier)." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@emma.aire/video/7569113859928100126", handle: "emma.aire", hook: "I gotta stop looking at people like this 😂", views: 2100000, likes: 59000, multiplier: "3,089x", followers: 1508, caption: "A creator with just 1,500 followers achieving 2.1M views through relatability." },

      { type: "paragraph", content: "@emma.aire had only 1,508 followers when this selfie lip-sync hit 2.1M views — a 3,089x multiplier. The hook creates instant relatability. Viral score: 104.9. This demonstrates how micro creators can achieve elite performance through emotional resonance." },

      { type: "video-grid", content: "", gridTitle: "More Elite Performers (90+ Viral Score)", gridDescription: "Verified examples from our database showing diverse paths to viral success", videos: [
        { url: "https://www.tiktok.com/@teetheviolinist/video/7540588409463639327", handle: "teetheviolinist", hook: "Your orchestra teacher wasn't ready for this one 😂🎻", views: 6400000, multiplier: "4,958x", contentStyle: "Live Performance" },
        { url: "https://www.tiktok.com/@sonsofmystro/video/7549218651623197965", handle: "sonsofmystro", hook: "STREAM VIVALDI ROCK", views: 2400000, multiplier: "6,916x", contentStyle: "Instrument Performance" },
        { url: "https://www.tiktok.com/@bb.flowerss/video/7570159645088697613", handle: "bb.flowerss", hook: "Meme format", views: 5100000, multiplier: "2,898x", contentStyle: "Meme" }
      ] },

      { type: "heading", content: "How to Use These Insights" },
      { type: "subheading", content: "1. Calculate Your Performance Multiplier" },
      { type: "paragraph", content: "Track your median views over your last 20 posts. For each new video, divide its views by your median. A 10x+ multiplier indicates strong performance; 50x+ is excellent; 100x+ is elite territory." },

      { type: "subheading", content: "2. Track Engagement Rate, Not Just Views" },
      { type: "paragraph", content: "Divide likes by views for each video. If you're consistently below 10%, your content is being shown but not resonating. Above 15% indicates strong audience connection." },

      { type: "callout", content: "Benchmark: Under 10% engagement = reach problem. 10-15% = solid. Above 15% = exceptional connection." },

      { type: "subheading", content: "3. Context Matters for Follower Comparisons" },
      { type: "paragraph", content: "Smaller creators show higher multipliers partly because multipliers favor low baselines. Compare yourself to creators of similar size, not platform-wide averages." },

      { type: "subheading", content: "4. Experiment, But Track Results" },
      { type: "paragraph", content: "Format patterns in our data suggest variety in approaches. Test different styles, but track what works for YOUR specific audience and content type." },

      { type: "heading", content: "Honest Takeaways" },
      { type: "numbered-list", content: "", items: [
        "Views alone mean little — track performance multiplier (views ÷ your median)",
        "Elite performance (90+ score) is rare — only 10% of our sample. Don't expect every video to go viral",
        "Smaller creators show higher multipliers, but this is partly mathematical — compare to similar-sized accounts",
        "Format averages are helpful benchmarks, but individual execution matters more",
        "This data comes from a curated sample of viral content — your results will vary"
      ] },

      { type: "heading", content: "Explore Your Own Analytics" },
      { type: "paragraph", content: "Every video in this analysis is available in Wavebound's Explore library. Filter by viral score, follower tier, and content style to benchmark your performance against verified data." },
    ],
  },
  "viral-hooks-for-music-content": {
    slug: "viral-hooks-for-music-content",
    title: "The Anatomy of a Viral Hook: What Makes Short Form Music Content Explode",
    excerpt: "We analyzed 3,700+ viral short form music posts from our database. Here's what we found.",
    category: "Data-Backed Research",
    readTime: "12 min read",
    publishDate: "Jan 30, 2026",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=600&fit=crop",
    metaDescription: "Real data from 3,700+ viral short form music posts reveals which content styles, hooks, and formats actually go viral.",
    author: { name: "Wavebound Research", role: "Data & Analytics Team" },
    sections: [
      { type: "intro", content: "Every advice article tells you to \"hook viewers in the first 3 seconds.\" But what does that actually mean? We analyzed 3,728 viral short form music posts in our database to find patterns — though remember, these are already-successful videos, so survivorship bias applies." },
      
      { type: "stats-row", content: "", stats: [
        { value: "3,728", label: "Videos Analyzed" },
        { value: "1.2M", label: "Avg Views/Video" },
        { value: "13.4%", label: "Avg Engagement" },
        { value: "71x", label: "Avg Multiplier" }
      ], statsSource: "Data from Wavebound's viral video database. Note: this is a curated sample of high-performers, not a random sample." },

      { type: "heading", content: "Content Style Performance: The Numbers" },
      { type: "paragraph", content: "Different content formats show varying average performance, though individual execution matters more than format choice:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "313x", label: "Memes (32 videos)" },
        { value: "196x", label: "Production (45 videos)" },
        { value: "133x", label: "Live + Hook (87 videos)" },
        { value: "109x", label: "Studio Lip-Sync (69 videos)" }
      ], statsSource: "Average performance multiplier by content style. Sample sizes shown — smaller samples have higher variance." },

      { type: "paragraph", content: "Meme-style content shows the highest average at 313x, but only 32 videos use this style. Hook Statement + Live Performance (133x with 87 videos) is more common and may be more reliably replicable." },

      { type: "callout", content: "Important context: Selfie Lip-Sync is the most common format (281 videos) but averages 54x. This doesn't mean it's 'bad' — it means the field is crowded and standing out requires exceptional execution." },

      { type: "heading", content: "The Effort Question" },
      { type: "paragraph", content: "Does higher production quality lead to better performance? The relationship is nuanced:" },
      
      { type: "stats-row", content: "", stats: [
        { value: "74x", label: "Medium Effort" },
        { value: "62x", label: "Low Effort" },
        { value: "60x", label: "High Effort" }
      ], statsSource: "Average multiplier by effort level. Sample: 1,610 Low, 1,230 Medium, 663 High effort videos." },

      { type: "paragraph", content: "Medium effort content shows a slight edge, but the differences are modest. This suggests that production value alone doesn't determine success — content-audience fit and hook quality matter more." },

      { type: "heading", content: "Top Performing Hook Patterns" },
      { type: "paragraph", content: "We analyzed the actual text hooks used in videos. Here are real examples from creators who achieved massive performance multipliers:" },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@teetheviolinist/video/7540588409463639327", handle: "teetheviolinist", hook: "Your orchestra teacher wasn't ready for this one 😂🎻", views: 6400000, likes: 1300000, multiplier: "4,958x", followers: 39100 },

      { type: "paragraph", content: "This video from @teetheviolinist achieved almost 5,000x their typical performance. The hook works because it creates immediate intrigue — what did they play that would shock an orchestra teacher? It combines curiosity with humor." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@nikikinimusic/video/7549130453492550934", handle: "nikikinimusic", hook: "when the budget is non-existent", views: 1500000, likes: 118500, multiplier: "1,867x", followers: 10200 },

      { type: "paragraph", content: "@nikikinimusic turned a limitation into a hook. With only 10K followers, this video hit 1.5M views. The \"no budget\" angle creates relatability and curiosity — how did they pull it off?" },

      { type: "heading", content: "Hook Types That Drive Performance" },
      
      { type: "subheading", content: "1. The POV Hook (2,500x+ average)" },
      { type: "paragraph", content: "\"POV:\" hooks dominate our top performers. They immediately place the viewer in a scenario, creating emotional investment before the music even starts." },
      
      { type: "video-grid", content: "", gridTitle: "Top POV Hook Examples", gridDescription: "Real examples from our database with verified performance data", videos: [
        { url: "https://www.tiktok.com/@mrfidoooo/video/7458932683620601094", handle: "mrfidoooo", hook: "POV: YOU DROPPED THE BIGGEST SONG IN AFRICA 🔥🔥🔥", views: 6000000, multiplier: "2,582x", contentStyle: "Selfie Lip-Sync" },
        { url: "https://www.tiktok.com/@tylerlwsmusic/video/7514321108166806806", handle: "tylerlwsmusic", hook: "POV: ur waiting for me to finish cooking dinner", views: 10900000, multiplier: "2,065x", contentStyle: "Selfie Performance" },
        { url: "https://www.tiktok.com/@emma.aire/video/7569113859928100126", handle: "emma.aire", hook: "I gotta stop looking at people like this 😂", views: 2100000, multiplier: "3,089x", contentStyle: "Selfie Lip-Sync" }
      ] },

      { type: "subheading", content: "2. The Story Hook (2,200x average)" },
      { type: "paragraph", content: "Hooks that start with a personal story create narrative tension. Viewers stay to see the resolution." },

      { type: "tiktok-embed", content: "", tiktokUrl: "https://www.tiktok.com/@heysarahdoran/video/7573566986127543582", handle: "heysarahdoran", hook: "Shortly after we got engaged, my fiancé told me the one thing he would love more than anything is if I sang to him at our wedding...", views: 4400000, likes: 736500, multiplier: "2,207x", followers: 65200 },

      { type: "subheading", content: "3. The Challenge/Flex Hook (1,900x average)" },
      { type: "paragraph", content: "Hooks that position the content as a creative challenge or demonstrate unexpected skill capture attention through surprise." },

      { type: "video-grid", content: "", gridTitle: "Challenge & Skill Flex Hooks", videos: [
        { url: "https://www.tiktok.com/@sonsofmystro/video/7549218651623197965", handle: "sonsofmystro", hook: "STREAM VIVALDI ROCK", views: 2400000, multiplier: "6,916x", contentStyle: "Instrument Performance" },
        { url: "https://www.tiktok.com/@blondetingfm/video/7574537661893922070", handle: "blondetingfm", hook: "Real Voices > AI Voices", views: 2100000, multiplier: "1,957x", contentStyle: "Selfie Performance" },
        { url: "https://www.tiktok.com/@sayfalse_funks/video/7542203527708413240", handle: "sayfalse_funks", hook: "I can already see the edits 😭", views: 3200000, multiplier: "1,894x", contentStyle: "Production" }
      ] },

      { type: "heading", content: "Genre Performance Comparison" },
      { type: "paragraph", content: "Does genre affect virality? Here's what the data shows:" },

      { type: "stats-row", content: "", stats: [
        { value: "387x", label: "R&B/Pop" },
        { value: "222x", label: "Pure Pop" },
        { value: "168x", label: "Rock/Alt" },
        { value: "157x", label: "African" }
      ], statsSource: "Average performance multiplier by primary genre classification" },

      { type: "callout", content: "R&B and Pop crossover content shows the highest average performance at 387x — but this is based on 12 videos. Rock/Alternative, with 19 videos at 168x, shows more consistent repeatability." },

      { type: "heading", content: "Actionable Takeaways" },
      { type: "numbered-list", content: "", items: [
        "Lead with POV or story hooks — they consistently outperform other formats by 3-5x",
        "Low-to-medium effort content performs as well or better than high-production videos",
        "Meme-style content has the highest ceiling but lowest volume — test it sparingly",
        "Hook Statement format (106x avg) is the most reliably replicable high-performer",
        "The hook text matters as much as the visual — curiosity + emotion + relatability"
      ] },

      { type: "heading", content: "Explore More in Wavebound" },
      { type: "paragraph", content: "Every video mentioned in this article is available in our Explore library. Filter by genre, content style, and performance level to find inspiration for your next viral video." },
    ],
  },
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const post = slug ? blogPostsContent[slug] : null;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Share this article",
        description: window.location.href,
      });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Article Not Found | Wavebound Blog" description="This article could not be found." />
        <AppHeader />
        <main className="pt-32 pb-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">Sorry, we couldn't find the article you're looking for.</p>
            <Button onClick={() => navigate('/blog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const renderSection = (section: BlogSection, index: number) => {
    switch (section.type) {
      case "intro":
        return (
          <p key={index} className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-light mb-8">
            {section.content}
          </p>
        );
      case "heading":
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-bold text-foreground mt-16 mb-6 pb-3 border-b border-border">
            {section.content}
          </h2>
        );
      case "subheading":
        return (
          <h3 key={index} className="text-lg md:text-xl font-semibold text-foreground mt-10 mb-4">
            {section.content}
          </h3>
        );
      case "paragraph":
        return (
          <p key={index} className="text-foreground/80 leading-relaxed mb-6 text-lg">
            {section.content}
          </p>
        );
      case "list":
        return (
          <ul key={index} className="space-y-3 mb-8 ml-1">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/80 text-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      case "numbered-list":
        return (
          <ol key={index} className="space-y-4 mb-8">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-4 text-foreground/80 text-lg">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        );
      case "callout":
        return (
          <div key={index} className="my-8 p-6 rounded-xl bg-primary/5 border-l-4 border-primary">
            <p className="text-foreground font-medium text-lg leading-relaxed">
              {section.content}
            </p>
          </div>
        );
      case "quote":
        return (
          <blockquote key={index} className="my-8 pl-6 border-l-4 border-primary italic text-foreground/70 text-xl">
            {section.content}
          </blockquote>
        );
      case "stat-card":
        return (
          <div key={index} className="my-6">
            <BlogStatCard
              value={section.statValue || ""}
              label={section.statLabel || ""}
              description={section.statDescription}
              icon={section.statIcon}
              color={section.statColor}
            />
          </div>
        );
      case "stats-row":
        return (
          <BlogStatsRow
            key={index}
            stats={section.stats || []}
            source={section.statsSource}
          />
        );
      case "tiktok-embed":
        return (
          <BlogTikTokEmbed
            key={index}
            tiktokUrl={section.tiktokUrl || ""}
            handle={section.handle || ""}
            hook={section.hook}
            views={section.views}
            likes={section.likes}
            multiplier={section.multiplier}
            followers={section.followers}
            caption={section.caption}
          />
        );
      case "video-grid":
        return (
          <BlogVideoGrid
            key={index}
            title={section.gridTitle || ""}
            description={section.gridDescription}
            videos={section.videos || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} | Wavebound Blog`}
        description={post.metaDescription}
      />
      <AppHeader />
      
      <main>
        {/* Hero Section - Ada.cx inspired */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-background dark:from-amber-950/20 dark:via-orange-950/10 dark:to-background">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Category & Read Time */}
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-6">
                <span className="text-primary font-medium">{post.category}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-8 max-w-3xl mx-auto">
                {post.title}
              </h1>

              {/* Author */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">{post.author.name}</p>
                  <p className="text-muted-foreground text-xs">{post.author.role}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-5xl mx-auto px-6 -mt-4"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
            <img
              src={blogImages[post.slug] || post.image}
              alt={post.title}
              className="w-full aspect-[2/1] object-cover"
            />
          </div>
        </motion.div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Meta bar */}
            <div className="flex items-center justify-between pb-8 mb-8 border-b border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {post.publishDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>

            {/* Content Sections */}
            {post.sections.map((section, index) => renderSection(section, index))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-20 p-8 md:p-10 rounded-3xl bg-primary/5 border border-primary/10 text-center"
          >
            <h3 className="text-2xl font-bold mb-3 text-foreground">
              Put these strategies into action
            </h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Wavebound shows you exactly what's working in your genre right now. Explore viral content, analyze your profile, and get AI-powered content ideas.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/discover')} 
                className="gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25"
              >
                Explore the Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/blog')}
                className="rounded-full"
              >
                More Articles
              </Button>
            </div>
          </motion.div>

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all articles
            </Button>
          </div>
        </article>
      </main>

      <FooterSection />
    </div>
  );
};

export default BlogPost;
