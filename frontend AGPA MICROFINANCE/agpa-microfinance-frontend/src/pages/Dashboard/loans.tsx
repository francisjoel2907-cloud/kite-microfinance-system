import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import {
  FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2, FiX,
  FiAlertCircle, FiCheckCircle, FiChevronLeft, FiChevronRight,
  FiDownload, FiDollarSign, FiTrendingUp, FiClock,
  FiUser, FiCalendar, FiPercent,
} from "react-icons/fi";
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
} from "../../services/loan.service";
import { getCustomers } from "../../services/customer.service";
// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type LoanStatus = "Active" | "Overdue" | "Completed";
type ModalMode  = "view" | "add" | "edit" | "delete" | null;

interface Customer {
  id: string;
  clientName: string;
  location: string;
}

interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  customerLocation: string;
  loanAmount: number;
  profit: number;
  totalPayment: number;
  repaymentDays: number;
  dailyPayment: number;
  issuedDate: string;
  dueDate: string;
  status: LoanStatus;
  balance: number;
  progress: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const INTEREST_RATE  = 0.30;
const MIN_LOAN       = 50000;
const MAX_LOAN       = 1000000;
const REPAY_DAYS     = 26;
const ITEMS_PER_PAGE = 7;

const fmt = (n: number) => "TSh " + Math.round(n).toLocaleString("en-TZ");
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};
const todayStr = () => new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const loanSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),

  loanAmount: z.coerce.number()
    .min(MIN_LOAN, `Minimum loan is ${fmt(MIN_LOAN)}`)
    .max(MAX_LOAN, `Maximum loan is ${fmt(MAX_LOAN)}`),

  issuedDate: z.string().min(1, "Disbursement date is required"),
});
type LoanFormData = z.infer<typeof loanSchema>;
type FormErrors   = Partial<Record<keyof LoanFormData, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const initials = (n: string) => n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

const STATUS_CFG: Record<LoanStatus,{pill:string;dot:string;bar:string}> = {
  Active:    {pill:"bg-green-100 text-green-700", dot:"bg-green-500",  bar:"bg-green-500"},
  Overdue:   {pill:"bg-red-100 text-red-700",     dot:"bg-red-500",    bar:"bg-red-500"},
  Completed: {pill:"bg-blue-100 text-blue-700",   dot:"bg-blue-500",   bar:"bg-blue-500"},
};

const StatusBadge = ({status}:{status:LoanStatus}) => {
  const s = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{status}
    </span>
  );
};

const ProgressBar = ({value,status}:{value:number;status:LoanStatus}) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
      <div className={`h-full rounded-full ${STATUS_CFG[status].bar}`} style={{width:`${value}%`}}/>
    </div>
    <span className="text-[11px] text-gray-400 font-semibold w-7 text-right">{value}%</span>
  </div>
);

