'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const updatePasswordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordSchema) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.updateUser({
      password: data.new_password
    });

    if (error) {
      setError('root', { message: error.message || 'Failed to update password. Your link may have expired.' });
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  const getInputClasses = (error?: any) => {
    const base = 'w-full transition-all placeholder:text-gray-400 focus:outline-none px-4 py-2.5 text-sm rounded-lg';
    const status = error 
      ? 'ring-2 ring-red-500 bg-red-50' 
      : 'bg-gray-100 focus:ring-2 focus:ring-[#6DBE45]/50';
    return `${base} ${status}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 selection:bg-[#6DBE45] selection:text-white">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-8 md:p-12">
        <h2 className="text-3xl font-bold text-center text-[#6DBE45] mb-6">Update Password</h2>
        
        {success ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Your password has been successfully updated.</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-gray-600 text-sm text-center mb-6">Please enter your new password.</p>
            
            <div>
              <div className="relative w-full">
                <input 
                  {...register('new_password')} 
                  type={showNewPassword ? 'text' : 'password'} 
                  placeholder="New Password" 
                  aria-invalid={!!errors.new_password}
                  className={getInputClasses(errors.new_password) + ' pr-10'} 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.new_password && <p className="text-red-500 text-xs mt-1 text-left">{errors.new_password.message}</p>}
            </div>

            <div>
              <div className="relative w-full">
                <input 
                  {...register('confirm_password')} 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm New Password" 
                  aria-invalid={!!errors.confirm_password}
                  className={getInputClasses(errors.confirm_password) + ' pr-10'} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1 text-left">{errors.confirm_password.message}</p>}
            </div>
            
            {errors.root && (
              <div className="flex flex-col items-center">
                <p className="text-red-500 text-sm text-center mb-2">{errors.root.message}</p>
                <button type="button" onClick={() => router.push('/login')} className="text-sm text-[#6DBE45] font-semibold hover:underline">
                  Request a new link
                </button>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className="w-full bg-[#6DBE45] text-white rounded-full py-3 mt-4 font-semibold uppercase tracking-wide hover:bg-[#5aa337] transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
