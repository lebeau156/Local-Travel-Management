import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AuthMethod = 'piv' | 'pin' | 'email';

export default function Login() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMethod === 'piv') {
        setError('PIV Card authentication requires hardware configuration. Please use Email/Password for now.');
        setLoading(false);
        return;
      }
      
      if (authMethod === 'pin') {
        setError('PIN authentication is not yet configured. Please use Email/Password for now.');
        setLoading(false);
        return;
      }

      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background - Farm Scene */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large USDA Inspection Badge Watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
          <svg className="w-[500px] h-[500px]" viewBox="0 0 200 200" fill="none">
            {/* Shield outline */}
            <path d="M100 10 L40 40 L40 100 C40 140 70 170 100 190 C130 170 160 140 160 100 L160 40 Z" 
                  stroke="#2C5234" strokeWidth="3" fill="#4A8B2A" opacity="0.3"/>
            {/* Inner shield */}
            <path d="M100 25 L50 50 L50 100 C50 130 75 155 100 170 C125 155 150 130 150 100 L150 50 Z" 
                  fill="#2C5234" opacity="0.4"/>
            {/* Checkmark */}
            <path d="M70 100 L90 120 L130 70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            {/* USDA text */}
            <text x="100" y="150" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">INSPECTED</text>
          </svg>
        </div>

        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 via-green-50/20 to-green-100/30"></div>
        
        {/* Ground/Grass layer */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200/20 to-transparent"></div>
        
        {/* Cow silhouettes */}
        <div className="absolute bottom-32 left-10 opacity-40 animate-pulse" style={{ animationDuration: '4s' }}>
          <svg className="w-32 h-32 text-gray-700" viewBox="0 0 200 150" fill="currentColor">
            {/* Detailed cow silhouette with spots */}
            <ellipse cx="100" cy="90" rx="50" ry="35" fill="#1a1a1a" />
            <ellipse cx="75" cy="75" rx="30" ry="35" fill="#1a1a1a" />
            <rect x="70" y="110" width="8" height="25" rx="2" fill="#1a1a1a" />
            <rect x="85" y="110" width="8" height="25" rx="2" fill="#1a1a1a" />
            <rect x="105" y="110" width="8" height="25" rx="2" fill="#1a1a1a" />
            <rect x="120" y="110" width="8" height="25" rx="2" fill="#1a1a1a" />
            <ellipse cx="65" cy="65" rx="15" ry="18" fill="#1a1a1a" />
            <circle cx="58" cy="60" r="3" fill="white" />
            <path d="M 55 75 Q 50 78 52 80" stroke="#1a1a1a" strokeWidth="2" fill="none" />
            <ellipse cx="145" cy="85" rx="8" ry="12" fill="#1a1a1a" />
            {/* Black spots */}
            <ellipse cx="95" cy="85" rx="12" ry="8" fill="white" opacity="0.4" />
            <ellipse cx="115" cy="90" rx="10" ry="7" fill="white" opacity="0.4" />
            <ellipse cx="85" cy="95" rx="8" ry="6" fill="white" opacity="0.4" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-1/4 opacity-35 animate-pulse" style={{ animationDuration: '5s' }}>
          <svg className="w-40 h-40 text-gray-700" viewBox="0 0 200 150" fill="currentColor">
            {/* Another cow - grazing */}
            <ellipse cx="100" cy="95" rx="55" ry="30" fill="#2a2a2a" />
            <ellipse cx="80" cy="80" rx="25" ry="30" fill="#2a2a2a" />
            <rect x="75" y="115" width="7" height="20" rx="2" fill="#2a2a2a" />
            <rect x="88" y="115" width="7" height="20" rx="2" fill="#2a2a2a" />
            <rect x="108" y="115" width="7" height="20" rx="2" fill="#2a2a2a" />
            <rect x="121" y="115" width="7" height="20" rx="2" fill="#2a2a2a" />
            <ellipse cx="70" cy="72" rx="12" ry="15" fill="#2a2a2a" />
            <circle cx="65" cy="68" r="2.5" fill="white" />
            <ellipse cx="148" cy="90" rx="10" ry="15" fill="#2a2a2a" />
            <path d="M 60 85 L 55 90" stroke="#2a2a2a" strokeWidth="3" fill="none" />
            {/* Spots */}
            <ellipse cx="100" cy="92" rx="14" ry="9" fill="white" opacity="0.3" />
            <ellipse cx="120" cy="95" rx="11" ry="8" fill="white" opacity="0.3" />
          </svg>
        </div>

        <div className="absolute bottom-28 right-20 opacity-30 animate-pulse" style={{ animationDuration: '6s' }}>
          <svg className="w-28 h-28 text-gray-700" viewBox="0 0 200 150" fill="currentColor">
            {/* Small cow in distance */}
            <ellipse cx="100" cy="90" rx="40" ry="28" fill="#333" />
            <ellipse cx="80" cy="78" rx="22" ry="28" fill="#333" />
            <rect x="78" y="108" width="6" height="18" rx="2" fill="#333" />
            <rect x="90" y="108" width="6" height="18" rx="2" fill="#333" />
            <rect x="106" y="108" width="6" height="18" rx="2" fill="#333" />
            <rect x="118" y="108" width="6" height="18" rx="2" fill="#333" />
            <ellipse cx="72" cy="70" rx="12" ry="14" fill="#333" />
            <ellipse cx="135" cy="88" rx="8" ry="12" fill="#333" />
            <ellipse cx="95" cy="88" rx="10" ry="7" fill="white" opacity="0.3" />
          </svg>
        </div>

        {/* Barn/Farm building */}
        <div className="absolute bottom-20 left-1/4 opacity-30">
          <svg className="w-28 h-28" viewBox="0 0 100 100">
            <path d="M 50 10 L 20 30 L 20 80 L 80 80 L 80 30 Z" fill="#C41E3A" />
            <path d="M 50 10 L 80 30 L 90 30 L 50 5 L 10 30 L 20 30 Z" fill="#8B0000" />
            <rect x="42" y="50" width="16" height="30" fill="#654321" />
            <rect x="25" y="40" width="12" height="12" fill="#FFF" opacity="0.7" />
            <rect x="63" y="40" width="12" height="12" fill="#FFF" opacity="0.7" />
            <path d="M 30 40 L 35 45 M 35 40 L 30 45" stroke="#333" strokeWidth="1" />
            <path d="M 68 40 L 73 45 M 73 40 L 68 45" stroke="#333" strokeWidth="1" />
          </svg>
        </div>

        {/* Fence posts */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-around opacity-20">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-2 h-16 bg-amber-800 rounded-t shadow"></div>
          ))}
        </div>

        {/* Additional farm elements */}
        <div className="absolute top-1/4 right-10 opacity-40">
          <svg className="w-24 h-24 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            {/* Sun */}
            <circle cx="12" cy="12" r="6" fill="#FDB813" />
            <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" stroke="#FDB813" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Clouds */}
        <div className="absolute top-20 left-1/4 opacity-25">
          <svg className="w-28 h-20 text-white" viewBox="0 0 100 60" fill="currentColor">
            <ellipse cx="25" cy="35" rx="20" ry="15" fill="#E8F4F8" />
            <ellipse cx="50" cy="30" rx="25" ry="18" fill="#E8F4F8" />
            <ellipse cx="75" cy="35" rx="20" ry="15" fill="#E8F4F8" />
          </svg>
        </div>

        <div className="absolute top-32 right-1/3 opacity-20">
          <svg className="w-36 h-24 text-white" viewBox="0 0 100 60" fill="currentColor">
            <ellipse cx="20" cy="38" rx="18" ry="12" fill="#E8F4F8" />
            <ellipse cx="45" cy="32" rx="22" ry="16" fill="#E8F4F8" />
            <ellipse cx="70" cy="38" rx="18" ry="12" fill="#E8F4F8" />
          </svg>
        </div>

        {/* Trees/Vegetation */}
        <div className="absolute bottom-32 right-10 opacity-30">
          <svg className="w-16 h-24" viewBox="0 0 50 80" fill="currentColor">
            <rect x="20" y="50" width="10" height="30" fill="#654321" />
            <ellipse cx="25" cy="35" rx="18" ry="25" fill="#2D5016" />
            <ellipse cx="25" cy="25" rx="15" ry="20" fill="#3A6B1F" />
            <ellipse cx="25" cy="15" rx="12" ry="15" fill="#4A8B2A" />
          </svg>
        </div>

        <div className="absolute bottom-36 left-1/3 opacity-25">
          <svg className="w-12 h-20" viewBox="0 0 50 80" fill="currentColor">
            <rect x="20" y="45" width="8" height="25" fill="#654321" />
            <ellipse cx="24" cy="30" rx="14" ry="20" fill="#2D5016" />
            <ellipse cx="24" cy="22" rx="11" ry="16" fill="#3A6B1F" />
          </svg>
        </div>
      </div>

      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Panel - Branding */}
        <div className="hidden md:block space-y-6 p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-usda-green relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute top-0 right-0 opacity-5">
              <svg className="w-32 h-32 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            
            <div className="flex items-center space-x-4 mb-6 relative z-10">
              <div className="w-16 h-16 bg-usda-green rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">USDA</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-usda-blue">USDA</h1>
                <p className="text-sm text-gray-600">Food Safety and Inspection Service</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Local Travel Voucher System
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Simple, fast, and secure travel reimbursement for USDA field inspectors.
            </p>
            
            {/* Agricultural Icons Row */}
            <div className="flex items-center justify-center space-x-6 mb-6 py-4 border-y border-gray-200 bg-gradient-to-r from-green-50 via-white to-blue-50 rounded-lg">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
                <span className="text-xs text-gray-600 mt-1">Produce</span>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
                </svg>
                <span className="text-xs text-gray-600 mt-1">Poultry</span>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
                <span className="text-xs text-gray-600 mt-1">Meat</span>
              </div>
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l-2 6h-6l5 4-2 6 5-4 5 4-2-6 5-4h-6z"/>
                </svg>
                <span className="text-xs text-gray-600 mt-1">Quality</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <svg className="w-5 h-5 text-usda-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure PIV Card Authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <svg className="w-5 h-5 text-usda-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Real-time Mileage Calculation</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <svg className="w-5 h-5 text-usda-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Digital Approval Workflow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Choose your authentication method</p>
          </div>

          {/* Authentication Method Selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setAuthMethod('piv')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                authMethod === 'piv'
                  ? 'border-usda-blue bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-8 h-8 mb-2 ${authMethod === 'piv' ? 'text-usda-blue' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className={`text-xs font-medium ${authMethod === 'piv' ? 'text-usda-blue' : 'text-gray-600'}`}>PIV Card</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('pin')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                authMethod === 'pin'
                  ? 'border-usda-blue bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-8 h-8 mb-2 ${authMethod === 'pin' ? 'text-usda-blue' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={`text-xs font-medium ${authMethod === 'pin' ? 'text-usda-blue' : 'text-gray-600'}`}>Access PIN</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                authMethod === 'email'
                  ? 'border-usda-blue bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-8 h-8 mb-2 ${authMethod === 'email' ? 'text-usda-blue' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className={`text-xs font-medium ${authMethod === 'email' ? 'text-usda-blue' : 'text-gray-600'}`}>Email</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {authMethod === 'piv' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-usda-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Insert Your PIV Card</h3>
                <p className="text-sm text-gray-600 mb-6">Please insert your PIV card into the reader and follow the prompts</p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-usda-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-usda-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Authenticating...' : 'Authenticate with PIV'}
                </button>
              </div>
            )}

            {authMethod === 'pin' && (
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  Access PIN / Employee ID
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-usda-blue focus:border-transparent text-lg tracking-widest text-center"
                  placeholder="••••••••"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full bg-usda-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-usda-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying PIN...' : 'Sign In with PIN'}
                </button>
              </div>
            )}

            {authMethod === 'email' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-usda-blue focus:border-transparent"
                    placeholder="your.email@usda.gov"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-usda-blue focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-usda-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-usda-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-600 mb-4">
              Don't have an account? Contact your supervisor or{' '}
              <a href="mailto:support@usda.gov" className="text-usda-blue hover:underline font-medium">
                IT Support
              </a>
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Demo Accounts (Testing Only):</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Inspector:</span> inspector@usda.gov / Test123!</p>
                <p><span className="font-medium">Supervisor:</span> supervisor@usda.gov / Test123!</p>
                <p><span className="font-medium">Fleet Manager:</span> fleetmgr@usda.gov / Test123!</p>
                <p><span className="font-medium">Admin:</span> admin@usda.gov / Admin123!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure Government Portal • USDA FSIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}


