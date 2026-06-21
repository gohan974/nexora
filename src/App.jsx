import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ─── Responsive hook ─── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

/* ─── InView ─── */
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const FadeIn = ({ children, delay = 0, style = {}, from = "up" }) => {
  const [ref, inView] = useInView();
  const offset = from === "up" ? "translateY(28px)" : from === "scale" ? "scale(0.96)" : "translateY(28px)";
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0) scale(1)" : offset, filter: inView ? "blur(0)" : "blur(6px)", transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, filter 0.7s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
};

/* ─── Count-up (chiffres qui s'incrémentent à l'apparition) ─── */
const CountUp = ({ target, duration = 1400, suffix = "", style = {} }) => {
  const [ref, inView] = useInView(0.5);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return <span ref={ref} style={style}>{val}{suffix}</span>;
};

/* ─── Email capture ─── */
const CTA = ({ email, setEmail, submitted, handleSubmit, isMobile }) => (
  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
    {!submitted ? <>
      <input
        style={{ background: "#0d0d18", border: "1px solid #1a1a2e", color: "#e2e8f0", padding: "0.9rem 1.2rem", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: "0.9rem", outline: "none", width: isMobile ? "100%" : 280 }}
        type="email" placeholder="ton@email.com" value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
      />
      <button onClick={handleSubmit} className="grad-btn" style={{ color: "#fff", border: "none", padding: "0.9rem 2rem", borderRadius: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
        Rejoindre la waitlist →
      </button>
    </> : <div style={{ background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.3)", borderRadius: 10, padding: "0.9rem 2rem", color: "#a78bfa", fontSize: "0.9rem" }}>✓ Tu es sur la liste. On te contacte en premier.</div>}
  </div>
);

/* ─── Constellation animée (fond cinématique) ─── */
const Constellation = ({ isMobile }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, raf, t = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999 };

    const maxDist = isMobile ? 120 : 160;
    const points = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = document.body.scrollHeight;
      canvas.style.height = h + "px";
    };

    const init = () => {
      points.length = 0;
      const area = w * h;
      // beaucoup plus dense
      const n = Math.min(Math.round(area / (isMobile ? 9000 : 6000)), isMobile ? 180 : 520);
      for (let i = 0; i < n; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.6 + 0.7,
          tw: Math.random() * Math.PI * 2,
          pulse: Math.random() * 100, // pour les pulses de lumière
        });
      }
    };

    const draw = () => {
      t += 0.01;
      // léger fond pour effet de traînée (trails)
      ctx.fillStyle = "rgba(7,7,13,0.22)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.03; p.pulse += 0.6;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // attraction douce vers la souris
        const mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 200) {
          const force = (1 - mdist / 200) * 0.4;
          p.x += (mdx / mdist) * force;
          p.y += (mdy / mdist) * force;
        }

        const near = mdist < 200;
        const pulseGlow = (Math.sin(p.pulse * 0.05) + 1) * 0.5;
        const alpha = (0.5 + Math.sin(p.tw) * 0.4) * (near ? 1 : 0.85);
        const radius = p.r + pulseGlow * 0.8 + (near ? 0.8 : 0);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = near ? `rgba(196,181,253,${alpha})` : `rgba(167,139,250,${alpha})`;
        ctx.shadowBlur = near ? 14 : 8;
        ctx.shadowColor = near ? "rgba(167,139,250,0.9)" : "rgba(124,58,237,0.7)";
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const o = (1 - dist / maxDist) * 0.55;
            // lignes plus lumineuses près de la souris
            const lineNear = (mdist < 200 || Math.sqrt((mouse.x - q.x) ** 2 + (mouse.y - q.y) ** 2) < 200);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = lineNear ? `rgba(167,139,250,${o * 1.3})` : `rgba(109,40,217,${o})`;
            ctx.lineWidth = lineNear ? 1 : 0.7;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    resize(); init();
    if (reduced) { ctx.fillStyle = "#07070d"; ctx.fillRect(0, 0, w, h); draw(); cancelAnimationFrame(raf); }
    else draw();

    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { resize(); init(); }, 200); };
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY + window.scrollY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [isMobile]);

  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", pointerEvents: "none", zIndex: 0 }} />;
};

