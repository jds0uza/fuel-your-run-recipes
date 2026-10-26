# Fuel Lab — Macro-Aware Recipe Box for Endurance Runners

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Preview-brightgreen?style=for-the-badge&logo=cloudflare)](https://fuel-your-run-recipes.roaring-dragon89.workers.dev/)

**Live Application:** [fuel-your-run-recipes.roaring-dragon89.workers.dev](https://fuel-your-run-recipes.roaring-dragon89.workers.dev/)  
*(Instant access — test with pre-analyzed sample recipes or run the live demo with no signup required)*

---

## 🏃 The Problem & Motivation

Marathon and endurance training places rigorous metabolic demands on the body. Sports nutrition research demonstrates that endurance athletes generally require:

> **5 to 10 grams of carbohydrates** and **1.2 to 2.0 grams of protein** per kilogram of body weight per day, scaling with training volume and workout intensity.  
> *(Source: Academy of Nutrition and Dietetics, Dietitians of Canada, and American College of Sports Medicine, 2016)*

Meeting these daily targets requires athletes to constantly evaluate recipes before cooking. Most cooking sites give vague descriptions or buried nutrition panels with no focus on training macros.

**Fuel Lab** eliminates stove-side mental math:
1. **Paste any recipe link**: Fuel Lab parses the page, extracting ingredients, preparation time, servings, and dish type.
2. **Macro Estimation**: Matches ingredients against **USDA FoodData Central** to compute per-serving protein, carbs, fats, and calories.
3. **Protein Density Metric**: Evaluates grams of protein per 100 kcal to help runners balance high-carb recovery meals with lean protein density.
4. **Target Goals Calculator**: Calculates personalized daily protein and carbohydrate ranges based on current body weight and today's training load.

---

## 🛠️ Architecture & Tech Stack

The application is structured as a full-stack, type-safe web application running on Cloudflare Workers edge runtime:

- **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (full-stack SSR, file-based routing, strict type safety)
- **Data & State Management**: [TanStack Query](https://tanstack.com/query) + type-safe server RPCs (`createServerFn`)
- **Backend / Ingestion Pipeline**:
  - Recipe page markdown extraction & structured ingredient parsing
  - Nutrition normalization and matching via USDA FoodData Central
  - Edge server runtime deployed with Nitro (`cloudflare-module` preset)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL with Row Level Security) + client-side guest sandbox via `localStorage` for zero-friction evaluations
- **Styling**: Modern design system using Tailwind CSS & Radix UI primitives

---

## ⚡ Built with Lovable — Engineering & Workflow Insights

This project demonstrates how to leverage **Lovable** to build production-grade, full-stack applications with edge deployment:

- **Accelerated Architecture Prototyping**: Leveraged Lovable to bootstrap a modern TanStack Start + Nitro stack with unified SSR and dev server configurations.
- **Bi-Directional Git Synchronization**: Maintained a clean, continuous Git integration between local development (terminal, Git, branch workflows) and the Lovable platform.
- **Edge Runtime Optimization**: Tuned build outputs and dependencies (`@lovable.dev/vite-tanstack-config`) for zero-cold-start execution on **Cloudflare Workers**.
- **Frictionless Product Experience**: Engineered a standalone, zero-auth demo flow alongside authenticated Supabase persistence so visitors can test core features immediately.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+
- npm (or bun)

### Installation

```bash
# Clone the repository
git clone https://github.com/jds0uza/fuel-your-run-recipes.git
cd fuel-your-run-recipes

# Install dependencies
npm install

# Start local development server with HMR
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the project locally.

### Production Build

```bash
# Compile client and server bundles
npm run build

# Preview locally
npm run preview
```

