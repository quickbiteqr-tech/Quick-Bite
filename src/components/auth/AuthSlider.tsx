'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithEmail } from '@/lib/auth/login';
import { signUpWithRestaurant, SignUpData } from '@/lib/auth/signup';
import { getSafeReturnPath } from '@/lib/auth/return-path';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  owner_name: z.string().min(1, 'Owner Name is required'),
  restaurant_name: z.string().min(1, 'Restaurant Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;
type SignUpSchema = z.infer<typeof signUpSchema>;

interface AuthSliderProps {
  defaultMode?: 'login' | 'signup';
}

export default function AuthSlider({ defaultMode = 'login' }: AuthSliderProps) {
  const configError =
    'App configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.';
  
  const [isSignup, setIsSignup] = useState(defaultMode === 'signup');
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(
    () => getSafeReturnPath(searchParams?.get('next')),
    [searchParams]
  );

  // States for password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // State for Restaurant Name check
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // React Hook Form for Login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin, isSubmitting: isLoginSubmitting },
    setError: setErrorLogin,
    watch: watchLogin,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });
  const loginFormValues = watchLogin();

  // React Hook Form for SignUp
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: errorsSignUp, isSubmitting: isSignUpSubmitting },
    setError: setErrorSignUp,
    clearErrors: clearErrorsSignUp,
    getValues: getValuesSignUp,
    watch: watchSignUp,
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });
  const signUpFormValues = watchSignUp();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onLoginSubmit = async (data: LoginSchema) => {
    if (!isSupabaseConfigured) {
      setErrorLogin('root', { message: configError });
      return;
    }
    if (isOffline) return;
    
    const { error } = await loginWithEmail(data.email, data.password);
    if (error) {
      if (error.toLowerCase().includes('password')) {
        setErrorLogin('password', { message: error });
      } else if (error.toLowerCase().includes('email') || error.toLowerCase().includes('user')) {
        setErrorLogin('email', { message: error });
      } else {
        setErrorLogin('root', { message: error });
      }
    } else {
      router.replace(returnTo);
    }
  };

  const onSignUpSubmit = async (data: SignUpSchema) => {
    if (!isSupabaseConfigured) {
      setErrorSignUp('root', { message: configError });
      return;
    }
    if (isOffline) return;
    
    if (nameStatus !== 'available') {
      setErrorSignUp('restaurant_name', { message: 'Please check restaurant name availability first' });
      return;
    }

    try {
      const signUpData: SignUpData = {
        email: data.email,
        password: data.password,
        owner_name: data.owner_name,
        restaurant_name: data.restaurant_name,
        phone: data.phone,
        address: data.address
      };
      
      const { session } = await signUpWithRestaurant(signUpData);
      if (session) {
        router.replace(returnTo);
        return;
      }
      setSignUpSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('already registered')) {
         setErrorSignUp('email', { message: errorMessage });
      } else {
         setErrorSignUp('root', { message: errorMessage });
      }
    }
  };

  const handleCheckAvailability = async () => {
    const rawName = getValuesSignUp('restaurant_name');
    if (!rawName) {
      setErrorSignUp('restaurant_name', { message: 'Restaurant Name is required to check' });
      return;
    }
    setNameStatus('checking');

    try {
      const generatedSlug = rawName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!generatedSlug) {
        setErrorSignUp('restaurant_name', { message: 'Please enter a valid name' });
        setNameStatus('idle');
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', generatedSlug)
        .maybeSingle();

      if (error) {
        console.error('Error checking availability:', error);
        setErrorSignUp('root', { message: 'Failed to check name availability. Please try again.' });
        setNameStatus('idle');
        return;
      }

      if (data) {
        setNameStatus('taken');
        setErrorSignUp('restaurant_name', { message: 'This name is already registered. Please choose another.' });
      } else {
        setNameStatus('available');
        clearErrorsSignUp('restaurant_name');
      }
    } catch (err) {
      console.error('Unexpected error checking availability:', err);
      setErrorSignUp('root', { message: 'An unexpected error occurred. Please try again.' });
      setNameStatus('idle');
    }
  };

  const { onChange: origRestaurantNameChange, ...restRestaurantNameReg } = registerSignUp('restaurant_name');
  const handleRestaurantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    origRestaurantNameChange(e);
    if (nameStatus === 'available' || nameStatus === 'taken') {
      setNameStatus('idle');
      clearErrorsSignUp('restaurant_name');
    }
  };

  const toggleMode = () => {
    const query = searchParams?.toString() ?? '';
    const suffix = query ? `?${query}` : '';
    router.replace(`${isSignup ? '/login' : '/signup'}${suffix}`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push('/');
  };

  const getInputClasses = (error?: any, isDesktop = false, extraClasses = '') => {
    const base = `w-full transition-all placeholder:text-gray-400 focus:outline-none ${isDesktop ? 'px-4 py-2.5 text-sm rounded-lg' : 'px-4 py-3 rounded-lg'}`;
    const status = error 
      ? 'ring-2 ring-red-500 bg-red-50' 
      : 'bg-gray-100 focus:ring-2 focus:ring-[#6DBE45]/50';
    return `${base} ${status} ${extraClasses}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 selection:bg-[#6DBE45] selection:text-white">
      {isOffline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-6 py-3 rounded-lg shadow-lg z-50 font-medium">
          You are offline. Please reconnect to continue.
        </div>
      )}
      {!isSupabaseConfigured && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-6 py-3 rounded-lg shadow-lg z-50 font-medium text-center">
          Supabase env vars are missing. Add them in `.env.local` and restart `npm run dev`.
        </div>
      )}

      {/* Main Container - The double slider layout */}
      <div className="relative w-full max-w-5xl h-[700px] md:h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] z-[60] inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-gray-700 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white md:absolute md:left-4 md:top-4 md:backdrop-blur-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        {/* =========================================
            MOBILE VIEW (stacked / conditional rendering)
            ========================================= */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {isSignup ? (
            <div className="p-8 w-full">
              {signUpSuccess ? (
                 <div className="text-center py-12">
                   <h2 className="text-2xl font-bold text-[#6DBE45]">Registration Successful!</h2>
                   <p className="mt-2 text-gray-600">Please check your email to confirm.</p>
                   <button onClick={toggleMode} className="mt-6 font-semibold text-[#6DBE45] hover:underline">Go to Login</button>
                 </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center text-[#6DBE45] mb-6">Create Account</h2>
                  <form onSubmit={handleSubmitSignUp(onSignUpSubmit)} className="space-y-4">
                    <div>
                      <input 
                        {...registerSignUp('owner_name')} 
                        
                        type="text" 
                        placeholder="Owner's Name" 
                        aria-invalid={!!errorsSignUp.owner_name}
                        className={getInputClasses(errorsSignUp.owner_name, false)} 
                      />
                      {errorsSignUp.owner_name && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.owner_name.message}</p>}
                    </div>
                    
                    <div>
                      <div className="relative w-full">
                        <input 
                          {...restRestaurantNameReg}
                          onChange={handleRestaurantNameChange}
                          
                          type="text" 
                          placeholder="Restaurant Name" 
                          aria-invalid={!!errorsSignUp.restaurant_name}
                          className={getInputClasses(errorsSignUp.restaurant_name, false, 'pr-20')} 
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/80 p-1 rounded-md backdrop-blur-sm">
                          {nameStatus === 'available' && <span className="text-xs text-green-600 font-bold hidden sm:inline">✓ Available</span>}
                          {nameStatus === 'taken' && <span className="text-xs text-red-600 font-bold hidden sm:inline">✗ Taken</span>}
                          <button
                            type="button"
                            onClick={handleCheckAvailability}
                            disabled={nameStatus === 'checking' || !signUpFormValues.restaurant_name}
                            className={`text-xs px-2 py-1 rounded-md font-semibold transition-colors ${
                              nameStatus === 'checking' || !signUpFormValues.restaurant_name
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#6DBE45] text-white hover:bg-[#5aa337]'
                            }`}
                          >
                            {nameStatus === 'checking' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
                          </button>
                        </div>
                      </div>
                      {errorsSignUp.restaurant_name && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.restaurant_name.message}</p>}
                    </div>

                    <div>
                      <input 
                        {...registerSignUp('email')} 
                        
                        type="email" 
                        placeholder="Email" 
                        aria-invalid={!!errorsSignUp.email}
                        className={getInputClasses(errorsSignUp.email, false)} 
                      />
                      {errorsSignUp.email && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.email.message}</p>}
                    </div>

                    <div>
                      <div className="relative w-full">
                        <input 
                          {...registerSignUp('password')} 
                          
                          type={showSignUpPassword ? 'text' : 'password'} 
                          placeholder="Password" 
                          aria-invalid={!!errorsSignUp.password}
                          className={getInputClasses(errorsSignUp.password, false, 'pr-10')} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorsSignUp.password && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.password.message}</p>}
                    </div>

                    <div>
                      <input 
                        {...registerSignUp('phone')} 
                        
                        type="tel" 
                        placeholder="Phone Number" 
                        aria-invalid={!!errorsSignUp.phone}
                        className={getInputClasses(errorsSignUp.phone, false)} 
                      />
                      {errorsSignUp.phone && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.phone.message}</p>}
                    </div>

                    <div>
                      <input 
                        {...registerSignUp('address')} 
                        
                        type="text" 
                        placeholder="Address" 
                        aria-invalid={!!errorsSignUp.address}
                        className={getInputClasses(errorsSignUp.address, false)} 
                      />
                      {errorsSignUp.address && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.address.message}</p>}
                    </div>
                    
                    {errorsSignUp.root && <p className="text-red-500 text-sm text-center">{errorsSignUp.root.message}</p>}
                    
                    <button 
                      type="submit" 
                      disabled={isSignUpSubmitting || !isSupabaseConfigured || nameStatus !== 'available'} 
                      className="w-full bg-[#6DBE45] text-white rounded-full py-3 font-semibold uppercase tracking-wide hover:bg-[#5aa337] transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSignUpSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign Up
                    </button>
                  </form>
                  <p className="mt-6 text-center text-gray-600">
                    Already have an account? <button onClick={toggleMode} className="text-[#6DBE45] font-semibold hover:underline">Log In</button>
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="p-8 w-full min-h-full flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-center text-[#6DBE45] mb-6">Sign in to QuickBiteQR</h2>
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                <div>
                  <input 
                    {...registerLogin('email')} 
                     
                    type="email" 
                    placeholder="Email" 
                    aria-invalid={!!errorsLogin.email}
                    className={getInputClasses(errorsLogin.email, false)} 
                  />
                  {errorsLogin.email && <p className="text-red-500 text-xs mt-1 text-left">{errorsLogin.email.message}</p>}
                </div>

                <div>
                  <div className="relative w-full">
                    <input 
                      {...registerLogin('password')} 
                       
                      type={showLoginPassword ? 'text' : 'password'} 
                      placeholder="Password" 
                      aria-invalid={!!errorsLogin.password}
                      className={getInputClasses(errorsLogin.password, false, 'pr-10')} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errorsLogin.password && <p className="text-red-500 text-xs mt-1 text-left">{errorsLogin.password.message}</p>}
                </div>
                
                {errorsLogin.root && <p className="text-red-500 text-sm text-center">{errorsLogin.root.message}</p>}
                
                <div className="flex justify-center mt-2">
                   <button type="button" className="text-gray-500 text-sm hover:text-[#6DBE45] hover:underline mb-4 border-b border-transparent">Forgot your password?</button>
                </div>

                <button type="submit" disabled={isLoginSubmitting || !isSupabaseConfigured} className="w-full bg-[#6DBE45] text-white rounded-full py-3 font-semibold uppercase tracking-wide hover:bg-[#5aa337] transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoginSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </button>
              </form>
              <p className="mt-8 text-center text-gray-600">
                Don't have an account? <button onClick={toggleMode} className="text-[#6DBE45] font-semibold hover:underline">Sign Up</button>
              </p>
            </div>
          )}
        </div>

        {/* =========================================
            DESKTOP VIEW (Sliding double panels)
            ========================================= */}
        <div className="hidden md:flex w-full h-full relative">
          
          {/* SIGN IN FORM (STATIC ON LEFT) */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white flex flex-col justify-center items-center p-12 transition-all duration-700">
             <h2 className="text-4xl font-bold text-[#6DBE45] mb-4">Sign in</h2>
             <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="w-full max-w-sm flex flex-col space-y-4">
                <div>
                  <input 
                    {...registerLogin('email')} 
                     
                    type="email" 
                    placeholder="Email" 
                    aria-invalid={!!errorsLogin.email}
                    className={getInputClasses(errorsLogin.email, true)} 
                  />
                  {errorsLogin.email && <p className="text-red-500 text-xs mt-1 text-left">{errorsLogin.email.message}</p>}
                </div>

                <div>
                  <div className="relative w-full">
                    <input 
                      {...registerLogin('password')} 
                       
                      type={showLoginPassword ? 'text' : 'password'} 
                      placeholder="Password" 
                      aria-invalid={!!errorsLogin.password}
                      className={getInputClasses(errorsLogin.password, true, 'pr-10')} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errorsLogin.password && <p className="text-red-500 text-xs mt-1 text-left">{errorsLogin.password.message}</p>}
                </div>
                
                {errorsLogin.root && <p className="text-red-500 text-sm text-center">{errorsLogin.root.message}</p>}
                
                <button type="submit" disabled={isLoginSubmitting || !isSupabaseConfigured} className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all self-center mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoginSubmitting ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Sign In'}
                </button>
             </form>
          </div>

          {/* SIGN UP FORM (STATIC ON RIGHT) */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white flex flex-col justify-center items-center p-10 overflow-y-auto overflow-x-hidden transition-all duration-700">
            {signUpSuccess ? (
              <div className="text-center w-full max-w-sm">
                <h2 className="text-3xl font-bold text-[#6DBE45] mb-4">Registration Successful!</h2>
                <p className="text-gray-500 mb-8">Please check your email to confirm your account.</p>
                <button onClick={toggleMode} className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all">Go to Login</button>
              </div>
            ) : (
             <>
               <h2 className="text-3xl font-bold text-[#6DBE45] mb-3">Create Account</h2>
               <form onSubmit={handleSubmitSignUp(onSignUpSubmit)} className="w-full max-w-sm flex flex-col space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input 
                        {...registerSignUp('owner_name')} 
                        
                        type="text" 
                        placeholder="Owner's Name" 
                        aria-invalid={!!errorsSignUp.owner_name}
                        className={getInputClasses(errorsSignUp.owner_name, true)} 
                      />
                      {errorsSignUp.owner_name && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.owner_name.message}</p>}
                    </div>
                    <div>
                      <div className="relative w-full">
                        <input 
                          {...restRestaurantNameReg}
                          onChange={handleRestaurantNameChange}
                          
                          type="text" 
                          placeholder="Restaurant Name" 
                          aria-invalid={!!errorsSignUp.restaurant_name}
                          className={getInputClasses(errorsSignUp.restaurant_name, true, 'pr-16')} 
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-white/80 p-0.5 rounded-md backdrop-blur-sm">
                          {nameStatus === 'available' && <span className="text-[10px] text-green-600 font-bold mr-1 hidden lg:inline">✓</span>}
                          {nameStatus === 'taken' && <span className="text-[10px] text-red-600 font-bold mr-1 hidden lg:inline">✗</span>}
                          <button
                            type="button"
                            onClick={handleCheckAvailability}
                            disabled={nameStatus === 'checking' || !signUpFormValues.restaurant_name}
                            className={`text-[10px] px-1.5 py-1 rounded-md font-semibold transition-colors ${
                              nameStatus === 'checking' || !signUpFormValues.restaurant_name
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#6DBE45] text-white hover:bg-[#5aa337]'
                            }`}
                          >
                            {nameStatus === 'checking' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
                          </button>
                        </div>
                      </div>
                      {errorsSignUp.restaurant_name && <p className="text-red-500 text-[10px] mt-1 text-left leading-tight">{errorsSignUp.restaurant_name.message}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <input 
                      {...registerSignUp('email')} 
                      
                      type="email" 
                      placeholder="Email" 
                      aria-invalid={!!errorsSignUp.email}
                      className={getInputClasses(errorsSignUp.email, true)} 
                    />
                    {errorsSignUp.email && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.email.message}</p>}
                  </div>

                  <div>
                    <div className="relative w-full">
                      <input 
                        {...registerSignUp('password')} 
                        
                        type={showSignUpPassword ? 'text' : 'password'} 
                        placeholder="Password" 
                        aria-invalid={!!errorsSignUp.password}
                        className={getInputClasses(errorsSignUp.password, true, 'pr-10')} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorsSignUp.password && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.password.message}</p>}
                  </div>

                  <div>
                    <input 
                      {...registerSignUp('phone')} 
                      
                      type="tel" 
                      placeholder="Phone Number" 
                      aria-invalid={!!errorsSignUp.phone}
                      className={getInputClasses(errorsSignUp.phone, true)} 
                    />
                    {errorsSignUp.phone && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.phone.message}</p>}
                  </div>

                  <div>
                    <input 
                      {...registerSignUp('address')} 
                      
                      type="text" 
                      placeholder="Address" 
                      aria-invalid={!!errorsSignUp.address}
                      className={getInputClasses(errorsSignUp.address, true)} 
                    />
                    {errorsSignUp.address && <p className="text-red-500 text-xs mt-1 text-left">{errorsSignUp.address.message}</p>}
                  </div>
                  
                  {errorsSignUp.root && <p className="text-red-500 text-sm text-center pt-2">{errorsSignUp.root.message}</p>}
                  
                  <button 
                    type="submit" 
                    disabled={isSignUpSubmitting || !isSupabaseConfigured || nameStatus !== 'available'} 
                    className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all self-center mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSignUpSubmitting ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Sign Up'}
                  </button>
               </form>
             </>
            )}
          </div>

          {/* OVERLAY PANEL (THE GREEN SLIDING PART) */}
          <motion.div 
            className="absolute top-0 right-0 w-1/2 h-full z-50 bg-[#6DBE45] text-white overflow-hidden shadow-2xl flex items-center justify-center"
            initial={false}
            animate={{ x: isSignup ? '-100%' : '0%' }}
            transition={{ type: 'tween', duration: 0.6, ease: 'easeInOut' }}
            style={{ borderRadius: isSignup ? '0 2rem 2rem 0' : '2rem 0 0 2rem' }}
          >
            <AnimatePresence mode="wait">
              {isSignup ? (
                <motion.div 
                  key="welcomeBack"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col justify-center items-center p-12 text-center"
                >
                  <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
                  <p className="text-white/90 text-sm mb-10 max-w-[250px] leading-relaxed">
                    To keep connected with us please login with your personal info
                  </p>
                  <button 
                    onClick={toggleMode}
                    className="bg-transparent border-2 border-white text-white rounded-full py-3 px-12 font-bold uppercase tracking-widest hover:bg-white hover:text-[#6DBE45] transition-all"
                  >
                    Sign In
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="helloFriend"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col justify-center items-center p-12 text-center"
                >
                  <h2 className="text-4xl font-bold mb-6">Hello, Friend!</h2>
                  <p className="text-white/90 text-sm mb-10 max-w-[250px] leading-relaxed">
                    Enter your personal details and start journey with us
                  </p>
                  <button 
                    onClick={toggleMode}
                    className="bg-transparent border-2 border-white text-white rounded-full py-3 px-12 font-bold uppercase tracking-widest hover:bg-white hover:text-[#6DBE45] transition-all"
                  >
                    Sign Up
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

