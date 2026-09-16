import React, { useMemo, useState } from "react";
import "./WelcomeVariant.css";

type Path = {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  accent: string;
  icon: string;
};

const PATHS: Path[] = [
  {
    id: "notice",
    eyebrow: "START WITH A SIGNAL",
    title: "I want to understand what I’m feeling",
    detail: "Name the pattern first. We’ll turn today’s body cues into a clearer next step.",
    accent: "#E7A38D",
    icon: "◌",
  },
  {
    id: "steady",
    eyebrow: "BUILD A PRACTICE",
    title: "I want a steadier nervous system",
    detail: "Small, research-backed exercises for the moments your day starts to run away from you.",
    accent: "#83B6B0",
    icon: "⌁",
  },
  {
    id: "support",
    eyebrow: "GET ORIENTED",
    title: "I’m supporting someone else",
    detail: "A gentle starting point for clinicians, partners, and people who want better language.",
    accent: "#B9A6D1",
    icon: "✦",
  },
];

export function WelcomeVariant() {
  const [selected, setSelected] = useState("notice");
  const [started, setStarted] = useState(false);
  const current = useMemo(() => PATHS.find((path) => path.id === selected) ?? PATHS[0], [selected]);

  return (
    <main className="wv-shell">
      <div className="wv-noise" aria-hidden="true" />
      <header className="wv-header">
        <div className="wv-brand" aria-label="Interosense">
          <span className="wv-mark"><i /><i /><i /></span>
          <span>interosense</span>
        </div>
        <button className="wv-signin" onClick={() => setStarted(true)}>
          Already a member <span>Sign in&nbsp; ↗</span>
        </button>
      </header>

      <section className="wv-intro">
        <div className="wv-kicker"><span /> A beginning, not a diagnosis</div>
        <h1>Where would you<br /><em>like to begin?</em></h1>
        <p>There’s no right answer. Choose the sentence that feels closest today, and we’ll meet you there.</p>
      </section>

      <section className="wv-layout" aria-label="Choose your starting point">
        <div className="wv-paths">
          {PATHS.map((path, index) => {
            const isSelected = path.id === selected;
            return (
              <button
                key={path.id}
                className={`wv-path ${isSelected ? "is-selected" : ""}`}
                style={{ "--path-accent": path.accent } as React.CSSProperties}
                onClick={() => setSelected(path.id)}
                aria-pressed={isSelected}
              >
                <span className="wv-path-number">0{index + 1}</span>
                <span className="wv-path-icon">{path.icon}</span>
                <span className="wv-path-copy">
                  <small>{path.eyebrow}</small>
                  <strong>{path.title}</strong>
                  <span>{path.detail}</span>
                </span>
                <span className="wv-arrow">{isSelected ? "→" : "↗"}</span>
              </button>
            );
          })}
        </div>

        <aside className="wv-reflection">
          <div className="wv-orbit" aria-hidden="true">
            <span className="wv-orbit-core">{current.icon}</span>
            <span className="wv-orbit-ring ring-a" />
            <span className="wv-orbit-ring ring-b" />
            <span className="wv-orbit-dot dot-a" />
            <span className="wv-orbit-dot dot-b" />
          </div>
          <div className="wv-reflection-copy">
            <small>YOUR FIRST THREAD</small>
            <h2>Notice<br /><em>before</em> you fix.</h2>
            <p>Interosense helps you build a more useful relationship with the signals you already carry.</p>
          </div>
          <div className="wv-reflection-meta"><span>37 questions</span><span>≈ 2 min</span></div>
        </aside>
      </section>

      <footer className="wv-footer">
        <div className="wv-progress"><span /><span /><span /><span /></div>
        <div className="wv-footer-note"><b>01</b> of 04 <span>Personalized for you</span></div>
        <button className="wv-continue" onClick={() => setStarted(true)}>
          {started ? "Your path is ready" : "Start with this"} <span>→</span>
        </button>
      </footer>
    </main>
  );
}

export default WelcomeVariant;
