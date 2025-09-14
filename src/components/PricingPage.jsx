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
  ArrowRight
} from 'lucide-react';
import TopBar from './generic/TopBar';
import PageHeader from './generic/PageHeader';

const PricingPage = ({ onNavigateToHome, onNavigateToChat, onNavigateToGallery, onNavigateToTranslate, onNavigateToPricing }) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      icon: Star,
      price: { monthly: 0, annual: 0 },
      description: "Perfect for getting started with AI-powered learning",
      features: [
        { text: "10 video uploads per month", icon: Upload },
        { text: "10 YouTube video chats per month", icon: MessageSquare },
        { text: "60 minutes translation per month", icon: Globe },
        { text: "Basic AI doubt solver", icon: Clock },
        { text: "5 interactive quizzes per month", icon: TrendingUp },
        { text: "Community support", icon: Users }
      ],
      buttonText: "Get Started Free",
      buttonStyle: "bg-gray-700 hover:bg-gray-600 text-white",
      popular: false
    },
    {
      name: "Vidya Plus",
      icon: Zap,
      price: { monthly: 12.99, annual: 9.99 },
      description: "Ideal for students and regular learners",
      features: [
        { text: "100 video uploads per month", icon: Upload },
        { text: "Unlimited YouTube video chats", icon: MessageSquare },
        { text: "500 minutes translation per month", icon: Globe },
        { text: "Advanced AI doubt solver", icon: Clock },
        { text: "Unlimited interactive quizzes", icon: TrendingUp },
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
      price: { monthly: 29.99, annual: 22.99 },
      description: "Best for educators, professionals, and power users",
      features: [
        { text: "Unlimited video uploads", icon: Upload },
        { text: "Unlimited YouTube video chats", icon: MessageSquare },
        { text: "Unlimited translation", icon: Globe },
        { text: "Premium AI models & features", icon: Clock },
        { text: "Unlimited everything", icon: TrendingUp },
        { text: "24/7 priority support", icon: Headphones },
        { text: "Team collaboration (up to 5 users)", icon: Users },
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

  const handlePlanClick = (planName) => {
    if (planName === "Free") {
      if (onNavigateToChat) {
        onNavigateToChat();
      }
    } else {
      console.log(`Navigate to payment for ${planName}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title="Pricing"
          onNavigateToChat={onNavigateToChat}
          onNavigateToGallery={onNavigateToGallery}
          onNavigateToTranslate={onNavigateToTranslate}
          onNavigateToHome={onNavigateToHome}
          onNavigateToPricing={onNavigateToPricing}
        />
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Learning
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Journey</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Unlock the full potential of AI-powered education. From casual learning to professional mastery, 
            we have the perfect plan for your needs.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                Save 23%
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
                className={`relative bg-gray-900 rounded-2xl p-8 border transition-all duration-300 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105' 
                    : 'border-gray-800 hover:border-gray-700'
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
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${currentPrice}
                    </span>
                    {currentPrice > 0 && (
                      <span className="text-gray-400 text-sm ml-1">
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
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-900 flex items-center justify-center mt-0.5">
                          <Check size={12} className="text-green-400" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <FeatureIcon size={16} className="text-gray-400" />
                          <span className="text-gray-300 text-sm">{feature.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare All Features
          </h2>
          
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Vidya Plus</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Vidya Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">Video Uploads/month</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">10</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">100</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">YouTube Video Chats</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">10/month</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">Translation Minutes</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">60/month</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">500/month</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">AI Model Quality</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">Basic</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">Advanced</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">Premium</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">Team Collaboration</td>
                    <td className="px-6 py-4 text-center text-sm text-red-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-red-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">✓ (5 users)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-300">Priority Support</td>
                    <td className="px-6 py-4 text-center text-sm text-red-400">✗</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">✓</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">✓ 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-900 rounded-xl border border-gray-800">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <span className="text-gray-400">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-center border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already using VidyaAI to accelerate their education 
            and unlock new possibilities with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateToChat}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Start Free Today
              <ArrowRight size={20} className="ml-2" />
            </button>
            <button
              onClick={() => console.log("Contact sales")}
              className="inline-flex items-center px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 VidyaAI. Empowering education through artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
