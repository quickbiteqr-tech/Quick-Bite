"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, Search, MessageSquare, BookOpen, Phone, Mail, ChevronRight, AlertCircle, Star } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqData = [
    {
      category: "getting-started",
      title: "Getting Started",
      icon: <Star className="w-5 h-5" />,
      questions: [
        {
          question: "How quickly can I set up QuickBiteQR?",
          answer: "Setup takes less than 5 minutes. Simply create your account, add your menu items, and generate QR codes for your tables. No technical knowledge required."
        },
        {
          question: "Do customers need to download an app?",
          answer: "No! Customers simply scan the QR code with their phone's camera and access your menu instantly through their web browser. No app downloads required."
        },
        {
          question: "Is there a limit on orders or tables?",
          answer: "Our free plan supports up to 5 tables. Pro and Business plans offer unlimited tables and orders with advanced features."
        }
      ]
    },
    {
      category: "features",
      title: "Features",
      icon: <BookOpen className="w-5 h-5" />,
      questions: [
        {
          question: "Can I customize the menu design?",
          answer: "Yes! You can customize colors, fonts, and layout to match your restaurant's branding. We also offer white-label options for complete customization."
        },
        {
          question: "How does real-time order tracking work?",
          answer: "Orders appear instantly in your dashboard as soon as customers place them. You can track order status, modify items, and manage your queue in real-time."
        },
        {
          question: "Can I manage multiple locations?",
          answer: "Yes! Our Business plan includes multi-location support, allowing you to manage all your restaurants from a single dashboard."
        }
      ]
    }
  ];

  const supportOptions = [
    {
      title: "Email Support",
      description: "Get help via email within 24 hours",
      icon: <Mail className="w-6 h-6" />,
      action: "hemant@apparotechinnovation.com",
      color: "blue"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      icon: <MessageSquare className="w-6 h-6" />,
      action: "Start Chat",
      color: "green"
    },
    {
      title: "Phone Support",
      description: "Call us for immediate assistance",
      icon: <Phone className="w-6 h-6" />,
      action: "+91 96751 65716",
      color: "purple"
    }
  ];

  const filteredFAQs = faqData.filter(category =>
    selectedCategory === "all" || category.category === selectedCategory
  ).flatMap(category =>
    category.questions.map(q => ({ ...q, category: category.title }))
  ).filter(faq =>
    searchQuery === "" ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{
                type: "spring",
                duration: 0.6,
                bounce: 0.1
              }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Enhanced Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30"
                    >
                      <HelpCircle className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-bold"
                      >
                        Help Center
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/90 text-xs"
                      >
                        Find answers and get support
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
                    onClick={handleClose}
                    className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                  >
                    <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search for help..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-sm"
                    />
                  </div>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-4"
                >
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${selectedCategory === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                      All
                    </button>
                    {faqData.map((category) => (
                      <button
                        key={category.category}
                        onClick={() => setSelectedCategory(category.category)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${selectedCategory === category.category
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                      >
                        {category.icon}
                        <span>{category.title}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-4"
                >
                  <h3 className="text-base font-semibold text-slate-900 mb-3">
                    FAQ
                  </h3>
                  <div className="space-y-2">
                    {filteredFAQs.length > 0 ? (
                      filteredFAQs.map((faq, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <HelpCircle className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 mb-1 text-sm">
                                {faq.question}
                              </h4>
                              <p className="text-slate-600 text-xs leading-relaxed">
                                {faq.answer}
                              </p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {faq.category}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 text-sm">No results found for your search.</p>
                        <p className="text-slate-500 text-xs">Try different keywords or browse all topics.</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Support Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="border-t border-slate-200 pt-4"
                >
                  <h3 className="text-base font-semibold text-slate-900 mb-3">
                    Need more help?
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {supportOptions.map((option, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                        className={`p-3 rounded-lg border border-slate-200 hover:border-${option.color}-300 transition-all duration-200 cursor-pointer group`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-${option.color}-100 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <div className={`text-${option.color}-600`}>
                              {option.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-sm">
                              {option.title}
                            </h4>
                            <p className="text-slate-600 text-xs">
                              {option.action}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Quick Stats - Removed for smaller modal */}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
