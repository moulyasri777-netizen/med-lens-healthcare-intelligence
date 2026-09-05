# 🩺 MedLens - Healthcare Intelligence

> **A visible trail from source documents to verified health records.**  
> Transforming fragmented lab reports into trusted, human-grounded personal health intelligence.

---

## 🌟 Overview

**MedLens** is an intelligent personal healthcare platform that bridges the gap between raw diagnostic reports and patient understanding. Instead of treating health data as an opaque black box, MedLens emphasizes provenance, transparent extraction, human decision-making, and longitudinal health comparison across multiple diagnostic labs.

- **Original Replit Deployment:** [med-lens-healthcare-intelligence--moulyasri777.replit.app](https://med-lens-healthcare-intelligence--moulyasri777.replit.app)
- **Live Demo on GitHub Pages:** `https://moulyasri777-netizen.github.io/med-lens-healthcare-intelligence/`

---

## ✨ Key Features

### 📋 Grounded Multi-Source Verification
- **Transparent Provenance:** Every lab value retains a direct connection to its original source document (e.g. *Apollo CBC*, *Metropolis Vitamin D*, *Dr. Mehta Consult*), reference ranges, and extraction confidence.
- **Source Confidence Scoring:** Automated extraction with high confidence metrics (96%–99%) flagged for human review where appropriate.

### 🔬 Longitudinal Lab Comparisons & Conflict Resolution
- **Multi-Lab Timeline:** Compare lab results over time across multiple diagnostic providers (e.g., Metropolis vs. Apollo).
- **Conflict Tracking & Decision History:** When labs show diverging measurements (e.g. Vitamin D or Haemoglobin discrepancies), MedLens highlights the disagreement and empowers the patient and clinician to choose the baseline rather than hiding variances.

### 🎧 AI Listening Brief
- **Audio Summary Player:** An integrated 42-second audio-style digest that walks patients through their key diagnostic updates in clear, calm, non-alarmist language.

### 🏥 Contextual Care Directory (Local Mumbai Options)
- **Specialist & Hospital Finder:** Connect findings directly with nearby care facilities and diagnostic centers (e.g., *Kokilaben Dhirubhai Ambani Hospital* and neighborhood clinics).

### 🛡️ Human-in-the-Loop & Privacy
- **"A Decision is Not a Diagnosis":** Patient and doctor retain full autonomy. No automated conclusions are finalized without human review.
- **Private by Default:** Clean client-side architecture keeping patient records under user control.

---

## 🚀 Quick Start (Run Locally)

### Option 1: Python (Zero Dependencies)

Run the included lightweight server:

```bash
python serve.py
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Node / NPX

```bash
npx serve .
```

---

## 📦 Project Structure

```text
med-lens-healthcare-intelligence/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Pages deployment
├── assets/
│   ├── index-C0DTqm2s.css    # Responsive Tailwind & Radix styles
│   └── index-BUwopQyT.js     # React application bundle & health intelligence engine
├── .gitignore
├── favicon.svg               # Application icon
├── index.html                # Main entry HTML
├── package.json              # NPM package scripts & metadata
├── README.md                 # Detailed documentation
├── robots.txt                # Web crawler rules
└── serve.py                  # Local lightweight HTTP server
```

---

## 🛠️ Built With

- **[React](https://react.dev/)** — Declarative UI component architecture
- **[Tailwind CSS](https://tailwindcss.com/)** — Responsive modern styling
- **[Radix UI](https://www.radix-ui.com/)** — Accessible design system components
- **[Lucide Icons](https://lucide.dev/)** — Medical and UI iconography

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
