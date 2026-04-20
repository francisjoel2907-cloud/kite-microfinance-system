import { useState } from "react";
import {
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUserPlus,
  FiPlusCircle,
  FiCheckSquare,
  FiArrowRight,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiActivity,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  type: "customer" | "loan" | "payment" | "overdue";
  title: string;
  subtitle: string;
  amount?: string;
  time: string;
  initials: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "payment",
    title: "Payment received",
    subtitle: "Amina Juma — LN-001",
    amount: "TSh 180,000",
    time: "2 min ago",
    initials: "AJ",
  },
  {
    id: "2",
    type: "loan",
    title: "Loan issued",
    subtitle: "Hassan Omar — LN-008",
    amount: "TSh 400,000",
    time: "1 hr ago",
    initials: "HO",
  },
  {
    id: "3",
    type: "customer",
    title: "New customer registered",
    subtitle: "Grace Kileo — MBR-007",
    time: "3 hrs ago",
    initials: "GK",
  },
  {
    id: "4",
    type: "payment",
    title: "Payment received",
    subtitle: "Emmanuel Mkwawa — LN-002",
    amount: "TSh 87,500",
    time: "5 hrs ago",
    initials: "EM",
  },
  {
    id: "5",
    type: "overdue",
    title: "Loan overdue",
    subtitle: "John Mbeki — LN-004",
    amount: "TSh 75,000 remaining",
    time: "Yesterday",
    initials: "JM",
  },
  {
    id: "6",
    type: "payment",
    title: "Payment received",
    subtitle: "Salma Rashid — LN-005",
    amount: "TSh 75,000",
    time: "Yesterday",
    initials: "SR",
  },
  {
    id: "7",
    type: "loan",
    title: "Loan issued",
    subtitle: "Fatuma Hassan — LN-003",
    amount: "TSh 1,000,000",
    time: "2 days ago",
    initials: "FH",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const activityConfig = {
  customer: {
    icon: <FiUserPlus size={15} />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    dot: "bg-purple-500",
    label: "New Customer",
  },
  loan: {
    icon: <FiDollarSign size={15} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    label: "Loan Issued",
  },
  payment: {
    icon: <FiCheckCircle size={15} />,
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-500",
    label: "Payment",
  },
  overdue: {
    icon: <FiAlertCircle size={15} />,
    color: "text-red-600",
    bg: "bg-red-50",
    dot: "bg-red-500",
    label: "Overdue",
  },
};

// greeting based on time of day
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const todayStr = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  icon,
  iconClass,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconClass: string;
  trend?: string;
  trendUp?: boolean;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl
          ${trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          <FiTrendingUp size={11} className={trendUp ? "" : "rotate-180"} />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p
        className="text-2xl sm:text-3xl font-black text-slate-800 leading-none"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1.5 font-medium">{label}</p>
      {sub && (
        <p className="text-xs text-gray-500 mt-1 font-semibold">{sub}</p>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const QuickAction = ({
  label,
  description,
  icon,
  iconClass,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm
      hover:border-green-300 hover:shadow-md hover:bg-green-50/30 active:scale-[0.98] transition-all text-left"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconClass}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
    </div>
    <FiArrowRight
      size={16}
      className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all flex-shrink-0"
    />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY ITEM
// ─────────────────────────────────────────────────────────────────────────────
const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const cfg = activityConfig[item.type];
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors group">
      {/* Avatar with type icon overlay */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center
          text-green-800 font-bold text-xs"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {item.initials}
        </div>
        {/* type dot */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${cfg.bg} border-2 border-white
          flex items-center justify-center ${cfg.color}`}
          style={{ fontSize: 8 }}>
          {cfg.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight truncate">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
          </div>
          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">{item.time}</span>
        </div>
        {item.amount && (
          <div className="mt-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
              {item.amount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [activityFilter, setActivityFilter] = useState<"all" | "payment" | "loan" | "customer" | "overdue">("all");

  const filtered = activityFilter === "all"
    ? RECENT_ACTIVITY
    : RECENT_ACTIVITY.filter(a => a.type === activityFilter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto p-3 sm:p-5 xl:p-7 space-y-6">

          {/* ── Greeting Banner ── */}
          <div className="bg-gradient-to-br from-green-800 via-green-700 to-green-600 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            {/* decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-green-200/80 text-sm font-medium">{getGreeting()}, Admin 👋</p>
                <h2
                  className="text-white font-bold text-xl sm:text-2xl mt-1 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Welcome to KITE Microfinance
                </h2>
                <p className="text-green-200/70 text-xs mt-2 flex items-center gap-1.5">
                  <FiCalendar size={12} />
                  {todayStr}
                </p>
              </div>

              {/* Mini status pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "System Online",    dot: "bg-green-400" },
                  { label: "5 Active Loans",   dot: "bg-yellow-400" },
                  { label: "2 Overdue",        dot: "bg-red-400" },
                ].map(s => (
                  <div key={s.label}
                    className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20
                      px-3 py-1.5 rounded-xl text-white text-xs font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Customers"
              value="75"
              sub="7 registered this month"
              icon={<FiUsers size={22} />}
              iconClass="bg-green-50 text-green-700"
              trend="+7"
              trendUp
            />
            <StatCard
              label="Active Loans"
              value="42"
              sub="TSh 31.5M outstanding"
              icon={<FiDollarSign size={22} />}
              iconClass="bg-blue-50 text-blue-600"
              trend="+3"
              trendUp
            />
            <StatCard
              label="Total Disbursed"
              value="TSh 78.4M"
              sub="Across all loans to date"
              icon={<FiTrendingUp size={22} />}
              iconClass="bg-purple-50 text-purple-600"
              trend="+12%"
              trendUp
            />
            <StatCard
              label="Today's Collections"
              value="TSh 642K"
              sub="4 payments received"
              icon={<FiCreditCard size={22} />}
              iconClass="bg-yellow-50 text-yellow-600"
              trend="+2"
              trendUp
            />
          </div>

          {/* ── Quick Actions + Recent Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Quick Actions */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <FiActivity size={14} className="text-green-700" />
                </div>
                <div>
                  <h3
                    className="font-bold text-slate-800 text-base leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Quick Actions
                  </h3>
                  <p className="text-xs text-gray-400">Common tasks at a glance</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <QuickAction
                  label="Register Customer"
                  description="Add a new member to the system"
                  icon={<FiUserPlus size={20} />}
                  iconClass="bg-green-100 text-green-700"
                />
                <QuickAction
                  label="Issue Loan"
                  description="Disburse a loan to a customer"
                  icon={<FiPlusCircle size={20} />}
                  iconClass="bg-blue-100 text-blue-600"
                />
                <QuickAction
                  label="Record Payment"
                  description="Log a customer repayment"
                  icon={<FiCheckSquare size={20} />}
                  iconClass="bg-yellow-100 text-yellow-600"
                />
              </div>

              {/* Overdue alert card */}
              <div className="mt-1 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle size={17} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">2 Overdue Loans</p>
                  <p className="text-xs text-red-500 mt-0.5 leading-relaxed">
                    John Mbeki and Peter Mwangi have missed their repayment deadlines.
                  </p>
                  <button className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1 hover:gap-2 transition-all">
                    View overdue <FiArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 pt-5 pb-3 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                    <FiClock size={14} className="text-green-700" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-slate-800 text-base leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Recent Activity
                    </h3>
                    <p className="text-xs text-gray-400">Latest system events</p>
                  </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 flex-shrink-0">
                  {([
                    { key: "all",      label: "All"      },
                    { key: "payment",  label: "Payments" },
                    { key: "loan",     label: "Loans"    },
                    { key: "customer", label: "Members"  },
                    { key: "overdue",  label: "Overdue"  },
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setActivityFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                        ${activityFilter === f.key
                          ? "bg-green-700 text-white shadow-sm shadow-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity list */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50/80 px-2 py-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <FiActivity size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">No activity found.</p>
                  </div>
                ) : filtered.map(item => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {RECENT_ACTIVITY.length} activities
                </p>
                <button className="text-xs font-bold text-green-700 flex items-center gap-1 hover:gap-2 transition-all">
                  View all activity <FiArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Summary Footer Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
            {[
              { label: "Loans Completed",  value: "28",      icon: <FiCheckCircle size={16} />, color: "text-blue-600 bg-blue-50"   },
              { label: "Overdue Loans",    value: "2",       icon: <FiAlertCircle size={16} />, color: "text-red-600 bg-red-50"     },
              { label: "Repayment Rate",   value: "96.2%",   icon: <FiTrendingUp size={16} />,  color: "text-green-700 bg-green-50" },
              { label: "Avg Loan Size",    value: "TSh 375K",icon: <FiDollarSign size={16} />,  color: "text-purple-600 bg-purple-50"},
            ].map(s => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-bold text-lg leading-tight ${s.color.split(" ")[0]}`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}