// auto-computed row inside the form
const CalcRow = ({label,value,green=false}:{label:string;value:string;green?:boolean}) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${green?"bg-green-700":"bg-gray-50"}`}>
    <span className={`text-xs font-semibold uppercase tracking-wide ${green?"text-green-100":"text-gray-500"}`}>{label}</span>
    <span className={`text-sm font-bold ${green?"text-white":"text-slate-800"}`}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ViewModal = ({loan,onClose}:{loan:Loan;onClose:()=>void}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>

      {/* header */}
      <div className="bg-gradient-to-br from-green-800 to-green-600 px-5 py-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"><FiX size={15}/></button>
        <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Loan Record</p>
        <h2 className="text-white font-bold text-xl" style={{fontFamily:"'Playfair Display',serif"}}>{loan.id}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">{initials(loan.customerName)}</div>
          <span className="text-white/80 text-sm">{loan.customerName}</span>
          <StatusBadge status={loan.status}/>
        </div>
      </div>

      {/* body */}
      <div className="p-5 space-y-2 max-h-[58vh] overflow-y-auto">
        {[
          {label:"Loan Amount",        value:fmt(loan.loanAmount),   icon:<FiDollarSign size={13}/>},
          {label:"Interest (30%)",     value:fmt(loan.profit),       icon:<FiPercent size={13}/>},
          {label:"Total to Repay",     value:fmt(loan.totalPayment), icon:<FiTrendingUp size={13}/>},
          {label:"Suggested Daily",    value:fmt(loan.dailyPayment), icon:<FiCalendar size={13}/>},
          {label:"Repayment Period",   value:`${loan.repaymentDays} days`, icon:<FiClock size={13}/>},
          {label:"Balance Remaining",  value:loan.balance===0?"Cleared":fmt(loan.balance), icon:<FiDollarSign size={13}/>},
          {label:"Issued Date",        value:fmtDate(loan.issuedDate), icon:<FiCalendar size={13}/>},
          {label:"Due Date",           value:fmtDate(loan.dueDate),    icon:<FiCalendar size={13}/>},
          {label:"Location",           value:loan.customerLocation,    icon:<FiUser size={13}/>},
        ].map(item=>(
          <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-green-600 flex-shrink-0">{item.icon}</div>
            <span className="text-xs text-gray-400 uppercase tracking-wide flex-1">{item.label}</span>
            <span className="text-sm font-bold text-slate-800 text-right">{item.value}</span>
          </div>
        ))}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Repayment Progress</span>
            <span className="text-xs font-bold text-green-700">{loan.progress}%</span>
          </div>
          <ProgressBar value={loan.progress} status={loan.status}/>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-gray-100">
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE / EDIT FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
const LoanFormModal = ({
  mode, loan, eligibleCustomers, onClose, onSave,
}:{
  mode:"add"|"edit"; loan?:Loan;
  eligibleCustomers:Customer[];
  onClose:()=>void; onSave:(d:LoanFormData)=>void;
}) => {
  const [customerId,  setCid]    = useState(loan?.customerId  ?? "");
  const [amountRaw,   setAmt]    = useState(loan ? String(loan.loanAmount) : "");
  const [issuedDate,  setDate]   = useState(loan?.issuedDate  ?? todayStr());
  const [errors,      setErrors] = useState<FormErrors>({});
  const [saved,       setSaved]  = useState(false);

  const amount   = parseFloat(amountRaw) || 0;
  const profit   = amount * INTEREST_RATE;
  const total    = amount + profit;
  const daily = Math.round(total / REPAY_DAYS);
  const dueDate  = issuedDate ? addDays(issuedDate, REPAY_DAYS) : "";
  const valid    = amount >= MIN_LOAN && amount <= MAX_LOAN;

 const handleSubmit = () => {

  const r = loanSchema.safeParse({
    customerId,
    loanAmount: parseFloat(amountRaw),
    issuedDate
  });

  if (!r.success) {

    const errs: FormErrors = {};

    r.error.issues.forEach(issue => {
      errs[issue.path[0] as keyof LoanFormData] = issue.message;
    });

    setErrors(errs);
    return;
  }

  setSaved(true);

  setTimeout(() => {
    onSave(r.data);
    onClose();
  }, 700);
};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>

        {/* header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>
              {mode==="add" ? "Issue New Loan" : "Edit Loan"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode==="add"
                ? `${fmt(MIN_LOAN)} – ${fmt(MAX_LOAN)} · 25% interest · 30-day repayment`
                : `Editing — ${loan?.id}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"><FiX size={15}/></button>
        </div>

        {/* body */}
        <div className="overflow-y-auto px-5 py-5 space-y-4 flex-1">

          {/* ── Customer selector ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Select Customer <span className="text-red-500">*</span>
            </label>
            {mode==="add" && eligibleCustomers.length===0 ? (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
                <FiAlertCircle size={15}/> All customers currently have active loans.
              </div>
            ) : (
              <select
                value={customerId}
                onChange={e=>{setCid(e.target.value);setErrors(p=>({...p,customerId:undefined}));}}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition-all cursor-pointer
                  ${errors.customerId
                    ?"border-red-300 bg-red-50 focus:border-red-400"
                    :"border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-100"}`}
              >
                <option value="">— Select a customer —</option>
                {eligibleCustomers.map(c=>(
                  <option key={c.id} value={c.id}>{c.clientName} · {c.location} ({c.id})</option>
                ))}
              </select>
            )}
            {errors.customerId && (
              <p className="flex items-center gap-1 text-xs text-red-600"><FiAlertCircle size={11}/>{errors.customerId}</p>
            )}
          </div>

          {/* ── Loan Amount ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Loan Amount (TSh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" value={amountRaw}
              placeholder="e.g. 200000"
              min={MIN_LOAN} max={MAX_LOAN} step={1000}
              onChange={e=>{setAmt(e.target.value);setErrors(p=>({...p,loanAmount:undefined}));}}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition-all
                ${errors.loanAmount
                  ?"border-red-300 bg-red-50"
                  :"border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white"}`}
            />
            <p className="text-[11px] text-gray-400">Min: {fmt(MIN_LOAN)} &nbsp;·&nbsp; Max: {fmt(MAX_LOAN)}</p>
            {errors.loanAmount && (
              <p className="flex items-center gap-1 text-xs text-red-600"><FiAlertCircle size={11}/>{errors.loanAmount}</p>
            )}
          </div>

          {/* ── Disbursement Date ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Disbursement Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date" value={issuedDate}
              onChange={e=>{setDate(e.target.value);setErrors(p=>({...p,issuedDate:undefined}));}}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition-all
                ${errors.issuedDate
                  ?"border-red-300 bg-red-50"
                  :"border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-100"}`}
            />
            {errors.issuedDate && (
              <p className="flex items-center gap-1 text-xs text-red-600"><FiAlertCircle size={11}/>{errors.issuedDate}</p>
            )}
          </div>

          {/* ── Auto-calculated breakdown ── */}
          {amount > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Loan Breakdown (auto-calculated)</p>
              <CalcRow label="Repayment Period"         value={`${REPAY_DAYS} days`}/>
              <CalcRow label="Interest / Profit (30%)"  value={valid ? fmt(profit) : "—"}/>
              <CalcRow label="Total Payment"            value={valid ? fmt(total)  : "—"} green/>
              <CalcRow label="Suggested Daily Payment"  value={valid ? fmt(daily)  : "—"}/>
              {dueDate && <CalcRow label="Due Date" value={fmtDate(dueDate)}/>}
            </div>
          )}

          {/* policy notice */}
          <div className="flex gap-2.5 bg-green-50 border border-green-200 rounded-xl p-3.5">
            <FiAlertCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-green-700 leading-relaxed">
              AGPA Microfinance charges a flat <strong>30% interest</strong>.
              Full repayment (principal + interest) is due within <strong>26 days</strong>.
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saved||(mode==="add"&&eligibleCustomers.length===0)}
            className={`flex-[2] py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all
              ${saved?"bg-green-400 cursor-not-allowed":"bg-green-700 hover:bg-green-800 shadow-lg shadow-green-200 active:scale-95"}`}
          >
            {saved
              ? <><FiCheckCircle size={15}/>{mode==="add"?"Loan Issued!":"Changes Saved!"}</>
              : mode==="add"
                ? <><FiPlus size={15}/>Issue Loan</>
                : <><FiCheckCircle size={15}/>Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const DeleteModal = ({loan,onClose,onConfirm}:{loan:Loan;onClose:()=>void;onConfirm:()=>void}) => {
  const [going,setGoing]=useState(false);
  const go=()=>{setGoing(true);setTimeout(()=>{onConfirm();onClose();},600);};
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><FiTrash2 size={22} className="text-red-600"/></div>
          <h3 className="font-bold text-lg text-slate-800 mb-2" style={{fontFamily:"'Playfair Display',serif"}}>Delete Loan?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Permanently delete loan <span className="font-bold text-slate-700">{loan.id}</span> for{" "}
            <span className="font-bold text-slate-700">{loan.customerName}</span>? This cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-7 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={go} disabled={going}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors ${going?"bg-red-300 cursor-not-allowed":"bg-red-600 hover:bg-red-700"}`}>
            <FiTrash2 size={14}/>{going?"Deleting...":"Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search,    setSearch]  = useState("");
  const [filter,    setFilter]  = useState<"All"|LoanStatus>("All");
  const [page,      setPage]    = useState(1);
  const [modal,     setModal]   = useState<ModalMode>(null);
  const [selected,  setSel]     = useState<Loan|null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
 
const fetchLoans = async () => {
  try {
    const data = await getLoans();

const formatted = data.map((loan: any) => ({
  id: loan._id,
  customerId: loan.customerId?._id || loan.customerId,
  customerName: loan.customerId?.clientName || "Unknown",
  customerLocation: loan.customerId?.clientLocation || "-",
  loanAmount: loan.loanAmount,
  profit: loan.profit,
  totalPayment: loan.totalPayment,
  repaymentDays: loan.repaymentDays,
  dailyPayment: loan.dailyPayment,
  issuedDate: loan.issuedDate,
  dueDate: loan.dueDate,
  status: loan.status,
  balance: loan.balance,
  progress: loan.progress,
}));

    setLoans(formatted);
  } catch (error) {
    console.error("Failed to fetch loans", error);
  }
};
const fetchCustomers = async () => {

  try {

    const data = await getCustomers();

    const formatted = data.map((c: any) => ({
      id: c._id,
      clientName: c.clientName,
      location: c.location
    }));

    setCustomers(formatted);

  } catch (error) {

    console.error("Customers fetch failed", error);

  }

};
useEffect(() => {

  fetchLoans();
  fetchCustomers();

  const interval = setInterval(() => {
    fetchLoans();
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const openView   = (l:Loan)=>{ setSel(l); setModal("view"); };
  const openEdit   = (l:Loan)=>{ setSel(l); setModal("edit"); };
  const openDelete = (l:Loan)=>{ setSel(l); setModal("delete"); };
  const closeModal = ()=>{ setModal(null); setSel(null); };

  // customers who already have an active loan → excluded from new-loan dropdown
  const activeIds = useMemo(
  () =>
    new Set(
      loans
        .filter(l => l.status === "Active" || l.status === "Overdue")
        .map(l => l.customerId)
    ),
  [loans]
);
  const eligibleCustomers = useMemo( () => customers.filter(c => !activeIds.has(c.id)), [customers, activeIds]);

 

const handleSave = async (data: LoanFormData) => {
  try {

    if (selected && modal === "edit") {

      await updateLoan(selected.id, data);

    } else {

      await createLoan(data);

    }

    await fetchLoans();

  } catch (error) {

    console.error("Loan save failed", error);

  }
};

  const handleDelete = async () => {

  if (!selected) return;

  try {

    await deleteLoan(selected.id);

    await fetchLoans();

  } catch (error) {

    console.error("Delete failed", error);

  }
};

  const filtered = loans.filter(l => {

  const ms = filter === "All" || l.status === filter;

  const q = search.toLowerCase();

  return ms && (
    l.customerName?.toLowerCase().includes(q) ||
    l.id?.toLowerCase().includes(q) ||
    l.customerLocation?.toLowerCase().includes(q)
  );

});

  const totalPages = Math.max(1,Math.ceil(filtered.length/ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const totalActiveBal  = loans.filter(l=>l.status==="Active").reduce((s,l)=>s+l.balance,0);
  const activeCount     = loans.filter(l=>l.status==="Active").length;
  const overdueCount    = loans.filter(l=>l.status==="Overdue").length;
  

// TODAY'S LOANS CALCULATION
const isToday = (dateStr: string) => {
  const today = new Date();
  const d = new Date(dateStr);

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

const todayLoans = loans.filter(l => isToday(l.issuedDate));

const todayLoansAmount = todayLoans.reduce(
  (sum, loan) => sum + loan.loanAmount,
  0
);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;font-family:'DM Sans',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#bbf7d0;border-radius:99px;}
        input[type=number]::-webkit-inner-spin-button{opacity:1;}
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto p-3 sm:p-5 xl:p-7 space-y-5">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>
                Loans
              </h1>
              <p className="text-sm text-gray-500 mt-1">{loans.length} total loans · {activeCount} active</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                <FiDownload size={15}/><span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={()=>{setSel(null);setModal("add");}}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 active:scale-95 transition-all shadow-lg shadow-green-200"
              >
                <FiPlus size={16}/>Issue Loan
              </button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:"Total Active Balance", value:fmt(totalActiveBal), icon:<FiDollarSign size={19}/>, col:"text-green-700 bg-green-50",    small:true  },
              { label:"Active Loans",          value:String(activeCount),   icon:<FiTrendingUp size={19}/>, col:"text-green-700 bg-green-100",  small:false },
              { label:"Overdue Loans",         value:String(overdueCount),  icon:<FiAlertCircle size={19}/>,col:"text-red-600 bg-red-50",       small:false },
              {label:"Total amount issued today",value:fmt(todayLoansAmount),icon:<FiCalendar size={19}/>,col:"text-blue-600 bg-blue-50",small:true},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.col}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className={`font-bold leading-tight ${s.small?"text-lg sm:text-xl":"text-2xl"} ${s.col.split(" ")[0]}`}
                     style={{fontFamily:"'Playfair Display',serif"}}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search & Filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <FiSearch size={15} className="text-gray-400 flex-shrink-0"/>
              <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, loan ID or location..."
                className="w-full text-sm text-slate-700 outline-none bg-transparent placeholder-gray-400"/>
              {search&&<button onClick={()=>setSearch("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><FiX size={14}/></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 flex-shrink-0">
              {(["All","Active","Overdue","Completed"] as const).map(s=>(
                <button key={s} onClick={()=>{setFilter(s);setPage(1);}}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all
                    ${filter===s?"bg-green-700 text-white border-green-700 shadow shadow-green-200":"bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-700"}`}>
                  {s}
                  {s!=="All"&&(
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter===s?"bg-white/20":"bg-gray-100 text-gray-500"}`}>
                      {loans.filter(l=>l.status===s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table + Cards ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Loan ID","Customer","Location","Loan Amount","Interest (30%)","Total Payment","Daily Payment","Issued","Due Date","Balance","Status","Progress","Actions"]
                      .map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length===0?(
                    <tr><td colSpan={13} className="py-16 text-center">
                      <FiDollarSign size={38} className="text-gray-200 mx-auto mb-3"/>
                      <p className="text-sm text-gray-400">No loans found.</p>
                    </td></tr>
                  ):paginated.map((l,i)=>(
                    <tr key={l.id} className={`border-t border-gray-50 hover:bg-green-50/40 transition-colors ${i%2===1?"bg-gray-50/40":""}`}>
                      <td className="px-4 py-3.5"><span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{l.id}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">{initials(l.customerName)}</div>
                          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{l.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{l.customerLocation}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-slate-800 whitespace-nowrap">{fmt(l.loanAmount)}</td>
                      <td className="px-4 py-3.5 text-sm text-orange-600 font-semibold whitespace-nowrap">{fmt(l.profit)}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-green-700 whitespace-nowrap">{fmt(l.totalPayment)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{fmt(l.dailyPayment)}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmtDate(l.issuedDate)}</td>
                      <td className={`px-4 py-3.5 text-xs whitespace-nowrap font-semibold ${l.status==="Overdue"?"text-red-600":"text-gray-400"}`}>{fmtDate(l.dueDate)}</td>
                      <td className={`px-4 py-3.5 text-sm font-bold whitespace-nowrap ${l.balance===0?"text-blue-600":"text-slate-800"}`}>{l.balance===0?"Cleared":fmt(l.balance)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={l.status}/></td>
                      <td className="px-4 py-3.5 min-w-[110px]"><ProgressBar value={l.progress} status={l.status}/></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>openView(l)} title="View" className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100 transition-colors"><FiEye size={14}/></button>
                          <button onClick={()=>openEdit(l)} title="Edit" className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"><FiEdit2 size={14}/></button>
                          <button onClick={()=>openDelete(l)} title="Delete" className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><FiTrash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card stack */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.length===0?(
                <div className="py-14 text-center">
                  <FiDollarSign size={36} className="text-gray-200 mx-auto mb-2"/>
                  <p className="text-sm text-gray-400">No loans found.</p>
                </div>
              ):paginated.map(l=>(
                <div key={l.id} className="p-4 hover:bg-green-50/30 transition-colors">
                  {/* top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm flex-shrink-0">{initials(l.customerName)}</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{l.customerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{l.id} · {l.customerLocation}</p>
                      </div>
                    </div>
                    <StatusBadge status={l.status}/>
                  </div>

                  {/* amounts */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      {label:"Loan Amount",   value:fmt(l.loanAmount),   color:"text-slate-800"},
                      {label:"Interest 30%",  value:fmt(l.profit),       color:"text-orange-600"},
                      {label:"Total Payment", value:fmt(l.totalPayment), color:"text-green-700 font-bold"},
                      {label:"Daily Payment", value:fmt(l.dailyPayment), color:"text-slate-700"},
                    ].map(item=>(
                      <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* dates */}
                  <div className="flex gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                    <span><span className="font-semibold text-green-700">Issued:</span> {fmtDate(l.issuedDate)}</span>
                    <span>·</span>
                    <span className={l.status==="Overdue"?"text-red-600 font-semibold":""}>
                      <span className="font-semibold text-green-700">Due:</span> {fmtDate(l.dueDate)}
                    </span>
                    <span>·</span>
                    <span><span className="font-semibold text-green-700">Balance:</span> {l.balance===0?"Cleared":fmt(l.balance)}</span>
                  </div>

                  <div className="mb-3"><ProgressBar value={l.progress} status={l.status}/></div>

                  {/* actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={()=>openView(l)} className="py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 active:scale-95 transition-all"><FiEye size={13}/>View</button>
                    <button onClick={()=>openEdit(l)} className="py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 active:scale-95 transition-all"><FiEdit2 size={13}/>Edit</button>
                    <button onClick={()=>openDelete(l)} className="py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-95 transition-all"><FiTrash2 size={13}/>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400 order-2 sm:order-1">
                Showing {filtered.length===0?0:(page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE,filtered.length)} of {filtered.length} loans
              </p>
              <div className="flex gap-1.5 order-1 sm:order-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors">
                  <FiChevronLeft size={14}/>
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>setPage(n)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${page===n?"bg-green-700 border-green-700 text-white shadow shadow-green-200":"bg-white border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-700"}`}>
                    {n}
                  </button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors">
                  <FiChevronRight size={14}/>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {modal==="view"&&selected&&<ViewModal loan={selected} onClose={closeModal}/>}
      {(modal==="add"||modal==="edit")&&(
        <LoanFormModal
          mode={modal}
          loan={selected??undefined}
          eligibleCustomers={modal==="add"?eligibleCustomers:customers}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
      {modal==="delete"&&selected&&<DeleteModal loan={selected} onClose={closeModal} onConfirm={handleDelete}/>}
    </>
  );
}