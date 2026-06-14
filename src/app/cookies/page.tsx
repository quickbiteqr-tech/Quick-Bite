import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Cookie Policy - QuickBiteQR",
    description: "Cookie Policy for QuickBiteQR restaurant management system",
};

export default function CookiePolicy() {
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
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Cookie Policy</h1>
                    <p className="text-lg text-slate-600">
                        Last updated: January 1, 2026
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="prose prose-slate prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Are Cookies?</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Cookies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use cookies for several purposes:
                        </p>
                        <div className="space-y-6 mt-4">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Essential Cookies</h3>
                                <p className="text-slate-600">These cookies are necessary for the website to function properly. They enable basic features like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Preference Cookies</h3>
                                <p className="text-slate-600">These cookies enable the website to remember information that changes the way the website behaves or looks, like your preferred language or the region that you are in.</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics Cookies</h3>
                                <p className="text-slate-600">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our user experience.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Managing Cookies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Changes to This Policy</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed">
                            If you have any questions about our use of cookies, please contact us at:
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
                        <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms</Link>
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
