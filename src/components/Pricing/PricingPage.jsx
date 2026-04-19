import { useState } from 'react';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  MessageSquare, 
  Upload, 
  Globe, 
  Clock,
  Users,
  Headphones,
  Shield,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../../firebase/config';
import { api } from '../generic/utils.jsx';
import { primaryButtonClass, secondaryButtonClass } from '../Landing/buttonClasses';
import { LANDING_ROUTES } from '../Landing/landingCtas';

const PricingPage = ({
  onNavigateToHome,
  onNavigateToChat,
  onNavigateToGallery,
  onNavigateToPricing,
  embedded = false,
}) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const plans = [
    {
      name: "Free",
      icon: Star,
      price: { monthly: 0, annual: 0 },
      description: "Perfect for getting started with AI-powered learning",
      features: [
        { text: "3 new videos per day", icon: Upload },
        { text: "6 questions per video per day", icon: MessageSquare },
        { text: "20 minutes translation per month", icon: Globe },
        { text: "Basic AI model quality", icon: Clock },
        { text: "Community support", icon: Users }
      ],
      buttonText: "Get Started Free",
      buttonStyle:
        "border border-white/12 bg-white/5 text-white hover:bg-white/10",
      iconWrapperClass: "bg-white/10 text-white",
      cardClass: "border-[#223556] bg-[#09172e]",
      featureIconClass: "bg-white/8 text-white",
      popular: false
    },
    {
      name: "Vidya Plus",
      icon: Zap,
      price: { monthly: 9.99, annual: 100.0 },
      description: "Ideal for students and regular learners",
      features: [
        { text: "10 new videos per day", icon: Upload },
        { text: "20 questions per video per day", icon: MessageSquare },
        { text: "500 minutes translation per month", icon: Globe },
        { text: "Advanced AI model quality", icon: Clock },
        { text: "Priority support", icon: Headphones },
        { text: "Export chat transcripts", icon: Shield },
        { text: "Custom study playlists", icon: Star }
      ],
      buttonText: "Start Plus Plan",
      buttonStyle:
        "border border-transparent bg-[#43ead6] text-[#051224] hover:bg-[#43ead6]/90",
      iconWrapperClass: "bg-[#43ead6]/16 text-[#43ead6]",
      cardClass:
        "border-[#43ead6]/35 bg-[linear-gradient(180deg,rgba(67,234,214,0.12),rgba(8,23,45,0.98))] shadow-[0_28px_80px_rgba(67,234,214,0.12)]",
      featureIconClass: "bg-[#43ead6]/12 text-[#43ead6]",
      popular: true
    },
    {
      name: "Vidya Pro",
      icon: Crown,
      price: { monthly: 14.99, annual: 150.0 },
      description: "Best for educators, professionals, and power users",
      features: [
        { text: "20 new videos per day", icon: Upload },
        { text: "Unlimited questions per video", icon: MessageSquare },
        { text: "120 minutes translation per month", icon: Globe },
        { text: "Premium AI model quality", icon: Clock },
        { text: "24/7 priority support", icon: Headphones },
        { text: "Team collaboration", icon: Users },
        { text: "Advanced analytics & insights", icon: Shield },
        { text: "Custom AI model training", icon: Star },
        { text: "White-label options", icon: Crown }
      ],
      buttonText: "Go Pro",
      buttonStyle:
        "border border-[#37d3ff]/20 bg-[linear-gradient(135deg,#37d3ff,#43ead6)] text-[#051224] hover:opacity-90",
      iconWrapperClass: "bg-[#4bc2ff]/16 text-[#7ed4ff]",
      cardClass: "border-[#2a466b] bg-[#08172d]",
      featureIconClass: "bg-[#4bc2ff]/12 text-[#7ed4ff]",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately, and we'll prorate any differences."
    },
    {
      question: "What happens to my data if I downgrade?",
      answer: "Your data remains safe. However, you'll be limited to the features of your new plan. For example, if you exceed upload limits, you'll need to wait until the next billing cycle."
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes! We offer a 50% student discount on all paid plans. Contact our support team with your valid student ID to get started."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "All new users start with our Free plan which gives you a great taste of VidyaAI. You can upgrade anytime to unlock more features."
    },
    {
      question: "What languages are supported for translation?",
      answer: "We support 100+ languages including all major world languages. Our AI continuously learns to improve translation quality and add new languages."
    }
  ];

  const [openFaq, setOpenFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanClick = async (planName) => {
    if (planName === "Free") {
      if (!auth.currentUser) {
        window.location.href = '/login?returnUrl=%2Fchat';
        return;
      }

      if (onNavigateToChat) {
        onNavigateToChat();
      }
      return;
    }

    setIsLoading(true);
    try {
      // Get Firebase auth token
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please log in to subscribe");
      }
      
      const token = await user.getIdToken();
      
      // Create checkout session
      const response = await api.post(`/api/payments/create-checkout-session`, {
        plan_type: planName,
        billing_period: isAnnual ? 'annual' : 'monthly'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data) {
        const error = await response.data;
        throw new Error(error.detail || 'Payment creation failed');
      }

      const { checkout_url } = await response.data;
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      
      // Extract error message from backend response
      let errorMessage = 'Payment failed: request failed';
      
      if (error.response && error.response.data && error.response.data.detail) {
        // Backend returned a detailed error message
        errorMessage = `Payment failed: ${error.response.data.detail}`;
      } else if (error.message) {
        // Use the error message if available
        errorMessage = `Payment failed: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-10'
          : 'min-h-screen bg-[#071224] text-white'
      }
    >
      {/* Header */}
      {!embedded && (
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#12213a] bg-[#071224]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <img
                src="/logo-new-2.png"
                alt="Vidya AI Logo"
                className="h-12 w-auto"
              />
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href={LANDING_ROUTES.home} className="text-sm text-slate-300 hover:text-white transition-colors">
                Home
              </a>
              <a href="/pricing" className="text-sm text-[#43ead6] font-medium transition-colors">
                Pricing
              </a>
              <a href="/blog" className="text-sm text-slate-300 hover:text-white transition-colors">
                Blog
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-sm text-slate-300 hover:text-white transition">
                Log in
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#43ead6] px-5 py-2 text-sm font-medium text-[#051224] transition hover:bg-[#43ead6]/90"
              >
                Get Started
              </a>
            </div>

            <button
              className="rounded-full border border-[#1a2943] bg-white/5 p-2 text-white transition hover:bg-white/10 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-[#12213a] py-4 md:hidden">
              <nav className="flex flex-col gap-4">
                <a href={LANDING_ROUTES.home} className="text-left text-sm text-slate-300 hover:text-white">
                  Home
                </a>
                <a href="/pricing" className="text-left text-sm font-medium text-[#43ead6]">
                  Pricing
                </a>
                <a href="/blog" className="text-left text-sm text-slate-300 hover:text-white">
                  Blog
                </a>
                <div className="flex gap-4 pt-4">
                  <a
                    href="/login"
                    className="flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-center text-sm text-white hover:bg-white/10"
                  >
                    Log in
                  </a>
                  <a
                    href="/login"
                    className="flex-1 rounded-full bg-[#43ead6] px-4 py-2 text-center text-sm font-medium text-[#051224]"
                  >
                    Get Started
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      )}

      {/* Main Content */}
      <main
        className={
          embedded
            ? 'rounded-[32px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.18)] sm:px-6 lg:px-8'
            : 'mx-auto max-w-7xl px-4 py-6 pt-28 sm:px-6 lg:px-8'
        }
      >
        {/* Hero Section */}
        <div className="relative mb-7 overflow-hidden rounded-[32px] border border-[#182842] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.14),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-6 text-center sm:px-10 sm:py-7">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle_at_left,rgba(67,234,214,0.1),transparent_70%)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#43ead6]/8 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6]">
            PRICING
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose Your Learning
            <span className="text-[#43ead6]"> Journey</span>
          </h1>

          {/* Billing Toggle */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#43ead6] focus:ring-offset-2 focus:ring-offset-[#0b1730] ${
                isAnnual ? 'bg-[#43ead6]' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  isAnnual ? 'translate-x-6 bg-[#051224]' : 'translate-x-1 bg-white'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="inline-flex items-center rounded-full border border-[#43ead6]/20 bg-[#43ead6]/10 px-3 py-1 text-xs font-medium text-[#43ead6]">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPrice = isAnnual ? plan.price.annual : plan.price.monthly;
            
            return (
              <div
                key={index}
                className={`relative rounded-[28px] border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.24)] ${
                  plan.popular 
                    ? `${plan.cardClass} md:scale-[1.03]`
                    : `${plan.cardClass} hover:border-[#30496f]`
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full border border-[#43ead6]/20 bg-[#43ead6] px-4 py-1 text-sm font-medium text-[#051224]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div
                    className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 ${plan.iconWrapperClass}`}
                  >
                    <IconComponent className="h-8 w-8" />
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="mb-4 text-sm text-slate-300">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${currentPrice}
                    </span>
                    {currentPrice > 0 && (
                      isAnnual ? (
                        <span className="ml-1 text-sm text-slate-400">
                          /year
                        </span>
                      ) : (
                        <span className="ml-1 text-sm text-slate-400">
                          /month
                        </span>
                      )
                    )}
                    {isAnnual && plan.price.monthly > 0 && (
                      <div className="mt-1 text-sm text-slate-500">
                        <span className="line-through">${plan.price.monthly}/month</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${plan.featureIconClass}`}>
                          <Check size={12} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <FeatureIcon size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-200">{feature.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePlanClick(plan.name)}
                  disabled={isLoading}
                  className={`w-full rounded-full px-4 py-3 font-medium transition-all duration-200 hover:scale-[1.01] ${plan.buttonStyle} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isLoading ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6]">
            FAQS
          </p>
          <h2 className="mt-4 mb-12 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-[#182842] bg-[#0d1a33]">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <span className="text-slate-400">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-[32px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-12">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white">
            Ready to Transform Your Learning?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-300">
            Join thousands of learners who are already using VidyaAI to accelerate their education 
            and unlock new possibilities with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className={primaryButtonClass}
            >
              Start Free Today
              <ArrowRight size={20} className="ml-2" />
            </a>
            <a
              href={LANDING_ROUTES.home}
              className={secondaryButtonClass}
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      {!embedded && (
      <footer className="mt-20 border-t border-[#12213a] bg-[#081325]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p>&copy; 2024 VidyaAI. Empowering education through artificial intelligence.</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default PricingPage;
