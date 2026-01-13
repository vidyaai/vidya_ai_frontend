import { useState } from 'react';
import {
  BookOpen,
  Video,
  Brain,
  Globe,
  Clock,
  CheckCircle,
  Zap,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Menu,
  X,
  Mail,
  User,
  MessageSquare,
  PlayCircle,
  MessageCircle,
  FileText,
  Cpu,
  Activity,
  GitBranch,
  Layers,
  Settings
} from 'lucide-react';
import emailjs from '@emailjs/browser';

const VidyaLandingPage = ({ onLogin, onNavigateToLoginWithTarget }) => {
  console.log('🚀 VidyaLandingPage UPDATED VERSION with University Logos and NVIDIA/AWS - Loaded at', new Date().toLocaleTimeString());
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-8 relative shadow-xl">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
            <p className="text-gray-600 mb-6">
              Get in touch to learn more about VidyaAI
            </p>

            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                <p className="text-green-400 text-sm">✓ Message sent successfully! We'll get back to you soon.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">✗ Failed to send message. Please try again or email us directly.</p>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-gray-600" />
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="logo-new-2.png"
                alt="VidyaAI Logo"
                className="h-16 w-auto rounded-lg border-2 border-indigo-600"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button onClick={handleGetStarted} className="text-gray-700 hover:text-indigo-600 transition font-medium">
                I'm a Student
              </button>
              <button onClick={() => scrollToSection('for-educators')} className="text-gray-700 hover:text-indigo-600 transition font-medium">
                I'm a Professor
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-gray-900 transition">
                How It Works
              </button>
              <button onClick={() => scrollToSection('subjects')} className="text-gray-600 hover:text-gray-900 transition">
                Subjects
              </button>
              <a href="/blog" className="text-gray-600 hover:text-gray-900 transition">
                Blog
              </a>
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-md"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-900"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
              <button onClick={handleGetStarted} className="block w-full text-left text-gray-700 hover:text-indigo-600 transition py-2 font-medium">
                I'm a Student
              </button>
              <button onClick={() => scrollToSection('for-educators')} className="block w-full text-left text-gray-700 hover:text-indigo-600 transition py-2 font-medium">
                I'm a Professor
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-gray-600 hover:text-gray-900 transition py-2">
                How It Works
              </button>
              <button onClick={() => scrollToSection('subjects')} className="block w-full text-left text-gray-600 hover:text-gray-900 transition py-2">
                Subjects
              </button>
              <a href="/blog" className="block w-full text-left text-gray-600 hover:text-gray-900 transition py-2">
                Blog
              </a>
              <button
                onClick={handleLogin}
                className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md"
              >
                Login
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-100 border border-purple-300 rounded-full text-purple-700 text-sm font-medium">
              Chat With Your STEM Videos
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
              Understand STEM Faster
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                By Chatting With Your Videos
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
              Chip design, circuit analysis, semiconductor physics—the lectures move fast.
              VidyaAI lets you ask questions about any moment in the video and get instant technical answers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center"
              >
                Start Chatting Free
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="px-8 py-4 bg-gray-100 border border-gray-300 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 hover:scale-105 flex items-center"
              >
                <PlayCircle className="mr-2" size={20} />
                See How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  10,000+
                </div>
                <div className="text-gray-600">STEM Students</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  500K+
                </div>
                <div className="text-gray-600">Questions Answered</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-gray-600">Technical Assistance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 border border-red-300 rounded-full text-red-700 text-sm font-medium mb-4">
              The Challenge
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              VLSI & Engineering Concepts Don't Click the First Time
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chip design isn't simple. Clock domain crossing, timing closure, RTL synthesis—these aren't topics you grasp from one lecture. You need to ask questions, clarify doubts, understand the steps you missed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pain Point 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <X size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-3">"I'm stuck on one concept in a 20-minute lecture"</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                <span className="font-semibold text-gray-700">The Reality:</span> You're watching a video on VLSI design flow. At minute 8, the instructor explains logic synthesis. You don't understand how HDL code becomes gates. You rewind. Still unclear. You need to ask someone "HOW does synthesis actually work?"—but it's midnight.
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-700">The STEM Problem:</span> Circuit design, semiconductor physics, signal processing—these subjects have layers. Miss one concept and everything after becomes noise.
              </p>
            </div>

            {/* Pain Point 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <X size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-3">"The timing diagram doesn't make sense"</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                <span className="font-semibold text-gray-700">The Reality:</span> Your professor draws waveforms showing setup time and hold time. The diagram is on screen for 30 seconds. You need to stare at it, ask questions, understand each transition. But the video keeps moving.
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-700">The STEM Problem:</span> Visuals matter in engineering. Clock edges, voltage levels, state transitions—you need to ask about what's shown on screen, not just what's said.
              </p>
            </div>

            {/* Pain Point 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <X size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-3">"I don't know which term I don't understand"</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                <span className="font-semibold text-gray-700">The Reality:</span> The lecture mentions "place and route," "DRC," "LVS," "timing closure." You write them down. Later, you realize you don't actually know what "DRC" does or why it matters. You don't even know what question to Google.
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-700">The STEM Problem:</span> Technical terminology piles up. You need someone to ask: "What's DRC in chip design?" and get a clear answer in context of the video you're watching.
              </p>
            </div>

            {/* Pain Point 4 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <X size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-3">"TAs aren't available when I'm studying"</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                <span className="font-semibold text-gray-700">The Reality:</span> You're doing VLSI homework at 10 PM. Your design fails timing constraints. You don't understand why. TA office hours are Tuesday at 2 PM. Your assignment is due Wednesday morning.
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-700">The STEM Problem:</span> Engineering doubts appear while solving problems, not during scheduled hours. You need help when you're stuck, not two days later.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-bold text-purple-600">
              What if you could ask questions about any technical video, anytime?
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section with Video Demo */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-700 text-sm font-medium mb-4">
              The VidyaAI Solution
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Paste a YouTube URL. Ask Technical Questions. Get Instant Answers.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              VidyaAI's "Chat with Videos" lets you have a conversation with any VLSI, circuit design, or engineering lecture. Clarify doubts the moment they appear.
            </p>
          </div>

          {/* Video Showcase */}
          <div className="bg-white border-2 border-purple-500/30 rounded-3xl p-8 mb-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Chat with Fourier Transform Video</h3>
              <p className="text-gray-600">Watch and see how you can ask questions about any moment in this video</p>
            </div>

            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/SXjOwcvcjRU"
                title="Fourier Transform Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>

            {/* Sample Chat Questions */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold mb-4">Sample Questions Students Ask VidyaAI:</h4>

              <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
                <div className="flex items-start mb-3">
                  <MessageCircle size={20} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <p className="font-semibold text-blue-400">Student: "At 2:34, what's the difference between front-end and back-end design?"</p>
                </div>
                <div className="ml-7 text-gray-700">
                  <p className="mb-2"><span className="font-semibold">VidyaAI:</span> "In the video at 2:34, the diagram shows the chip design flow split into two phases:</p>
                  <p className="mb-2">Front-end design (left side): RTL coding (Verilog/VHDL), functional verification, logic synthesis. This is about WHAT the chip does—the logical behavior.</p>
                  <p>Back-end design (right side): Floor planning, place and route, timing closure. This is about HOW to physically build it—transistor placement, wire routing."</p>
                </div>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
                <div className="flex items-start mb-3">
                  <MessageCircle size={20} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <p className="font-semibold text-blue-400">Student: "Why do we need synthesis? Can't engineers just design with gates?"</p>
                </div>
                <div className="ml-7 text-gray-700">
                  <p className="mb-2"><span className="font-semibold">VidyaAI:</span> "As mentioned at 5:12, synthesis automates HDL-to-gate conversion.</p>
                  <p className="mb-2">Consider: A modern processor has 10+ billion transistors. Writing each gate manually would take decades. Synthesis tools read your RTL code, map it to standard cell libraries, optimize for speed/power/area, and generate gate-level netlist.</p>
                  <p>Manual gate design is only practical for tiny circuits. For chips with millions of logic cells, synthesis is essential."</p>
                </div>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
                <div className="flex items-start mb-3">
                  <MessageCircle size={20} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <p className="font-semibold text-blue-400">Student: "Explain place and route more simply."</p>
                </div>
                <div className="ml-7 text-gray-700">
                  <p className="mb-2"><span className="font-semibold">VidyaAI:</span> "Let me break down the place and route step shown at 8:45:</p>
                  <p className="mb-2">PLACEMENT: Deciding WHERE each logic gate sits on the chip silicon. Goal: Put frequently-communicating gates close together. Like placing a school near a residential area.</p>
                  <p>ROUTING: Building metal wires to connect gates. Goal: Connect with minimal wire length and delay. Like designing streets between locations. If placement is bad, routing becomes long → signals delayed → chip fails timing."</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105"
              >
                Start Chatting With Your Videos
              </button>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-400/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Frame Specific</h3>
              <p className="text-gray-600">
                Ask about any moment in the video. Get answers that reference exactly what's on screen at that timestamp.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Brain size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Concept Breakdown</h3>
              <p className="text-gray-600">
                Complex topics broken into simple pieces. Keep asking until it clicks. Unlimited technical questions.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <Activity size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Visual Understanding</h3>
              <p className="text-gray-600">
                Explain circuit diagrams, timing waveforms, block diagrams—VidyaAI processes visuals, not just audio.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Answers</h3>
              <p className="text-gray-600">
                Ask at 2 AM, get answered at 2 AM. Study on your schedule, not when office hours happen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From YouTube URL to Clarified Doubts in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Paste Video URL</h3>
              <p className="text-gray-600">
                YouTube, Coursera, uploaded lectures—any STEM video URL works
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">YouTube</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Coursera</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Uploads</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">VidyaAI Processes</h3>
              <p className="text-gray-600">
                Transcript, visuals, diagrams, technical terminology—complete understanding
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Audio</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Video</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Visuals</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Ask Questions</h3>
              <p className="text-gray-600">
                About timestamps, concepts, visuals, steps you missed, or terminology
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Timestamps</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Concepts</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Diagrams</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold mb-3">Master Material</h3>
              <p className="text-gray-600">
                Keep chatting until you understand. Quiz yourself. Track progress.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Chat</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Quiz</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Learn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Students Can Chat About
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <Cpu size={24} className="text-purple-400 mr-3" />
                <h3 className="text-xl font-bold">VLSI & Chip Design</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain the synthesis flow at 5:12"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why does my design fail timing closure?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"How does clock tree synthesis work?"</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <Activity size={24} className="text-blue-400 mr-3" />
                <h3 className="text-xl font-bold">Circuit Analysis</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain this op-amp circuit diagram"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why does this RC filter work?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Walk me through this amplifier design"</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <GitBranch size={24} className="text-green-400 mr-3" />
                <h3 className="text-xl font-bold">Digital Logic</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"How do flip-flops prevent metastability?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain pipelining in processors"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why do we need cache coherence?"</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <TrendingUp size={24} className="text-orange-400 mr-3" />
                <h3 className="text-xl font-bold">Signal Processing</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-orange-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Break down this Fourier transform"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-orange-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why does sampling below Nyquist cause aliasing?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-orange-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain this filter's frequency response"</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-pink-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <Layers size={24} className="text-pink-400 mr-3" />
                <h3 className="text-xl font-bold">Semiconductor Physics</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-pink-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain PN junction operation"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-pink-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why does doping change conductivity?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-pink-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"How do MOSFETs switch?"</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300">
              <div className="flex items-center mb-4">
                <Settings size={24} className="text-cyan-400 mr-3" />
                <h3 className="text-xl font-bold">Control Systems</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-cyan-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Explain this transfer function"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-cyan-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"Why is this system unstable?"</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={16} className="text-cyan-400 mr-2 mt-1 flex-shrink-0" />
                  <span>"How does PID control work?"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Educators Section */}
      <section id="for-educators" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 border border-purple-300 rounded-full text-purple-700 text-sm font-medium mb-4">
              Are you a professor?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Generate Unique VLSI & STEM Assignments Instantly
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              I'm an engineering professor teaching the same chip design course every semester. Generating new problem sets with different circuits, timing scenarios, and synthesis problems takes hours. VidyaAI creates unique variations in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-2">Randomized Technical Problems</h3>
                  <p className="text-gray-600">
                    Same VLSI concepts, different circuits and parameters. Students can't copy last quarter's solutions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-2">Generate from Lecture Videos</h3>
                  <p className="text-gray-600">
                    Paste your recorded lecture URL. VidyaAI creates aligned assignments testing the exact concepts you covered.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cpu size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-2">Engineering-Specific Generation</h3>
                  <p className="text-gray-600">
                    Circuit diagrams, timing parameters, Verilog code problems—not just multiple choice questions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold mb-2">Save 8+ Hours Per Week</h3>
                  <p className="text-gray-600">
                    What took a weekend now takes 20 minutes. Focus on teaching and research, not assignment recreation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-3">Example Use Cases</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Generate 5 versions of timing analysis problems</span>
              </div>
              <div className="flex items-start">
                <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Create unique Verilog coding assignments per student</span>
              </div>
              <div className="flex items-start">
                <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Randomize circuit parameters in analog design homework</span>
              </div>
              <div className="flex items-start">
                <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Generate varied gate-level optimization questions</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigateToLoginWithTarget && onNavigateToLoginWithTarget('assignments')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105"
              >
                Try Assignment Generator
              </button>
              <button
                onClick={handleContactSales}
                className="px-8 py-4 bg-gray-100 border border-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Students Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Star size={20} className="text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-bold">Priya</div>
                  <div className="text-sm text-gray-600">MS VLSI Student</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I was stuck on clock domain crossing for a week. Chatted with my professor's lecture video on VidyaAI for 10 minutes—finally understood it. Saved my VLSI project."
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Star size={20} className="text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-bold">Marcus</div>
                  <div className="text-sm text-gray-600">Electrical Engineering</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The timing diagram in the lecture made no sense. Asked VidyaAI to explain each clock edge and transition. Actually got it. Aced the midterm."
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Star size={20} className="text-white" />
                </div>
                <div className="ml-3">
                  <div className="font-bold">Sarah</div>
                  <div className="text-sm text-gray-600">Electronics Student</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I paste every circuit analysis video into VidyaAI now. Ask questions as they come up. No more waiting for TA hours or staying confused."
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <div className="text-gray-600 text-sm">STEM Students</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                500K+
              </div>
              <div className="text-gray-600 text-sm">Questions Answered</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                95%
              </div>
              <div className="text-gray-600 text-sm">Better Understanding</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                4.8/5
              </div>
              <div className="text-gray-600 text-sm">Student Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* STEM Subjects */}
      <section id="subjects" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Chat With Any STEM Video URL
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              If it's a technical STEM video, you can chat with it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: 'VLSI & Chip Design', desc: 'RTL synthesis, timing, DFT, verification' },
              { icon: Activity, title: 'Circuit Analysis', desc: 'Analog, op-amps, filters, power electronics' },
              { icon: GitBranch, title: 'Digital Logic', desc: 'State machines, pipelining, processors' },
              { icon: TrendingUp, title: 'Signal Processing', desc: 'Fourier, filters, modulation' },
              { icon: Layers, title: 'Semiconductor Physics', desc: 'PN junctions, MOSFETs, devices' },
              { icon: Settings, title: 'Control Systems', desc: 'Transfer functions, PID, feedback' },
              { icon: Brain, title: 'Engineering Math', desc: 'Differential equations, transforms' },
              { icon: Zap, title: 'Power Systems', desc: 'AC/DC, transformers, distribution' }
            ].map((subject, index) => {
              const IconComponent = subject.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <IconComponent size={32} className="text-purple-400 mb-3" />
                  <h3 className="text-lg font-bold mb-2">{subject.title}</h3>
                  <p className="text-gray-600 text-sm">{subject.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden border-4 border-green-500">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            🎓 Trusted By Professors from:
          </h2>
          <p className="text-center text-green-600 font-bold mb-8">✅ NEW SECTION - If you see this, the update worked!</p>

          <div className="relative">
            <div className="flex gap-12 animate-scroll items-center justify-center flex-wrap md:flex-nowrap">
              <a
                href="https://www.utdallas.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
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
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
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
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
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
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
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
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
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

      {/* Backed By Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Backed By
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
            <div className="flex items-center justify-center">
              <img
                src="/images/nvidia.png"
                alt="NVIDIA"
                className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/images/aws.png"
                alt="AWS"
                className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start Chatting With STEM Videos Today
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 hover:border-purple-400/50 transition-all duration-300">
              <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
              <p className="text-gray-600 mb-6">Perfect for trying Chat with Videos</p>
              <div className="mb-6">
                <div className="text-4xl font-bold mb-6">$0</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Chat with any video URL</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Ask unlimited questions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Smart transcripts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Save chat history</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full px-8 py-4 bg-gray-100 border border-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300"
              >
                Start Free - No Card Required
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/50 rounded-3xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Student Premium</h3>
              <p className="text-gray-600 mb-6">Everything in Free, plus advanced features</p>
              <div className="mb-6">
                <div className="text-4xl font-bold">$19<span className="text-xl text-gray-600">/month</span></div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Quiz generation from videos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Multi-language translation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited video uploads</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105"
              >
                Try Free for 14 Days
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Need enterprise or university licensing?</p>
            <button
              onClick={handleContactSales}
              className="px-8 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 border border-purple-500/50 rounded-3xl p-12 text-center backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Stop Rewatching. Start Chatting.
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join 10,000+ STEM students who chat with chip design, circuit analysis, and engineering videos to clarify every technical doubt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Paste Your First Video URL - Chat Free
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-400 mr-2" />
                <span>Free forever for basic Chat with Videos</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-400 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-400 mr-2" />
                <span>10,000+ engineering students chatting daily</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img
                src="logo-new-2.png"
                alt="VidyaAI Logo"
                className="h-16 w-auto rounded-lg mb-4"
              />
              <p className="text-gray-600 text-sm">
                Chat with VLSI & engineering videos. Clarify technical doubts instantly.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-indigo-600 transition">How It Works</button></li>
                <li><button onClick={() => scrollToSection('subjects')} className="hover:text-indigo-600 transition">STEM Subjects</button></li>
                <li><button onClick={() => scrollToSection('for-educators')} className="hover:text-indigo-600 transition">For Educators</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><button onClick={handleContactSales} className="hover:text-indigo-600 transition">Contact Us</button></li>
                <li><a href="#" className="hover:text-indigo-600 transition">About</a></li>
                <li><a href="/blog" className="hover:text-indigo-600 transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-indigo-600 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 VidyaAI. Empowering STEM education through intelligent video chat.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VidyaLandingPage;
