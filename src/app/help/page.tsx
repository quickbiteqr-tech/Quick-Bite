import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Book, MessageCircle, FileText, Zap, Shield, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Help Center - QuickBiteQR",
    description: "Support resources and documentation for QuickBiteQR",
};

export default function HelpCenterPage() {
    const categories = [
        {
            icon: <Zap className="w-6 h-6 text-yellow-600" />,
            title: "Getting Started",
            description: "Learn the basics of setting up your restaurant and menu.",
            bg: "bg-yellow-50",
            links: ["Account setup guide", "Creating your first menu", "Generating QR codes"]
        },
        {
            icon: <FileText className="w-6 h-6 text-blue-600" />,
            title: "Menu Management",
            description: "How to edit items, manage prices, and organize categories.",
            bg: "bg-blue-50",
            links: ["Adding items & variations", "Uploading food photos", "Managing stock availability"]
        },
        {
            icon: <MessageCircle className="w-6 h-6 text-purple-600" />,
            title: "Orders & Payments",
            description: "Handling live orders and processing customer payments.",
            bg: "bg-purple-50",
            links: ["Managing live order queue", "Payment gateway setup", "Refund processing"]
        },
        {
            icon: <Shield className="w-6 h-6 text-emerald-600" />,
            title: "Account & Billing",
            description: "Manage your subscription, team members, and security.",
            bg: "bg-emerald-50",
            links: ["Subscription plans", "Adding staff members", "Password reset"]
        }
    ];

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

            {/* Hero Search */}
            <header className="bg-slate-900 text-white py-16 sm:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 pattern-grid-lg opacity-10"></div>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">How can we help you?</h1>
                    <div className="relative max-w-xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 rounded-xl border-0 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-lg shadow-lg"
                            placeholder="Search for answers, guides, or articles..."
                        />
                    </div>
                </div>
            </header>

            {/* Categories */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 ${cat.bg} rounded-lg flex items-center justify-center mb-6`}>
                                {cat.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.title}</h3>
                            <p className="text-slate-600 mb-6">{cat.description}</p>
                            <ul className="space-y-3">
                                {cat.links.map((link, i) => (
                                    <li key={i}>
                                        <a href="#" className="flex items-center text-blue-600 hover:text-blue-800 font-medium group">
                                            <Book className="w-4 h-4 mr-2 text-slate-400 group-hover:text-blue-600" />
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Can't find what you need?</h3>
                    <p className="text-slate-600 mb-8">
                        If you need further assistance, our support team is available mon-fri 9am-6pm.
                    </p>
                    <Link href="/contact" className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                        Contact Support
                    </Link>
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
                        <Link href="/faq" className="text-slate-400 hover:text-white text-sm transition-colors">FAQ</Link>
                        <Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</Link>
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