/* ─── Chart ─── */
const decisionData = [
  { week: "S1", score: 48 }, { week: "S2", score: 54 },
  { week: "S3", score: 51 }, { week: "S4", score: 63 },
  { week: "S5", score: 69 }, { week: "S6", score: 72 },
  { week: "S7", score: 78 }, { week: "S8", score: 84 },
];
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return <div style={{ background: "#12121f", border: "1px solid #3b1f6e", borderRadius: 8, padding: "0.5rem 0.8rem", fontSize: "0.78rem", color: "#a78bfa" }}>Score : <strong>{payload[0].value}</strong></div>;
};

/* ─── Heatmap ─── */
const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const slots = ["Matin", "Après-midi", "Soir"];
const heatData = {
  "Lun-Matin": 72, "Lun-Après-midi": 65, "Lun-Soir": 38,
  "Mar-Matin": 81, "Mar-Après-midi": 74, "Mar-Soir": 42,
  "Mer-Matin": 78, "Mer-Après-midi": 70, "Mer-Soir": 35,
  "Jeu-Matin": 76, "Jeu-Après-midi": 68, "Jeu-Soir": 40,
  "Ven-Matin": 69, "Ven-Après-midi": 55, "Ven-Soir": 22,
  "Sam-Matin": 60, "Sam-Après-midi": 52, "Sam-Soir": 30,
  "Dim-Matin": 55, "Dim-Après-midi": 48, "Dim-Soir": 25,
};
const scoreColor = v => {
  if (v >= 75) return { bg: "rgba(16,185,129,.18)", border: "rgba(16,185,129,.3)", text: "#34d399" };
  if (v >= 55) return { bg: "rgba(234,179,8,.12)", border: "rgba(234,179,8,.25)", text: "#fbbf24" };
  return { bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.25)", text: "#f87171" };
};

/* ─── Fonctionnalités (hors Check et Chat, déjà en démo) ─── */
const allFeatures = [
  { icon: "◈", tag: "MÉTRIQUE CLÉ", title: "Score de décision", desc: "Nexora note la qualité de ta décision — jamais ton résultat. Un trade gagnant mal décidé reste une erreur." },
  { icon: "⟁", tag: "TON MIROIR", title: "Profil psychologique", desc: "Tes biais, tes pires contextes, tes patterns invisibles. Nexora te connaît mieux que toi-même." },
  { icon: "◷", tag: "TON CADRE", title: "Plan de trading", desc: "Tes règles d'entrée, de sortie, ta gestion du risque. Nexora les mémorise et vérifie que tu les respectes." },
  { icon: "◍", tag: "30 SECONDES", title: "Journal intelligent", desc: "Tu entres ton trade vite. Nexora trace ta progression et détecte tes schémas sur la durée." },
  { icon: "◰", tag: "SANS PLAFOND", title: "Progression", desc: "Semaine après semaine, tu vois tes décisions s'améliorer. Pas ton PnL — ta maîtrise." },
  { icon: "◉", tag: "LE CONTEXTE", title: "Fondamental", desc: "L'actualité qui compte, expliquée simplement. Pour décider en connaissance de cause, pas à l'aveugle." },
];

