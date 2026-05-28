import { useState, useEffect, useRef } from "react";

// ── Typing animation hook ──────────────────────────────────────────────────
function useTyping(words, speed = 90, pause = 1800) {
  const [text, setText] = useState("");
  const [wIdx, setWIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wIdx];
    const delay = deleting ? speed / 2 : speed;
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        } else setCharIdx((c) => c + 1);
      } else {
        setText(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setWIdx((w) => (w + 1) % words.length);
          setCharIdx(0);
        } else setCharIdx((c) => c - 1);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wIdx, words, speed, pause]);

  return text;
}

// ── Intersection Observer hook ─────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Reveal wrapper ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────────────────
function Loader({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#050a14",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1.5rem",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        border: "3px solid #1e2a3a",
        borderTop: "3px solid #38bdf8",
        animation: "spin 0.9s linear infinite",
      }} />
      <p style={{ color: "#94a3b8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.3em", fontSize: 13 }}>
        LOADING PORTFOLIO
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Particle background (canvas) ───────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,189,248,0.5)";
        ctx.fill();
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(56,189,248,${0.12 * (1 - d / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    }
    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Glassmorphism card ─────────────────────────────────────────────────────
function Glass({ children, className = "", style = {} }) {
  return (
    <div className={className} style={{
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(56,189,248,0.15)",
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Gradient text ──────────────────────────────────────────────────────────
function GT({ children, style = {} }) {
  return (
    <span style={{
      background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #e879f9 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style,
    }}>
      {children}
    </span>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
const NAV_LINKS = ["Hero","About","Skills","Projects","Certifications","Internship","Resume","Contact"];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(5,10,20,0.9)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(56,189,248,0.1)" : "none",
      transition: "all 0.3s ease",
      padding: "0 1.5rem",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, cursor: "pointer" }}
          onClick={() => scrollTo("hero")}>
          <GT>KK</GT>
        </span>
        {/* Desktop links */}
        <div style={{ display: "flex", gap: "1.5rem" }} className="nav-desktop">
          {NAV_LINKS.map(l => (
            <button key={l} onClick={() => scrollTo(l.toLowerCase())} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#38bdf8"}
              onMouseLeave={e => e.target.style.color = "#94a3b8"}
            >{l}</button>
          ))}
        </div>
        {/* Mobile burger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="nav-mobile" style={{
          background: "none", border: "none", cursor: "pointer", display: "none",
          flexDirection: "column", gap: 5, padding: 4,
        }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 22, height: 2, background: "#38bdf8", borderRadius: 2 }} />)}
        </button>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: "rgba(5,10,20,0.97)", borderTop: "1px solid rgba(56,189,248,0.1)",
          padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          {NAV_LINKS.map(l => (
            <button key={l} onClick={() => scrollTo(l.toLowerCase())} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", fontSize: 15, fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
              textAlign: "left", padding: "0.4rem 0",
            }}>{l}</button>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

// ── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  const typed = useTyping(["AI/ML Developer", "Full Stack Developer", "Deep Learning Enthusiast", "Problem Solver"]);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "6rem 1.5rem 4rem",
      position: "relative", textAlign: "center",
    }}>
      <div style={{ maxWidth: 800, position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{
            display: "inline-block",
            padding: "6px 20px", marginBottom: "1.5rem",
            background: "rgba(56,189,248,0.1)", borderRadius: 99,
            border: "1px solid rgba(56,189,248,0.25)",
            color: "#38bdf8", fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>
            Welcome to my portfolio
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2.8rem,7vw,5rem)", fontWeight: 800, lineHeight: 1.1, fontFamily: "'Rajdhani', sans-serif", color: "#f1f5f9" }}>
            Kavyanjali
            <br />
            <GT>Kulukuri</GT>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontSize: "clamp(1.1rem,3vw,1.6rem)", color: "#64748b", marginBottom: "1rem", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
            <span style={{ color: "#38bdf8" }}>&gt; </span>
            <span style={{ color: "#e2e8f0" }}>{typed}</span>
            <span style={{ animation: "blink 1s step-end infinite", color: "#38bdf8" }}>|</span>
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p style={{ color: "#94a3b8", fontSize: "clamp(0.95rem,2vw,1.1rem)", maxWidth: 620, margin: "0 auto 2.5rem", lineHeight: 1.8 }}>
            Passionate about building intelligent systems and elegant web experiences. 
            Bridging the gap between AI research and real-world applications.
          </p>
        </Reveal>
        <Reveal delay={0.4}>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "View Projects", id: "projects", primary: true },
              { label: "Download Resume", id: "resume", primary: false },
              { label: "Contact Me", id: "contact", primary: false },
            ].map(btn => (
              <button key={btn.label} onClick={() => scrollTo(btn.id)} style={{
                padding: "0.75rem 1.75rem", borderRadius: 10, cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.08em",
                border: btn.primary ? "none" : "1px solid rgba(56,189,248,0.35)",
                background: btn.primary ? "linear-gradient(135deg,#38bdf8,#818cf8)" : "rgba(56,189,248,0.08)",
                color: btn.primary ? "#050a14" : "#38bdf8",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(56,189,248,0.3)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
              >{btn.label}</button>
            ))}
          </div>
        </Reveal>
        {/* Scroll indicator */}
        <Reveal delay={0.6}>
          <div style={{ marginTop: "4rem", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 24, height: 38, borderRadius: 12, border: "2px solid rgba(56,189,248,0.4)", display: "flex", justifyContent: "center", paddingTop: 6 }}>
              <div style={{ width: 3, height: 8, borderRadius: 2, background: "#38bdf8", animation: "scroll-dot 2s infinite" }} />
            </div>
          </div>
        </Reveal>
      </div>
      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scroll-dot { 0%,100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(10px); opacity: 0.3; } }
      `}</style>
    </section>
  );
}

// ── ABOUT ──────────────────────────────────────────────────────────────────
function About() {
  const stats = [
    { label: "Projects Built", value: "5+" },
    { label: "Certifications", value: "3" },
    { label: "Internships", value: "2" },
    { label: "Tech Skills", value: "15+" },
  ];
  return (
    <section id="about" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            About <GT>Me</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── WHO I AM ─── ●</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "2rem", alignItems: "start" }}>
          <Reveal delay={0.1}>
            <Glass style={{ padding: "2rem", height: "100%" }}>
              {/* Avatar */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: 120, height: 120, borderRadius: "50%",
                  background: "linear-gradient(135deg, #38bdf8, #818cf8, #e879f9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 42, fontWeight: 800, fontFamily: "'Rajdhani', sans-serif", color: "#050a14",
                  boxShadow: "0 0 40px rgba(56,189,248,0.4)",
                }}>KK</div>
              </div>
              <h3 style={{ color: "#f1f5f9", textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: 22, marginBottom: "1rem" }}>Kavyanjali Kulukuri</h3>
              <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: 14 }}>
                A dedicated B.Tech student in <span style={{ color: "#38bdf8" }}>Artificial Intelligence &amp; Data Science</span>, passionate about crafting intelligent systems that solve real-world problems. I blend the analytical depth of <span style={{ color: "#818cf8" }}>Machine Learning &amp; Deep Learning</span> with the creative craft of Full Stack Web Development.
              </p>
              <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: 14, marginTop: "0.75rem" }}>
                My journey spans building CNN-powered image classifiers, conversational AI chatbots, emotion recognition systems, and responsive web applications — all driven by a relentless curiosity and passion for problem-solving.
              </p>
            </Glass>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Reveal delay={0.2}>
              <Glass style={{ padding: "1.5rem" }}>
                <h4 style={{ color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Education</h4>
                <p style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}>B.Tech – AI &amp; Data Science</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Specializing in Machine Learning, Deep Learning, Neural Networks, and Full Stack Development with a focus on building production-ready AI solutions.</p>
              </Glass>
            </Reveal>
            <Reveal delay={0.3}>
              <Glass style={{ padding: "1.5rem" }}>
                <h4 style={{ color: "#818cf8", fontFamily: "'Rajdhani', sans-serif", fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Focus Areas</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Machine Learning","Deep Learning","CNN Architectures","Full Stack Dev","REST APIs","Python","React.js","Data Science"].map(t => (
                    <span key={t} style={{ padding: "4px 12px", borderRadius: 99, background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: "#818cf8", fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>{t}</span>
                  ))}
                </div>
              </Glass>
            </Reveal>
            <Reveal delay={0.35}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.75rem" }}>
                {stats.map(s => (
                  <Glass key={s.label} style={{ padding: "1rem", textAlign: "center" }}>
                    <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Rajdhani', sans-serif", margin: 0 }}><GT>{s.value}</GT></p>
                    <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>{s.label}</p>
                  </Glass>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SKILLS ─────────────────────────────────────────────────────────────────
const SKILLS = {
  Frontend: { color: "#38bdf8", items: ["HTML5","CSS3","JavaScript","React.js"] },
  Backend:  { color: "#818cf8", items: ["Flask","FastAPI","REST APIs","Node.js"] },
  "AI / ML": { color: "#e879f9", items: ["Python","TensorFlow","Scikit-learn","CNN","VGG16","Deep Learning"] },
  "DB & Tools": { color: "#34d399", items: ["MongoDB","SQLite","GitHub","VS Code","Jupyter Notebook"] },
};

function SkillBar({ label, pct, color }) {
  const [ref, vis] = useInView(0.1);
  return (
    <div ref={ref} style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#e2e8f0", fontSize: 13, fontFamily: "'Rajdhani', sans-serif" }}>{label}</span>
        <span style={{ color: color, fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          width: vis ? `${pct}%` : "0%",
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

const SKILL_LEVELS = {
  "HTML5":85,"CSS3":82,"JavaScript":78,"React.js":75,
  "Flask":70,"FastAPI":68,"REST APIs":75,"Node.js":60,
  "Python":88,"TensorFlow":72,"Scikit-learn":75,"CNN":70,"VGG16":68,"Deep Learning":72,
  "MongoDB":65,"SQLite":68,"GitHub":80,"VS Code":90,"Jupyter Notebook":85,
};

function Skills() {
  return (
    <section id="skills" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            Technical <GT>Skills</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── MY TOOLKIT ─── ●</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: "1.5rem" }}>
          {Object.entries(SKILLS).map(([cat, { color, items }], ci) => (
            <Reveal key={cat} delay={ci * 0.1}>
              <Glass style={{ padding: "1.75rem", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 12px ${color}` }} />
                  <h3 style={{ color, fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{cat}</h3>
                </div>
                {items.map(item => <SkillBar key={item} label={item} pct={SKILL_LEVELS[item] || 70} color={color} />)}
              </Glass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PROJECTS ───────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title: "Fish Disease Detection",
    desc: "Deep learning system using VGG16 architecture to detect and classify fish diseases from images with high accuracy. Trained on a custom dataset of diseased fish samples.",
    tags: ["Python","VGG16","TensorFlow","CNN","Flask","OpenCV"],
    icon: "🐟", accent: "#38bdf8",
    github: "https://github.com/Kavyakulukuri",
  },
  {
    title: "AI Healthcare Chatbot",
    desc: "Intelligent conversational AI chatbot for healthcare that provides symptom analysis, health tips, and medical information using NLP and ML models.",
    tags: ["Python","NLP","Flask","React.js","Scikit-learn"],
    icon: "🏥", accent: "#818cf8",
    github: "https://github.com/Kavyakulukuri",
  },
  {
    title: "Voice Emotion Recognition",
    desc: "Real-time voice emotion recognition system that analyzes audio features (MFCC, chroma) to classify emotions like happy, sad, angry, and neutral.",
    tags: ["Python","LibROSA","CNN","Deep Learning","Scikit-learn"],
    icon: "🎙️", accent: "#e879f9",
    github: "https://github.com/Kavyakulukuri",
  },
  {
    title: "TaskFlow – Task Manager",
    desc: "Full-featured task management web app with drag-and-drop boards, priority tagging, deadlines, and a clean responsive UI. Inspired by modern productivity tools.",
    tags: ["React.js","FastAPI","MongoDB","Tailwind CSS"],
    icon: "✅", accent: "#34d399",
    github: "https://github.com/Kavyakulukuri",
  },
  {
    title: "Restaurant Website",
    desc: "Modern, fully responsive restaurant landing page featuring an interactive menu, reservation system, gallery, and smooth animations for a premium dining experience.",
    tags: ["HTML","CSS","JavaScript","Responsive Design"],
    icon: "🍽️", accent: "#f97316",
    github: "https://github.com/Kavyakulukuri",
  },
];

function ProjectCard({ p, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${hovered ? p.accent + "55" : "rgba(56,189,248,0.1)"}`,
          borderRadius: 16,
          overflow: "hidden",
          transition: "all 0.3s ease",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered ? `0 20px 60px ${p.accent}22` : "none",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Image placeholder */}
        <div style={{
          height: 160,
          background: `linear-gradient(135deg, ${p.accent}22 0%, rgba(5,10,20,0.8) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 64, position: "relative", overflow: "hidden",
        }}>
          <span style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}>{p.icon}</span>
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(circle at center, ${p.accent}22 0%, transparent 70%)`,
          }} />
        </div>
        <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "#f1f5f9", fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.5rem" }}>{p.title}</h3>
          <p style={{ color: "#94a3b8", fontSize: 13.5, lineHeight: 1.7, flex: 1, marginBottom: "1rem" }}>{p.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
            {p.tags.map(t => (
              <span key={t} style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11,
                background: `${p.accent}15`, border: `1px solid ${p.accent}35`,
                color: p.accent, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em",
              }}>{t}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a href={p.github} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, textAlign: "center", padding: "0.5rem", borderRadius: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0", fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
              textDecoration: "none", fontWeight: 600, transition: "background 0.2s",
            }}
              onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.05)"}
            >⚡ GitHub</a>
            <button style={{
              flex: 1, padding: "0.5rem", borderRadius: 8, cursor: "pointer",
              background: `${p.accent}22`, border: `1px solid ${p.accent}44`,
              color: p.accent, fontSize: 13, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            }}>🔗 Live Demo</button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Projects() {
  return (
    <section id="projects" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            Featured <GT>Projects</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── WHAT I BUILT ─── ●</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: "1.5rem" }}>
          {PROJECTS.map((p, i) => <ProjectCard key={p.title} p={p} delay={i * 0.08} />)}
        </div>
      </div>
    </section>
  );
}

// ── CERTIFICATIONS ─────────────────────────────────────────────────────────
const CERTS = [
  { title: "Foundations of Modern Machine Learning", org: "IIIT Hyderabad", icon: "🎓", color: "#38bdf8", year: "2024" },
  { title: "TechSaksham AI Program", org: "Microsoft & SAP", icon: "🤖", color: "#818cf8", year: "2024" },
  { title: "Basics of Python", org: "Infosys Springboard", icon: "🐍", color: "#e879f9", year: "2023" },
];

function Certifications() {
  return (
    <section id="certifications" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            <GT>Certifications</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── CREDENTIALS ─── ●</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {CERTS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <Glass style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: `${c.color}22`, border: `1px solid ${c.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: "#f1f5f9", fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>{c.title}</h3>
                  <p style={{ color: c.color, fontSize: 13, margin: 0, fontFamily: "'Rajdhani', sans-serif" }}>{c.org}</p>
                </div>
                <span style={{
                  padding: "4px 14px", borderRadius: 99, fontSize: 12,
                  background: `${c.color}15`, border: `1px solid ${c.color}35`,
                  color: c.color, fontFamily: "'Rajdhani', sans-serif", whiteSpace: "nowrap",
                }}>{c.year}</span>
              </Glass>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── INTERNSHIP ─────────────────────────────────────────────────────────────
const INTERNSHIPS = [
  {
    role: "AI & ML Intern",
    org: "AICTE EduSkills",
    duration: "2024",
    color: "#38bdf8",
    icon: "🤖",
    points: [
      "Developed and trained ML models using Python, Scikit-learn, and TensorFlow",
      "Worked on real-world datasets for classification and regression tasks",
      "Implemented deep learning architectures including CNNs for image processing",
      "Collaborated on end-to-end AI pipeline development and model deployment",
    ],
  },
  {
    role: "Full Stack Web Development Intern",
    org: "AICTE EduSkills",
    duration: "2023",
    color: "#818cf8",
    icon: "💻",
    points: [
      "Built responsive web applications using React.js, HTML, CSS, and JavaScript",
      "Developed RESTful APIs using Flask and FastAPI for backend services",
      "Integrated MongoDB and SQLite databases for data persistence",
      "Delivered production-ready applications with modern UI/UX practices",
    ],
  },
];

function Internship() {
  return (
    <section id="internship" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            Internship <GT>Experience</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── MY JOURNEY ─── ●</p>
        </Reveal>
        <div style={{ position: "relative" }}>
          {/* Timeline line */}
          <div style={{ position: "absolute", left: 27, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #38bdf8, #818cf8)", opacity: 0.3, zIndex: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {INTERNSHIPS.map((intern, i) => (
              <Reveal key={intern.role} delay={i * 0.15}>
                <div style={{ display: "flex", gap: "1.25rem", position: "relative" }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
                    background: `${intern.color}22`, border: `2px solid ${intern.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, zIndex: 1,
                  }}>{intern.icon}</div>
                  <Glass style={{ flex: 1, padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div>
                        <h3 style={{ color: "#f1f5f9", fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{intern.role}</h3>
                        <p style={{ color: intern.color, fontSize: 14, margin: 0, fontFamily: "'Rajdhani', sans-serif" }}>{intern.org}</p>
                      </div>
                      <span style={{ padding: "4px 14px", borderRadius: 99, fontSize: 12, background: `${intern.color}15`, border: `1px solid ${intern.color}35`, color: intern.color, fontFamily: "'Rajdhani', sans-serif" }}>{intern.duration}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {intern.points.map(pt => (
                        <li key={pt} style={{ color: "#94a3b8", fontSize: 13.5, lineHeight: 1.7, marginBottom: "0.3rem" }}>{pt}</li>
                      ))}
                    </ul>
                  </Glass>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── RESUME ─────────────────────────────────────────────────────────────────
function Resume() {
  return (
    <section id="resume" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            Download <GT>Resume</GT>
          </h2>
          <p style={{ color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "2.5rem" }}>● ─── GET MY CV ─── ●</p>
        </Reveal>
        <Reveal delay={0.1}>
          <Glass style={{ padding: "3rem 2rem" }}>
            <div style={{ fontSize: 64, marginBottom: "1rem" }}>📄</div>
            <h3 style={{ color: "#f1f5f9", fontFamily: "'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: "0.75rem" }}>Kavyanjali Kulukuri</h3>
            <p style={{ color: "#94a3b8", marginBottom: "0.5rem", fontSize: 14 }}>AI/ML Developer • Full Stack Developer • B.Tech AI &amp; DS</p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: "2rem" }}>View my complete academic background, technical skills, projects, certifications, and internship experiences.</p>
           <a href="/resume.pdf" download="Kavyanjali_Resume.pdf" style={{
  padding: "0.85rem 2.5rem", borderRadius: 12, cursor: "pointer",
  background: "linear-gradient(135deg, #38bdf8, #818cf8)",
  border: "none", color: "#050a14", textDecoration: "none",
  fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.08em",
  display: "inline-block", transition: "transform 0.2s, box-shadow 0.2s",
}}>⬇ Download Resume (PDF)</a>
            <p style={{ color: "#475569", fontSize: 12, marginTop: "1rem" }}>PDF format • Updated 2025</p>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}

// ── CONTACT ────────────────────────────────────────────────────────────────
const CONTACTS = [
  { icon: "✉️", label: "Gmail", value: "kavyanjali@gmail.com", href: "mailto:kavyanjali@gmail.com", color: "#e879f9" },
  { icon: "💼", label: "LinkedIn", value: "kavya-kulukuri", href: "https://linkedin.com/in/kavya-kulukuri", color: "#38bdf8" },
  { icon: "⚡", label: "GitHub", value: "Kavyakulukuri", href: "https://github.com/Kavyakulukuri", color: "#818cf8" },
  { icon: "📱", label: "Phone", value: "+91 XXXXXXXXXX", href: "tel:+91XXXXXXXXXX", color: "#34d399" },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (form.name && form.email && form.message) {
      await fetch("https://formspree.io/f/xgoqrjrk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    }
  };

  return (
    <section id="contact" style={{ padding: "6rem 1.5rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: "0.5rem", color: "#f1f5f9" }}>
            Get In <GT>Touch</GT>
          </h2>
          <p style={{ textAlign: "center", color: "#38bdf8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase", marginBottom: "3rem" }}>● ─── LET'S CONNECT ─── ●</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "2rem" }}>
          {/* Contact cards */}
          <Reveal delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, marginBottom: "0.5rem" }}>
                I'm open to new opportunities, collaborations, and conversations about AI, ML, and Full Stack development. Feel free to reach out through any of the channels below!
              </p>
              {CONTACTS.map(c => (
                <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Glass style={{
                    padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem",
                    transition: "transform 0.2s, border-color 0.2s", cursor: "pointer",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateX(6px)"; e.currentTarget.style.borderColor = `${c.color}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.15)"; }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div>
                      <p style={{ color: c.color, fontSize: 11, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.12em", margin: "0 0 2px", textTransform: "uppercase" }}>{c.label}</p>
                      <p style={{ color: "#e2e8f0", fontSize: 14, margin: 0 }}>{c.value}</p>
                    </div>
                  </Glass>
                </a>
              ))}
            </div>
          </Reveal>
          {/* Message form */}
          <Reveal delay={0.2}>
            <Glass style={{ padding: "2rem" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ fontSize: 48, marginBottom: "1rem" }}>✅</div>
                  <h3 style={{ color: "#34d399", fontFamily: "'Rajdhani', sans-serif", fontSize: 22 }}>Message Sent!</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>Thanks for reaching out. I'll get back to you soon!</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", borderRadius: 8, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif" }}>Send Another</button>
                </div>
              ) : (
                <>
                  <h3 style={{ color: "#f1f5f9", fontFamily: "'Rajdhani', sans-serif", fontSize: 20, marginBottom: "1.25rem" }}>Send a Message</h3>
                  {["name","email"].map(field => (
                    <input key={field}
                      placeholder={field === "name" ? "Your Name" : "Your Email"}
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{
                        width: "100%", marginBottom: "1rem", padding: "0.75rem 1rem",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(56,189,248,0.15)",
                        borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none",
                        fontFamily: "inherit", boxSizing: "border-box",
                      }}
                    />
                  ))}
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{
                      width: "100%", marginBottom: "1rem", padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(56,189,248,0.15)",
                      borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <button onClick={handleSubmit} style={{
                    width: "100%", padding: "0.85rem", borderRadius: 10, cursor: "pointer",
                    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                    border: "none", color: "#050a14",
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em",
                  }}>Send Message →</button>
                </>
              )}
            </Glass>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(56,189,248,0.1)", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700 }}><GT>Kavyanjali Kulukuri</GT></span>
        <p style={{ color: "#475569", fontSize: 13, textAlign: "center" }}>AI/ML Developer • Full Stack Developer • B.Tech AI &amp; DS</p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "GitHub", href: "https://github.com/Kavyakulukuri" },
            { label: "LinkedIn", href: "https://linkedin.com/in/kavya-kulukuri" },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", fontSize: 13, fontFamily: "'Rajdhani', sans-serif", textDecoration: "none", letterSpacing: "0.08em" }}>{l.label}</a>
          ))}
        </div>
        <p style={{ color: "#334155", fontSize: 12 }}>© 2025 Kavyanjali Kulukuri. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #050a14; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, sans-serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050a14; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#38bdf8, #818cf8); border-radius: 3px; }
        html { scroll-behavior: smooth; }
        input::placeholder, textarea::placeholder { color: #475569; }
      `}</style>

      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      <div style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}>
        {/* Ambient gradient blobs */}
        <div style={{ position: "fixed", top: "-20%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,121,249,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "80vw", height: "80vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        <ParticleCanvas />
        <Nav />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Certifications />
        <Internship />
        <Resume />
        <Contact />
        <Footer />
      </div>
    </>
  );
}