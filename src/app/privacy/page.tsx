import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Privacy Policy - QuickBiteQR",
    description: "Privacy Policy for QuickBiteQR restaurant management system",
};

export default function PrivacyPolicy() {
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
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
                    <p className="text-lg text-slate-600">
                        Last updated: January 1, 2026
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="prose prose-slate prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Welcome to QuickBiteQR ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant management system and QR code ordering platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-900">2.1 Restaurant Partners</h3>
                            <p className="text-slate-600 leading-relaxed">
                                When you register your restaurant with QuickBiteQR, we collect:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                                <li>Business name, address, and contact details</li>
                                <li>Owner/Manager contact information</li>
                                <li>Menu data and pricing information</li>
                                <li>Billing and payment information</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-slate-900 mt-6">2.2 End Users (Diners)</h3>
                            <p className="text-slate-600 leading-relaxed">
                                When diners scans QR codes or place orders, we may collect:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                                <li>Order details and dining preferences</li>
                                <li>Payment information (processed securely by our payment providers)</li>
                                <li>Device information and IP address</li>
                                <li>Table number and restaurant location</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
                            <li>Process and facilitate food orders and payments</li>
                            <li>Provide analytics and insights to restaurant partners</li>
                            <li>Improve and optimize our platform's performance</li>
                            <li>Communicate with you regarding updates or support</li>
                            <li>Detect and prevent fraudulent activities</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We implement appropriate technical and organizational measures to maintain the safety of your personal information. However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <div className="mt-4 p-6 bg-slate-100 rounded-xl border border-slate-200">
                            <p className="font-semibold text-slate-900">Apparotech Innovation</p>
                            <p className="text-slate-600 mt-1">Email: hemant@apparotechinnovation.com, hr@apparotechinnovation.com</p>
                            <p className="text-slate-600">Address: Futec Gateway, Plot no 10, Gardenia Gateway, Sector 75, Noida, Uttar Pradesh 201316</p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-slate-900">
                    <div className="text-slate-400 text-sm mb-4 md:mb-0">
                        © 2025 QuickBiteQR. All rights reserved.
                    </div>
                    <div className="flex space-x-6">
                        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Home</Link>
                        <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms</Link>
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
