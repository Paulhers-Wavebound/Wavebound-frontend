import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import paulStudio from "@/assets/paul-studio.jpg";
import adenStudio from "@/assets/aden-studio.jpg";

const TIERS = {
  free: {
    name: "Basic",
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavings: 0,
    price_id_monthly: null,
    price_id_annual: null,
    product_id: null,
    description: "Try Wavebound risk-free",
    features: [
      "2 audio analyses",
      "1 profile audit",
      "1 content plan",
      "Community support",
    ],
    footer: "No credit card required",
  },
  basic: {
    name: "Starter",
    monthlyPrice: 12,
    annualPrice: 8,
    annualSavings: 33,
    price_id_monthly: "price_1SanwTRHyWAnNpnl7hDUG0VT",
    price_id_annual: "price_1SanwTRHyWAnNpnl7hDUG0VT",
    product_id: "prod_TXtjxZEFGWRA7A",
    description: "For artists just getting started",
    inheritFrom: "Everything in Basic, plus:",
    features: [
      "5 audio analyses per month",
      "5 profile audits per month",
      "5 content plans per month",
      "Email support",
    ],
    footer: "Perfect for testing the waters",
  },
  pro: {
    name: "Pro",
    monthlyPrice: 29,
    annualPrice: 19,
    annualSavings: 33,
    price_id_monthly: "price_1Salh6RHyWAnNpnlSfQMnPjx",
    price_id_annual: "price_1Salh6RHyWAnNpnlSfQMnPjx",
    product_id: "prod_TXrPgIZHzT9TwO",
    description: "For growing artists",
    inheritFrom: "Everything in Starter, plus:",
    features: [
      "Unlimited audio analyses",
      "Unlimited profile audits",
      "Unlimited content plans",
      "Priority support",
      "Early access to new features",
    ],
    footer: "The best fit for growing artists",
  },
  enterprise: {
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavings: 0,
    price_id_monthly: null,
    price_id_annual: null,
    product_id: null,
    description: "For labels & agencies",
    inheritFrom: "Everything in Pro, plus:",
    features: [
      "Custom API integrations",
      "Dedicated account manager",
      "White-glove onboarding",
      "Custom reporting",
    ],
    footer: "Tailored to your organization",
  },
};

