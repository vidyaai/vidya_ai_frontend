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
  TrendingUp,
  Shield,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../../firebase/config';
import { api } from '../generic/utils.jsx';

const PricingPage = ({ onNavigateToHome, onNavigateToChat, onNavigateToGallery, onNavigateToTranslate, onNavigateToPricing }) => {
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
      buttonStyle: "bg-gray-700 hover:bg-gray-600 text-white",
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
      buttonStyle: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
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
      buttonStyle: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white",
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
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
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="/pricing" className="text-sm text-gray-900 font-medium transition-colors">
                Pricing
              </a>
              <a href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Blog
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">
                Log in
              </a>
              <a href="/login" className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                Get Started
              </a>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-4">
                <a href="/" className="text-sm text-gray-600 hover:text-gray-900 text-left">
                  Home
                </a>
                <a href="/pricing" className="text-sm text-gray-900 font-medium text-left">
                  Pricing
                </a>
                <a href="/blog" className="text-sm text-gray-600 hover:text-gray-900 text-left">
                  Blog
                </a>
                <div className="flex gap-4 pt-4">
                  <a href="/login" className="text-sm flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                    Log in
                  </a>
                  <a href="/login" className="text-sm flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-center">
                    Get Started
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your Learning
            <span className="text-indigo-600"> Journey</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Unlock the full potential of AI-powered education. From casual learning to professional mastery, 
            we have the perfect plan for your needs.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPrice = isAnnual ? plan.price.annual : plan.price.monthly;
            
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${
                    plan.name === 'Free' ? 'from-gray-600 to-gray-700' :
                    plan.name === 'Vidya Plus' ? 'from-indigo-500 to-purple-500' :
                    'from-yellow-500 to-orange-500'
                  } flex items-center justify-center mb-4`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${currentPrice}
                    </span>
                    {currentPrice > 0 && (
                      <span className="text-gray-600 text-sm ml-1">
                        /month
                      </span>
                    )}
                    {isAnnual && plan.price.monthly > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
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
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                          <Check size={12} className="text-green-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <FeatureIcon size={16} className="text-gray-600" />
                          <span className="text-gray-700 text-sm">{feature.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePlanClick(plan.name)}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${plan.buttonStyle} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <span className="text-gray-600">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-12 text-center border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already using VidyaAI to accelerate their education 
            and unlock new possibilities with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Start Free Today
              <ArrowRight size={20} className="ml-2" />
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 VidyaAI. Empowering education through artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
