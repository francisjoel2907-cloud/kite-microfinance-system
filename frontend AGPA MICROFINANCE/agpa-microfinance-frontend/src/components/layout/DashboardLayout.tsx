import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiBarChart2,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronRight,
  FiBell,
  FiSettings,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────

interface User {
  fullName: string;
  role: "Admin" | "Agency";
  initials: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CURRENT_USER: User = {
  fullName: "Francis Joel",
  role: "Admin",
  initials: "FJ",
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: <FiGrid size={18} /> },
  { path: "/dashboard/customers", label: "Customers", icon: <FiUsers size={18} /> },
  { path: "/dashboard/loans", label: "Loans", icon: <FiDollarSign size={18} /> },
  { path: "/dashboard/payments", label: "Payments", icon: <FiCreditCard size={18} /> },
  { path: "/dashboard/reports", label: "Reports", icon: <FiBarChart2 size={18} /> },
];


// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR  (used on desktop; slides in as drawer on mobile)
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarProps {
  activePage: string;
  onNavigate: (path: string) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

const Sidebar = ({ activePage, onNavigate, onClose, isMobileDrawer = false }: SidebarProps) => {
  const navigate = (path: string) => {
    onNavigate(path);
    if (isMobileDrawer && onClose) onClose();
  };

  return (
    <aside className="flex flex-col h-full w-64 bg-green-900 select-none">

      {/* ── Brand / Logo area ── */}
      <div className="flex-shrink-0 px-5 pt-6 pb-5 border-b border-green-800/60">
        {/* Close button on mobile drawer */}
        {isMobileDrawer && (
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-green-800/60 flex items-center justify-center text-green-200 hover:bg-green-800 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Logo placeholder + company name */}
        <div className="flex flex-col items-center text-center gap-3">
          {/* Logo circle — replace with <img> when you have a real logo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-950/40">
              {/* Inner "K" mark */}
              <span
                className="text-white font-black text-3xl leading-none"
                style={{ fontFamily: "'Playfair Display',serif" }}
              >
                K
              </span>
            </div>
            {/* small pulse dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-green-900" />
          </div>

          {/* Company name */}
          <div>
            <h1
              className="text-white font-bold text-base leading-tight tracking-wide"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              KITE Microfinance
            </h1>
            <p className="text-green-300/70 text-[11px] mt-0.5 tracking-wider uppercase">
              Loan Management
            </p>
          </div>
        </div>
      </div>

      {/* ── Logged-in user card ── */}
      <div className="flex-shrink-0 mx-4 mt-4 mb-2 bg-green-800/50 rounded-2xl p-3.5 border border-green-700/40">
        <div className="flex items-center gap-3">
          {/* Avatar with initials */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow shadow-green-950/30">
            <span
              className="text-green-900 font-black text-sm"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              {CURRENT_USER.initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {CURRENT_USER.fullName}
            </p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold
              ${CURRENT_USER.role === "Admin"
                ? "bg-yellow-400/20 text-yellow-300"
                : "bg-green-400/20 text-green-300"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${CURRENT_USER.role === "Admin" ? "bg-yellow-400" : "bg-green-400"}`} />
              {CURRENT_USER.role}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-green-500/60 text-[10px] font-bold uppercase tracking-widest px-3 pb-2 pt-1">
          Main Menu
        </p>

        {NAV_ITEMS.map(item => {
          const active = activePage === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150 relative
                ${active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-green-300/80 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              {/* Active left bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-r-full" />
              )}

              {/* Icon */}
              <span className={`flex-shrink-0 transition-colors ${active ? "text-yellow-400" : "text-green-400/70 group-hover:text-green-300"}`}>
                {item.icon}
              </span>

              {/* Label */}
              <span className="flex-1 text-left">{item.label}</span>

              {/* Arrow */}
              {active && <FiChevronRight size={14} className="text-yellow-400/70 flex-shrink-0" />}
            </button>
          );
        })}

        <div className="pt-3">
          <p className="text-green-500/60 text-[10px] font-bold uppercase tracking-widest px-3 pb-2">
            System
          </p>
          <button className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-green-300/60 hover:bg-white/5 hover:text-white transition-all">
            <FiSettings size={17} className="text-green-400/50 group-hover:text-green-300 transition-colors" />
            Settings
          </button>
        </div>
      </nav>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 px-3 pb-5 pt-2 border-t border-green-800/60">
        <button
          onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold
          text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
          <FiLogOut size={17} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR  (mobile only — contains hamburger + brand + notifications)
// ─────────────────────────────────────────────────────────────────────────────
const MobileTopBar = ({
  onOpenMenu,
  activePage,
}: {
  onOpenMenu: () => void;
  activePage: string;
}) => {
  const pageLabel =
  NAV_ITEMS.find(n => n.path === activePage)?.label ?? "Dashboard";

  return (
    <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={onOpenMenu}
        className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors flex-shrink-0"
      >
        <FiMenu size={18} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">KITE Microfinance</p>
        <h2 className="text-base font-bold text-slate-800 leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
          {pageLabel}
        </h2>
      </div>

      {/* User avatar + bell */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <FiBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
          <span className="text-green-900 font-black text-xs" style={{ fontFamily: "'Playfair Display',serif" }}>
            {CURRENT_USER.initials}
          </span>
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP TOPBAR  (breadcrumb + bell + user info)
// ─────────────────────────────────────────────────────────────────────────────
const DesktopTopBar = ({ activePage }: { activePage: string }) => {
  const pageLabel = NAV_ITEMS.find(n => n.path === activePage)?.label ?? "Dashboard";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <header className="hidden md:flex flex-shrink-0 items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 shadow-sm">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>KITE Microfinance</span>
          <FiChevronRight size={11} />
          <span className="text-green-700 font-semibold">{pageLabel}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mt-0.5 leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
          {pageLabel}
        </h2>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="hidden lg:block text-right">
          <p className="text-xs text-gray-400">{dateStr}</p>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-200" />

        {/* Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <FiBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
            <span className="text-green-900 font-black text-xs" style={{ fontFamily: "'Playfair Display',serif" }}>
              {CURRENT_USER.initials}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{CURRENT_USER.fullName}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{CURRENT_USER.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE BOTTOM NAV  (tab bar on phones — quick shortcuts)
// ─────────────────────────────────────────────────────────────────────────────
const MobileBottomNav = ({
  activePage,
  onNavigate,
}: {
  activePage: string;
onNavigate: (path: string) => void;
}) => (
  <nav className="md:hidden flex-shrink-0 flex items-center justify-around bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] safe-area-inset-bottom">
    {NAV_ITEMS.map(item => {
      const active = activePage === item.path;
      return (
        <button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          className="flex flex-col items-center gap-0.5 py-2.5 px-3 relative flex-1"
        >
          {active && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full" />
          )}
          <span className={`transition-colors ${active ? "text-green-700" : "text-gray-400"}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] font-semibold transition-colors ${active ? "text-green-700" : "text-gray-400"}`}>
            {item.label}
          </span>
        </button>
      );
    })}
  </nav>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LAYOUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = location.pathname;
  const [drawerOpen,    setDrawerOpen]    = useState(false);


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }

        /* mobile safe area for bottom nav */
        .safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }

        /* drawer slide-in */
        @keyframes slideIn  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes fadeIn   { from { opacity: 0; }                  to { opacity: 1; }               }
        .drawer-enter  { animation: slideIn 0.22s ease forwards; }
        .overlay-enter { animation: fadeIn  0.22s ease forwards; }
      `}</style>

      {/* Root: full-screen flex */}
      <div className="flex h-screen overflow-hidden bg-gray-50">

        {/* ──────────────────────────────────────
            DESKTOP SIDEBAR (hidden on mobile)
        ────────────────────────────────────── */}
        <div className="hidden md:flex flex-shrink-0 h-full shadow-xl shadow-green-950/20">
          <Sidebar activePage={activePage} onNavigate={navigate} />
        </div>

        {/* ──────────────────────────────────────
            MOBILE DRAWER + OVERLAY
        ────────────────────────────────────── */}
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              className="overlay-enter md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="drawer-enter md:hidden fixed left-0 top-0 bottom-0 z-50 h-full shadow-2xl">
              <Sidebar
                activePage={activePage}
                onNavigate={navigate}
                onClose={() => setDrawerOpen(false)}
                isMobileDrawer
              />
            </div>
          </>
        )}

        {/* ──────────────────────────────────────
            MAIN CONTENT AREA
        ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile topbar */}
          <MobileTopBar
            onOpenMenu={() => setDrawerOpen(true)}
            activePage={activePage}
          />

          {/* Desktop topbar */}
          <DesktopTopBar activePage={activePage} />

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Outlet />
          </main>

          {/* Mobile bottom navigation tab bar */}
          <MobileBottomNav activePage={activePage} onNavigate={navigate} />
        </div>
      </div>
    </>
  );
}