const FAQ_ITEMS = [
  {
    question: "What is Wavebound?",
    answer: "Wavebound is a content intelligence platform for music artists and creators. It helps you analyze your audio, audit your social profiles, and generate data-driven content plans based on viral trends in your genre."
  },
  {
    question: "How does the audio analysis work?",
    answer: "Upload any audio file and our AI analyzes its genre, mood, tempo, and other musical characteristics. We then match it against our database of viral content to suggest content strategies that resonate with your specific sound."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or hidden fees. Your access will continue until the end of your current billing period."
  },
  {
    question: "What's included in the profile audit?",
    answer: "Our profile audit analyzes your TikTok content to identify your best-performing content categories, optimal posting times, engagement patterns, and provides actionable insights to improve your strategy."
  },
  {
    question: "How accurate are the content recommendations?",
    answer: "Our recommendations are based on analyzing millions of viral videos across genres. While results vary, creators using our platform have reported significant improvements in engagement and reach."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a satisfaction guarantee. If you're not happy with Wavebound within the first 7 days, contact us for a full refund."
  },
];

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Welcome to Wavebound!",
        description: "Your subscription is now active.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Checkout canceled",
        description: "No charges were made.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await checkSubscription();
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkSubscription();
      } else {
        setSubscription(null);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleCheckout = async (tier: "basic" | "pro", period: "monthly" | "annual") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setCheckoutLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier, period },
      });
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getCurrentTier = () => {
    if (!subscription?.product_id) return null;
    if (subscription.product_id === TIERS.basic.product_id) return "basic";
    if (subscription.product_id === TIERS.pro.product_id) return "pro";
    return null;
  };

  const currentTier = getCurrentTier();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout withHeaderPadding>
      <SEOHead 
        title="Pricing & Plans"
        description="Choose a Wavebound plan that fits your needs. From basic audio analysis to unlimited pro features for serious music creators."
        canonical="/subscription"
      />
      
      <div className="pt-8 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose the plan that's right for you
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Start free, upgrade when you're ready
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                billingPeriod === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">
                -33%
              </span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">per user / month • Prices in USD</p>
        </div>

        {/* Pricing Cards - 4 Column Layout */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {/* Free Card */}
            <div className="relative bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              {/* Spacer to align with Pro card's badge */}
              <div className="h-[52px]" />
              <div className="p-6 pt-0 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                  {TIERS.free.name}
                </h2>
                <p className="text-muted-foreground text-sm text-center mb-5 min-h-[36px]">
                  {TIERS.free.description}
                </p>

                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">Free</span>
                </div>
                <div className="h-4 mb-4" />

                <Button 
                  onClick={() => user ? navigate('/analyze') : navigate('/auth')}
                  variant="outline"
                  className="w-full h-11 rounded-lg mb-5 font-medium group border-border text-foreground hover:bg-muted"
                >
                  {user ? "Get started" : "Sign up free"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                <div className="border-t border-dashed border-border my-4" />
                <ul className="space-y-2.5 mb-4 flex-1">
                  {TIERS.free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs text-muted-foreground text-center">{TIERS.free.footer}</p>
              </div>
            </div>

            {/* Starter Card */}
            <div className="relative bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              {/* Spacer to align with Pro card's badge */}
              <div className="h-[52px]" />
              <div className="p-6 pt-0 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                  {TIERS.basic.name}
                </h2>
                <p className="text-muted-foreground text-sm text-center mb-5 min-h-[36px]">
                  {TIERS.basic.description}
                </p>

                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">
                    ${billingPeriod === "annual" ? TIERS.basic.annualPrice : TIERS.basic.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">/user/mo</span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-xs text-green-600 text-center mb-4">Save {TIERS.basic.annualSavings}%</p>
                )}
                {billingPeriod !== "annual" && <div className="h-4 mb-4" />}

                {currentTier === 'basic' ? (
                  <div className="space-y-2 mb-5">
                    <div className="text-center p-2 bg-muted rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Renews {subscription?.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}</p>
                    </div>
                    <Button 
                      onClick={handleManageSubscription} 
                      variant="outline" 
                      className="w-full h-11 rounded-lg border-border text-foreground hover:bg-muted"
                      disabled={portalLoading}
                    >
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleCheckout('basic', billingPeriod)} 
                    variant="outline"
                    className="w-full h-11 rounded-lg mb-5 font-medium group border-border text-foreground hover:bg-muted"
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === 'basic' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Get started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                )}

                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs font-medium text-foreground mb-2">{TIERS.basic.inheritFrom}</p>
                <ul className="space-y-2.5 mb-4 flex-1">
                  {TIERS.basic.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs text-muted-foreground text-center">{TIERS.basic.footer}</p>
                {currentTier === 'basic' && (
                  <div className="mt-3 flex justify-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      Current plan
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pro Card - Featured */}
            <div className="relative bg-card rounded-2xl border-2 border-foreground shadow-xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              <div className="flex justify-center pt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
                  Most popular
                </span>
              </div>

              <div className="p-6 pt-3 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                  {TIERS.pro.name}
                </h2>
                <p className="text-muted-foreground text-sm text-center mb-5 min-h-[36px]">
                  {TIERS.pro.description}
                </p>

                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">
                    ${billingPeriod === "annual" ? TIERS.pro.annualPrice : TIERS.pro.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">/user/mo</span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-xs text-green-600 text-center mb-4">Save {TIERS.pro.annualSavings}%</p>
                )}
                {billingPeriod !== "annual" && <div className="h-4 mb-4" />}

                {currentTier === 'pro' ? (
                  <div className="space-y-2 mb-5">
                    <div className="text-center p-2 bg-muted rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Renews {subscription?.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}</p>
                    </div>
                    <Button 
                      onClick={handleManageSubscription} 
                      variant="outline" 
                      className="w-full h-11 rounded-lg border-border text-foreground hover:bg-muted"
                      disabled={portalLoading}
                    >
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleCheckout('pro', billingPeriod)} 
                    className="w-full h-11 rounded-lg mb-5 font-medium group bg-foreground hover:bg-foreground/90 text-background"
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === 'pro' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Get started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                )}

                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs font-medium text-foreground mb-2">{TIERS.pro.inheritFrom}</p>
                <ul className="space-y-2.5 mb-4 flex-1">
                  {TIERS.pro.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs text-muted-foreground text-center">{TIERS.pro.footer}</p>
                {currentTier === 'pro' && (
                  <div className="mt-3 flex justify-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      Current plan
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enterprise Card */}
            <div className="relative bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/40 to-muted-foreground/20" />
              {/* Spacer to align with Pro card's badge */}
              <div className="h-[52px]" />
              <div className="p-6 pt-0 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                  {TIERS.enterprise.name}
                </h2>
                <p className="text-muted-foreground text-sm text-center mb-5 min-h-[36px]">
                  {TIERS.enterprise.description}
                </p>

                <div className="flex items-baseline justify-center gap-1 mb-5">
                  <span className="text-xl font-semibold text-foreground">Custom</span>
                </div>

                <Button 
                  onClick={() => window.location.href = 'mailto:contact@wavebound.io?subject=Enterprise Inquiry'}
                  className="w-full h-11 rounded-lg mb-5 font-medium group bg-muted hover:bg-muted/80 text-foreground border border-border"
                >
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs font-medium text-foreground mb-2">{TIERS.enterprise.inheritFrom}</p>
                <ul className="space-y-2.5 mb-4 flex-1">
                  {TIERS.enterprise.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-dashed border-border my-4" />
                <p className="text-xs text-muted-foreground text-center">{TIERS.enterprise.footer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>Cancel anytime. No questions asked. Secure payment powered by Stripe.</p>
        </div>

        {/* FAQ Section - Arcus Style */}
        <div className="max-w-5xl mx-auto px-4 mt-24">
          {/* FAQ Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-1 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-500 font-medium">Frequently asked questions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Got Questions? Don't worry,<br />
              we've got the Answers.
            </h2>
          </div>

        {/* FAQ Grid */}
          {/* FAQ Grid */}
          <div className="grid md:grid-cols-2 gap-4 items-start">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={item.question}
                className="border border-border rounded-xl overflow-hidden bg-card self-start h-fit"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenFaq(openFaq === index ? null : index);
                  }}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{item.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 border-t border-border/50">
                    <p className="text-foreground/90 text-sm leading-relaxed pt-4">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ============ Talk with Founders Section ============ */}
        <div className="max-w-5xl mx-auto px-4 mt-24 mb-16">
          <div className="bg-black text-white p-12 md:p-20">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-8">Direct Access</p>
              
              <h3 className="text-3xl md:text-5xl font-light mb-8 leading-tight">
                Speak with the people<br />who built the product.
              </h3>

              <p className="text-neutral-400 mb-16 max-w-xl">
                No intermediaries. No support queues. Just a direct line to us.
              </p>

              {/* Both founders displayed together */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-12 mb-12">
                <div className="flex items-center gap-4">
                  <img 
                    src={paulStudio} 
                    alt="Paul Hers"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-700"
                    style={{ objectPosition: '85% 20%' }}
                  />
                  <div className="text-left">
                    <h4 className="text-lg font-medium">Paul Hers</h4>
                    <p className="text-neutral-500 text-sm">Founder, Songwriter/Producer</p>
                  </div>
                </div>

                <span className="text-neutral-600 hidden sm:block">&</span>

                <div className="flex items-center gap-4">
                  <img 
                    src={adenStudio} 
                    alt="Aden Foyer"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-700"
                    style={{ objectPosition: 'center 30%' }}
                  />
                  <div className="text-left">
                    <h4 className="text-lg font-medium">Aden Foyer</h4>
                    <p className="text-neutral-500 text-sm">Founder, Artist</p>
                  </div>
                </div>
              </div>

              {/* Single CTA to contact both */}
              <div className="text-center">
                <a 
                  href="mailto:founders@wavebound.io?subject=Question about Wavebound"
                  className="group inline-flex items-center gap-3 border border-neutral-700 px-8 py-4 hover:border-neutral-500 hover:bg-neutral-900 transition-all"
                >
                  <Mail className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-white font-medium">Contact the Founders</span>
                  <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </a>
                <p className="text-neutral-600 text-sm mt-4">founders@wavebound.io</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </AppLayout>
  );
};

export default Subscription;