/* ─── Main ─── */
export default function NexoraLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Nexora — Arrête de subir tes trades";
    const favicon = document.querySelector("link[rel~='icon']") || document.createElement("link");
    favicon.rel = "icon";
    favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%234f46e5'/><text x='50' y='52' font-size='62' font-family='Arial,Helvetica,sans-serif' font-weight='900' fill='white' text-anchor='middle' dominant-baseline='central'>N</text></svg>";
    document.head.appendChild(favicon);
  }, []);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setSubmitted(true);
    try {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": import.meta.env.VITE_BREVO_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, listIds: [2], updateEnabled: true })
      });
    } catch(e) { console.error(e); }
  };

  const pad = isMobile ? "1rem" : "2rem";
  const S = {
    page: { background: "#07070d", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", overflowX: "hidden" },
    section: (mw = 1100) => ({ padding: isMobile ? "3rem 1rem" : "5rem 2rem", maxWidth: mw, margin: "0 auto", position: "relative", zIndex: 1 }),
    label: { fontSize: "0.72rem", color: "#6d28d9", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.6rem" },
    h2: { fontFamily: "'Syne',sans-serif", fontSize: isMobile ? "1.7rem" : "2.4rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" },
  };

  const CTA_PROPS = { email, setEmail, submitted, handleSubmit, isMobile };

  return (
    <div style={{ ...S.page, position: "relative" }}>
      <Constellation isMobile={isMobile} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#6d28d9;color:#fff}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#07070d}::-webkit-scrollbar-thumb{background:#3b1f6e;border-radius:2px}
        .fcard{background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:1.5rem;transition:transform .35s cubic-bezier(.16,1,.3,1),border-color .35s,box-shadow .35s;height:100%}
        .fcard:hover{border-color:#6d28d9;transform:translateY(-6px);box-shadow:0 24px 70px rgba(109,40,217,.18)}
        .tcard{background:#0d0d18;border:1px solid #1a1a2e;border-radius:14px;padding:1.5rem;transition:transform .35s cubic-bezier(.16,1,.3,1),border-color .35s}
        .tcard:hover{border-color:#3b1f6e;transform:translateY(-4px)}
        .glow{width:6px;height:6px;border-radius:50%;background:#6d28d9;box-shadow:0 0 12px #6d28d9;display:inline-block;animation:dot-pulse 2s ease-in-out infinite}
        @keyframes dot-pulse{0%,100%{box-shadow:0 0 8px #6d28d9;opacity:1}50%{box-shadow:0 0 18px #a78bfa;opacity:.7}}
        @keyframes pulse-ring{0%,100%{transform:scale(.95);opacity:.5}50%{transform:scale(1.08);opacity:.28}}
        @keyframes pulse-ring-2{0%,100%{transform:scale(1.05);opacity:.35}50%{transform:scale(.92);opacity:.18}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes gradient-shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes hero-rise{0%{opacity:0;transform:translateY(40px);filter:blur(10px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
        @keyframes badge-fade{0%{opacity:0;transform:translateY(-12px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes float-slow{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .shimmer{background:linear-gradient(90deg,#e2e8f0 0%,#a78bfa 40%,#e2e8f0 60%,#e2e8f0 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
        .hero-badge{animation:badge-fade .8s cubic-bezier(.16,1,.3,1) both}
        .hero-sup{animation:hero-rise .9s cubic-bezier(.16,1,.3,1) .1s both}
        .hero-title{animation:hero-rise 1s cubic-bezier(.16,1,.3,1) .22s both}
        .hero-sub{animation:hero-rise 1s cubic-bezier(.16,1,.3,1) .36s both}
        .hero-cta{animation:hero-rise 1s cubic-bezier(.16,1,.3,1) .5s both}
        .grad-btn{background:linear-gradient(135deg,#6d28d9,#4f46e5,#7c3aed);background-size:200% 200%;animation:gradient-shift 5s ease infinite}
        input:focus{border-color:#6d28d9 !important}
        input::placeholder{color:#1e293b}
        @media (prefers-reduced-motion:reduce){*{animation:none !important}}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: `0.9rem ${pad}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrollY > 40 ? "rgba(7,7,13,.92)" : "transparent", backdropFilter: scrollY > 40 ? "blur(20px)" : "none", borderBottom: scrollY > 40 ? "1px solid #12121f" : "none", transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "1rem", color: "white" }}>N</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.06em" }}>NEXORA</span>
          {!isMobile && <span style={{ fontSize: "0.65rem", color: "#6d28d9", background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.25)", borderRadius: 20, padding: "0.15rem 0.5rem", fontWeight: 600, letterSpacing: "0.06em" }}>BÊTA</span>}
        </div>
        <button onClick={handleSubmit} style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "#fff", border: "none", padding: isMobile ? "0.45rem 1rem" : "0.55rem 1.3rem", borderRadius: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: isMobile ? "0.75rem" : "0.8rem", cursor: "pointer" }}>Accès anticipé</button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "7rem 1.25rem 3rem" : "8rem 2rem 4rem", position: "relative", textAlign: "center", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "18%", left: "8%", width: isMobile ? 220 : 520, height: isMobile ? 220 : 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(109,40,217,.12) 0%,transparent 70%)", animation: "pulse-ring 7s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "12%", right: "6%", width: isMobile ? 180 : 420, height: isMobile ? 180 : 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,.1) 0%,transparent 70%)", animation: "pulse-ring-2 9s ease-in-out infinite", pointerEvents: "none" }} />

        <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.3)", borderRadius: 20, padding: "0.4rem 1rem", fontSize: "0.72rem", color: "#a78bfa", fontWeight: 500, letterSpacing: "0.06em", marginBottom: "2rem" }}>
          <span className="glow" /> ACCÈS ANTICIPÉ · 100 PLACES
        </div>

        <p className="hero-sup" style={{ fontSize: isMobile ? "0.75rem" : "0.85rem", color: "#6d28d9", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "1rem", textTransform: "uppercase" }}>
          Le premier système d'aide à la prise de décision pour traders
        </p>

        <h1 className="hero-title" style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? "2.2rem" : "4.4rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", maxWidth: 820, marginBottom: "1.5rem" }}>
          <span style={{ color: "#e2e8f0" }}>Arrête de</span>{" "}
          <span className="shimmer">subir tes trades.</span><br />
          <span style={{ color: "#e2e8f0" }}>Commence à </span>
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>les décider.</span>
        </h1>

        <p className="hero-sub" style={{ fontSize: isMobile ? "0.9rem" : "1.05rem", color: "#475569", maxWidth: 520, lineHeight: 1.75, marginBottom: "3rem", fontWeight: 300 }}>
          Tu sais analyser les marchés.<br />
          Ton problème, c'est <strong style={{ color: "#94a3b8", fontWeight: 500 }}>l'exécution.</strong> Nexora intervient au moment de vérité — avant que tu appuies sur le bouton.
        </p>

        <div className="hero-cta">
          <CTA {...CTA_PROPS} />
          <p style={{ color: "#1e293b", fontSize: "0.72rem", marginTop: "1rem" }}>Pas de spam. Pas de CB. Accès early bird offert aux 100 premiers.</p>
        </div>

        <FadeIn delay={0.3} style={{ marginTop: "4rem", borderTop: "1px solid #12121f", paddingTop: "2.5rem", width: "100%", maxWidth: 720 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? "0.5rem" : "1.5rem" }}>
            {[
              { big: "0", small: "signal." },
              { big: "0", small: "promesse." },
              { big: "100%", small: "basé sur toi et ton plan." },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? "1.4rem" : "2.2rem", fontWeight: 800, color: "#a78bfa", lineHeight: 1.1, marginBottom: "0.5rem", minHeight: isMobile ? "1.9rem" : "2.6rem", display: "flex", alignItems: "center" }}>{s.big}</div>
                <div style={{ color: "#475569", fontSize: isMobile ? "0.66rem" : "0.74rem", lineHeight: 1.5, maxWidth: 180 }}>{s.small}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* PROBLEM */}
      <section style={S.section(760)}>
        <FadeIn>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderLeft: "3px solid #6d28d9", borderRadius: 20, padding: isMobile ? "1.75rem" : "3rem" }}>
            <p style={S.label}>LE VRAI PROBLÈME</p>
            <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Tu sais quoi faire.</span><br /><span style={{ color: "#334155" }}>Tu ne le fais pas.</span></h2>
            <p style={{ color: "#475569", lineHeight: 1.85, fontSize: "0.95rem" }}>
              Formations, stratégies, backtests — tu as tout essayé.<br />
              Le problème n'est jamais l'analyse.<br />
              C'est que <strong style={{ color: "#a78bfa" }}>personne ne t'a aidé à maîtriser le moment de décision.</strong>
            </p>
          </div>
        </FadeIn>
      </section>

      {/* CHECK AVANT-TRADE — démo visuelle (le différenciateur, on le garde en vedette) */}
      <section style={S.section(960)}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>LA FONCTIONNALITÉ QUI CHANGE TOUT</p>
          <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Le Check avant-trade.</span></h2>
          <p style={{ color: "#475569", fontSize: "0.9rem", maxWidth: 520, margin: "0 auto" }}>En 60 secondes, avant d'entrer, Nexora évalue si tu dois vraiment prendre ce trade — ou si c'est ton biais qui parle.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6d28d9", boxShadow: "0 0 8px #6d28d9" }} />
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Check avant-trade</span>
              <span style={{ color: "#334155", fontSize: "0.78rem", marginLeft: "auto" }}>Jeudi 09h18 · Avant ouverture</span>
            </div>

            <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.68rem", color: "#475569", marginBottom: "0.4rem", fontWeight: 600, letterSpacing: "0.06em" }}>SETUP</p>
                  <div style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.85rem", color: "#e2e8f0" }}>EUR/USD · Long</div>
                </div>
                <div>
                  <p style={{ fontSize: "0.68rem", color: "#475569", marginBottom: "0.4rem", fontWeight: 600, letterSpacing: "0.06em" }}>RAISON D'ENTRER</p>
                  <div style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6, minHeight: 60 }}>Breakout sur résistance clé, volume confirmé, dans mon plan</div>
                </div>
                <div>
                  <p style={{ fontSize: "0.68rem", color: "#475569", marginBottom: "0.4rem", fontWeight: 600, letterSpacing: "0.06em" }}>ÉTAT ÉMOTIONNEL</p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {["😌 Calme", "😤 Stressé", "⚡ Impulsif", "🎯 Focus"].map((e, i) => (
                      <div key={i} style={{ flex: 1, minWidth: 60, background: i === 0 ? "rgba(16,185,129,.1)" : "#07070d", border: i === 0 ? "1px solid rgba(16,185,129,.25)" : "1px solid #1a1a2e", borderRadius: 8, padding: "0.4rem 0.2rem", fontSize: "0.7rem", color: i === 0 ? "#34d399" : "#334155", textAlign: "center" }}>{e}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(109,40,217,.08)", border: "1px solid rgba(109,40,217,.2)", borderRadius: 12, padding: "1rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#6d28d9", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "0.06em" }}>VERDICT NEXORA</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#064e3b,#1e1b4b)", border: "1px solid #059669", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#34d399" }}>87</div>
                    <div>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>Score de décision</p>
                      <p style={{ fontSize: "0.72rem", color: "#34d399" }}>✓ Setup validé — tu peux entrer</p>
                    </div>
                  </div>
                </div>
                <div style={{ background: "rgba(234,179,8,.06)", border: "1px solid rgba(234,179,8,.2)", borderRadius: 10, padding: "1rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#fbbf24", fontWeight: 600, marginBottom: "0.35rem", letterSpacing: "0.06em" }}>POINT D'ATTENTION</p>
                  <p style={{ fontSize: "0.82rem", color: "#fde68a", lineHeight: 1.6 }}>Tu sors en moyenne 40% trop tôt sur ce type de setup. Fixe ton TP avant d'entrer.</p>
                </div>
                <div style={{ background: "rgba(109,40,217,.06)", border: "1px solid rgba(109,40,217,.15)", borderRadius: 10, padding: "1rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#6d28d9", fontWeight: 600, marginBottom: "0.35rem", letterSpacing: "0.06em" }}>CONTEXTE OPTIMAL</p>
                  <p style={{ fontSize: "0.82rem", color: "#a78bfa", lineHeight: 1.6 }}>Jeudi matin · Calme · Dans ton plan. C'est ton profil de trade idéal.</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CHAT IA — démo visuelle (deuxième vedette) */}
      <section style={S.section(760)}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>TON MENTOR, À CHAQUE INSTANT</p>
          <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Le Chat IA.</span></h2>
          <p style={{ color: "#475569", fontSize: "0.9rem", maxWidth: 480, margin: "0 auto" }}>Pas un bot générique. Un mentor qui connaît ton profil, ton plan, tes erreurs — et qui te secoue quand il le faut.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "0.8rem", color: "white" }}>N</div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>Nexora</span>
              <span style={{ fontSize: "0.68rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />en ligne</span>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "linear-gradient(135deg,#6d28d9,#4f46e5)", borderRadius: "14px 14px 4px 14px", padding: "0.8rem 1rem", fontSize: "0.85rem", color: "#fff", lineHeight: 1.6 }}>
                Je veux reprendre un trade sur l'or, je viens de perdre 2 fois d'affilée mais là c'est sûr ça va marcher
              </div>
              <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: "#12121f", border: "1px solid #1a1a2e", borderRadius: "14px 14px 14px 4px", padding: "0.9rem 1.1rem", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.7 }}>
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>Stop.</span> Deux pertes d'affilée + "c'est sûr" = exactement le pattern qui a grillé ton compte en mars. Ton score chute de 30% quand tu trades en revanche. Ferme l'écran 20 minutes. Si le setup est réel, il sera encore là.
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* TOUTES LES FONCTIONNALITÉS */}
      <section style={S.section()}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>L'ÉCOSYSTÈME COMPLET</p>
          <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Tout ce qu'il te faut</span><br /><span style={{ color: "#334155" }}>pour décider en conscience.</span></h2>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: isMobile ? "0.6rem" : "1rem" }}>
          {allFeatures.map((f, i) => (
            <FadeIn key={i} delay={(i % 2) * 0.08}>
              <div className="fcard" style={{ padding: isMobile ? "1rem" : "1.5rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
                  <div style={{ fontSize: isMobile ? "1.2rem" : "1.4rem", color: "#6d28d9" }}>{f.icon}</div>
                  <span style={{ fontSize: isMobile ? "0.5rem" : "0.58rem", color: "#6d28d9", letterSpacing: "0.06em", fontWeight: 600, background: "rgba(109,40,217,.08)", border: "1px solid rgba(109,40,217,.18)", borderRadius: 20, padding: "0.2rem 0.55rem", whiteSpace: "nowrap" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: isMobile ? "0.95rem" : "1.05rem", marginBottom: "0.4rem", color: "#e2e8f0" }}>{f.title}</h3>
                <p style={{ color: "#475569", fontSize: isMobile ? "0.78rem" : "0.85rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ONBOARDING — pourquoi Nexora te connaît */}
      <section style={S.section(760)}>
        <FadeIn>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderLeft: "3px solid #6d28d9", borderRadius: 20, padding: isMobile ? "1.75rem" : "3rem" }}>
            <p style={S.label}>CE QUI REND NEXORA UNIQUE</p>
            <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Nexora commence</span><br /><span style={{ color: "#334155" }}>par te connaître.</span></h2>
            <p style={{ color: "#475569", lineHeight: 1.85, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Avant tout, Nexora construit ton profil : ton marché, ton plan, ta psychologie, tes objectifs. C'est grâce à ça qu'il sait si tu respectes <strong style={{ color: "#a78bfa" }}>TON</strong> plan — pas un plan générique.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Profil trader", "Framework", "Psychologie", "Objectifs"].map((t, i) => (
                <span key={i} style={{ fontSize: "0.75rem", color: "#a78bfa", background: "rgba(109,40,217,.08)", border: "1px solid rgba(109,40,217,.2)", borderRadius: 20, padding: "0.35rem 0.85rem" }}>{t}</span>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* PRODUCT PREVIEW — progression + profil + heatmap */}
      <section style={S.section(960)}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>APERÇU DU PRODUIT</p>
          <h2 style={S.h2}><span style={{ color: "#e2e8f0" }}>Finis le brouillard.</span><br /><span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>Comprends tes décisions.</span></h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          <FadeIn delay={0.15}>
            <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: "1.75rem" }}>
              <p style={{ fontSize: "0.68rem", color: "#6d28d9", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.3rem" }}>PROGRESSION DÉCISIONNELLE</p>
              <p style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "1.5rem" }}>Qualité de tes décisions — pas de ton PnL</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={decisionData}>
                  <XAxis dataKey="week" tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 90]} tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#6d28d9" strokeWidth={2.5} dot={{ fill: "#6d28d9", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#a78bfa" }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                <span style={{ fontSize: "1.1rem", color: "#34d399", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>+75%</span>
                <span style={{ fontSize: "0.78rem", color: "#334155" }}>d'amélioration sur 8 semaines</span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: "1.75rem" }}>
              <p style={{ fontSize: "0.68rem", color: "#6d28d9", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "1rem" }}>TON PROFIL DÉCISIONNEL</p>
              <div style={{ background: "linear-gradient(135deg,rgba(109,40,217,.12),rgba(79,70,229,.08))", border: "1px solid rgba(109,40,217,.2)", borderRadius: 12, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.72rem", color: "#475569", marginBottom: "0.2rem" }}>Profil détecté</p>
                <p style={{ fontSize: "0.88rem", color: "#a78bfa", fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>Trader en reconstruction</p>
              </div>
              {[
                { label: "Force", value: "Lecture de marché", color: "#34d399", bg: "rgba(16,185,129,.08)", border: "rgba(16,185,129,.2)" },
                { label: "À corriger", value: "Gestion post-perte", color: "#f87171", bg: "rgba(239,68,68,.08)", border: "rgba(239,68,68,.2)" },
                { label: "Contexte optimal", value: "Mardi–Jeudi matin", color: "#fbbf24", bg: "rgba(234,179,8,.08)", border: "rgba(234,179,8,.2)" },
              ].map((x, i) => (
                <div key={i} style={{ background: x.bg, border: `1px solid ${x.border}`, borderRadius: 8, padding: "0.6rem 0.8rem", marginBottom: i < 2 ? "0.5rem" : 0 }}>
                  <p style={{ fontSize: "0.65rem", color: "#475569", marginBottom: "0.1rem" }}>{x.label}</p>
                  <p style={{ fontSize: "0.82rem", color: x.color, fontWeight: 500 }}>{x.value}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.25}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: "1.75rem" }}>
            <p style={{ fontSize: "0.68rem", color: "#6d28d9", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.3rem" }}>HEATMAP COMPORTEMENTALE</p>
            <p style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "1.5rem" }}>Quand tu décides bien — et quand tu ne devrais pas trader</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px", minWidth: 300 }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: "0.68rem", color: "#334155", fontWeight: 500, textAlign: "left", paddingBottom: "0.5rem", width: 70 }}></th>
                    {days.map(d => <th key={d} style={{ fontSize: "0.65rem", color: "#475569", fontWeight: 500, textAlign: "center", paddingBottom: "0.5rem" }}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot}>
                      <td style={{ fontSize: "0.68rem", color: "#334155", paddingRight: "0.5rem", fontWeight: 500, whiteSpace: "nowrap" }}>{slot}</td>
                      {days.map(day => {
                        const v = heatData[`${day}-${slot}`] || 50;
                        const c = scoreColor(v);
                        return (
                          <td key={day} style={{ textAlign: "center", padding: "2px" }}>
                            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "0.35rem 0.1rem", fontSize: "0.65rem", color: c.text, fontWeight: 600 }}>{v}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {[{ c: "#34d399", bg: "rgba(16,185,129,.15)", l: "Optimal (75+)" }, { c: "#fbbf24", bg: "rgba(234,179,8,.12)", l: "Acceptable (55–74)" }, { c: "#f87171", bg: "rgba(239,68,68,.12)", l: "Évite (< 55)" }].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: x.bg, border: `1px solid ${x.c}` }} />
                  <span style={{ fontSize: "0.7rem", color: "#334155" }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* WOW FACTOR */}
      <section style={S.section(760)}>
        <FadeIn>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: isMobile ? "1.75rem" : "3rem", textAlign: "center" }}>
            <p style={{ ...S.label, textAlign: "center" }}>CE QUE NEXORA RÉVÈLE</p>
            <h2 style={{ ...S.h2, marginBottom: "2rem" }}>
              <span style={{ color: "#e2e8f0" }}>"Tu n'es pas un mauvais trader."</span><br />
              <span style={{ color: "#475569" }}>"Tu prends de mauvaises décisions</span><br />
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>dans les mauvais contextes."</span>
            </h2>
            <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
              83% des pertes viennent de 2 ou 3 situations récurrentes que tu ne vois pas.<br />
              Nexora les voit. Et t'arrête avant que tu les répètes.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: isMobile ? "4rem 1.25rem 6rem" : "6rem 2rem 8rem", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(109,40,217,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <FadeIn>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? "1.9rem" : "3rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem", position: "relative" }}>
            <span style={{ color: "#e2e8f0" }}>Prêt à décider</span><br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>au lieu de subir ?</span>
          </h2>
          <p style={{ color: "#475569", marginBottom: "2.5rem", fontSize: "0.95rem" }}>Accès early bird offert aux 100 premiers. Tarif bloqué à vie.</p>
          <CTA {...CTA_PROPS} />
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #0d0d18", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "0.75rem", color: "white" }}>N</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#334155" }}>NEXORA</span>
        </div>
        <p style={{ color: "#1e293b", fontSize: "0.72rem" }}>© 2026 Nexora · Arrête de subir tes trades. Commence à les décider.</p>
      </footer>
    </div>
  );
}