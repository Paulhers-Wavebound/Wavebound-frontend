import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import FooterSection from "@/components/FooterSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";


// Founder photos
import adenStage from "@/assets/aden-stage.jpg";
import adenStudio from "@/assets/aden-studio.jpg";
import paulStudio from "@/assets/paul-studio.jpg";
import paulSynths from "@/assets/paul-synths.png";
import adenKid from "@/assets/aden-kid.jpg";
import paulKid from "@/assets/paul-kid-new.jpg";
import foundersTogether from "@/assets/founders-together.jpg";
import studioDrums from "@/assets/studio-drums.jpg";
import studioSynths from "@/assets/studio-synths.jpg";
import studioWindow from "@/assets/studio-window.jpg";
import studioMics from "@/assets/studio-mics.jpg";
import studioConsole from "@/assets/studio-console.jpg";

const About = () => {
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ["start end", "end start"]
  });
  
  // Different parallax speeds for each image
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-background">
      <AppHeader />

      {/* Hero Section - Large photo left, text right */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Large Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <img 
                src={foundersTogether} 
                alt="Paul Hers and Aden Foyer" 
                className="w-full h-[500px] object-cover rounded-lg shadow-xl"
                style={{ objectPosition: 'center 30%' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 rounded-b-lg py-2 px-4">
                <p className="text-[11px] text-white/70 text-center tracking-wide">
                  Paul & Aden celebrating diamond records in France
                </p>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:pl-8"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Our Story</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal text-foreground mb-6 leading-tight">
                Hi, we're Wavebound
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Two best friends from Norway. After a decade making music, we're on a mission to help artists spend less time strategizing — and more time creating.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Origin Story - Text center, photos scattered */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left floating photos */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="ml-auto"
              >
                <div className="w-48 h-72 rounded-lg shadow-lg lg:-rotate-3 overflow-hidden">
                  <img
                    src={paulKid}
                    alt="Young Paul"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">Paul, age 5</p>
              </motion.div>
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                src={studioMics}
                alt="Studio microphones"
                className="w-40 h-32 object-cover rounded-lg shadow-md ml-8 lg:rotate-2"
              />
            </div>

            {/* Center text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 text-center py-12"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Our mission</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-8 leading-tight">
                Built for artists, by artists
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
                We spent countless hours scrolling TikTok and Reels, saving videos to messy documents, trying to decode what worked. It wasn't sustainable — we were too busy researching to actually make music. So we built something better.
              </p>
            </motion.div>

            {/* Right floating photos */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <img
                  src={adenKid}
                  alt="Young Aden"
                  className="w-44 h-56 object-cover rounded-lg shadow-lg lg:rotate-3"
                />
                <p className="text-[11px] text-muted-foreground mt-2 text-center">Aden, age 4</p>
              </motion.div>
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                src={studioConsole}
                alt="Studio console"
                className="w-48 h-36 object-cover rounded-lg shadow-md ml-auto lg:-rotate-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Paul Section - Photo right, text left */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Co-founder</p>
              <h3 className="text-3xl md:text-4xl font-serif text-foreground mb-1">Paul Hers</h3>
              <p className="text-sm text-muted-foreground mb-2">500M+ Streams • Multiplatinum Producer</p>
              <a href="https://instagram.com/paulhers" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors mb-6 font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                @paulhers
              </a>
              <p className="text-foreground/80 leading-relaxed">
                The architect behind the analytics. Paul has produced hundreds of millions of streams and now channels that obsession into building smarter tools for artists.
              </p>
            </motion.div>

            {/* Photos stacked */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 relative"
            >
              <img 
                src={paulStudio} 
                alt="Paul Hers in studio" 
                className="w-full h-80 object-cover rounded-lg shadow-xl"
              />
              <img 
                src={paulSynths} 
                alt="Paul producing" 
                className="w-2/3 h-40 object-cover rounded-lg shadow-lg absolute -bottom-8 -left-8 border-4 border-stone-50 dark:border-background"
                style={{ objectPosition: 'center 60%' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Aden Section - Photo left, text right */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Photos stacked */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src={adenStage} 
                alt="Aden Foyer on stage" 
                className="w-full h-80 object-cover rounded-lg shadow-xl"
              />
              <img 
                src={adenStudio} 
                alt="Aden in studio" 
                className="w-2/3 h-40 object-cover rounded-lg shadow-lg absolute -bottom-8 -right-8 border-4 border-stone-50 dark:border-background"
                style={{ objectPosition: 'center 30%' }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:pl-8"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Co-founder</p>
              <h3 className="text-3xl md:text-4xl font-serif text-foreground mb-1">Aden Foyer</h3>
              <p className="text-sm text-muted-foreground mb-2">200M+ Streams • Diamond Records</p>
              <a href="https://instagram.com/adenfoyer" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors mb-6 font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                @adenfoyer
              </a>
              <p className="text-foreground/80 leading-relaxed">
                Aden's been the artist in the room — nervous before TV performances, refreshing analytics at 2am, figuring out what to post next. He built Wavebound for that version of himself.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10+", label: "Years together" },
              { number: "600M+", label: "Combined streams" },
              { number: "💎", label: "Diamond records" },
              { number: "100M+", label: "Social views" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <p className="text-3xl font-serif text-foreground mb-1">{stat.number}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission - Large quote style */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground/90 leading-relaxed">
              "We wanted to use AI for something genuinely good for artists. Something that frees up time and brain power so you can focus on what actually matters — <em>making human art.</em>"
            </p>
          </motion.div>
        </div>
      </section>

      {/* Giving Back */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-10 shadow-sm border border-border"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Always for artists</p>
            <p className="text-foreground/80 leading-relaxed mb-6">
              In 2020, we gave $10,000 to independent artists who needed a push. We've also put out free production tutorials on YouTube that reached a few million people.
            </p>
            <div className="border-l-2 border-border pl-6">
              <p className="text-foreground/90 italic">
                That part of us isn't going anywhere.
              </p>
            </div>
            <a 
              href="https://youtu.be/vwAry-iInQ0?si=uGsf2M8hI4_QB2H0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Watch the original giveaway
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Studio Gallery - Parallax */}
      <section className="py-24 px-6 overflow-hidden" ref={galleryRef}>
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-12"
          >
            Some of our favorite studios throughout the years
          </motion.p>

          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <motion.div 
              className="col-span-2 overflow-hidden rounded-lg"
              style={{ y: y1 }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                src={studioDrums}
                alt="Norway studio"
                className="w-full h-48 md:h-64 object-cover"
              />
            </motion.div>
            <motion.div 
              className="overflow-hidden rounded-lg"
              style={{ y: y2 }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                src={studioWindow}
                alt="Studio window"
                className="w-full h-48 md:h-64 object-cover"
              />
            </motion.div>
            <motion.div 
              className="overflow-hidden rounded-lg"
              style={{ y: y3 }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                src={studioSynths}
                alt="Studio synths"
                className="w-full h-40 md:h-52 object-cover"
              />
            </motion.div>
            <motion.div 
              className="col-span-2 overflow-hidden rounded-lg"
              style={{ y: y4 }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                src={paulSynths}
                alt="Paul's setup"
                className="w-full h-40 md:h-52 object-cover"
                style={{ objectPosition: 'center 60%' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
              Ready to find what works?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the artists already using Wavebound to discover viral content strategies.
            </p>
            <Button 
              onClick={() => navigate('/discover')}
              className="bg-foreground hover:bg-foreground/90 text-background px-8 py-6 rounded-full"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default About;
