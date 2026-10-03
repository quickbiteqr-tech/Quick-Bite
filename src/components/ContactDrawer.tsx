'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { submitContactForm, ContactFormInputs } from '@/app/actions/submitContactForm';

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ContactDrawer({ isOpen, onClose }: DrawerProps) {
  const [formData, setFormData] = useState<ContactFormInputs>({
    intent: 'demo',
    name: '',
    email: '',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const intents = [
    { id: 'demo', label: 'Book Demo' },
    { id: 'partnership', label: 'Partnership' },
    { id: 'support', label: 'Support' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const result = await submitContactForm(formData);

    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
        setTimeout(() => setStatus('idle'), 500); // reset state after closing animation
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Failed to send message.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white z-[101] shadow-2xl flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    {/* Mock Avatar Group */}
                    <img src="https://i.pravatar.cc/100?img=12" alt="Founder" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                    <img src="https://i.pravatar.cc/100?img=33" alt="Founder" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Talk to the Founders</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">We typically reply in under 15 minutes.</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Intent Selector (Interactive Pills) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">How can we help?</label>
                  <div className="flex flex-wrap gap-2">
                    {intents.map((intent) => (
                      <button
                        key={intent.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, intent: intent.id as any })}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                          formData.intent === intent.id 
                            ? 'bg-slate-900 text-white shadow-md scale-105' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {intent.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating Inputs */}
                <div className="space-y-6 mt-4">
                  {/* Name Input */}
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="peer w-full border-b-2 border-slate-200 bg-transparent pt-4 pb-1.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 transition-colors placeholder-transparent"
                      placeholder="John Doe"
                    />
                    <label htmlFor="name" className="absolute left-0 -top-1 text-xs font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:normal-case peer-placeholder-shown:text-slate-400 peer-focus:-top-1 peer-focus:text-xs peer-focus:uppercase peer-focus:text-slate-900">
                      Your Name
                    </label>
                  </div>

                  {/* Email Input */}
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="peer w-full border-b-2 border-slate-200 bg-transparent pt-4 pb-1.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 transition-colors placeholder-transparent"
                      placeholder="john@company.com"
                    />
                    <label htmlFor="email" className="absolute left-0 -top-1 text-xs font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:normal-case peer-placeholder-shown:text-slate-400 peer-focus:-top-1 peer-focus:text-xs peer-focus:uppercase peer-focus:text-slate-900">
                      Work Email
                    </label>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="peer w-full rounded-xl border-2 border-slate-200 bg-transparent p-4 text-slate-900 font-medium focus:outline-none focus:border-slate-900 transition-colors resize-none placeholder-transparent mt-5"
                      placeholder="Tell us about your restaurant..."
                    />
                    <label htmlFor="message" className="absolute left-4 top-5 text-sm font-medium text-slate-400 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:left-2 peer-focus:bg-white peer-focus:px-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-slate-900 peer-focus:uppercase peer-focus:tracking-widest">
                      Your Message
                    </label>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">
                    {errorMessage}
                  </motion.p>
                )}

                {/* Morphing Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="relative w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center overflow-hidden disabled:opacity-90 disabled:cursor-not-allowed group shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                >
                  <AnimatePresence mode="wait">
                    {status === 'idle' || status === 'error' ? (
                      <motion.div key="idle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                        Send Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </motion.div>
                    ) : status === 'loading' ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" /> Sent Successfully
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
