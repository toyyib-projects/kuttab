"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { 
  BookOpen, ArrowRight, Search, BookMarked, 
  FileText, Target, X, Users, ShoppingBag, 
  Handshake, ChevronLeft, ChevronRight, RefreshCw, Book, Quote
} from "lucide-react"

// Utility for Testimonial Highlights
const Highlight = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-bold bg-secondary/20 text-primary px-1 py-0.5 rounded ${className}`}>
    {children}
  </span>
);

export default function Home() {
  const router = useRouter()
  
  // --- Salaf Quotes Logic ---
  const [currentQuote, setCurrentQuote] = useState(0)
  const quotes = [
    { quote: "Knowledge is not what is memorized. Knowledge is what benefits.", author: "Imam Ash-Shafi'i", bio: "d. 204 AH" },
    { quote: "If I were to say that I have seen a man who has memorized all the knowledge in the world, I would not be lying.", author: "Ibn al-Mubarak", bio: "d. 181 AH" },
    { quote: "The one who does not have a book in his pocket, wisdom will not settle in his heart.", author: "Al-Jahiz", bio: "d. 255 AH" }
  ]

  // --- How to Read Logic ---
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [mobileStep, setMobileStep] = useState(0)
  const [currentReadSlide, setCurrentReadSlide] = useState(0)

  const readingSteps = [
    { id: 0, step: "01", title: "Niyyah", front: "The Foundation", back: "Purify your intention. Start with a prayer for beneficial knowledge ($Ilm Nafi')." },
    { id: 1, step: "02", title: "Taharah", front: "Outer Readiness", back: "Approach your books in a state of Wudu to show respect for the sacred text." },
    { id: 2, step: "03", title: "Active Reading", front: "Engagement", back: "Don't just scan. Interrogate the text. Why did the author choose this specific word?" },
    { id: 3, step: "04", title: "Annotation", front: "The Hashiyah", back: "Write your own notes in the margins. This links your thought process to the text." },
    { id: 4, step: "05", title: "Glossary", front: "Vocabulary", back: "Record every unfamiliar word. A master of a science is a master of its terminology." },
    { id: 5, step: "06", title: "Review", front: "The Muraja'ah", back: "Knowledge is like a wild animal; it must be tied down through constant revision." }
  ]

  const toggleFlip = (id: number) => {
    setFlippedCards(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth font-sans">
      {/* 1. Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Kuttab Logo" width={120} height={40} className="h-8 w-auto object-contain" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#how-to-read" className="text-sm font-medium hover:text-primary transition-colors">Methodology</Link>
            <Link href="#community" className="text-sm font-medium hover:text-primary transition-colors">Community</Link>
          </div>
          <button onClick={() => router.push("/auth/login")} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">Deep Learning with Purpose</h1>
            <p className="text-lg opacity-90 max-w-lg mx-auto md:mx-0">A platform for serious students of knowledge to read, annotate, and master Islamic texts.</p>
            <div className="flex items-center gap-2 bg-white rounded-full p-2 max-w-md shadow-lg mx-auto md:mx-0">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input type="text" placeholder="Search Islamic texts..." className="flex-1 px-2 py-2 outline-none bg-transparent text-primary placeholder:text-gray-400" />
              <button className="bg-primary text-primary-foreground p-2 rounded-full hover:scale-105 transition-transform"><ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="hidden md:block h-80 bg-white/10 rounded-[2rem] border border-white/20 backdrop-blur-sm" />
        </div>
      </section>

      {/* 3. The Kuttab Method (Corrected Stack Section) */}
      <section id="how-to-read" className="py-24 bg-muted/20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">The Kuttab Method</h2>
          <p className="text-muted-foreground">Mastery through dedicated tradition.</p>
        </div>

        {/* Mobile View: Aceternity Stack */}
        <div className="md:hidden flex flex-col items-center">
          <div className="relative h-[400px] w-full max-w-[300px]">
            {readingSteps.map((card, index) => {
              const distance = index - mobileStep;
              const isActive = index === mobileStep;
              const isBehind = index > mobileStep && index <= mobileStep + 2;
              const isVisible = isActive || isBehind;

              return (
                <div
                  key={card.id}
                  onClick={() => isActive && toggleFlip(card.id)}
                  style={{
                    zIndex: readingSteps.length - index,
                    transform: isVisible 
                      ? `translateY(${distance * -15}px) scale(${1 - distance * 0.05})`
                      : `translateY(20px) scale(0.9)`,
                    opacity: isVisible ? 1 - distance * 0.2 : 0,
                  }}
                  className={`absolute inset-0 transition-all duration-500 transform-style-3d ${isActive ? "cursor-pointer" : "pointer-events-none"} ${flippedCards.includes(card.id) ? "rotate-y-180" : ""}`}
                >
                  <div className="absolute inset-0 bg-white border border-border rounded-2xl p-8 flex flex-col justify-between backface-hidden shadow-xl">
                    <div>
                      <span className="text-4xl font-black text-secondary/20">{card.step}</span>
                      <h3 className="text-2xl font-bold mt-4 text-primary">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{card.front}</p>
                    </div>
                    {isActive && <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse"><RefreshCw size={14} /> Tap to flip</div>}
                  </div>
                  <div className="absolute inset-0 h-full w-full rounded-2xl bg-secondary p-8 text-secondary-foreground rotate-y-180 backface-hidden flex items-center justify-center text-center shadow-xl">
                    <p className="text-lg italic leading-relaxed">{card.back}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-10 mt-10 items-center">
            <button onClick={() => mobileStep > 0 && setMobileStep(m => m - 1)} className={`p-4 bg-white rounded-full shadow-lg ${mobileStep === 0 ? 'opacity-20' : 'opacity-100'}`}><ChevronLeft /></button>
            <span className="font-bold text-primary">{mobileStep + 1} / 6</span>
            <button onClick={() => mobileStep < 5 && setMobileStep(m => m + 1)} className={`p-4 bg-white rounded-full shadow-lg ${mobileStep === 5 ? 'opacity-20' : 'opacity-100'}`}><ChevronRight /></button>
          </div>
        </div>

        {/* Desktop View: Slides */}
        <div className="hidden md:block max-w-6xl mx-auto relative px-12">
          <div className="overflow-hidden py-8">
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentReadSlide * 100}%)` }}>
              {[readingSteps.slice(0, 3), readingSteps.slice(3, 6)].map((slideCards, slideIdx) => (
                <div key={slideIdx} className="min-w-full grid grid-cols-3 gap-8 px-4">
                  {slideCards.map((card) => (
                    <div key={card.id} className="h-[380px] perspective-1000">
                      <div onClick={() => toggleFlip(card.id)} className={`relative h-full w-full rounded-2xl transition-all duration-500 transform-style-3d cursor-pointer shadow-sm ${flippedCards.includes(card.id) ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 bg-white border border-border rounded-2xl p-8 flex flex-col justify-between backface-hidden">
                          <div><span className="text-4xl font-black text-secondary/20">{card.step}</span><h3 className="text-xl font-bold mt-4 text-primary">{card.title}</h3></div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium"><RefreshCw size={14} /> Flip</div>
                        </div>
                        <div className="absolute inset-0 h-full w-full rounded-2xl bg-secondary p-8 text-secondary-foreground rotate-y-180 backface-hidden flex items-center justify-center text-center p-6 shadow-inner"><p className="text-md italic leading-relaxed">{card.back}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setCurrentReadSlide(0)} className={`absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white shadow-xl rounded-full ${currentReadSlide === 0 ? 'opacity-30' : 'opacity-100'}`}><ChevronLeft /></button>
          <button onClick={() => setCurrentReadSlide(1)} className={`absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-white shadow-xl rounded-full ${currentReadSlide === 1 ? 'opacity-30' : 'opacity-100'}`}><ChevronRight /></button>
        </div>
      </section>

      {/* 4. Testimonials (New Section based on your demo) */}
      {/* <section className="py-24 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-1 px-0 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold text-primary">Student Stories</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-muted/30 rounded-3xl border border-border/50">
              <Quote className="w-10 h-10 text-primary/20 mb-4" />
              <p className="text-lg leading-relaxed mb-6">
                Kuttab has completely changed how I approach <Highlight>classical texts</Highlight>. The annotation features allow me to preserve the <Highlight>Hashiyah</Highlight> just like the students of old did.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full" />
                <div>
                  <h4 className="font-bold text-primary">Zaid Al-Farsi</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Fiqh Student</p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-muted/30 rounded-3xl border border-border/50">
              <Quote className="w-10 h-10 text-primary/20 mb-4" />
              <p className="text-lg leading-relaxed mb-6">
                I never thought a digital platform could feel this <Highlight>sacred and focused</Highlight>. It’s more than a reader; it’s a digital <Highlight>Madrasah</Highlight> for my personal library.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full" />
                <div>
                  <h4 className="font-bold text-primary">Maryam Siddiqui</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Arabic Scholar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* 5. Salaf Quotes Carousel */}
      <section id="quotes" className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <Book className="w-12 h-12 mx-auto text-secondary mb-8 opacity-50" />
          <div className="relative min-h-[300px] flex items-center justify-center">
            <button onClick={() => setCurrentQuote(prev => (prev - 1 + quotes.length) % quotes.length)} className="absolute left-0 p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={32}/></button>
            <div key={currentQuote} className="px-12 animate-fade-in">
              <p className="text-2xl md:text-3xl font-serif italic mb-6 leading-relaxed">"{quotes[currentQuote].quote}"</p>
              <h4 className="text-xl font-bold text-secondary">{quotes[currentQuote].author}</h4>
              <p className="text-sm opacity-60 tracking-widest uppercase">{quotes[currentQuote].bio}</p>
            </div>
            <button onClick={() => setCurrentQuote(prev => (prev + 1) % quotes.length)} className="absolute right-0 p-2 hover:bg-white/10 rounded-full"><ChevronRight size={32}/></button>
          </div>
        </div>
      </section>

      {/* 6. Community Section (Restored Cards) */}
      <section id="community" className="px-4 py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 relative z-10">
            <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">Coming Soon</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-primary">Community</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">We are building a space where knowledge is shared and students connect.</p>
          </div>
          
          <div className="relative min-h-[450px]">
            {/* Restored Background Cards */}
            <div className="grid md:grid-cols-3 gap-8 opacity-20 grayscale pointer-events-none">
              <div className="p-8 bg-white rounded-2xl border border-border flex flex-col items-center text-center">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Share Materials</h3>
                <p className="text-sm text-muted-foreground">Collaborate on study guides and summaries with students globally.</p>
              </div>
              <div className="p-8 bg-white rounded-2xl border border-border flex flex-col items-center text-center">
                <Handshake className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Borrow Books</h3>
                <p className="text-sm text-muted-foreground">A peer-to-peer system for lending physical copies within your city.</p>
              </div>
              <div className="p-8 bg-white rounded-2xl border border-border flex flex-col items-center text-center">
                <ShoppingBag className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Marketplace</h3>
                <p className="text-sm text-muted-foreground">Buy and sell used classical texts to fellow students worldwide.</p>
              </div>
            </div>

            {/* Waitlist Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white border border-primary/20 p-8 md:p-10 rounded-3xl shadow-2xl text-center max-w-md mx-4">
                <h4 className="text-2xl font-black text-primary mb-2">Join the Waitlist</h4>
                <p className="text-sm text-muted-foreground mb-8">Get notified as soon as the Community Hub launches.</p>
                <div className="flex flex-col gap-3">
                  <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 rounded-xl border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  <button className="bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Notify Me</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-background border-t border-border py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image src="/logo.png" alt="Kuttab" width={120} height={40} />
            <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
              Preserving the tradition of Islamic learning through modern technology.
            </p>
          </div>
          <div className="flex gap-12 text-sm font-medium">
            <div className="flex flex-col gap-4">
              <span className="text-primary font-bold uppercase tracking-wider text-xs">Platform</span>
              <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="#how-to-read" className="hover:text-primary transition-colors">Methodology</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-primary font-bold uppercase tracking-wider text-xs">Support</span>
              <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            © 2026 Kuttab Learning. Made for the seekers of knowledge.
          </p>
        </div>
      </footer>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}