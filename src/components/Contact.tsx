import React from 'react';

export default function Contact() {
    return (
        <section id="contact" className="py-24 bg-white relative z-20 border-t border-gray-100">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <div className="flex-1">
                        <span className="text-indigo-600 font-semibold tracking-wider text-sm uppercase mb-2 block">Available for Freelance</span>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                            Let's build <br className="hidden md:block" /> something great.
                        </h2>
                        <p className="text-xl text-gray-500 mb-8 max-w-lg leading-relaxed">
                            We're currently accepting new projects. Get in touch to discuss your next big idea.
                        </p>

                        <div className="space-y-4">
                            <a href="mailto:contact.synvoke@gmail.com" className="block text-2xl md:text-3xl lg:text-4xl font-display font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                                contact.synvoke@gmail.com
                            </a>
                            <p className="text-gray-500 text-lg">+91 9642469249</p>
                            <p className="text-gray-500 text-lg">Madhapur, Hyderabad, Telangana - 500081</p>
                        </div>

                        <div className="mt-12 flex gap-6">
                            <SocialLink href="/coming-soon" label="Twitter" />
                            <SocialLink href="/coming-soon" label="LinkedIn" />
                            <SocialLink href="/coming-soon" label="Instagram" />
                            <SocialLink href="/coming-soon" label="Dribbble" />
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60"></div>

                        <form className="space-y-6 relative z-10">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Project Details</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none shadow-sm"
                                    placeholder="Tell us about your project goals and requirements..."
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full btn btn-primary flex justify-center items-center gap-2 group">
                                Send Message
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send group-hover:translate-x-1 transition-transform">
                                    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-gray-500">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <p>&copy; {new Date().getFullYear()} SynVoke. All rights reserved.</p>
                        <span className="hidden sm:inline text-gray-200">·</span>
                        <a href="https://acuitix.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors font-semibold text-gray-700">
                            Acuitix – Secure Online Exams
                        </a>
                    </div>
                    <div className="flex gap-6">
                        <a href="/acuitix" className="hover:text-indigo-600 transition-colors">Our Products</a>
                        <a href="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                        <a href="/terms-of-service" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                        <a href="/admin" className="hover:text-indigo-600 transition-colors text-gray-300">Portals</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

const SocialLink = ({ href, label }: { href: string; label: string }) => (
    <a
        href={href}
        className="text-gray-500 hover:text-indigo-600 font-medium transition-colors border-b border-transparent hover:border-indigo-600 pb-0.5"
    >
        {label}
    </a>
);
