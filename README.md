# Spendly — Interactive Personal Finance & Simulator

**Spendly** is a modern, high-performance personal finance dashboard and wealth simulator built with Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, and Zustand.

Designed for instant zero-login usage, Spendly operates 100% on the client side using browser `localStorage` for complete data privacy. It comes preloaded with an internally consistent multi-month demonstration dataset so users can explore interactive visualizations immediately.

---

## Key Features

### 1. Interactive Dashboard Overview
- **Core Summary Cards**: Total Net Worth, Selected Period Inflow, Outflow, Savings Rate, and Budget Consumption with period-over-period delta indicators.
- **Cash Flow Analysis**: Switch dynamically between **Weekly**, **Monthly**, and **Yearly** intervals.
- **Spending Breakdown**: Interactive donut chart with category distribution and drill-down modal for itemized records.
- **Recent Activity Ledger**: Quick overview of recent transactions with direct editing and deletion.
- **Budget Health Widget**: Visual utilization meters with warning states when spending exceeds 80% or 100%.
- **Deterministic Financial Insights**: Algorithmically generated insights and warnings derived strictly from actual transactions.

### 2. Full Transaction Management
- Search records by keyword across descriptions, categories, payment methods, and notes.
- Multi-dimensional filters: Transaction Type (Income / Expense), Category, Date Range, and Amount Range.
- Sort by date (newest/oldest) and amount (highest/lowest).
- Client-side pagination with customizable views.
- **CSV Data Export** of filtered transactions.
- Quick global **+ Add Transaction** modal accessible anywhere.

### 3. Monthly Category Budgets
- Establish category spending guardrails (Food & Dining, Housing, Transportation, Utilities, Shopping, etc.).
- Accessible status indicators for normal spending, approaching limit (≥80%), and exceeded limits.
- Real-time expense computation from actual ledger records.

### 4. Savings Goals & Milestones
- Set financial targets with target amounts, current savings, and target completion dates.
- Interactive **Contribution Dialog** to track progress increments.
- Automatic calculation of estimated required monthly contributions based on remaining time.
- Celebratory confetti trigger upon reaching 100% of a goal!

### 5. Differentiating Feature: Financial Simulator
- **Interactive Modeling Controls**:
  - Initial savings balance.
  - Monthly income and monthly expense adjustments.
  - Periodic savings contributions.
  - Annual compound return rate (0% to 15%).
  - Simulation horizon from 1 to 30 years.
  - Advanced parameters: annual income raises, expense inflation, and contribution timing (Ordinary Annuity vs. Annuity Due).
- **Goal Milestone Projection**: Solves for the exact month when a selected savings target will be reached.
- **Scenario Comparisons**: Real-time side-by-side comparison with strategic scenarios (Save +25% More, Cut Expenses 15%, Increase Income 15%).
- **Mathematical Transparency**: Transparent formulas explaining compound interest accumulation without false guarantees.

### 6. Reports & Analytics
- Monthly comparisons and historical savings rate trajectory line charts.
- Highest spending category rankings.
- Average transaction metrics.
- Exportable CSV report generation.

### 7. Dual Theme System (Light, Dark, System)
- Intentional deep charcoal/navy dark mode and soft off-white light mode with violet/indigo accents.
- Zero-flash theme initialization script in `<head>`.
- Responsive desktop sidebar, mobile drawer, and bottom navigation bar.

### 8. Currency & Privacy
- Native locale formatting for **Indonesian Rupiah (IDR)** (`Rp1.500.000`) and **US Dollar (USD)** (`$1,500.00`).
- 100% private client-side persistence via Zustand & `localStorage`.
- Full backup export and import functionality via JSON.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 with custom tokens and dark mode variant
- **State Management**: Zustand with persistent storage middleware
- **Charts & Visualization**: Recharts
- **Validation**: Zod
- **Icons**: Lucide React
- **Celebrations**: Canvas Confetti
- **Date Utilities**: Date-fns
- **Unit Testing**: Vitest

---

## Local Development Setup

1. **Clone or enter repository**:
   ```bash
   cd Spendly
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Run unit tests**:
   ```bash
   npm test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Vercel Deployment

Spendly is architected for zero-configuration deployment to [Vercel](https://vercel.com):

1. Push this repository to GitHub or GitLab.
2. Import the repository in the Vercel Dashboard.
3. Keep default settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Deploy! No environment variables or external databases are required.
