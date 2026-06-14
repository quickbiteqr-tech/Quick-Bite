import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Phone, MapPin, Send, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Contact Us - QuickBiteQR",
    description: "Get in touch with the QuickBiteQR team",
};

export default function ContactPage() {
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
            <header className="bg-slate-900 text-white py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Get in Touch</h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Have questions about QuickBiteQR? We're here to help. Reach out to our team for support, sales, or partnerships.
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                            <p className="text-slate-600 mb-4">For general inquiries and support.</p>
                            <div className="flex flex-col space-y-1">
                                <a href="mailto:hemant@apparotechinnovation.com" className="text-blue-600 hover:text-blue-700 font-medium">hemant@apparotechinnovation.com</a>
                                <a href="mailto:hr@apparotechinnovation.com" className="text-blue-600 hover:text-blue-700 font-medium">hr@apparotechinnovation.com</a>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
                                <Phone className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Call Us</h3>
                            <p className="text-slate-600 mb-4">Mon-Fri from 9am to 6pm IST.</p>
                            <a href="tel:+919675165716" className="text-emerald-600 hover:text-emerald-700 font-medium">+91 96751 65716</a>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6">
                                <MapPin className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Visit Us</h3>
                            <p className="text-slate-600 mb-4">Our main office location.</p>
                            <address className="not-italic text-slate-600">
                                Futec Gateway, Plot no 10,<br />
                                Gardenia Gateway, Sector 75,<br />
                                Noida, Uttar Pradesh 201316
                            </address>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                                        <input type="text" id="firstName" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="John" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                                        <input type="text" id="lastName" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Doe" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                    <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="john@example.com" />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                    <select id="subject" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                                        <option>General Inquiry</option>
                                        <option>Technical Support</option>
                                        <option>Sales & Pricing</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                                    <textarea id="message" rows={6} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="How can we help you?"></textarea>
                                </div>

                                <div className="pt-4">
                                    <button type="button" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                                        <span>Send Message</span>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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
                        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy</Link>
                        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Terms</Link>
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
