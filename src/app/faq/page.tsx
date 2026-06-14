import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown, Instagram, Linkedin } from "lucide-react";

export const metadata = {
    title: "Frequently Asked Questions - QuickBiteQR",
    description: "Common questions and answers about QuickBiteQR restaurant management system",
};

export default function FAQPage() {
    const faqs = [
        {
            question: "How does the QR menu work?",
            answer: "We generate a unique QR code for each of your tables. When customers scan it with their phone camera, they instantly see your digital menu, can customize items, and place orders directly to your kitchen or bar."
        },
        {
            question: "Do customers need to download an app?",
            answer: "No, that's the best part! QuickBiteQR works directly in any mobile browser (Chrome, Safari, etc.). Customers simply scan the QR code and start ordering immediately without installing anything."
        },
        {
            question: "Can I update my menu in real-time?",
            answer: "Yes, absolutely. You can change prices, add daily specials, or mark items as 'out of stock' instantly from your dashboard. All changes reflect immediately on the QR menus."
        },
        {
            question: "Is there a limit to the number of orders?",
            answer: "No, all our plans include unlimited orders. We want you to grow without worrying about hitting caps or paying per-order fees."
        },
        {
            question: "Does it support multiple languages?",
            answer: "Yes, our digital menus can be set up to clear language barriers for international tourists. The interface is intuitive and easy to navigate for everyone."
        },
        {
            question: "How secure are the payments?",
            answer: "Very secure. We integrate with leading payment processors that are PCI-DSS compliant to handle all transactions safely. We do not store sensitive card data on our servers."
        },
        {
            question: "Can I manage multiple restaurant locations?",
            answer: "Yes, our platform supports multi-location management from a single master account, making it perfect for restaurant chains and franchises."
        },
        {
            question: "What hardware do I need?",
            answer: "None! You can run the kitchen display system on any tablet, laptop, or smartphone you already own. We provide the software; you use your existing devices."
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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h1>
                    <p className="text-lg text-slate-600">
                        Everything you need to know about QuickBiteQR. Can't find the answer you're looking for? <Link href="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>.
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <details className="group">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6">
                                    <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                                    <span className="transition group-open:rotate-180">
                                        <ChevronDown className="w-5 h-5 text-slate-500" />
                                    </span>
                                </summary>
                                <div className="text-slate-600 px-6 pb-6 leading-relaxed border-t border-slate-100 pt-4">
                                    {faq.answer}
                                </div>
                            </details>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-blue-50 rounded-2xl p-8 sm:p-12 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h3>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                        Our support team is always ready to help. Reach out to us and we'll get back to you as soon as possible.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                            Contact Support
                        </Link>
                        <Link href="/help" className="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                            Help Center
                        </Link>
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
