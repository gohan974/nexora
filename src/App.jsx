import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ─── Hooks & helpers ─── */
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const FadeIn = ({ children, delay = 0, style = {} }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

/* ─── Steps with active indicator ─── */
const StepsIndicator = ({ steps }) => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % steps.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      {steps.map((s, i) => {
        const on = active === i;
        return (
          <div key={i} onClick={() => setActive(i)} style={{ display: "flex", gap: "1.4rem", position: "relative", paddingBottom: i < steps.length - 1 ? "2rem" : 0, cursor: "pointer" }}>
            {i < steps.length - 1 && <div style={{ position: "absolute", left: 21, top: 44, bottom: -4, width: 2, borderRadius: 2, background: on ? "linear-gradient(to bottom,#6d28d9,#3b1f6e)" : "#12121f", transition: "background .4s" }} />}
            <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12, background: on ? "linear-gradient(135deg,#6d28d9,#4f46e5)" : "#0d0d18", border: on ? "1px solid #7c3aed" : "1px solid #1a1a2e", boxShadow: on ? "0 0 20px rgba(109,40,217,.4)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.75rem", color: on ? "#fff" : "#334155", position: "relative", zIndex: 1, transition: "all .35s" }}>
              {on ? "●" : s.n}
            </div>
            <div style={{ paddingTop: "0.5rem", opacity: on ? 1 : 0.35, transform: on ? "translateX(0)" : "translateX(-4px)", transition: "all .35s" }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem", color: on ? "#e2e8f0" : "#475569" }}>{s.title}</h3>
              <p style={{ color: on ? "#64748b" : "#1e293b", fontSize: "0.85rem", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "2rem", paddingLeft: "3.5rem" }}>
        {steps.map((_, i) => <div key={i} onClick={() => setActive(i)} style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, background: active === i ? "#6d28d9" : "#1a1a2e", transition: "all .3s", cursor: "pointer" }} />)}
      </div>
    </div>
  );
};

/* ─── Decision curve chart ─── */
const decisionData = [
  { week: "S1", score: 48 }, { week: "S2", score: 54 },
  { week: "S3", score: 51 }, { week: "S4", score: 63 },
  { week: "S5", score: 69 }, { week: "S6", score: 72 },
  { week: "S7", score: 78 }, { week: "S8", score: 84 },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#12121f", border: "1px solid #3b1f6e", borderRadius: 8, padding: "0.5rem 0.8rem", fontSize: "0.78rem", color: "#a78bfa" }}>
      Score : <strong>{payload[0].value}</strong>
    </div>
  );
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
const scoreColor = (v) => {
  if (v >= 75) return { bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.3)", text: "#34d399" };
  if (v >= 55) return { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.25)", text: "#fbbf24" };
  return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", text: "#f87171" };
};

/* ─── Data ─── */
const features = [
  { icon: "◎", title: "Journal en 30 secondes", desc: "Tu entres ton trade rapidement. Nexora fait le reste : analyse, pattern, recommandation." },
  { icon: "⟁", title: "Tu vois tes erreurs invisibles", desc: "L'IA détecte ce que tu ne vois pas. Tes pires contextes. Tes patterns qui coûtent cher." },
  { icon: "◈", title: "Finis le brouillard", desc: "Pas des signaux génériques. Un miroir de toi. De tes décisions. De ta progression réelle." },
  { icon: "◷", title: "Score de décision", desc: "Nexora note la qualité de ta décision — pas ton résultat. Un bon trade mal décidé reste une erreur." },
];

const steps = [
  { n: "01", title: "Tu entres ton trade", desc: "Actif, direction, résultat, état émotionnel, pourquoi tu as décidé. 30 secondes." },
  { n: "02", title: "Nexora analyse", desc: "L'IA compare avec ton historique et détecte tes patterns de décision invisibles." },
  { n: "03", title: "Tu te comprends enfin", desc: "Chaque jour Nexora te connaît mieux. Chaque recommandation te rapproche de ton état optimal." },
];

