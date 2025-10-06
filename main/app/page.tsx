
"use client";

import Image from "next/image";
import { IconCalendar, IconStack2, IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiaGithub } from "react-icons/lia";
import { FaLink, FaLinkedin } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/kibo-ui/announcement";
import { ArrowUpRightIcon } from "lucide-react";

export default function F1EngineerPage() {
  const [exiting, setExiting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'tech-stack', label: 'Tech Stack' },
    { 
      id: 'rag-pipeline', 
      label: 'RAG Pipeline',
      subSections: [
        { id: 'pdf-processing', label: 'PDF Processing' },
        { id: 'embeddings', label: 'Vector Embeddings' },
        { id: 'retrieval', label: 'Context Retrieval' }
      ]
    },
    { id: 'voice-agent', label: 'Voice Agent',
      subSections: [
        { id: 'livekit-setup', label: 'LiveKit Setup' },
        { id: 'agent-personality', label: 'Agent Personality' }]
   },
     { id: 'demo', label: 'Demo & Results' },

  ];

  useEffect(() => {
    setLightMode(localStorage.getItem("theme") === "light");
  }, []);

  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 50);
    return () => {
      document.body.style.cursor = "";
      document.body.style.overflow = "";
      clearTimeout(timeout);
    };
  }, []);

  // Intersection Observer for tracking active section
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }

      if (section.subSections) {
        section.subSections.forEach(subSection => {
          const subElement = document.getElementById(subSection.id);
          if (subElement) {
            observer.observe(subElement);
          }
        });
      }
    });

    

    return () => observer.disconnect();
  }, [loaded]);

  const handleBack = () => {
    setExiting(true);
    setTimeout(() => {
      router.push("/innovation");
    }, 200);
  };

  const smoothScrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const textColor = "#ffffff";
  const fadedText = "#9ca3af"; // muted text
  const fadedLabel = "#a1a1aa"; // slightly stronger muted label
  const bgColor = "#0e0e0e";

  const NavigationItem = ({ section, isActive }: { section: { id: string; label: string }, isActive: boolean }) => (
    <li className="relative">
      <button 
        onClick={() => smoothScrollToSection(section.id)}
        className="flex items-center w-full text-left transition-all duration-300 ease-out hover:translate-x-1"
        style={{ 
          color: isActive ? textColor : fadedText,
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          padding: 0,
          paddingLeft: isActive ? "1rem" : "0"
        }}
      >
        <div 
          className="absolute left-0 transition-all duration-300 ease-out"
          style={{
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateX(0)' : 'translateX(-8px)'
          }}
        >
          <IoIosArrowForward size={12} color="#ffffff" />
        </div>
        <span className="transition-all duration-300">
          {section.label}
        </span>
      </button>
    </li>
  );

  const SubNavigationItem = ({ subSection, isActive }: { subSection: { id: string; label: string }, isActive: boolean }) => (
    <li className="relative ml-4">
      <button 
        onClick={() => smoothScrollToSection(subSection.id)}
        className="flex items-center w-full text-left transition-all duration-300 ease-out hover:translate-x-1"
        style={{ 
          color: isActive ? textColor : fadedText,
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          padding: 0,
          paddingLeft: isActive ? "1rem" : "0",
          fontSize: "0.8rem"
        }}
      >
        <div 
          className="absolute left-0 transition-all duration-300 ease-out"
          style={{
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateX(0)' : 'translateX(-8px)'
          }}
        >
          <IoIosArrowForward size={10} color="#ffffff" />
        </div>
        <span className="transition-all duration-300">
          {subSection.label}
        </span>
      </button>
    </li>
  );

  return (
    <>
      <style jsx global>{`
        /* Custom scrollbar styles for webkit browsers (Chrome, Safari, Edge) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        /* Custom scrollbar for Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        
        /* For better compatibility across browsers */
        .custom-scrollbar {
          scrollbar-gutter: stable;
        }

        /* Smooth arrow animation */
        .nav-arrow {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <div
        className={`h-screen flex flex-col font-sans transition-all duration-700 ease-in-out ${
          loaded && !exiting ? "opacity-100 blur-none" : "opacity-0 blur-sm"
        }`}
        style={{ background: bgColor, color: textColor }}
      >
        <div className="flex-shrink-0 px-4 sm:px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <button
              onClick={handleBack}
              className="relative group border-none bg-none text-[0.9rem] pb-0.5 cursor-pointer ml-2 sm:ml-6 mt-6 sm:mt-10"
              style={{ color: fadedText }}
              onMouseOver={(e) => (e.currentTarget.style.color = textColor)}
              onMouseOut={(e) => (e.currentTarget.style.color = fadedText)}
            >
              ← Back
              <span className="absolute left-0 -bottom-0.5 h-0.25 w-full bg-current origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 pb-16 flex flex-col lg:flex-row gap-0 lg:gap-8">
        <aside className="hidden lg:block w-64 sticky top-20 self-start">
              <nav>
                <h3 className="inline-flex items-center gap-2" style={{ color: 'white', fontSize: "0.9rem", marginBottom: "1rem" }}>
                   Table of Contents
                </h3>
                <ul style={{ fontSize: "0.85rem" }} className="space-y-3">
                {sections.map((section) => (
  <div key={section.id}>
    <NavigationItem 
      section={section} 
      isActive={activeSection === section.id} 
    />
    {section.subSections && (
      <ul className="space-y-2 mt-2">
        {section.subSections.map((subSection) => (
          <SubNavigationItem
            key={subSection.id}
            subSection={subSection}
            isActive={activeSection === subSection.id}
          />
        ))}
      </ul>
    )}
  </div>
))}
                </ul>
              </nav>
            </aside>
            <div className="flex-1 w-full max-w-3xl p-1" style={{ overflowX: "hidden" }}>
          
          <p style={{ fontSize: "0.6rem", color: fadedText }}>
              December 2024
              </p>

            <header className="space-y-4 mt-3">
                            <h1 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Adrian – F1 Race Engineer AI 🏎️
                <a href="https://github.com/yourusername/f1-engineer" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <LiaGithub size={20} color={textColor} />
                </a>

              </h1>

              
              <p style={{ fontSize: "0.9rem", color: fadedText }}>
              A voice-powered F1 race engineer that combines RAG over FIA regulations with real-time championship calculations. Built with LiveKit, LangChain, and OpenAI.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-x-2 sm:gap-y-0">
  <Announcement style={{ border: "1px solid #3a3a3a" }}>
    <AnnouncementTag>LiveKit</AnnouncementTag>
    <AnnouncementTitle>
      Voice AI
      <ArrowUpRightIcon className="shrink-0 text-muted-foreground" size={16} />
    </AnnouncementTitle>
  </Announcement>

  <Announcement style={{ border: "1px solid #3a3a3a" }}>
    <AnnouncementTag>RAG</AnnouncementTag>
    <AnnouncementTitle>
      FIA Regulations
      <ArrowUpRightIcon className="shrink-0 text-muted-foreground" size={16} />
    </AnnouncementTitle>
  </Announcement>
</div>

            
            </header>

            <div className="mt-8 rounded-2xl" style={{ background: "#111111"}}>
              <img src="/f1-hero.png" className="w-full h-auto aspect-video object-cover rounded-2xl"></img>
            </div>

            <nav className="mt-10 lg:hidden">
              <h3 className="inline-flex items-center gap-2" style={{ color: fadedLabel, fontSize: "0.8rem", marginBottom: "1rem" }}>
                <IconInfoCircle size={"0.8rem"} color={textColor} /> Table of Contents
              </h3>
              <ul style={{ fontSize: "0.85rem" }} className="space-y-3">
              {sections.map((section) => (
  <div key={section.id}>
    <NavigationItem 
      section={section} 
      isActive={activeSection === section.id} 
    />
    {section.subSections && (
      <ul className="space-y-2 mt-2">
        {section.subSections.map((subSection) => (
          <SubNavigationItem
            key={subSection.id}
            subSection={subSection}
            isActive={activeSection === subSection.id}
          />
        ))}
      </ul>
    )}
  </div>
))}
              </ul>
            </nav>

            <article className="prose prose-invert max-w-none mt-10">
              <section id="introduction">
                <h2 style={{ fontSize: "1.5rem" }}>Introduction</h2>
                <p style={{ color: fadedText, fontSize: "0.9rem", marginTop: "0.5rem" }}>
               
                Adrian is a voice-powered F1 race engineer that combines RAG (Retrieval-Augmented Generation) over FIA sporting regulations with real-time championship calculations. The goal was to create an AI assistant that could answer complex F1 questions like "If Max has 400 points and Lando has 350 with 3 races left, can Lando still win?" while also being able to instantly reference specific FIA regulations.
<br></br>
<br></br>
The project uses LiveKit for real-time voice communication, LangChain for the RAG pipeline, and OpenAI's GPT-4 for natural language understanding. What makes Adrian unique is the combination of structured data (championship calculations) with unstructured data (FIA regulation PDFs) in a single conversational interface.
         </p>
              </section>

            

              <section id="tech-stack">
                <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Tech Stack</h2>
                <p style={{ color: fadedText, fontSize: "0.9rem", marginTop: "0.5rem" }}>
                The architecture consists of three main components working together:
                
                <br></br>
                <br></br>
                <span className="text-white font-mono bg-white/10 px-1 rounded">LiveKit</span> - Handles real-time voice communication with sub-second latency. LiveKit provides the WebRTC infrastructure for bidirectional audio streaming between the user and the AI agent.
                < br></br>
                <br></br>
                <span className="text-white font-mono bg-white/10 px-1 rounded">LangChain + ChromaDB</span> - Powers the RAG pipeline. The FIA regulations PDF is chunked into 1000-character segments with 200-character overlap, embedded using OpenAI's embeddings, and stored in ChromaDB for semantic search.
                
                <br></br>
                <br></br>
                <span className="text-white font-mono bg-white/10 px-1 rounded">OpenAI GPT-4</span> - Provides the natural language understanding and generation. The model is given function-calling tools for championship calculations and receives retrieved regulation context dynamically.
                <br></br>
                <br></br>
                The frontend is built with Next.js 15 and uses LiveKit's React components for the voice interface. The backend Python agent runs on LiveKit's agent framework and orchestrates everything together.
                </p>
              </section>

              <section id="rag-pipeline">
                <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>RAG Pipeline</h2>
                <p id="pdf-processing" style={{ color: fadedText, fontSize: "0.9rem", marginTop: "0.5rem" }}>
                The RAG pipeline is the core of Adrian's ability to answer regulation questions. It starts with the FIA Formula 1 Sporting Regulations PDF (a 200+ page document).
                
  </p>

                <p id="embeddings" style={{ color: fadedText, fontSize: "0.9rem" }}>

                  <br></br>
                  <br></br>
                  The PDF is loaded using <span className="text-white font-mono bg-white/10 px-1 rounded">PyPDFLoader</span> and split into chunks using <span className="text-white font-mono bg-white/10 px-1 rounded">RecursiveCharacterTextSplitter</span>. Each chunk is 1000 characters with 200-character overlap to maintain context across boundaries. This chunking strategy ensures that related information stays together while keeping chunks small enough for effective retrieval.
                  <br></br>
                  <br></br>
                  Each chunk is then embedded using OpenAI's <span className="text-white font-mono bg-white/10 px-1 rounded">text-embedding-ada-002</span> model, which converts text into 1536-dimensional vectors. These embeddings capture semantic meaning, allowing us to find relevant regulations even when the user's question uses different wording.
                
                 </p>
                  
  
  <p id="retrieval" style={{ color: fadedText, fontSize: "0.9rem" }}>

The embeddings are stored in ChromaDB, a vector database optimized for similarity search. When a user asks a question, we:   
   <br></br>
   <br></br>
   1. Detect if the question requires regulation lookup (keywords like "rule", "regulation", "points system", etc.)
    <br></br>
    <br></br>
    2. Embed the user's question using the same embedding model
<br></br>
<br></br>
3. Perform a similarity search in ChromaDB to find the top 4 most relevant chunks
<br></br>
<br></br>
4. Inject these chunks into the LLM's context with source page numbers
<br></br>
<br></br>
This approach gives Adrian access to the entire FIA rulebook without needing to fit it all in the LLM's context window. The retrieval happens in real-time during the conversation, so Adrian always has the most relevant information at hand.

   <br></br>
   <br></br>

   <img src="/rag-diagram.png" className="w-full aspect-video rounded-2xl"></img>
   <br></br>
   <br></br>
   

 
     
                </p>
              </section>


              <section id="voice-agent">
                <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Voice Agent</h2>
                <p id="livekit-setup" style={{ color: fadedText, fontSize: "0.9rem", marginTop: "0.5rem" }}>
                The voice agent is built on LiveKit's agent framework, which handles the complexity of real-time voice communication. The architecture consists of several components:
                <br></br>
<br></br>
<span className="text-white font-mono bg-white/10 px-1 rounded">VAD (Voice Activity Detection)</span> - Uses Silero VAD to detect when the user starts and stops speaking, enabling natural turn-taking in the conversation.
</p>
  <p style={{ color: fadedText, fontSize: "0.9rem" }}>

 <br></br>
<br></br>
<span className="text-white font-mono bg-white/10 px-1 rounded">STT (Speech-to-Text)</span> - Converts user speech to text using OpenAI's Whisper model. This runs in real-time with sub-second latency.
<br></br>
<br></br>
<span className="text-white font-mono bg-white/10 px-1 rounded">LLM Processing</span> - The transcribed text is sent to GPT-4, which has access to function-calling tools for championship calculations and receives RAG context for regulation questions.
<br></br>
<br></br>
<span className="text-white font-mono bg-white/10 px-1 rounded">TTS (Text-to-Speech)</span> - The LLM's response is converted back to speech using OpenAI's TTS with the "echo" voice, which has a professional, measured tone perfect for a race engineer.

  </p>

<p id="agent-personality" style={{ color: fadedText, fontSize: "0.9rem" }}>

Adrian's personality is carefully crafted through the system prompt. He's designed to sound like a veteran F1 race engineer - calm, measured, technical but accessible. Key personality traits include:
<br></br>
<br></br>
• Using phrases like "Let me run those numbers..." before calculations
<br></br>
<br></br>
• Referencing specific FIA articles when discussing regulations
<br></br>
<br></br>
• Keeping responses concise (30-60 seconds of speech)
<br></br>
<br></br>
• Showing enthusiasm for clever strategies with words like "Brilliant" or "Questionable call"

<br></br>
<br></br>

The agent has three function-calling tools: <span className="text-white font-mono bg-white/10 px-1 rounded">calculate_championship_scenario</span>, <span className="text-white font-mono bg-white/10 px-1 rounded">calculate_points_swing</span>, and <span className="text-white font-mono bg-white/10 px-1 rounded">calculate_pit_stop_time_loss</span>. These tools provide precise mathematical calculations that complement the RAG-retrieved regulation context.
</p>

<br></br>
</section>

<section id="demo">    
<h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Demo & Results</h2>
<p style={{ color: fadedText, fontSize: "0.9rem" }}>
Adrian successfully combines structured and unstructured data in a natural conversational interface. Users can ask complex questions like "If Max has 400 points and Lando has 350 with 3 races left, can Lando win?" and get instant mathematical analysis. They can also ask "What's the F1 points system?" and Adrian will retrieve the exact regulation from the FIA document, citing the specific article number.

<br></br>
<br></br>
The voice interface makes it feel like talking to a real race engineer. The sub-second latency means conversations flow naturally without awkward pauses. The combination of RAG for regulations and function-calling for calculations creates a powerful assistant that's both knowledgeable and precise.
<br></br>
<br></br>
Try it yourself by clicking the button below to start a conversation with Adrian!


</p>              

                    <video
  src="/f1-demo.mp4"
  className="w-full aspect-video rounded-2xl mt-6"
  autoPlay
  loop
  muted
  playsInline
></video>    

</section>


              <section id="demo">
                <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Key Learnings</h2>
                <p style={{ color: fadedText, fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Building Adrian taught me a lot about combining different AI techniques. RAG is powerful for giving LLMs access to large documents, but it needs to be combined with structured tools for precise calculations. The voice interface adds a whole new dimension - latency matters way more than in text chat, and personality design becomes crucial for user experience.
                <br></br>
                <br></br>
                LiveKit's agent framework made the voice part surprisingly straightforward, handling all the WebRTC complexity. The hardest part was tuning the RAG pipeline - finding the right chunk size, overlap, and retrieval parameters to balance relevance with context length.
                </p>
              </section>
<div className="mt-90"></div>
            </article>


            {/* <section className="hidden lg:block mt-12 grid grid-cols-2 gap-6">
              <div>
                <h3 className="inline-flex items-center gap-2" style={{ color: fadedLabel, fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                  <IconCalendar size={"0.8rem"} color={textColor} /> Details
                </h3>
                <ul style={{ color: fadedText, fontSize: "0.85rem" }}>
                  <li>Co-Founder & Founding Engineer</li>
                  <li>August 2024 – Present</li>
                </ul>
              </div>
              <div>
                <h3 className="inline-flex items-center gap-2" style={{ color: fadedLabel, fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                  <IconStack2 size={"0.8rem"} color={textColor} /> Tech Stack
                </h3>
                <ul style={{ color: fadedText, fontSize: "0.85rem" }}>
                  <li>Next.js</li>
                  <li>TypeScript</li>
                  <li>Amazon S3</li>
                  <li>Supabase</li>
                  <li>Firestore</li>
                </ul>
              </div>
            </section> */}


            </div>
          </div>
        </div>
      </div>
    </>
  );
}