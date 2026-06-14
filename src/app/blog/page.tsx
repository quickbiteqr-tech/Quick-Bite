import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, ArrowRight, User, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Blog - QuickBiteQR",
    description: "Latest news, tips, and insights for restaurant owners from QuickBiteQR",
};

export default function BlogPage() {
    const posts = [
        {
            title: "How QR Menus Increase Table Turnover",
            excerpt: "Discover how digital menus streamline the ordering process and help you serve more customers during peak hours.",
            date: "Jan 1, 2026",
            author: "Indrajit Barman",
            category: "Operations",
            image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "5 Tips to Design a Menu That Sells",
            excerpt: "Learn the psychology behind menu engineering and how to arrange your digital menu to boost high-margin items.",
            date: "Dec 28, 2025",
            author: "Sarah Smith",
            category: "Marketing",
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "The Future of Contactless Dining",
            excerpt: "Contactless dining is here to stay. See what trends are shaping the restaurant industry in 2026 and beyond.",
            date: "Dec 15, 2025",
            author: "Indrajit Barman",
            category: "Trends",
            image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Reducing Food Waste with Inventory Tracking",
            excerpt: "How real-time order tracking and inventory management can help you cut costs and be more sustainable.",
            date: "Nov 30, 2025",
            author: "Mike Johnson",
            category: "Sustainability",
            image: "https://images.unsplash.com/photo-1629859239462-870305d28bba?auto=format&fit=crop&q=80&w=800"
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

            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Our Blog</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Insights, success stories, and tips to help you run a better restaurant business.
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {posts.map((post, idx) => (
                        <article key={idx} className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {post.category}
                                </div>
                            </div>
                            <div className="flex-1 p-8 flex flex-col">
                                <div className="flex items-center text-sm text-slate-500 mb-4 space-x-4">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-2" />
                                        {post.author}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3 hover:text-blue-600 transition-colors cursor-pointer">
                                    {post.title}
                                </h2>
                                <p className="text-slate-600 mb-6 flex-1">
                                    {post.excerpt}
                                </p>
                                <Link href="#" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition-colors group">
                                    Read Article
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button className="bg-white border border-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                        Load More Posts
                    </button>
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
                        <Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</Link>
                        <Link href="/help" className="text-slate-400 hover:text-white text-sm transition-colors">Help Center</Link>
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
