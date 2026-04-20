import { useState, useMemo } from "react";
import {
  FiDownload,
  FiPrinter,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiCreditCard,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiFileText,
  FiChevronDown,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Period = "week" | "month" | "quarter" | "year";

interface MonthStat {
  month: string;
  shortMonth: string;
  disbursed: number;
  collected: number;
  members: number;
  overdue: number;
}

interface LoanStatusStat {
  label: string;
  count: number;
  amount: number;
  color: string;
  bg: string;
  pct: number;
}

interface TopBorrower {
  name: string;
  loanAmount: number;
  totalPaid: number;
  remaining: number;
  status: "Active" | "Overdue" | "Completed";
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_STATS: MonthStat[] = [
  { month: "January",   shortMonth: "Jan", disbursed: 4200000, collected: 2800000, members: 8,  overdue: 1 },
  { month: "February",  shortMonth: "Feb", disbursed: 5100000, collected: 3900000, members: 12, overdue: 0 },
  { month: "March",     shortMonth: "Mar", disbursed: 3800000, collected: 4200000, members: 6,  overdue: 2 },
  { month: "April",     shortMonth: "Apr", disbursed: 6500000, collected: 5100000, members: 15, overdue: 1 },
  { month: "May",       shortMonth: "May", disbursed: 4900000, collected: 4700000, members: 9,  overdue: 3 },
  { month: "June",      shortMonth: "Jun", disbursed: 7200000, collected: 5900000, members: 18, overdue: 1 },
  { month: "July",      shortMonth: "Jul", disbursed: 5500000, collected: 6100000, members: 11, overdue: 2 },
  { month: "August",    shortMonth: "Aug", disbursed: 8100000, collected: 7200000, members: 22, overdue: 0 },
  { month: "September", shortMonth: "Sep", disbursed: 6700000, collected: 6400000, members: 14, overdue: 2 },
  { month: "October",   shortMonth: "Oct", disbursed: 7400000, collected: 6900000, members: 19, overdue: 1 },
  { month: "November",  shortMonth: "Nov", disbursed: 9200000, collected: 8100000, members: 25, overdue: 3 },
  { month: "December",  shortMonth: "Dec", disbursed: 8800000, collected: 9500000, members: 21, overdue: 0 },
];

const LOAN_STATUS_STATS: LoanStatusStat[] = [
  { label: "Active",    count: 42, amount: 31500000, color: "#16a34a", bg: "#dcfce7", pct: 56 },
  { label: "Completed", count: 28, amount: 19600000, color: "#2563eb", bg: "#dbeafe", pct: 37 },
  { label: "Overdue",   count:  5, amount:  3750000, color: "#dc2626", bg: "#fee2e2", pct:  7 },
];

const TOP_BORROWERS: TopBorrower[] = [
  { name: "Grace Kileo",     loanAmount: 1000000, totalPaid: 1250000, remaining: 0,      status: "Completed" },
  { name: "Amina Juma",      loanAmount: 500000,  totalPaid: 362500,  remaining: 262500, status: "Active"    },
  { name: "Peter Mwangi",    loanAmount: 750000,  totalPaid: 421875,  remaining: 515625, status: "Overdue"   },
  { name: "Emmanuel Mkwawa", loanAmount: 200000,  totalPaid: 87500,   remaining: 162500, status: "Active"    },
  { name: "Hassan Omar",     loanAmount: 400000,  totalPaid: 50000,   remaining: 450000, status: "Active"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `TSh ${(n / 1_000).toFixed(0)}K`;
  return `TSh ${n.toLocaleString()}`;
};
const fmtFull = (n: number) => "TSh " + Math.round(n).toLocaleString("en-TZ");

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

const STATUS_COLOR: Record<string, string> = {
  Active:    "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  Overdue:   "bg-red-100 text-red-700",
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Metric card
const MetricCard = ({
  label, value, sub, icon, colorClass, trend, trendUp,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; colorClass: string;
  trend?: string; trendUp?: boolean;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg
          ${trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {trendUp ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 leading-tight"
         style={{ fontFamily: "'Playfair Display',serif" }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  </div>
);

// Simple bar chart built with pure CSS/divs
const BarChart = ({ data, period }: { data: MonthStat[]; period: Period }) => {
  const visible = period === "week"    ? data.slice(-1)
                : period === "month"   ? data.slice(-1)
                : period === "quarter" ? data.slice(-3)
                : data;

  const maxVal = Math.max(...visible.flatMap(d => [d.disbursed, d.collected]));

  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-40 w-full">
      {visible.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
          {/* Bars */}
          <div className="flex items-end gap-0.5 sm:gap-1 flex-1 w-full justify-center">
            {/* Disbursed */}
            <div className="relative flex-1 flex flex-col justify-end group">
              <div
                className="w-full rounded-t-lg bg-green-500 transition-all duration-500 hover:bg-green-600"
                style={{ height: `${(d.disbursed / maxVal) * 100}%`, minHeight: 4 }}
              />
              {/* tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap font-semibold">
                  {fmt(d.disbursed)}
                </div>
                <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5" />
              </div>
            </div>
            {/* Collected */}
            <div className="relative flex-1 flex flex-col justify-end group">
              <div
                className="w-full rounded-t-lg bg-yellow-400 transition-all duration-500 hover:bg-yellow-500"
                style={{ height: `${(d.collected / maxVal) * 100}%`, minHeight: 4 }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap font-semibold">
                  {fmt(d.collected)}
                </div>
                <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5" />
              </div>
            </div>
          </div>
          {/* Label */}
          <span className="text-[10px] text-gray-400 font-semibold">{d.shortMonth}</span>
        </div>
      ))}
    </div>
  );
};

// Donut chart for loan status (pure CSS)
const DonutChart = ({ stats }: { stats: LoanStatusStat[] }) => {
  const total = stats.reduce((s, st) => s + st.count, 0);
  // Build conic-gradient segments
  let cumulative = 0;
  const segments = stats.map(st => {
    const start = cumulative;
    cumulative += st.pct;
    return { ...st, start, end: cumulative };
  });
  const conicGrad = segments
    .map(s => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <div
          className="w-32 h-32 rounded-full"
          style={{ background: `conic-gradient(${conicGrad})` }}
        />
        {/* Hole */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
            <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display',serif" }}>{total}</span>
            <span className="text-[10px] text-gray-400 font-semibold">Loans</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-3 flex-1 w-full">
        {stats.map(st => (
          <div key={st.label} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: st.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">{st.label}</span>
                <span className="font-bold text-slate-800">{st.count} &nbsp;·&nbsp; {st.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${st.pct}%`, background: st.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collection rate sparkline (simple line made with SVG)
const MiniSparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const poly = pts.join(" ");
  const area = `${pts[0].split(",")[0]},${h} ${poly} ${pts[pts.length - 1].split(",")[0]},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#16a34a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={poly} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="3" fill="#16a34a" />
    </svg>
  );
};

// Section header
const SectionHeader = ({
  title, subtitle, icon,
}: { title: string; subtitle?: string; icon: React.ReactNode }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Playfair Display',serif" }}>
        {title}
      </h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [period,     setPeriod]     = useState<Period>("year");
  const [showFilter, setShowFilter] = useState(false);

  // Aggregate totals based on period
  const periodData = useMemo(() => {
    const slice =
      period === "week"    ? MONTHLY_STATS.slice(-1)   :
      period === "month"   ? MONTHLY_STATS.slice(-1)   :
      period === "quarter" ? MONTHLY_STATS.slice(-3)   :
      MONTHLY_STATS;

    return {
      totalDisbursed:  slice.reduce((s, d) => s + d.disbursed,  0),
      totalCollected:  slice.reduce((s, d) => s + d.collected,  0),
      totalMembers:    slice.reduce((s, d) => s + d.members,    0),
      totalOverdue:    slice.reduce((s, d) => s + d.overdue,    0),
      collectionRate:  Math.round(
        (slice.reduce((s, d) => s + d.collected, 0) /
         slice.reduce((s, d) => s + d.disbursed, 0)) * 100
      ),
    };
  }, [period]);

  const sparkData = MONTHLY_STATS.map(d =>
    Math.round((d.collected / d.disbursed) * 100)
  );

  const PERIOD_OPTIONS: { key: Period; label: string }[] = [
    { key: "week",    label: "This Week"    },
    { key: "month",   label: "This Month"   },
    { key: "quarter", label: "This Quarter" },
    { key: "year",    label: "This Year"    },
  ];

  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label ?? "This Year";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto p-3 sm:p-5 xl:p-7 space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight"
                style={{ fontFamily: "'Playfair Display',serif" }}
              >
                Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Financial overview — KITE Microfinance Loan Management
              </p>
            </div>

            {/* Period selector + export */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {/* Period dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilter(f => !f)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FiCalendar size={14} className="text-green-700" />
                  {currentPeriodLabel}
                  <FiChevronDown size={13} className={`text-gray-400 transition-transform ${showFilter ? "rotate-180" : ""}`} />
                </button>
                {showFilter && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-20 min-w-[160px]">
                    {PERIOD_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setPeriod(opt.key); setShowFilter(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors
                          ${period === opt.key
                            ? "bg-green-50 text-green-700"
                            : "text-slate-700 hover:bg-gray-50"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors shadow-sm">
                <FiPrinter size={14} />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 active:scale-95 transition-all shadow-lg shadow-green-200">
                <FiDownload size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* ── Key Metric Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Disbursed"
              value={fmt(periodData.totalDisbursed)}
              sub={`${currentPeriodLabel}`}
              icon={<FiDollarSign size={19} />}
              colorClass="text-green-700 bg-green-50"
              trend="+12%"
              trendUp
            />
            <MetricCard
              label="Total Collected"
              value={fmt(periodData.totalCollected)}
              sub={`${currentPeriodLabel}`}
              icon={<FiTrendingUp size={19} />}
              colorClass="text-blue-600 bg-blue-50"
              trend="+8%"
              trendUp
            />
            <MetricCard
              label="New Members"
              value={String(periodData.totalMembers)}
              sub="registered"
              icon={<FiUsers size={19} />}
              colorClass="text-purple-600 bg-purple-50"
              trend="+5"
              trendUp
            />
            <MetricCard
              label="Overdue Loans"
              value={String(periodData.totalOverdue)}
              sub="need follow-up"
              icon={<FiAlertCircle size={19} />}
              colorClass="text-red-600 bg-red-50"
              trend="-2"
              trendUp
            />
          </div>

          {/* ── Collection Rate Banner ── */}
          <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <p className="text-green-200 text-xs uppercase tracking-widest font-bold mb-1">Collection Rate</p>
              <div className="flex items-end gap-3">
                <span
                  className="text-white font-black text-5xl leading-none"
                  style={{ fontFamily: "'Playfair Display',serif" }}
                >
                  {periodData.collectionRate}%
                </span>
                <div className="flex items-center gap-1 bg-green-600/50 px-2 py-1 rounded-lg mb-1">
                  <FiArrowUp size={12} className="text-yellow-300" />
                  <span className="text-yellow-300 text-xs font-bold">+3% vs last period</span>
                </div>
              </div>
              <p className="text-green-300 text-sm mt-2">
                {fmt(periodData.totalCollected)} collected out of {fmt(periodData.totalDisbursed)} disbursed
              </p>
              {/* collection progress bar */}
              <div className="mt-3">
                <div className="h-2 bg-green-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(periodData.collectionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            {/* Sparkline */}
            <div className="w-full sm:w-48 h-12 flex-shrink-0 opacity-80">
              <p className="text-green-300 text-[10px] uppercase tracking-wide mb-1 font-semibold">Monthly trend</p>
              <MiniSparkline data={sparkData} />
            </div>
          </div>

          {/* ── Chart Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Bar chart — Disbursements vs Collections */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader
                title="Disbursements vs Collections"
                subtitle={`Monthly breakdown · ${currentPeriodLabel}`}
                icon={<FiBarChart2 size={17} />}
              />
              <BarChart data={MONTHLY_STATS} period={period} />
              {/* Legend */}
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  <span className="text-xs text-gray-500 font-semibold">Disbursed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                  <span className="text-xs text-gray-500 font-semibold">Collected</span>
                </div>
              </div>
            </div>

            {/* Donut — Loan Status Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader
                title="Loan Status"
                subtitle="Portfolio distribution"
                icon={<FiPieChart size={17} />}
              />
              <DonutChart stats={LOAN_STATUS_STATS} />
              {/* Amount summary */}
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                {LOAN_STATUS_STATS.map(st => (
                  <div key={st.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: st.color }} />
                      {st.label}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{fmt(st.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Monthly Summary Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <SectionHeader
                title="Monthly Summary"
                subtitle="Detailed month-by-month breakdown for the year"
                icon={<FiActivity size={17} />}
              />
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    {["Month", "Disbursed", "Collected", "Collection Rate", "New Members", "Overdue", "Net Position"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY_STATS.map((row, i) => {
                    const rate    = Math.round((row.collected / row.disbursed) * 100);
                    const net     = row.collected - row.disbursed;
                    const netPos  = net >= 0;
                    return (
                      <tr
                        key={row.month}
                        className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-700 text-sm">{row.month}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-800 whitespace-nowrap">
                          {fmtFull(row.disbursed)}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-green-700 whitespace-nowrap">
                          {fmtFull(row.collected)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[50px]">
                              <div
                                className={`h-full rounded-full ${rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${rate >= 90 ? "text-green-700" : rate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-purple-600 text-center">
                          +{row.members}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {row.overdue > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <FiAlertCircle size={10} /> {row.overdue}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <FiCheckCircle size={10} /> 0
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={`flex items-center gap-1 text-xs font-bold
                            ${netPos ? "text-green-700" : "text-red-600"}`}>
                            {netPos ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                            {netPos ? "+" : ""}{fmtFull(net)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="bg-green-700 border-t-2 border-green-600">
                    <td className="px-5 py-3.5 text-sm font-bold text-white">Total / Year</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white whitespace-nowrap">
                      {fmtFull(MONTHLY_STATS.reduce((s, d) => s + d.disbursed, 0))}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-yellow-300 whitespace-nowrap">
                      {fmtFull(MONTHLY_STATS.reduce((s, d) => s + d.collected, 0))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-white">
                        {Math.round(
                          (MONTHLY_STATS.reduce((s, d) => s + d.collected, 0) /
                           MONTHLY_STATS.reduce((s, d) => s + d.disbursed, 0)) * 100
                        )}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white text-center">
                      {MONTHLY_STATS.reduce((s, d) => s + d.members, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white text-center">
                      {MONTHLY_STATS.reduce((s, d) => s + d.overdue, 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-yellow-300">
                        +{fmtFull(
                          MONTHLY_STATS.reduce((s, d) => s + d.collected - d.disbursed, 0)
                        )}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile month cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {MONTHLY_STATS.map(row => {
                const rate = Math.round((row.collected / row.disbursed) * 100);
                const net  = row.collected - row.disbursed;
                return (
                  <div key={row.month} className="px-4 py-4 hover:bg-green-50/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 text-sm">{row.month}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {net >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                        {net >= 0 ? "+" : ""}{fmt(net)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">Disbursed</p>
                        <p className="font-bold text-slate-800 mt-0.5">{fmt(row.disbursed)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">Collected</p>
                        <p className="font-bold text-green-700 mt-0.5">{fmt(row.collected)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${rate >= 90 ? "text-green-700" : rate >= 70 ? "text-yellow-600" : "text-red-600"}`}>{rate}%</span>
                      <span className="text-xs text-purple-600 font-semibold">+{row.members} members</span>
                      {row.overdue > 0 && (
                        <span className="text-xs text-red-600 font-semibold flex items-center gap-0.5">
                          <FiAlertCircle size={10} />{row.overdue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom Row: Top Borrowers + Quick Stats ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">

            {/* Top Borrowers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader
                title="Top Borrowers"
                subtitle="Highest loan amounts this year"
                icon={<FiUsers size={17} />}
              />
              <div className="space-y-3">
                {TOP_BORROWERS.map((b, i) => {
                  const pct = Math.round((b.totalPaid / (b.loanAmount * 1.25)) * 100);
                  return (
                    <div key={b.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
                        ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-500" : "bg-orange-50 text-orange-500"}`}>
                        {i + 1}
                      </div>
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">
                        {initials(b.name)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-slate-800 truncate">{b.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${STATUS_COLOR[b.status]}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Loan: {fmtFull(b.loanAmount)}</span>
                          <span className="text-green-700 font-semibold">Paid: {fmtFull(b.totalPaid)}</span>
                        </div>
                        <div className="mt-1.5">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? "bg-blue-500" : pct >= 50 ? "bg-green-500" : "bg-yellow-400"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Financial Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader
                title="Financial Highlights"
                subtitle="Key metrics for the full year"
                icon={<FiFileText size={17} />}
              />
              <div className="space-y-3">
                {[
                  {
                    label: "Total Portfolio Disbursed",
                    value: fmtFull(MONTHLY_STATS.reduce((s, d) => s + d.disbursed, 0)),
                    icon: <FiDollarSign size={15} />,
                    colorClass: "text-green-700 bg-green-50",
                  },
                  {
                    label: "Total Revenue Collected",
                    value: fmtFull(MONTHLY_STATS.reduce((s, d) => s + d.collected, 0)),
                    icon: <FiTrendingUp size={15} />,
                    colorClass: "text-blue-600 bg-blue-50",
                  },
                  {
                    label: "Total New Members",
                    value: String(MONTHLY_STATS.reduce((s, d) => s + d.members, 0)) + " members",
                    icon: <FiUsers size={15} />,
                    colorClass: "text-purple-600 bg-purple-50",
                  },
                  {
                    label: "Active Loan Portfolio",
                    value: fmtFull(LOAN_STATUS_STATS.find(s => s.label === "Active")?.amount ?? 0),
                    icon: <FiCreditCard size={15} />,
                    colorClass: "text-green-700 bg-green-50",
                  },
                  {
                    label: "Portfolio At Risk (PAR)",
                    value: `${LOAN_STATUS_STATS.find(s => s.label === "Overdue")?.pct ?? 0}% of portfolio`,
                    icon: <FiAlertCircle size={15} />,
                    colorClass: "text-red-600 bg-red-50",
                  },
                  {
                    label: "Average Collection Rate",
                    value: `${Math.round(MONTHLY_STATS.reduce((s, d) => s + (d.collected / d.disbursed) * 100, 0) / MONTHLY_STATS.length)}% / month`,
                    icon: <FiActivity size={15} />,
                    colorClass: "text-yellow-600 bg-yellow-50",
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-green-50/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.colorClass}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-center gap-3">
                      <span className="text-xs text-gray-500 font-medium truncate">{item.label}</span>
                      <span className="text-sm font-bold text-slate-800 whitespace-nowrap flex-shrink-0">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}