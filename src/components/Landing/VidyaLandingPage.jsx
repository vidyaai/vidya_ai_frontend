import { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
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
  MessageSquare
} from 'lucide-react';
import emailjs from '@emailjs/browser';

const VidyaLandingPage = ({ onLogin, onNavigateToLoginWithTarget }) => {
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

  const handleTryHWAssistant = () => {
    if (onNavigateToLoginWithTarget) {
      onNavigateToLoginWithTarget('assignments');
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
      // Replace these with your actual EmailJS credentials
      const serviceId = 'service_3qtt4eu';
      const templateId = 'template_xgigp3g'; // Replace with your EmailJS template ID
      const publicKey = '15XEZx-YXn86POgyR'; // Replace with your EmailJS public key

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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2">Contact Sales</h2>
            <p className="text-gray-400 mb-6">
              Get in touch with our team to learn more about Vidya AI
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
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium hover:bg-gray-700 transition"
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
      <header className="fixed top-0 w-full bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="logo-new-2.png" 
                alt="Vidya AI Logo" 
                className="h-12 w-auto rounded-lg"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('learning')} className="text-gray-300 hover:text-white transition">
                For Students
              </button>
              <button onClick={() => scrollToSection('homework')} className="text-gray-300 hover:text-white transition">
                For Educators
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition">
                Features
              </button>
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <button onClick={() => scrollToSection('learning')} className="block w-full text-left text-gray-300 hover:text-white transition py-2">
                For Students
              </button>
              <button onClick={() => scrollToSection('homework')} className="block w-full text-left text-gray-300 hover:text-white transition py-2">
                For Educators
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-300 hover:text-white transition py-2">
                Features
              </button>
              <button
                onClick={handleLogin}
                className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-medium"
              >
                Login
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-900/30 border border-purple-500/50 rounded-full text-purple-300 text-sm font-medium">
            🚀 Revolutionizing STEM Education with AI
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transform STEM Learning
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              With Intelligent AI
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Empower students with 24/7 AI tutoring and help educators save 30+ hours per week with automated grading. 
            The future of STEM education is here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center"
            >
              Start Learning Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button
              onClick={() => scrollToSection('homework')}
              className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              For Educators
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-gray-400">AI Learning Assistant</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                30+ hrs
              </div>
              <div className="text-gray-400">Saved Per Week</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-gray-400">STEM Focused</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vidya Learning Assistant Section */}
      <section id="learning" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-900/30 border border-indigo-500/50 rounded-full text-indigo-300 text-sm font-medium mb-4">
              <GraduationCap size={16} className="mr-2" />
              For Students
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Vidya Learning Assistant
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Your personal AI tutor, available 24/7 to help you master STEM subjects
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">Interactive Video Learning</h3>
                    <p className="text-gray-400">
                      Upload any educational video and have intelligent conversations about the content. Ask questions, get summaries, and dive deep into complex topics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">AI-Powered Quizzes</h3>
                    <p className="text-gray-400">
                      Test your knowledge with adaptive quizzes that adjust to your learning pace. Get instant feedback and explanations for every answer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">Voice-Cloned Translation</h3>
                    <p className="text-gray-400">
                      Break language barriers with AI translation that preserves your professor's voice. Learn in your preferred language without losing context.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-6">Perfect For</h3>
              <ul className="space-y-4">
                {[
                  'STEM students seeking deeper understanding',
                  'Visual learners who prefer video content',
                  'International students learning in new languages',
                  'Self-paced learners needing flexible support',
                  'Students preparing for exams and assessments'
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={20} className="text-indigo-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                Start Learning Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vidya HW Assistant Section */}
      <section id="homework" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-900/30 border border-purple-500/50 rounded-full text-purple-300 text-sm font-medium mb-4">
              <Users size={16} className="mr-2" />
              For Educators
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Vidya HW Assistant
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Automate grading and homework generation. Focus on what matters: teaching and research.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-6">Save Time, Teach Better</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <Clock size={20} className="text-purple-400 mr-2" />
                    <span className="font-bold text-xl">30+ Hours Saved Weekly</span>
                  </div>
                  <p className="text-gray-400 ml-7">Automated grading frees up your schedule for research, student interaction, and course development.</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Zap size={20} className="text-purple-400 mr-2" />
                    <span className="font-bold text-xl">Instant Feedback</span>
                  </div>
                  <p className="text-gray-400 ml-7">Students receive immediate, detailed feedback on their work, enhancing the learning process.</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <TrendingUp size={20} className="text-purple-400 mr-2" />
                    <span className="font-bold text-xl">Consistent Grading</span>
                  </div>
                  <p className="text-gray-400 ml-7">AI ensures fair, objective, and consistent evaluation across all assignments.</p>
                </div>
              </div>
              <button
                onClick={handleTryHWAssistant}
                className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105"
              >
                Try It Now
              </button>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">Generate Assignments</h3>
                    <p className="text-gray-400">
                      Create diverse, challenging homework problems aligned with your curriculum in minutes. Customize difficulty and topics with ease.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">Automated Grading</h3>
                    <p className="text-gray-400">
                      Grade assignments, projects, and exams automatically with detailed rubrics. Provide comprehensive feedback at scale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold mb-2">STEM Specialized</h3>
                    <p className="text-gray-400">
                      Built specifically for STEM subjects. Understands equations, code, diagrams, and complex problem-solving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-950 via-indigo-950/10 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose Vidya AI?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built specifically for STEM education with cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Advanced AI Models',
                description: 'Powered by state-of-the-art language models trained on STEM content',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Clock,
                title: 'Real-Time Processing',
                description: 'Instant answers and feedback to keep your learning momentum going',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: CheckCircle,
                title: 'Accurate & Reliable',
                description: 'Rigorous testing ensures high accuracy across all STEM disciplines',
                gradient: 'from-green-500 to-emerald-500'
              },
              {
                icon: Users,
                title: 'Collaborative Learning',
                description: 'Share resources and insights with classmates and study groups',
                gradient: 'from-orange-500 to-red-500'
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                description: 'Monitor your improvement with detailed analytics and insights',
                gradient: 'from-indigo-500 to-purple-500'
              },
              {
                icon: Star,
                title: 'Expert-Approved',
                description: 'Developed in collaboration with STEM educators and researchers',
                gradient: 'from-yellow-500 to-orange-500'
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 border border-purple-500/50 rounded-3xl p-12 text-center backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your STEM Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students and educators already using Vidya AI to revolutionize their learning and teaching experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Get Started Free
              </button>
              <button
                onClick={handleContactSales}
                className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all duration-300"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src="logo-new-2.png" 
                alt="Vidya AI Logo" 
                className="h-16 w-auto rounded-lg mb-4"
              />
              <p className="text-gray-400 text-sm">
                Revolutionizing STEM education through intelligent AI assistance.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Products</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('learning')} className="hover:text-white transition">Learning Assistant</button></li>
                <li><button onClick={() => scrollToSection('homework')} className="hover:text-white transition">HW Assistant</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition">Features</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Vidya AI. Empowering education through artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VidyaLandingPage;