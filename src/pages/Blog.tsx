import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import waveboundLogo from "@/assets/wavebound-logo.png";
import blogViralTiktok from "@/assets/blog-viral-tiktok.jpg";
import blogTiktokVsReels from "@/assets/blog-tiktok-vs-reels.jpg";
import blogAnalyzePerformance from "@/assets/blog-analyze-performance.jpg";
import blogPostingTimes from "@/assets/blog-posting-times.jpg";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishDate: string;
  image: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "how-to-go-viral-on-tiktok-as-a-musician-2026",
    title: "How to Go Viral on TikTok as a Musician in 2026",
    excerpt: "The algorithm has changed. Here's what's actually working for independent artists right now — based on data from 15,000+ viral music videos.",
    category: "TikTok Strategy",
    readTime: "8 min read",
    publishDate: "Jan 3, 2026",
    image: blogViralTiktok,
    featured: true,
  },
  {
    id: "2",
    slug: "best-posting-times-for-musicians-on-tiktok",
    title: "The Best Posting Times for Musicians on TikTok (Data-Backed)",
    excerpt: "We analyzed 10,000+ music posts to find the optimal posting windows. Spoiler: it's not when you think.",
    category: "Data & Analytics",
    readTime: "5 min read",
    publishDate: "Jan 1, 2026",
    image: blogPostingTimes,
  },
  {
    id: "3",
    slug: "music-content-ideas-that-actually-work",
    title: "47 Music Content Ideas That Actually Get Views",
    excerpt: "Stuck on what to post? These content formats are driving millions of views for artists in every genre.",
    category: "Content Ideas",
    readTime: "12 min read",
    publishDate: "Dec 28, 2025",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
  },
  {
    id: "4",
    slug: "tiktok-vs-instagram-reels-for-musicians",
    title: "TikTok vs Instagram Reels: Where Should Musicians Focus in 2026?",
    excerpt: "Both platforms want your music. Here's how to decide where to invest your time based on your goals and genre.",
    category: "Platform Strategy",
    readTime: "7 min read",
    publishDate: "Dec 25, 2025",
    image: blogTiktokVsReels,
  },
  {
    id: "5",
    slug: "how-to-analyze-your-tiktok-performance",
    title: "How to Actually Analyze Your TikTok Performance (Beyond Views)",
    excerpt: "Views don't pay bills. Learn which metrics actually matter for growing your music career on TikTok.",
    category: "Data & Analytics",
    readTime: "6 min read",
    publishDate: "Dec 22, 2025",
    image: blogAnalyzePerformance,
  },
  {
    id: "6",
    slug: "viral-hooks-for-music-videos",
    title: "The Anatomy of a Viral Hook: What Makes Music Videos Explode",
    excerpt: "We broke down 500 viral music videos to find the patterns. Here's what the first 3 seconds have in common.",
    category: "Content Strategy",
    readTime: "9 min read",
    publishDate: "Dec 19, 2025",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop",
  },
];

const Blog = () => {
  const navigate = useNavigate();
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog | Wavebound - Music Marketing Tips & TikTok Strategy"
        description="Learn how to grow your music career on TikTok and Instagram. Data-backed strategies, content ideas, and marketing tips for independent artists."
      />
      <AppHeader />
      
      <main>
        {/* Hero Section - Ada.cx inspired with soft background */}
        <section className="pt-28 pb-10 bg-gradient-to-b from-sky-50 via-indigo-50/50 to-background dark:from-background dark:via-background dark:to-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo + Blog badge - tighter spacing, sexier styling */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <img src={waveboundLogo} alt="Wavebound" className="w-10 h-10" loading="lazy" />
                <span className="text-2xl font-semibold text-primary tracking-tight">
                  Blog
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Music marketing insights that drive real{" "}
                <span className="italic text-primary">
                  growth
                </span>
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-10 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            {/* Featured Post - Horizontal card like Ada.cx */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10"
              >
                <div 
                  onClick={() => handlePostClick(featuredPost.slug)}
                  className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                      <img 
                        src={featuredPost.image} 
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="text-sm text-muted-foreground">
                          {featuredPost.category}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-sm text-muted-foreground">
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-muted-foreground mb-8 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        Read
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Divider */}
            <div className="border-t border-border mb-8" />

            {/* Article Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + index * 0.05 }}
                  onClick={() => handlePostClick(post.slug)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-xl mb-5">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <span>{post.category}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </motion.article>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-20 text-center py-16 px-8 rounded-3xl bg-primary/5 border border-primary/10"
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                Ready to put these strategies into action?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Wavebound helps you find viral content ideas and analyze what's working in your genre.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              >
                Explore the Library
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default Blog;
