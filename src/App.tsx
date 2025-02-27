import React, { useState } from 'react';
import { Search, Video, CreditCard, MessageSquare, Phone, Instagram, Facebook, Twitter, Youtube, Timer, Smartphone, Share2, ExternalLink, Loader, Stethoscope } from 'lucide-react';
import { BackgroundMountains } from './components/BackgroundMountains';

interface AnalysisResults {
  patientExperience: Record<string, boolean>;
  digitalPresence: Record<string, boolean>;
  performance: {
    mobileResponsive: boolean;
    loadTime: string;
    scores: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
  };
  scores: {
    patientExperience: number;
    digitalPresence: number;
    performance: number;
    overall: number;
  };
}

function App() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const validateEmail = (email: string) => {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1];
    return !personalDomains.includes(domain);
  };

  const calculateScore = (features: Record<string, boolean>): number => {
    const total = Object.values(features).length;
    const available = Object.values(features).filter(v => v).length;
    return Math.round((available / total) * 10);
  };

  const calculateOverallScore = (scores: { patientExperience: number; digitalPresence: number; performance: number }): number => {
    return Math.round((scores.patientExperience + scores.digitalPresence + scores.performance) / 3);
  };

  const shareResults = () => {
    if (results) {
      const shareUrl = `${window.location.origin}?analysis=${encodeURIComponent(JSON.stringify(results))}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Analysis URL copied to clipboard!');
    }
  };

  const analyzeWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError('Please use a company email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);
    setEmailError(null);

    try {
      // Update this URL to your Cloudflare Worker URL when deployed
      const response = await fetch(`https://website-analyzer.your-worker.workers.dev/analyze?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }
      
      const data = await response.json();
      const { html, loadTime, lighthouse } = data;

      const patientExperience = {
        'Doctor Search': checkFeature(html, ['find a doctor', 'search doctor', 'find doctor', 'doctor directory']),
        'Video Consultation': checkFeature(html, ['video consult', 'telemedicine', 'virtual care', 'online consultation']),
        'Online Payment': checkFeature(html, ['pay online', 'payment gateway', 'make payment', 'bill payment']),
        'Chatbot': checkFeature(html, ['chat with us', 'virtual assistant', 'chat bot', 'chat support']),
        'Helpline': checkFeature(html, ['helpline', 'toll free', 'contact us', 'emergency contact'])
      };

      const digitalPresence = {
        'Instagram': checkSocialMedia(html, 'instagram.com'),
        'Facebook': checkSocialMedia(html, 'facebook.com'),
        'YouTube': checkSocialMedia(html, 'youtube.com'),
        'Twitter': checkSocialMedia(html, 'twitter.com'),

      };

      const scores = {
        patientExperience: calculateScore(patientExperience),
        digitalPresence: calculateScore(digitalPresence),
        performance: Math.round((lighthouse?.performance || 0.5) * 10)
      };

      const features = {
        patientExperience,
        digitalPresence,
        performance: {
          mobileResponsive: checkMobileResponsive(html),
          loadTime: `${loadTime} seconds`,
          scores: {
            performance: Math.round((lighthouse?.performance || 0.5) * 100),
            accessibility: Math.round((lighthouse?.accessibility || 0.5) * 100),
            bestPractices: Math.round((lighthouse?.bestPractices || 0.5) * 100),
            seo: Math.round((lighthouse?.seo || 0.5) * 100)
          }
        },
        scores: {
          ...scores,
          overall: calculateOverallScore(scores)
        }
      };

      setResults(features);
      setShowResults(true);
    } catch (err) {
      setError('Failed to analyze website. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkFeature = (html: string, keywords: string[]): boolean => {
    return keywords.some(keyword => html.toLowerCase().includes(keyword));
  };

  const checkSocialMedia = (html: string, platform: string): boolean => {
    return html.includes(platform);
  };

  const checkMobileResponsive = (html: string): boolean => {
    const indicators = ['viewport', 'media="screen', '@media', 'max-width', 'min-width'];
    return indicators.some(indicator => html.includes(indicator));
  };

  const getFeatureIcon = (feature: string) => {
    const icons = {
      'Doctor Search': <Search className="w-5 h-5" />,
      'Video Consultation': <Video className="w-5 h-5" />,
      'Online Payment': <CreditCard className="w-5 h-5" />,
      'Chatbot': <MessageSquare className="w-5 h-5" />,
      'Helpline': <Phone className="w-5 h-5" />,
      'Instagram': <Instagram className="w-5 h-5" />,
      'Twitter': <Instagram className="w-5 h-5" />,
      'Facebook': <Facebook className="w-5 h-5" />,
      'YouTube': <Youtube className="w-5 h-5" />,
      'Mobile Responsive': <Smartphone className="w-5 h-5" />,
      'Load Time': <Timer className="w-5 h-5" />
    };
    return icons[feature as keyof typeof icons] || null;
  };

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 relative">
        <BackgroundMountains />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis Results</h1>
            <p className="text-xl text-gray-600">Overall Digital Health Score: <span className="font-bold text-blue-600">{results.scores.overall}/10</span></p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Patient Experience</h2>
                <span className="text-2xl font-bold text-blue-600">{results.scores.patientExperience}/10</span>
              </div>
              <div className="space-y-3">
                {Object.entries(results.patientExperience).map(([feature, available]) => (
                  <div key={feature} className="flex items-center gap-3">
                    {getFeatureIcon(feature)}
                    <span className="flex-1">{feature}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {available ? '✓ Available' : '✗ Not Found'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Digital Presence</h2>
                <span className="text-2xl font-bold text-blue-600">{results.scores.digitalPresence}/10</span>
              </div>
              <div className="space-y-3">
                {Object.entries(results.digitalPresence).map(([platform, available]) => (
                  <div key={platform} className="flex items-center gap-3">
                    {getFeatureIcon(platform)}
                    <span className="flex-1">{platform}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {available ? '✓ Available' : '✗ Not Found'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Website Performance</h2>
                <span className="text-2xl font-bold text-blue-600">{results.scores.performance}/10</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5" />
                  <span className="flex-1">Mobile Responsive</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${results.performance.mobileResponsive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {results.performance.mobileResponsive ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5" />
                  <span className="flex-1">Load Time</span>
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">{results.performance.loadTime}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance</span>
                    <span className="text-sm font-medium">{results.performance.scores.performance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Accessibility</span>
                    <span className="text-sm font-medium">{results.performance.scores.accessibility}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Practices</span>
                    <span className="text-sm font-medium">{results.performance.scores.bestPractices}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SEO</span>
                    <span className="text-sm font-medium">{results.performance.scores.seo}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Analyze Another Website
            </button>
            <button
              onClick={shareResults}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Analysis
            </button>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Improve Your Digital Health Score?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Transform your healthcare digital presence with our affordable all-in-one platform. From AI-powered automation to complete patient journey management and retention, get enterprise-grade features without the enterprise pricing.
            </p>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Explore Our Solution
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      <BackgroundMountains />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Digital Health Score</h1>
          <p className="text-xl text-gray-600">Evaluate your healthcare website's digital vitality</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="flex items-center gap-6 mb-8">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Instant Website Checkup</h3>
                <p className="text-gray-600">Get a comprehensive analysis in seconds</p>
              </div>
            </div>
            
            <form onSubmit={analyzeWebsite} className="space-y-4">
              <div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your company email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {emailError && (
                  <p className="mt-2 text-sm text-red-600">{emailError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing your website...</span>
                  </div>
                ) : (
                  'Analyze Website'
                )}
              </button>
            </form>
          </div>
          
          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
              alt="Digital Health Analysis"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;