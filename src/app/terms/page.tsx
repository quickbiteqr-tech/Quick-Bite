import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Terms of Service - QuickBiteQR",
    description: "Terms of Service for QuickBiteQR restaurant management system",
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                            <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Back to Home</span>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Image
                                src="/favicon.ico"
                                alt="QuickBiteQR"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="text-xl font-bold text-slate-900">QuickBiteQR</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Terms of Service</h1>
                    <p className="text-lg text-slate-600">
                        Last updated: January 1, 2026
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="prose prose-slate prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
                        <p className="text-slate-600 leading-relaxed">
                            By accessing or using QuickBiteQR, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, you may not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
                        <p className="text-slate-600 leading-relaxed">
                            QuickBiteQR provides a digital menu and ordering platform for restaurants ("Service"). We enable restaurants to generate QR codes, manage menus, and receive orders from customers. We are a technology provider and not a party to the transactions between restaurants and their customers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
                        <p className="text-slate-600 leading-relaxed">
                            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You agree not to use the Service:
                        </p>
                        <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
                            <li>In any way that violates any applicable national or international law or regulation.</li>
                            <li>To transmit any unsolicited or unauthorized advertising or promotional material.</li>
                            <li>To impersonate or attempt to impersonate QuickBiteQR, a QuickBiteQR employee, another user, or any other person or entity.</li>
                            <li>To process orders for illegal goods or services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Subscription and Payments</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Some aspects of the Service may be provided for a fee. You agree to pay all fees associated with your subscription plan. We reserve the right to change our subscription fees upon reasonable notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
                        <p className="text-slate-600 leading-relaxed">
                            In no event shall QuickBiteQR, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact Information</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Questions about the Terms of Service should be sent to us at:
                        </p>
                        <div className="mt-4 p-6 bg-slate-100 rounded-xl border border-slate-200">
                            <p className="font-semibold text-slate-900">Apparotech Innovation</p>
                            <p className="text-slate-600 mt-1">Email: hemant@apparotechinnovation.com, hr@apparotechinnovation.com</p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="text-slate-400 text-sm mb-4 md:mb-0">
                        © 2025 QuickBiteQR. All rights reserved.
                    </div>
                    <div className="flex space-x-6">
                        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Home</Link>
                        <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy</Link>
                        <Link href="/cookies" className="text-slate-400 hover:text-white text-sm transition-colors">Cookies</Link>
                        <Link
                            href="https://linkedin.com/company/quickbiteqr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                            aria-label="QuickBiteQR on LinkedIn"
                            title="LinkedIn"
                        >
                            <Linkedin className="h-5 w-5" />
                        </Link>
                        <Link
                            href="https://www.instagram.com/quickbiteqr/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-white text-sm transition-colors"
                            aria-label="QuickBiteQR on Instagram"
                            title="Instagram"
                        >
                            <Instagram className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
