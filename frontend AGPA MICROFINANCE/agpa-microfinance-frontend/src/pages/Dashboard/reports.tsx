import { useState, useMemo } from "react";
import {
  FiCalendar,
  FiDownload,
  FiPrinter,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiFilter,
  FiX,
  FiChevronDown,
  FiArrowUp,
  FiArrowDown,
  FiFileText,
  FiSearch,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type PeriodKey = "week" | "month" | "year" | "custom";
type LoanStatus = "Active" | "Overdue" | "Completed";

interface SummaryRow {
  month: string;
  shortMonth: string;
  year: number;
  weekLabel?: string;
  newCustomers: number;
  loansIssued: number;
  totalDisbursed: number;
  totalCollected: number;
  overdueCount: number;
  completedCount: number;
  collectionRate: number;   // percent
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA  (12 months)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_ROWS: SummaryRow[] = [
  { month:"January",   shortMonth:"Jan", year:2024, newCustomers:8,  loansIssued:6,  totalDisbursed:4200000, totalCollected:2800000, overdueCount:1, completedCount:0, collectionRate:67 },
  { month:"February",  shortMonth:"Feb", year:2024, newCustomers:12, loansIssued:9,  totalDisbursed:5100000, totalCollected:3900000, overdueCount:0, completedCount:2, collectionRate:76 },
  { month:"March",     shortMonth:"Mar", year:2024, newCustomers:6,  loansIssued:5,  totalDisbursed:3800000, totalCollected:4200000, overdueCount:2, completedCount:3, collectionRate:110 },
  { month:"April",     shortMonth:"Apr", year:2024, newCustomers:15, loansIssued:11, totalDisbursed:6500000, totalCollected:5100000, overdueCount:1, completedCount:2, collectionRate:78 },
  { month:"May",       shortMonth:"May", year:2024, newCustomers:9,  loansIssued:7,  totalDisbursed:4900000, totalCollected:4700000, overdueCount:3, completedCount:4, collectionRate:96 },
  { month:"June",      shortMonth:"Jun", year:2024, newCustomers:18, loansIssued:14, totalDisbursed:7200000, totalCollected:5900000, overdueCount:1, completedCount:5, collectionRate:82 },
  { month:"July",      shortMonth:"Jul", year:2024, newCustomers:11, loansIssued:8,  totalDisbursed:5500000, totalCollected:6100000, overdueCount:2, completedCount:6, collectionRate:111 },
  { month:"August",    shortMonth:"Aug", year:2024, newCustomers:22, loansIssued:17, totalDisbursed:8100000, totalCollected:7200000, overdueCount:0, completedCount:8, collectionRate:89 },
  { month:"September", shortMonth:"Sep", year:2024, newCustomers:14, loansIssued:10, totalDisbursed:6700000, totalCollected:6400000, overdueCount:2, completedCount:5, collectionRate:96 },
  { month:"October",   shortMonth:"Oct", year:2024, newCustomers:19, loansIssued:15, totalDisbursed:7400000, totalCollected:6900000, overdueCount:1, completedCount:7, collectionRate:93 },
  { month:"November",  shortMonth:"Nov", year:2024, newCustomers:25, loansIssued:20, totalDisbursed:9200000, totalCollected:8100000, overdueCount:3, completedCount:9, collectionRate:88 },
  { month:"December",  shortMonth:"Dec", year:2024, newCustomers:21, loansIssued:16, totalDisbursed:8800000, totalCollected:9500000, overdueCount:0, completedCount:11, collectionRate:108 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `TSh ${(n / 1_000).toFixed(0)}K`;
  return `TSh ${n.toLocaleString()}`;
};

const fmtFull = (n: number) => "TSh " + Math.round(n).toLocaleString("en-TZ");

const rateColor = (r: number) =>
  r >= 95 ? "text-green-700 bg-green-100"
  : r >= 75 ? "text-yellow-700 bg-yellow-100"
  : "text-red-700 bg-red-100";

const rateBar = (r: number) =>
  r >= 95 ? "bg-green-500"
  : r >= 75 ? "bg-yellow-400"
  : "bg-red-400";

const now = new Date();

// Current week rows (last 7 days → we mock as latest 2 months partial)
const thisWeekRows  = ALL_ROWS.slice(-1);
const thisMonthRows = ALL_ROWS.filter(r => r.month === now.toLocaleString("en-US", { month: "long" })).length
  ? ALL_ROWS.filter(r => r.month === now.toLocaleString("en-US", { month: "long" }))
  : ALL_ROWS.slice(-1);
const thisYearRows  = ALL_ROWS;

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────
const MetricCard = ({
  label, value, sub, icon, colorClass, delta, deltaUp,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; colorClass: string;
  delta?: string; deltaUp?: boolean;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      {delta && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl
          ${deltaUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {deltaUp ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />}
          {delta}
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-none"
         style={{ fontFamily: "'Playfair Display',serif" }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-green-700 font-semibold mt-1">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
const SectionHead = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
      <FiFileText size={15} className="text-green-700" />
    </div>
    <div>
      <h3 className="font-bold text-slate-800 leading-tight"
          style={{ fontFamily: "'Playfair Display',serif" }}>
        {title}
      </h3>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Reports() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [period,      setPeriod]      = useState<PeriodKey>("year");
  const [fromDate,    setFromDate]    = useState("");
  const [toDate,      setToDate]      = useState("");
  const [statusFilter,setStatusFilter]= useState<"all" | LoanStatus>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQ,     setSearchQ]     = useState("");

  // ── Derive rows from period ───────────────────────────────────────────────
  const baseRows: SummaryRow[] = useMemo(() => {
    if (period === "week")   return thisWeekRows;
    if (period === "month")  return thisMonthRows;
    if (period === "year")   return thisYearRows;
    // custom date range — filter by month index (simple mock)
    if (period === "custom" && fromDate && toDate) {
      const from = new Date(fromDate);
      const to   = new Date(toDate);
      return ALL_ROWS.filter(r => {
        const d = new Date(`${r.month} 1, ${r.year}`);
        return d >= from && d <= to;
      });
    }
    return thisYearRows;
  }, [period, fromDate, toDate]);

  // secondary filters
  const rows = useMemo(() => {
    return baseRows.filter(r => {
      const matchMonth = monthFilter === "all" || r.month === monthFilter;
      const matchSearch = searchQ === "" || r.month.toLowerCase().includes(searchQ.toLowerCase());
      return matchMonth && matchSearch;
    });
  }, [baseRows, monthFilter, searchQ]);

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    customers:   rows.reduce((s, r) => s + r.newCustomers,    0),
    disbursed:   rows.reduce((s, r) => s + r.totalDisbursed,  0),
    collected:   rows.reduce((s, r) => s + r.totalCollected,  0),
    loans:       rows.reduce((s, r) => s + r.loansIssued,     0),
    overdue:     rows.reduce((s, r) => s + r.overdueCount,    0),
    completed:   rows.reduce((s, r) => s + r.completedCount,  0),
    avgRate:     rows.length
      ? Math.round(rows.reduce((s, r) => s + r.collectionRate, 0) / rows.length)
      : 0,
  }), [rows]);

  const netPosition = totals.collected - totals.disbursed;
  const netPositive = netPosition >= 0;

  const periodLabel: Record<PeriodKey, string> = {
    week:   "This Week",
    month:  "This Month",
    year:   "This Year",
    custom: fromDate && toDate ? `${fromDate} → ${toDate}` : "Custom Range",
  };

  const clearFilters = () => {
    setPeriod("year");
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
    setMonthFilter("all");
    setSearchQ("");
  };

  const anyFilter =
    period !== "year" || statusFilter !== "all" || monthFilter !== "all" || searchQ !== "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto p-3 sm:p-5 xl:p-7 space-y-5">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display',serif" }}>
                Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                KITE Microfinance · {periodLabel[period]}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm
                  ${showFilters
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <FiFilter size={14} />
                Filters
                {anyFilter && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                )}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                <FiPrinter size={14} />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 active:scale-95 transition-all shadow-lg shadow-green-200">
                <FiDownload size={14} />
                Export
              </button>
            </div>
          </div>

          {/* ── Filter Panel ── */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiFilter size={15} className="text-green-700" />
                  <span className="font-bold text-slate-800 text-sm">Filter Reports</span>
                </div>
                {anyFilter && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-red-500 font-semibold hover:text-red-600 transition-colors"
                  >
                    <FiX size={12} /> Clear all filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                {/* Period quick-select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide">
                    Period
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { key: "week",  label: "This Week"  },
                      { key: "month", label: "This Month" },
                      { key: "year",  label: "This Year"  },
                      { key: "custom",label: "Custom"     },
                    ] as const).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setPeriod(opt.key)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all
                          ${period === opt.key
                            ? "bg-green-700 text-white border-green-700 shadow-sm shadow-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom date range */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide">
                    From Date
                  </label>
                  <div className="relative">
                    <FiCalendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={e => { setFromDate(e.target.value); setPeriod("custom"); }}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                    />
                  </div>
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide mt-1">
                    To Date
                  </label>
                  <div className="relative">
                    <FiCalendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => { setToDate(e.target.value); setPeriod("custom"); }}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                    />
                  </div>
                </div>

                {/* Month filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide">
                    Filter by Month
                  </label>
                  <div className="relative">
                    <select
                      value={monthFilter}
                      onChange={e => setMonthFilter(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 cursor-pointer appearance-none transition-all"
                    >
                      <option value="all">All Months</option>
                      {ALL_ROWS.map(r => (
                        <option key={r.month} value={r.month}>{r.month}</option>
                      ))}
                    </select>
                    <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Loan status filter */}
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide mt-2">
                    Loan Status
                  </label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 cursor-pointer appearance-none transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-green-800 uppercase tracking-wide">
                    Search Month
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <FiSearch size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="e.g. January..."
                      className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder-gray-400"
                    />
                    {searchQ && (
                      <button onClick={() => setSearchQ("")} className="text-gray-400 hover:text-gray-600">
                        <FiX size={13} />
                      </button>
                    )}
                  </div>

                  {/* Active filter tags */}
                  {anyFilter && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {period !== "year" && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {periodLabel[period]}
                          <button onClick={() => setPeriod("year")}><FiX size={9} /></button>
                        </span>
                      )}
                      {monthFilter !== "all" && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {monthFilter}
                          <button onClick={() => setMonthFilter("all")}><FiX size={9} /></button>
                        </span>
                      )}
                      {statusFilter !== "all" && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {statusFilter}
                          <button onClick={() => setStatusFilter("all")}><FiX size={9} /></button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Customers"
              value={String(totals.customers)}
              sub={`${period === "year" ? "registered this year" : "in selected period"}`}
              icon={<FiUsers size={22} />}
              colorClass="bg-green-50 text-green-700"
              delta="+7%"
              deltaUp
            />
            <MetricCard
              label="Total Disbursed"
              value={fmt(totals.disbursed)}
              sub={`${totals.loans} loans issued`}
              icon={<FiDollarSign size={22} />}
              colorClass="bg-blue-50 text-blue-600"
              delta="+12%"
              deltaUp
            />
            <MetricCard
              label="Total Collected"
              value={fmt(totals.collected)}
              sub={`${totals.avgRate}% avg collection rate`}
              icon={<FiTrendingUp size={22} />}
              colorClass="bg-purple-50 text-purple-600"
              delta="+8%"
              deltaUp
            />
            <MetricCard
              label="Net Position"
              value={fmt(Math.abs(netPosition))}
              sub={netPositive ? "Surplus collected" : "Outstanding balance"}
              icon={netPositive ? <FiArrowUp size={22} /> : <FiArrowDown size={22} />}
              colorClass={netPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}
              delta={netPositive ? "Surplus" : "Deficit"}
              deltaUp={netPositive}
            />
          </div>

          {/* ── Quick Stats Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Loans Issued",    value: totals.loans,     icon: <FiDollarSign size={15} />,  col: "text-blue-600 bg-blue-50"   },
              { label: "Loans Completed", value: totals.completed, icon: <FiCheckCircle size={15} />, col: "text-green-700 bg-green-50" },
              { label: "Overdue Loans",   value: totals.overdue,   icon: <FiAlertCircle size={15} />, col: "text-red-600 bg-red-50"     },
              { label: "Avg Collection",  value: `${totals.avgRate}%`, icon: <FiTrendingUp size={15} />, col: "text-purple-600 bg-purple-50" },
            ].map(s => (
              <div key={s.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.col}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-lg leading-tight ${s.col.split(" ")[0]}`}
                     style={{ fontFamily: "'Playfair Display',serif" }}>
                    {s.value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Summary Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Table header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <SectionHead
                title="Monthly Summary"
                sub={`${rows.length} period${rows.length !== 1 ? "s" : ""} · ${periodLabel[period]}`}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Collected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Disbursed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Overdue
                </span>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Period", "New Members", "Loans Issued",
                      "Total Disbursed", "Total Collected",
                      "Net Position", "Collection Rate",
                      "Completed", "Overdue",
                    ].map(h => (
                      <th key={h}
                        className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <FiFileText size={20} className="text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400">No data for the selected filters.</p>
                          <button onClick={clearFilters} className="text-xs text-green-700 font-bold hover:underline">
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, i) => {
                    const net    = row.totalCollected - row.totalDisbursed;
                    const netPos = net >= 0;
                    return (
                      <tr key={row.month}
                        className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>

                        {/* Period */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-green-800 font-bold text-xs"
                                    style={{ fontFamily: "'Playfair Display',serif" }}>
                                {row.shortMonth}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{row.month}</p>
                              <p className="text-xs text-gray-400">{row.year}</p>
                            </div>
                          </div>
                        </td>

                        {/* New members */}
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-600">
                            <FiUsers size={13} />
                            +{row.newCustomers}
                          </span>
                        </td>

                        {/* Loans issued */}
                        <td className="px-4 py-4 text-sm font-semibold text-blue-600">
                          {row.loansIssued}
                        </td>

                        {/* Disbursed */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{fmtFull(row.totalDisbursed)}</p>
                        </td>

                        {/* Collected */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-green-700 whitespace-nowrap">{fmtFull(row.totalCollected)}</p>
                        </td>

                        {/* Net position */}
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1 text-sm font-bold whitespace-nowrap
                            ${netPos ? "text-green-700" : "text-red-600"}`}>
                            {netPos ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
                            {netPos ? "+" : ""}{fmtFull(net)}
                          </div>
                        </td>

                        {/* Collection rate */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5 min-w-[120px]">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${rateBar(row.collectionRate)}`}
                                style={{ width: `${Math.min(row.collectionRate, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${rateColor(row.collectionRate)}`}>
                              {row.collectionRate}%
                            </span>
                          </div>
                        </td>

                        {/* Completed */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                            <FiCheckCircle size={11} />
                            {row.completedCount}
                          </span>
                        </td>

                        {/* Overdue */}
                        <td className="px-4 py-4">
                          {row.overdueCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                              <FiAlertCircle size={11} />
                              {row.overdueCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                              <FiCheckCircle size={11} />
                              0
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals row */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-green-700 border-t-2 border-green-600">
                      <td className="px-4 py-4">
                        <p className="text-white font-bold text-sm">Total</p>
                        <p className="text-green-200 text-xs">{rows.length} period{rows.length !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-4 text-white font-bold text-sm">+{totals.customers}</td>
                      <td className="px-4 py-4 text-white font-bold text-sm">{totals.loans}</td>
                      <td className="px-4 py-4 text-white font-bold text-sm whitespace-nowrap">{fmtFull(totals.disbursed)}</td>
                      <td className="px-4 py-4 text-yellow-300 font-bold text-sm whitespace-nowrap">{fmtFull(totals.collected)}</td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1 text-sm font-bold ${netPositive ? "text-yellow-300" : "text-red-300"}`}>
                          {netPositive ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
                          {netPositive ? "+" : ""}{fmtFull(netPosition)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white font-bold text-sm">{totals.avgRate}% avg</span>
                      </td>
                      <td className="px-4 py-4 text-white font-bold text-sm">{totals.completed}</td>
                      <td className="px-4 py-4 text-white font-bold text-sm">{totals.overdue}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile: card per month */}
            <div className="sm:hidden divide-y divide-gray-100">
              {rows.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FiFileText size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No data for selected filters.</p>
                  <button onClick={clearFilters} className="text-xs text-green-700 font-bold">Clear filters</button>
                </div>
              ) : rows.map(row => {
                const net    = row.totalCollected - row.totalDisbursed;
                const netPos = net >= 0;
                return (
                  <div key={row.month} className="px-4 py-4 hover:bg-green-50/20 transition-colors">
                    {/* Month header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-800 font-bold text-sm"
                                style={{ fontFamily: "'Playfair Display',serif" }}>
                            {row.shortMonth}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{row.month} {row.year}</p>
                          <p className="text-xs text-gray-400">+{row.newCustomers} members · {row.loansIssued} loans</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold ${netPos ? "text-green-700" : "text-red-600"}`}>
                        {netPos ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                        {netPos ? "+" : ""}{fmt(net)}
                      </div>
                    </div>

                    {/* Amounts grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Disbursed</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(row.totalDisbursed)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Collected</p>
                        <p className="text-sm font-bold text-green-700 mt-0.5">{fmt(row.totalCollected)}</p>
                      </div>
                    </div>

                    {/* Collection rate bar */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rateBar(row.collectionRate)}`}
                          style={{ width: `${Math.min(row.collectionRate, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${rateColor(row.collectionRate)}`}>
                        {row.collectionRate}%
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <FiCheckCircle size={11} /> {row.completedCount} completed
                      </span>
                      {row.overdueCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                          <FiAlertCircle size={11} /> {row.overdueCount} overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                          <FiCheckCircle size={11} /> 0 overdue
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Mobile totals card */}
              {rows.length > 0 && (
                <div className="bg-green-700 px-4 py-4">
                  <p className="text-white font-bold text-sm mb-3">
                    Total · {rows.length} period{rows.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Members",    value: `+${totals.customers}`,        color: "text-white" },
                      { label: "Disbursed",  value: fmt(totals.disbursed),         color: "text-white" },
                      { label: "Collected",  value: fmt(totals.collected),         color: "text-yellow-300" },
                      { label: "Net",        value: `${netPositive ? "+" : ""}${fmt(netPosition)}`, color: netPositive ? "text-yellow-300" : "text-red-300" },
                      { label: "Avg Rate",   value: `${totals.avgRate}%`,          color: "text-white" },
                      { label: "Overdue",    value: String(totals.overdue),        color: "text-red-300" },
                    ].map(s => (
                      <div key={s.label} className="bg-green-800/40 rounded-xl p-2.5">
                        <p className="text-green-300 text-[10px] uppercase tracking-wide">{s.label}</p>
                        <p className={`text-sm font-bold mt-0.5 ${s.color}`}
                           style={{ fontFamily: "'Playfair Display',serif" }}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </>
  );
}