/* ─── Main ─── */
export default function NexoraLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleSubmit = () => { if (email.includes("@")) setSubmitted(true); };

  const S = {
    page: { background: "#07070d", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", overflowX: "hidden" },
    section: (mw = 1100) => ({ padding: "5rem 2rem", maxWidth: mw, margin: "0 auto" }),
    label: { fontSize: "0.72rem", color: "#6d28d9", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.6rem" },
    h2: { fontFamily: "'Syne',sans-serif", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" },
    card: { background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 16, padding: "1.75rem" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#6d28d9;color:#fff}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#07070d}::-webkit-scrollbar-thumb{background:#3b1f6e;border-radius:2px}
        .nav-link{color:#475569;font-size:.85rem;letter-spacing:.04em;cursor:pointer;transition:color .2s}.nav-link:hover{color:#e2e8f0}
        .cta-btn{background:linear-gradient(135deg,#6d28d9,#4f46e5);color:#fff;border:none;padding:.9rem 2.2rem;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:.9rem;letter-spacing:.03em;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
        .cta-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#7c3aed,#6366f1);opacity:0;transition:opacity .25s}.cta-btn:hover::after{opacity:1}.cta-btn span{position:relative;z-index:1}
        .fcard{background:#0d0d18;border:1px solid #1a1a2e;border-radius:16px;padding:2rem;transition:all .3s;cursor:default}.fcard:hover{border-color:#3b1f6e;transform:translateY(-4px);box-shadow:0 20px 60px rgba(109,40,217,.12)}
        .email-input{background:#0d0d18;border:1px solid #1a1a2e;color:#e2e8f0;padding:.9rem 1.2rem;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;outline:none;transition:border-color .2s;width:280px}.email-input:focus{border-color:#6d28d9}.email-input::placeholder{color:#1e293b}
        .glow{width:6px;height:6px;border-radius:50%;background:#6d28d9;box-shadow:0 0 12px #6d28d9;display:inline-block}
        @keyframes pulse-ring{0%,100%{transform:scale(.95);opacity:.5}50%{transform:scale(1.05);opacity:.25}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .shimmer{background:linear-gradient(90deg,#e2e8f0 0%,#a78bfa 40%,#e2e8f0 60%,#e2e8f0 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrollY > 40 ? "rgba(7,7,13,.92)" : "transparent", backdropFilter: scrollY > 40 ? "blur(20px)" : "none", borderBottom: scrollY > 40 ? "1px solid #12121f" : "none", transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6d28d9,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>N</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.06em" }}>NEXORA</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <span className="nav-link">Fonctionnalités</span>
          <span className="nav-link">Comment ça marche</span>
          <button className="cta-btn" style={{ padding: "0.55rem 1.3rem", fontSize: "0.8rem" }}><span>Accès anticipé</span></button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem 2rem 4rem", position: "relative", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(109,40,217,.1) 0%,transparent 70%)", animation: "pulse-ring 7s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "35%", right: "8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,.08) 0%,transparent 70%)", animation: "pulse-ring 9s ease-in-out infinite 2s", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.3)", borderRadius: 20, padding: "0.4rem 1rem", fontSize: "0.72rem", color: "#a78bfa", fontWeight: 500, letterSpacing: "0.06em", marginBottom: "2rem" }}>
          <span className="glow" /> ACCÈS ANTICIPÉ · 100 PLACES
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(2.8rem,6vw,5.5rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 820, marginBottom: "1.5rem" }}>
          <span className="shimmer">Nexora apprend</span><br />
          <span>de tes trades.</span><br />
          <span>Et te rend </span>
          <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>meilleur.</span>
        </h1>

        <p style={{ fontSize: "1.05rem", color: "#475569", maxWidth: 500, lineHeight: 1.75, marginBottom: "3rem", fontWeight: 300 }}>
          Tu ne perds pas par manque d'info.<br />
          Tu perds parce que personne ne t'a encore montré <strong style={{ color: "#94a3b8", fontWeight: 500 }}>comment tu décides vraiment.</strong>
        </p>

        {/* CTA */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {!submitted ? <>
            <input className="email-input" type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button className="cta-btn" onClick={handleSubmit}><span>Rejoindre la liste d'attente →</span></button>
          </> : <div style={{ background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.3)", borderRadius: 10, padding: "0.9rem 2rem", color: "#a78bfa", fontSize: "0.9rem" }}>✓ Tu es sur la liste. On te contacte en premier.</div>}
        </div>
        <p style={{ color: "#1e293b", fontSize: "0.72rem", marginTop: "1rem" }}>Pas de spam. Pas de CB. Accès early bird offert aux 100 premiers.</p>

        {/* 3 pillars */}
        <div style={{ display: "flex", gap: "3rem", marginTop: "5rem", borderTop: "1px solid #0d0d18", paddingTop: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { n: "0", label: "signal. 0 prédiction. 100% basé sur toi." },
            { n: "∞", label: "patterns comportementaux détectés dans ton historique" },
            { n: "1", label: "seul objectif — que tu prennes de meilleures décisions" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>{s.n}</div>
              <div style={{ color: "#334155", fontSize: "0.75rem", maxWidth: 140, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ ...S.section(760) }}>
        <FadeIn>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderLeft: "3px solid #6d28d9", borderRadius: 20, padding: "3rem" }}>
            <p style={S.label}>LE VRAI PROBLÈME</p>
            <h2 style={{ ...S.h2 }}>Tu as accès à tout.<br /><span style={{ color: "#334155" }}>Et tu perds encore.</span></h2>
            <p style={{ color: "#475569", lineHeight: 1.85, fontSize: "0.95rem" }}>
              Formations, indicateurs, signaux, groupes Telegram.<br />
              Le problème n'est pas le manque d'information.<br />
              C'est que <strong style={{ color: "#a78bfa" }}>personne ne t'a aidé à comprendre comment tu décides toi.</strong>
            </p>
          </div>
        </FadeIn>
      </section>

      {/* FEATURES */}
      <section style={S.section()}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>FONCTIONNALITÉS</p>
          <h2 style={S.h2}>Tout ce dont tu as besoin.<br /><span style={{ color: "#334155" }}>Rien de superflu.</span></h2>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.25rem" }}>
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="fcard">
                <div style={{ fontSize: "1.4rem", color: "#6d28d9", marginBottom: "1rem" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.6rem" }}>{f.title}</h3>
                <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={S.section(600)}>
        <FadeIn>
          <p style={S.label}>COMMENT ÇA MARCHE</p>
          <h2 style={{ ...S.h2, marginBottom: "3rem" }}>Simple. Rapide.<br /><span style={{ color: "#334155" }}>Puissant.</span></h2>
        </FadeIn>
        <StepsIndicator steps={steps} />
      </section>

      {/* PRODUCT PREVIEW */}
      <section style={S.section(960)}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>APERÇU DU PRODUIT</p>
          <h2 style={S.h2}>Finis le brouillard.<br /><span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Comprends tes décisions.</span></h2>
          <p style={{ color: "#475569", fontSize: "0.9rem" }}>Pas des signaux. Pas des prédictions. Un miroir de toi.</p>
        </FadeIn>

        {/* Trade card */}
        <FadeIn delay={0.1}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "linear-gradient(135deg,#3b1f6e,#1e1b4b)", border: "1px solid #3b1f6e", borderRadius: 8, padding: "0.3rem 0.8rem", fontSize: "0.72rem", color: "#a78bfa", fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>Trade #147</div>
                <span style={{ color: "#334155", fontSize: "0.8rem" }}>BTC/USDT · Long · Mardi 09h22</span>
              </div>
              <div style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 8, padding: "0.3rem 0.8rem", fontSize: "0.72rem", color: "#34d399", fontWeight: 600 }}>+3.8%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {/* Left */}
              <div style={{ padding: "1.5rem", borderRight: "1px solid #1a1a2e" }}>
                <p style={{ fontSize: "0.68rem", color: "#334155", letterSpacing: "0.08em", marginBottom: "1rem", fontWeight: 600 }}>TON ENTRÉE</p>
                {[
                  { l: "Pourquoi ce trade", v: "Breakout propre sur niveau clé, volume fort" },
                  { l: "État émotionnel", v: "😌 Calme — 1/5" },
                  { l: "Confiance", v: "⚡ 7/10" },
                  { l: "Respect du plan", v: "✅ Oui" },
                ].map((x, i) => <div key={i} style={{ marginBottom: "0.8rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#334155", marginBottom: "0.15rem" }}>{x.l}</p>
                  <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{x.v}</p>
                </div>)}
              </div>
              {/* Right */}
              <div style={{ padding: "1.5rem" }}>
                <p style={{ fontSize: "0.68rem", color: "#6d28d9", letterSpacing: "0.08em", marginBottom: "1rem", fontWeight: 600 }}>ANALYSE NEXORA</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#064e3b,#1e1b4b)", border: "1px solid #059669", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#34d399" }}>91</div>
                  <div><p style={{ fontSize: "0.78rem", fontWeight: 600 }}>Score de décision</p><p style={{ fontSize: "0.72rem", color: "#475569" }}>Excellente décision</p></div>
                </div>
                <div style={{ background: "rgba(109,40,217,.08)", border: "1px solid rgba(109,40,217,.2)", borderRadius: 10, padding: "1rem", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#6d28d9", fontWeight: 600, marginBottom: "0.35rem", letterSpacing: "0.06em" }}>INSIGHT INATTENDU</p>
                  <p style={{ fontSize: "0.82rem", color: "#a78bfa", lineHeight: 1.6 }}>Ce setup performe 40% moins bien le lundi matin. Tu as eu de la chance — note-le pour la prochaine fois.</p>
                </div>
                <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 10, padding: "1rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 600, marginBottom: "0.35rem", letterSpacing: "0.06em" }}>TON ÉTAT OPTIMAL</p>
                  <p style={{ fontSize: "0.82rem", color: "#6ee7b7", lineHeight: 1.6 }}>Tes 5 meilleurs trades : calme, le matin, après une bonne nuit. C'est là que tu décides le mieux.</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Row: curve + profile */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {/* Decision curve */}
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

          {/* Trader profile */}
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

        {/* Heatmap */}
        <FadeIn delay={0.25}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: "1.75rem" }}>
            <p style={{ fontSize: "0.68rem", color: "#6d28d9", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.3rem" }}>HEATMAP COMPORTEMENTALE</p>
            <p style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "1.5rem" }}>Quand tu décides bien — et quand tu ne devrais pas trader</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: "0.68rem", color: "#334155", fontWeight: 500, textAlign: "left", paddingBottom: "0.5rem", width: 80 }}></th>
                    {days.map(d => <th key={d} style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 500, textAlign: "center", paddingBottom: "0.5rem" }}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot}>
                      <td style={{ fontSize: "0.72rem", color: "#334155", paddingRight: "0.75rem", fontWeight: 500, whiteSpace: "nowrap" }}>{slot}</td>
                      {days.map(day => {
                        const v = heatData[`${day}-${slot}`] || 50;
                        const c = scoreColor(v);
                        return (
                          <td key={day} style={{ textAlign: "center", padding: "2px" }}>
                            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "0.4rem 0.2rem", fontSize: "0.72rem", color: c.text, fontWeight: 600, minWidth: 36 }}>{v}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem" }}>
              {[{ c: "#34d399", bg: "rgba(16,185,129,.15)", l: "Décisions optimales (75+)" }, { c: "#fbbf24", bg: "rgba(234,179,8,.12)", l: "Acceptable (55–74)" }, { c: "#f87171", bg: "rgba(239,68,68,.12)", l: "Évite de trader (< 55)" }].map((x, i) => (
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
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: "3rem", textAlign: "center" }}>
            <p style={{ ...S.label, textAlign: "center" }}>CE QUE NEXORA RÉVÈLE</p>
            <h2 style={{ ...S.h2, marginBottom: "2rem" }}>
              "Tu pensais être mauvais en trading."<br />
              <span style={{ color: "#475569" }}>"En réalité, tu trades bien…</span><br />
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>mais au mauvais moment."</span>
            </h2>
            <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
              83% des pertes viennent de 2 ou 3 situations récurrentes que tu ne vois pas.<br />
              Nexora les voit. Et te le montre.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* BETA */}
      <section style={S.section(1000)}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={S.label}>ACCÈS ANTICIPÉ</p>
          <h2 style={S.h2}>Les premiers retours arrivent bientôt.</h2>
          <p style={{ color: "#475569", fontSize: "0.9rem" }}>Rejoins les premiers traders et construis le produit avec nous.</p>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1.25rem" }}>
          {[
            { label: "Ce que tu découvres", text: "Tu identifies tes patterns de décision que tu ne vois jamais seul." },
            { label: "Ce que tu comprends", text: "Tu comprends pourquoi tu perds — pas comment le marché bouge." },
            { label: "Ce que tu construis", text: "Une structure décisionnelle qui te ressemble et qui s'améliore chaque semaine." },
          ].map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{ ...S.card, borderLeft: "2px solid #3b1f6e" }}>
                <p style={{ ...S.label, marginBottom: "0.75rem" }}>{t.label}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.75 }}>{t.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "6rem 2rem 8rem", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(109,40,217,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <FadeIn>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem", position: "relative" }}>
            Prêt à comprendre<br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>comment tu décides vraiment ?</span>
          </h2>
          <p style={{ color: "#475569", marginBottom: "2.5rem", fontSize: "0.95rem" }}>Accès early bird offert aux 100 premiers.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {!submitted ? <>
              <input className="email-input" type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button className="cta-btn" onClick={handleSubmit}><span>Rejoindre maintenant →</span></button>
            </> : <div style={{ background: "rgba(109,40,217,.1)", border: "1px solid rgba(109,40,217,.3)", borderRadius: 10, padding: "0.9rem 2rem", color: "#a78bfa", fontSize: "0.9rem" }}>✓ Tu es sur la liste. On te contacte en premier.</div>}
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #0d0d18", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#6d28d9,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>N</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#334155" }}>NEXORA</span>
        </div>
        <p style={{ color: "#1e293b", fontSize: "0.72rem" }}>© 2026 Nexora · Finis le brouillard. Comprends tes décisions.</p>
      </footer>
    </div>
  );
}