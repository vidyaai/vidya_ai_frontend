import { useState } from 'react';
import { 
  ArrowRight, 
  Play, 
  Clock, 
  Users, 
  AlertTriangle, 
  GraduationCap,
  Sparkles, 
  BookOpen, 
  BarChart3, 
  Bot,
  CheckCircle,
  Menu,
  X,
  Mail,
  User,
  MessageSquare
} from 'lucide-react';
import emailjs from '@emailjs/browser';

const VidyaLandingPageNew = ({ onLogin, onNavigateToLoginWithTarget }) => {
  console.log('🚀🚀🚀 NEW VidyaLandingPage - Modern Version Loaded at', new Date().toLocaleTimeString());
  console.log('THIS IS THE NEW LANDING PAGE WITH EDUCATION MEETS AI');
  
  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "VidyaAI",
        "url": "https://vidyaai.co",
        "logo": "https://vidyaai.co/logo-new.png",
        "description": "AI-based grading platform and learning assistant backed by NVIDIA and AWS",
        "founder": {
          "@type": "Person",
          "name": "VidyaAI Team"
        },
        "foundingDate": "2023",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "US"
        },
        "sameAs": [
          "https://twitter.com/vidyaai",
          "https://linkedin.com/company/vidyaai"
        ],
        "brand": {
          "@type": "Brand",
          "name": "VidyaAI"
        },
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "value": "10-50"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "VidyaAI Platform",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "500",
          "bestRating": "5",
          "worstRating": "1"
        },
        "description": "World's best AI-based grading platform and learning assistant. Automated homework grading and 24/7 AI tutoring.",
        "featureList": [
          "Automated AI Grading",
          "24/7 AI Tutoring",
          "Homework Assessment",
          "Real-time Feedback",
          "Multi-format Support",
          "Analytics Dashboard"
        ],
        "screenshot": "https://vidyaai.co/og-image.png"
      },
      {
        "@type": "WebSite",
        "name": "VidyaAI",
        "url": "https://vidyaai.co",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vidyaai.co/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "ItemList",
        "name": "VidyaAI University Partners",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Organization",
              "name": "University of Texas at Dallas"
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Organization",
              "name": "San Jose State University"
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Organization",
              "name": "University of Houston Clear Lake"
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Organization",
              "name": "Troy University"
            }
          },
          {
            "@type": "ListItem",
            "position": 5,
            "item": {
              "@type": "Organization",
              "name": "Santa Clara University"
            }
          }
        ]
      }
    ]
  };
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    }
  };

  const handleGetStarted = () => {
    if (onNavigateToLoginWithTarget) {
      onNavigateToLoginWithTarget('home');
    }
  };

  const handleContactSales = () => {
    setContactModalOpen(true);
    setSubmitStatus(null);
  };

  const handleCloseModal = () => {
    setContactModalOpen(false);
    setFormData({ name: '', email: '', message: '' });
    setSubmitStatus(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setSending(true);
    setSubmitStatus(null);

    try {
      const serviceId = 'service_3qtt4eu';
      const templateId = 'template_xgigp3g';
      const publicKey = '15XEZx-YXn86POgyR';

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: 'pingakshya@vidyaai.co'
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      setSubmitStatus('success');
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitStatus('error');
    } finally {
      setSending(false);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-gray-900">Contact Sales</h2>
            <p className="text-gray-600 mb-6">Get in touch with our team to learn more about Vidya AI</p>

            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">✓ Message sent successfully! We'll get back to you soon.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">✗ Failed to send message. Please try again or email us directly.</p>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Email *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Message *</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white text-gray-900 transition-colors">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-new-2.png"
                  alt="Vidya AI Logo"
                  className="h-12 w-auto"
                />
              </div>

              <nav className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection('problem')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Problem
                </button>
                <button onClick={() => scrollToSection('solution')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Solution
                </button>
                <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </a>
                <a href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </a>
                <button onClick={() => scrollToSection('contact')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </button>
              </nav>

              <div className="hidden md:flex items-center gap-4">
                <button onClick={handleLogin} className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Log in
                </button>
                <button onClick={handleGetStarted} className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                  Get Started
                </button>
              </div>

              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-200">
                <nav className="flex flex-col gap-4">
                  <button onClick={() => scrollToSection('problem')} className="text-sm text-gray-600 hover:text-gray-900 text-left">
                    Problem
                  </button>
                  <button onClick={() => scrollToSection('solution')} className="text-sm text-gray-600 hover:text-gray-900 text-left">
                    Solution
                  </button>
                  <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 text-left">
                    Pricing
                  </a>
                  <a href="/blog" className="text-sm text-gray-600 hover:text-gray-900 text-left">
                    Blog
                  </a>
                  <button onClick={() => scrollToSection('contact')} className="text-sm text-gray-600 hover:text-gray-900 text-left">
                    Contact
                  </button>
                  <div className="flex gap-4 pt-4">
                    <button onClick={handleLogin} className="text-sm flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Log in
                    </button>
                    <button onClick={handleGetStarted} className="text-sm flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg">
                      Get Started
                    </button>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            {/* Backed By Badge */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-4">
                <img src="/images/nvidia.png" alt="NVIDIA" className="h-10 w-auto object-contain" />
                <span className="text-lg text-gray-600">+</span>
                <img src="/images/aws.png" alt="AWS" className="h-10 w-auto object-contain" />
              </div>
            </div>
            <p className="text-base text-gray-500 mb-8 font-medium">Backed by NVIDIA Inception & AWS</p>

            {/* Vidya AI Logo */}
            <div className="flex justify-center mb-6">
              <img src="/logo-new-2.png" alt="Vidya AI" className="h-16 w-auto" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Education Meets <span className="text-indigo-600">AI</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Your all-in-one AI learning companion. Empowering students with instant answers and professors with automated
              grading—transforming education at scale.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a 
                href="https://www.youtube.com/watch?v=SXjOwcvcjRU"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">33+</div>
                <div className="text-sm text-gray-600 mt-1">Hours saved weekly</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600 mt-1">Universities targeted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">$47.8B</div>
                <div className="text-sm text-gray-600 mt-1">Market opportunity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600 mt-1">AI availability</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">The Problem</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4">
                Education is broken—for everyone
              </h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                Students struggle to get support, while professors drown in grading. The system fails both sides.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Student Problems */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-red-100">
                    <GraduationCap className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Limited Student Support</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">Only 3 hours per week</p>
                      <p className="text-sm text-gray-600">Professors and TAs provide limited office hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">Days to clear doubts</p>
                      <p className="text-sm text-gray-600">Students wait endlessly for answers to questions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Users className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">45% deadline submissions</p>
                      <p className="text-sm text-gray-600">Delayed feedback slows down learning velocity</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professor Problems */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-red-100">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Grading Overload for Professors</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">33 hours/week grading</p>
                      <p className="text-sm text-gray-600">Professors and TAs spend excessive time on assessment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">Subjective and uneven</p>
                      <p className="text-sm text-gray-600">Human grading introduces inconsistency and bias</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <GraduationCap className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">Delayed graduations</p>
                      <p className="text-sm text-gray-600">Overworked TAs impact research and student outcomes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">The Solution</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4">
                Vidya AI—Your All-in-One Learning Companion
              </h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                AI-powered tools that transform education for both students and professors.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* For Students */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mb-6">
                    <BookOpen className="h-4 w-4" />
                    For Students
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Learning Assistant</h3>
                  <p className="text-gray-600 mb-8">
                    Get instant answers, study smarter, and never wait for office hours again.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Bot className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">AI Chat from Video</p>
                        <p className="text-sm text-gray-600">Ask questions about lecture content instantly</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Voice-Cloned Translations</p>
                        <p className="text-sm text-gray-600">
                          Learn in your native language with professor's voice
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Smart Quizzes</p>
                        <p className="text-sm text-gray-600">Auto-generated practice tests from your materials</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Professors */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mb-6">
                    <BarChart3 className="h-4 w-4" />
                    For Professors
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Grading Assistant</h3>
                  <p className="text-gray-600 mb-8">
                    Automate assessments, get insights, and reclaim your time for what matters.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Auto-Generate Assignments</p>
                        <p className="text-sm text-gray-600">Create relevant homework from course materials</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">AI Grading and Analytics</p>
                        <p className="text-sm text-gray-600">Consistent, fair grading with detailed insights</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Save 33+ Hours Weekly</p>
                        <p className="text-sm text-gray-600">Focus on teaching, not administrative tasks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
              Trusted By Professors from:
            </h2>

            <div className="relative overflow-hidden">
              <div className="flex gap-12 animate-scroll items-center pointer-events-auto" style={{ width: 'max-content' }}>
                {/* First set */}
                <a
                  href="https://www.utdallas.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/utd.png"
                    alt="UT Dallas"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.uhcl.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/uhcl.png"
                    alt="UHCL"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.sjsu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/sjsu.png"
                    alt="SJSU"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.troy.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/troy.jpg"
                    alt="Troy University"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.scu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/scu.png"
                    alt="Santa Clara University"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                {/* Duplicate set for seamless loop */}
                <a
                  href="https://www.utdallas.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/utd.png"
                    alt="UT Dallas"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.uhcl.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/uhcl.png"
                    alt="UHCL"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.sjsu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/sjsu.png"
                    alt="SJSU"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.troy.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/troy.jpg"
                    alt="Troy University"
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <a
                  href="https://www.scu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src="/images/scu.png"
                    alt="Santa Clara University"
                    className="h-12 w-auto object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Ready to transform your institution?
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Join leading universities already using Vidya AI to enhance learning outcomes and save thousands of hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleGetStarted}
                className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
              >
                Request Demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleContactSales}
                className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contact Sales
              </button>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-gray-50 border border-gray-200 inline-block">
              <p className="text-gray-600">
                <span className="text-gray-900 font-medium">Contact:</span>{" "}
                <a href="mailto:pingakshya@vidyaai.co" className="text-indigo-600 hover:underline">
                  pingakshya@vidyaai.co
                </a>{" "}
                •{" "}
                <a href="tel:+14692379220" className="text-indigo-600 hover:underline">
                  +1-469-237-9220
                </a>
              </p>
              <p className="text-gray-600 mt-2">
                <a
                  href="https://www.vidyaai.co"
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.vidyaai.co
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-new-2.png"
                  alt="Vidya AI Logo"
                  className="h-8 w-auto"
                />
              </div>

              <nav className="flex flex-wrap justify-center gap-6">
                <button onClick={() => scrollToSection('problem')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Problem
                </button>
                <button onClick={() => scrollToSection('solution')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Solution
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </button>
              </nav>

              <p className="text-sm text-gray-600">© 2025 Vidya AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default VidyaLandingPageNew;
