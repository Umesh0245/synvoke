export interface Project {
    id: string;
    title: string;
    category: string;
    desc: string;
    image: string;
    websiteLink: string;
    technologies: string[];
    objectives: string[];
}

export const projects: Project[] = [
    {
        id: "acuitix",
        title: "Acuitix",
        category: "EdTech · Secure Exams",
        desc: "Acuitix is SynVoke's flagship secure online examination platform — engineered for institutions that demand zero-compromise integrity. Featuring AI-powered proctoring, real-time analytics, and a fortified student-admin interface built for enterprise-scale assessments.",
        image: "/images/exam_portal.png",
        websiteLink: "https://acuitix.com",
        technologies: ["React", "Firebase", "Node.js", "WebRTC", "Socket.io", "AI Proctoring"],
        objectives: ["Deliver tamper-proof large-scale exam delivery", "AI-driven proctoring for absolute integrity", "Real-time synchronized results and analytics"]
    },
    {
        id: "ai-arcade",
        title: "AI Arcade",
        category: "AI Platform",
        desc: "An advanced arcade and marketplace of AI tools. Discover premium AI algorithms, read insightful blogs, and engage with a global developer community. Experience a robust platform offering specialized tools and learning resources for AI enthusiasts.",
        image: "/images/ai_arcade.png",
        websiteLink: "https://www.aiarcade.tech/",
        technologies: ["React", "Next.js", "GPT-4 AI", "Tailwind CSS", "Node.js"],
        objectives: ["Centralize cutting-edge AI utility", "Ensure an intuitive UX for prompt generation", "Create an automated marketplace for models"]
    },
    {
        id: "diligince",
        title: "Diligince.ai",
        category: "Industrial SaaS",
        desc: "Plant operations intelligence platform connecting requirement governance, procurement decisions, and work execution for heavy industry. Features DICE AI for workflow-aware assistance, ERP integration (SAP, Tally), and end-to-end vendor coordination — from store check to work order closure.",
        image: "/images/og-synvoke.jpg",
        websiteLink: "https://www.diligince.ai/",
        technologies: ["React", "Node.js", "PostgreSQL", "AI / DICE", "ERP Integration", "Tailwind CSS"],
        objectives: ["Bridge the gap between ERP systems and plant floor execution", "Structured vendor engagement with full audit trail", "AI-assisted requirement and procurement workflows"]
    },
    {
        id: "nexagen",
        title: "NexaGen",
        category: "AI · Enterprise",
        desc: "NexaGen is an enterprise AI acceleration platform that integrates large language models into business workflows — automating documentation, intelligent search, and decision support across operations teams.",
        image: "/images/og-synvoke.jpg",
        websiteLink: "#",
        technologies: ["Python", "LangChain", "React", "FastAPI", "PostgreSQL", "OpenAI"],
        objectives: ["Embed LLM intelligence into core business ops", "Automate document generation and retrieval", "Deliver measurable ROI through AI workflow gains"]
    },
    {
        id: "clara-it",
        title: "Clara IT",
        category: "IT Services",
        desc: "A comprehensive IT services and managed solutions platform for growing businesses. Clara IT consolidates infrastructure management, helpdesk operations, and cloud migrations into a single, transparent service layer.",
        image: "/images/og-synvoke.jpg",
        websiteLink: "#",
        technologies: ["AWS", "Azure", "Terraform", "Docker", "Node.js", "React"],
        objectives: ["Unify IT operations under one managed platform", "Reduce infrastructure overhead for SMBs", "Enable seamless cloud migration and governance"]
    },
    {
        id: "playflux",
        title: "Playflux",
        category: "E-Commerce",
        desc: "A high-octane e-commerce destination exclusively built for premium gaming gear and accessories. Engineered for exceptional search speeds and a hyper-optimized checkout flow, delivering the ultimate shopping experience for gamers.",
        image: "/images/playflux.png",
        websiteLink: "#",
        technologies: ["Shopify Plus", "React", "Framer Motion", "GraphQL", "Tailwind CSS"],
        objectives: ["Deliver neon cinematic product previews", "Implement lightning-fast edge cart system", "Enhance global gear delivery logistics"]
    },
    {
        id: "house-of-vastra",
        title: "House of Vastra",
        category: "E-Commerce",
        desc: "An elegant, premium online boutique specializing in authentic Indian traditional attire. Featuring a breathtaking visual design that beautifully showcases intricate clothing while prioritizing a seamless, luxury shopping journey.",
        image: "/images/house_of_vastra.png",
        websiteLink: "#",
        technologies: ["Next.js", "Stripe", "PostgreSQL", "Tailwind CSS"],
        objectives: ["Highlight premium HD texture detail beautifully", "Ensure a minimalist luxury shopping sequence", "Architect limitless e-commerce catalog capability"]
    }
];
