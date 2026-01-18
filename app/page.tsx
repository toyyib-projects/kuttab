"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, ArrowRight, Menu, Search, Star, Users, Zap, BookMarked, FileText, Target, X } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">kuttab</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
          </div>

          <button 
            onClick={() => router.push("/auth/login")}
            className="hidden md:block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Sign In
          </button>

          <button className="md:hidden p-2">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Hero Section - Large background */}
      <section className="bg-secondary text-secondary-foreground min-h-screen flex items-center py-12 md:py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left content */}
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Deep Learning with Purpose
              </h1>
              
              <p className="text-base md:text-lg opacity-95">
                A thoughtfully designed platform for serious Islamic scholars and learners to read, annotate, and master Islamic texts.
              </p>

              {/* Search bar */}
              <div className="flex items-center gap-2 bg-white rounded-full p-2 max-w-md">
                <Search className="w-5 h-5 text-gray-400 ml-3" />
                <input 
                  type="text"
                  placeholder="Search Islamic texts..."
                  className="flex-1 px-2 py-2 outline-none bg-transparent text-primary placeholder-gray-400 text-sm md:text-base"
                />
                <button className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 transition-opacity">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {["Quranic Studies", "Hadith", "Islamic Law", "Theology"].map((tag) => (
                  <button
                    key={tag}
                    className="px-3 py-1 md:px-4 md:py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs md:text-sm transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                <button 
                  onClick={() => router.push("/auth/signup")}
                  className="px-6 md:px-8 py-2.5 md:py-3 bg-white text-primary rounded-lg hover:opacity-90 transition-opacity font-medium text-sm md:text-base flex items-center justify-center gap-2"
                >
                  Start Learning <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="px-6 md:px-8 py-2.5 md:py-3 border-2 border-white rounded-lg hover:bg-white/10 transition-colors font-medium text-sm md:text-base"
                >
                  Learn More
                </button>
              </div>

              {/* Social proof */}
              <div className="pt-8 md:pt-12">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="w-6 h-6 md:w-8 md:h-8 bg-white/30 rounded-full border-2 border-white"></div>
                    ))}
                  </div>
                  <p className="text-xs md:text-sm">
                    <span className="font-bold">Join thousands</span> of learners
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Hero image/illustration - Hidden on mobile */}
            <div className="hidden md:flex items-center justify-end">
              <div className="relative w-full h-64 lg:h-80 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl flex items-center justify-center border-2 border-white/30">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">Islamic Knowledge Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Excellent Reader</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to engage deeply with Islamic texts. Advanced tools designed for scholars, students, and lifelong learners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: BookMarked,
                title: "Upload & Organize",
                desc: "Add PDFs directly or link to online resources. Build your personal Islamic library with ease."
              },
              {
                icon: FileText,
                title: "Rich Annotations",
                desc: "Highlight, underline, and add detailed notes. Create interactive margins for deep engagement."
              },
              {
                icon: Target,
                title: "Reading Goals",
                desc: "Set intentional goals, track progress, and celebrate milestones. Stay motivated on your journey."
              },
              {
                icon: Star,
                title: "Personal Glossary",
                desc: "Build a glossary of new terms and concepts. Strengthen your Islamic vocabulary progressively."
              },
              {
                icon: Zap,
                title: "Track Progress",
                desc: "Monitor reading time, pages completed, and learning streaks. Measure meaningful progress."
              },
              {
                icon: Users,
                title: "Community",
                desc: "Share resources, insights, and reflections with fellow scholars and learners worldwide."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 md:p-8 border border-border hover:border-secondary hover:shadow-lg transition-all group">
                <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-secondary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg md:text-xl font-bold mb-3 text-primary">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses Kuttab */}
      <section id="about" className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-center">Who Uses Kuttab</h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Islamic Scholars",
                desc: "Access comprehensive texts, maintain detailed research notes, and build knowledge progressively."
              },
              {
                title: "University Students",
                desc: "Study Quranic sciences, Islamic history, and jurisprudence with advanced annotation tools."
              },
              {
                title: "Lifelong Learners",
                desc: "Embark on a meaningful Islamic learning journey with structured resources and community support."
              },
              {
                title: "Educators",
                desc: "Organize curriculum, track student progress, and share curated Islamic resources seamlessly."
              },
              {
                title: "Memorization Seekers",
                desc: "Record recitations, track memorization progress, and verify accuracy with original texts."
              },
              {
                title: "Arabic Enthusiasts",
                desc: "Master Arabic vocabulary, study classical texts, and understand linguistic nuances deeply."
              }
            ].map((user, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                <h3 className="text-lg md:text-xl font-bold mb-3">{user.title}</h3>
                <p className="opacity-95 text-sm md:text-base">{user.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Kuttab - Carousel Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-center">Why Use Kuttab</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto text-sm md:text-base">
            Wisdom from the Salaf on the importance of reading and learning
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                quote: "The best of you are those who learn the Quran and teach it.",
                author: "Prophet Muhammad (ﷺ)"
              },
              {
                quote: "Seeking knowledge is a duty upon every Muslim.",
                author: "Prophet Muhammad (ﷺ)"
              },
              {
                quote: "Knowledge is three things: a verse that is to be read, a Sunnah that is to be followed, and a tradition that is to be learned.",
                author: "Ibn Abbas (رضي الله عنهما)"
              },
              {
                quote: "The scholars are the heirs of the Prophets.",
                author: "Abu Daud"
              }
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-secondary to-primary rounded-xl p-6 md:p-8 text-secondary-foreground border border-secondary/30 transform hover:scale-105 transition-transform cursor-default">
                <p className="text-base md:text-lg font-semibold mb-4 leading-relaxed">"{item.quote}"</p>
                <p className="text-xs md:text-sm opacity-90">— {item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-center">What Kuttab Users Say</h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "Fatimah Al-Rashid",
                role: "Quranic Studies Scholar",
                review: "Kuttab transformed how I engage with Islamic texts. The annotation tools are incredibly intuitive, and the community aspect has deepened my understanding immensely.",
                rating: 5
              },
              {
                name: "Hassan Muhammad",
                role: "Islamic Law Student",
                review: "As a law student, I needed a platform that could handle complex texts with detailed notes. Kuttab exceeded all my expectations with its thoughtful design.",
                rating: 5
              },
              {
                name: "Aisha Malik",
                role: "Independent Learner",
                review: "This platform made my Islamic learning journey structured and meaningful. The reading goals feature keeps me motivated and accountable.",
                rating: 5
              }
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-xl p-6 md:p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic text-sm md:text-base">"{review.review}"</p>
                <div>
                  <p className="font-bold text-primary text-sm md:text-base">{review.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Begin Your Learning Journey</h2>
          <p className="text-base md:text-lg opacity-95 mb-8 md:mb-12 max-w-2xl mx-auto">
            Join thousands of Islamic scholars and learners transforming their understanding of Islamic knowledge through purposeful reading.
          </p>
          <button 
            onClick={() => router.push("/auth/signup")}
            className="px-8 md:px-10 py-3 md:py-4 bg-white text-primary rounded-lg hover:opacity-90 transition-opacity font-bold text-base md:text-lg inline-flex items-center gap-2"
          >
            Create Your Account <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-primary">kuttab</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Deep learning. Meaningful study. Islamic mastery.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Explore</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Community</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Discussions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Contributors
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Company</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <p className="text-xs md:text-sm text-muted-foreground">© 2026 kuttab. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                Instagram
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                YouTube
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-96 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">Learn About Kuttab</h3>
              <button
                onClick={() => setShowVideo(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full bg-muted" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/f0zo00sZJH4"
                title="Kuttab - Learn More"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  )
}
