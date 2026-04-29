import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import {
  FiSearch, FiX, FiCheckCircle, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiDollarSign,
  FiCalendar, FiTrendingUp, FiClock, FiPhone,
  FiFileText, FiPlus, FiEye,
} from "react-icons/fi";
import {
  getActiveLoans,
  getPayments,
  recordPayment as recordPaymentAPI
} from "../../services/payment.service";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ActiveLoan {
  loanId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanAmount: number;
  totalPayment: number;   // principal + 25% interest
  totalPaid: number;
  lastPaymentDate: string | null;
}

interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanId: string;
  loanAmount: number;
  amountPaid: number;
  paidDate: string;
  notes: string;
  isCompleted: boolean;   // true = moved to history
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => "TSh " + Math.round(n).toLocaleString("en-TZ");

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const todayStr = () => new Date().toISOString().split("T")[0];

const isThisWeek = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
};

const isToday = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0] === todayStr();


// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),

  amountPaid: z.coerce.number()
    .min(1000, "Minimum payment is TSh 1,000"),

  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;
type FormErrors      = Partial<Record<keyof PaymentFormData, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const initials = (n: string) =>
  n.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

const ProgressBar = ({ value }: { value: number }) => {
  const color = value >= 100 ? "bg-blue-500" : value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-[11px] font-bold text-gray-500 w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RECORD PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const RecordPaymentModal = ({
  activeLoans,
  onClose,
  onRecord,
}: {
  activeLoans: ActiveLoan[];
  onClose: () => void;
  onRecord: (data: PaymentFormData) => void;
}) => {
  const [searchQ,     setSearchQ]     = useState("");
  const [showDrop,    setShowDrop]    = useState(false);
  const [selectedLoan,setSel]         = useState<ActiveLoan | null>(null);
  const [amountRaw,   setAmtRaw]      = useState("");
  const [notes,       setNotes]       = useState("");
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [saved,       setSaved]       = useState(false);

  const filtered = activeLoans.filter(l =>
    l.customerName.toLowerCase().includes(searchQ.toLowerCase()) ||
    l.customerId.toLowerCase().includes(searchQ.toLowerCase()) ||
    l.customerPhone.includes(searchQ)
  );

  const selectLoan = (loan: ActiveLoan) => {
    setSel(loan);
    setSearchQ(loan.customerName);
    setShowDrop(false);
    setErrors(p => ({ ...p, customerId: undefined }));
  };

  const remaining = selectedLoan ? selectedLoan.totalPayment - selectedLoan.totalPaid : 0;
  const amount    = parseFloat(amountRaw) || 0;

  const handleSubmit = () => {
    const result = paymentSchema.safeParse({
      customerId: selectedLoan?.customerId ?? "",
      amountPaid: parseFloat(amountRaw),
      notes,
    });
    if (!result.success) {
      const errs: FormErrors = {};
      result.error.issues.forEach(e => { errs[e.path[0] as keyof PaymentFormData] = e.message;});
      setErrors(errs);
      return;
    }
    setSaved(true);
    setTimeout(() => { onRecord(result.data); onClose(); }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800" style={{ fontFamily: "'Playfair Display',serif" }}>
              Record Payment
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Search a customer with an active loan</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <FiX size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 space-y-4 flex-1">

          {/* ── Customer search ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Search Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-all
                ${errors.customerId ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white"}`}>
                <FiSearch size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setShowDrop(true); setSel(null); setErrors(p => ({ ...p, customerId: undefined })); }}
                  onFocus={() => setShowDrop(true)}
                  placeholder="Type customer name or ID..."
                  className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-gray-400"
                />
                {searchQ && (
                  <button onClick={() => { setSearchQ(""); setSel(null); setShowDrop(false); }} className="text-gray-400 hover:text-gray-600">
                    <FiX size={13} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDrop && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400 text-center">
                      No active loans found for "{searchQ}"
                    </div>
                  ) : filtered.map(loan => {
                    const remain  = loan.totalPayment - loan.totalPaid;
                    const pct     = (loan.totalPaid / loan.totalPayment) * 100;
                    return (
                      <button
                        key={loan.loanId}
                        onClick={() => selectLoan(loan)}
                        className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-green-50 transition-colors text-left border-t border-gray-50 first:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0 mt-0.5">
                          {initials(loan.customerName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{loan.customerName}</p>
                          <p className="text-xs text-gray-400">{loan.loanId} · {loan.customerPhone}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="text-orange-600 font-semibold">Remaining: {fmt(remain)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-green-700 font-semibold">{Math.round(pct)}% paid</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {errors.customerId && (
              <p className="flex items-center gap-1 text-xs text-red-600"><FiAlertCircle size={11} />{errors.customerId}</p>
            )}
          </div>

          {/* ── Selected customer info card ── */}
          {selectedLoan && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials(selectedLoan.customerName)}
                </div>
                <div>
                  <p className="font-bold text-green-900 text-sm">{selectedLoan.customerName}</p>
                  <p className="text-xs text-green-700">{selectedLoan.loanId} · {selectedLoan.customerPhone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Loan Total",  value: fmt(selectedLoan.totalPayment) },
                  { label: "Paid So Far", value: fmt(selectedLoan.totalPaid)    },
                  { label: "Remaining",   value: fmt(remaining)                 },
                ].map(item => (
                  <div key={item.label} className="bg-white/70 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-green-700 uppercase tracking-wide font-semibold">{item.label}</p>
                    <p className="text-xs font-bold text-green-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-green-700 font-semibold">Repayment Progress</span>
                  <span className="text-xs font-bold text-green-800">
                    {Math.round((selectedLoan.totalPaid / selectedLoan.totalPayment) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${(selectedLoan.totalPaid / selectedLoan.totalPayment) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Amount ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Payment Amount (TSh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amountRaw}
              placeholder="e.g. 20000"
              min={1000}
              onChange={e => { setAmtRaw(e.target.value); setErrors(p => ({ ...p, amountPaid: undefined })); }}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition-all
                ${errors.amountPaid
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white"}`}
            />
            {selectedLoan && amount > 0 && (
              <p className={`text-xs font-semibold mt-0.5 ${amount > remaining ? "text-orange-600" : "text-green-700"}`}>
                {amount > remaining
                  ? `⚠ Amount exceeds remaining balance of ${fmt(remaining)}`
                  : amount === remaining
                    ? `✓ This will fully clear the loan!`
                    : `Remaining after payment: ${fmt(remaining - amount)}`
                }
              </p>
            )}
            {errors.amountPaid && (
              <p className="flex items-center gap-1 text-xs text-red-600"><FiAlertCircle size={11} />{errors.amountPaid}</p>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. April instalment, partial payment, loan cleared..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-800 outline-none resize-none focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saved}
            className={`flex-[2] py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all
              ${saved ? "bg-green-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800 shadow-lg shadow-green-200 active:scale-95"}`}
          >
            {saved
              ? <><FiCheckCircle size={15} /> Payment Recorded!</>
              : <><FiPlus size={15} /> Record Payment</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW PAYMENT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const PaymentDetailModal = ({ record, onClose }: { record: PaymentRecord; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>

      <div className="bg-gradient-to-br from-green-800 to-green-600 px-5 py-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"><FiX size={15} /></button>
        <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Payment Record</p>
        <h2 className="text-white font-bold text-xl" style={{ fontFamily: "'Playfair Display',serif" }}>{record.id}</h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">{initials(record.customerName)}</div>
          <span className="text-white/80 text-sm">{record.customerName}</span>
          {record.isCompleted && <span className="bg-blue-400/30 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full">Completed</span>}
        </div>
      </div>

      <div className="p-5 space-y-2.5">
        {[
          { icon: <FiPhone size={13} />,     label: "Phone",        value: record.customerPhone },
          { icon: <FiDollarSign size={13} />, label: "Loan Amount",  value: fmt(record.loanAmount) },
          { icon: <FiTrendingUp size={13} />, label: "Amount Paid",  value: fmt(record.amountPaid) },
          { icon: <FiCalendar size={13} />,   label: "Payment Date", value: fmtDate(record.paidDate) },
          { icon: <FiFileText size={13} />,   label: "Loan ID",      value: record.loanId },
          { icon: <FiFileText size={13} />,   label: "Notes",        value: record.notes || "—" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-green-600 flex-shrink-0">{item.icon}</div>
            <span className="text-xs text-gray-400 uppercase tracking-wide flex-1">{item.label}</span>
            <span className="text-sm font-bold text-slate-800 text-right max-w-[55%] truncate">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5">
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 7;

export default function Payments() {
  const [activeLoans, setActiveLoans]   =useState<ActiveLoan[]>([]);
  const [payments, setPayments]         =useState<PaymentRecord[]>([]);
  const [tab,          setTab]          = useState<"active" | "history">("active");
  const [showModal,    setShowModal]    = useState(false);
  const [viewRecord,   setViewRecord]   = useState<PaymentRecord | null>(null);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  // ── Payment stats ──────────────────────────────────────────────────────────
  const allPaid = payments;  // active payments

  const todayTotal   = allPaid.filter(p => isToday(p.paidDate)).reduce((s, p) => s + p.amountPaid, 0);
  const weekTotal    = allPaid.filter(p => isThisWeek(p.paidDate)).reduce((s, p) => s + p.amountPaid, 0);
  const customersToday = new Set(
  allPaid
    .filter(p => isToday(p.paidDate))
    .map(p => p.customerId)
).size;
  const overallTotal = payments.reduce((s, p) => s + p.amountPaid, 0);

useEffect(() => {

  const fetchLoans = async () => {

    try {

      const loans = await getActiveLoans();

   const formatted = loans
  .filter((loan: any) => loan.customerId) 
  .map((loan: any) => ({
    loanId: loan._id,
    customerId: loan.customerId._id,
    customerName: loan.customerId.clientName,
    customerPhone: loan.customerId.clientPhone,

    loanAmount: loan.loanAmount,
    totalPayment: loan.totalPayment,
    totalPaid: loan.totalPaid,

    lastPaymentDate: loan.lastPaymentDate
  }));

      setActiveLoans(formatted);

    } catch (error) {

      console.error("Failed to load loans");

    }

  };

  fetchLoans();

}, []);

useEffect(() => {

  const fetchPayments = async () => {

    try {

      const data = await getPayments();

      const formatted = data
  .filter((p: any) => p.customerId && p.loanId)
  .map((p: any) => ({
    id: p._id,
    customerId: p.customerId._id,
    customerName: p.customerId.clientName,
    customerPhone: p.customerId.clientPhone,

    loanId: p.loanId._id,
    loanAmount: p.loanId.loanAmount,

    amountPaid: p.amountPaid,
    paidDate: p.paidDate,

    notes: p.notes,

    isCompleted: p.loanId.status === "Completed"
  }));

      setPayments(formatted);

    } catch (error) {

      console.error("Failed to load payments");

    }

  };

  fetchPayments();

}, []);

  // ── Record new payment ─────────────────────────────────────────────────────
  const handleRecord = async (
  data: PaymentFormData
) => {

  try {

    const loan = activeLoans.find(
      l => l.customerId === data.customerId
    );

    if (!loan) return;

    const response =
      await recordPaymentAPI({

        loanId: loan.loanId,
        customerId: loan.customerId,
        amountPaid: data.amountPaid,
        notes: data.notes

      });

    const updatedLoan =
      response.updatedLoan;

    // update active loans list
   setActiveLoans(prev =>
  updatedLoan.status === "Completed"
    ? prev.filter(l => l.loanId !== updatedLoan._id)
    : prev.map(l =>
        l.loanId === updatedLoan._id
          ? {
              ...l,
              totalPaid: updatedLoan.totalPaid,
              lastPaymentDate: updatedLoan.lastPaymentDate
            }
          : l
      )
      );

    // refresh payments list from backend
    const refreshed =
      await getPayments();

    const formatted =
      refreshed.map((p: any) => ({

        id: p._id,
        customerId: p.customerId._id,
        customerName: p.customerId.clientName,
        customerPhone: p.customerId.clientPhone,

        loanId: p.loanId._id,
        loanAmount: p.loanId.loanAmount,

        amountPaid: p.amountPaid,
        paidDate: p.paidDate,

        notes: p.notes,

        isCompleted:
          p.loanId.status === "Completed"

      }));

    setPayments(formatted);

  } catch (error) {

    console.error("Payment failed");

  }

};

  // ── Table data ─────────────────────────────────────────────────────────────
  const tableData: (ActiveLoan | PaymentRecord)[] = useMemo(() => {
    if (tab === "active") {
      return activeLoans.filter(l => {
        const q = search.toLowerCase();
        return l.customerName.toLowerCase().includes(q) || l.loanId.toLowerCase().includes(q) || l.customerPhone.includes(q);
      });
    } else {
      return payments.filter(p => {
        const q = search.toLowerCase();
        return p.isCompleted && (
          p.customerName.toLowerCase().includes(q) || p.loanId.toLowerCase().includes(q)
        );
      });
    }
  }, [tab, activeLoans, payments, search]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / ITEMS_PER_PAGE));
  const paginated  = tableData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
                Payments
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeLoans.length} active loans · {payments.filter(p => p.isCompleted).length} completed
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 active:scale-95 transition-all shadow-lg shadow-green-200 self-start sm:self-auto"
            >
              <FiPlus size={16} /> Record Payment
            </button>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Today's Collections",   value: fmt(todayTotal),   icon: <FiCalendar size={18} />,   col: "text-green-700 bg-green-50"  },
              { label: "This Week",              value: fmt(weekTotal),    icon: <FiClock size={18} />,      col: "text-green-700 bg-green-100" },
              { label: "today payment",             value: fmt(customersToday),   icon: <FiTrendingUp size={18} />, col: "text-blue-600 bg-blue-50"    },
              { label: "Total Collections",      value: fmt(overallTotal), icon: <FiDollarSign size={18} />, col: "text-purple-600 bg-purple-50"},
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.col}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-lg sm:text-xl leading-tight ${s.col.split(" ")[0]}`}
                     style={{ fontFamily: "'Playfair Display',serif" }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab + Search ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
              {([
                { key: "active",  label: "Active Loans",     count: activeLoans.length },
                { key: "history", label: "Payment History",  count: payments.filter(p => p.isCompleted).length },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1); setSearch(""); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                    ${tab === t.key ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${tab === t.key ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <FiSearch size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={tab === "active" ? "Search by name, loan ID or phone..." : "Search completed payments..."}
                className="w-full text-sm text-slate-700 outline-none bg-transparent placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Table / Cards ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* ── ACTIVE LOANS TAB ── */}
            {tab === "active" && (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Customer","Phone","Loan Amount","Total (incl. 25%)","Total Paid","Remaining","Progress","Last Payment",""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan={9} className="py-14 text-center">
                          <FiDollarSign size={36} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No active loans found.</p>
                        </td></tr>
                      ) : (paginated as ActiveLoan[]).map((l, i) => {
                        const remain = l.totalPayment - l.totalPaid;
                        const pct    = (l.totalPaid / l.totalPayment) * 100;
                        return (
                          <tr key={l.loanId} className={`border-t border-gray-50 hover:bg-green-50/40 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">{initials(l.customerName)}</div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">{l.customerName}</p>
                                  <p className="text-xs text-gray-400">{l.loanId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{l.customerPhone}</td>
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-800 whitespace-nowrap">{fmt(l.loanAmount)}</td>
                            <td className="px-4 py-3.5 text-sm font-bold text-green-700 whitespace-nowrap">{fmt(l.totalPayment)}</td>
                            <td className="px-4 py-3.5 text-sm font-semibold text-blue-600 whitespace-nowrap">{fmt(l.totalPaid)}</td>
                            <td className="px-4 py-3.5 text-sm font-semibold text-orange-600 whitespace-nowrap">{fmt(remain)}</td>
                            <td className="px-4 py-3.5 min-w-[130px]"><ProgressBar value={pct} /></td>
                            <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{l.lastPaymentDate ? fmtDate(l.lastPaymentDate) : "—"}</td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => { setShowModal(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-bold hover:bg-green-800 transition-colors whitespace-nowrap"
                              >
                                <FiPlus size={12} /> Pay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <div className="py-14 text-center">
                      <FiDollarSign size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No active loans found.</p>
                    </div>
                  ) : (paginated as ActiveLoan[]).map(l => {
                    const remain = l.totalPayment - l.totalPaid;
                    const pct    = (l.totalPaid / l.totalPayment) * 100;
                    return (
                      <div key={l.loanId} className="p-4 hover:bg-green-50/30 transition-colors">
                        {/* top */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm flex-shrink-0">{initials(l.customerName)}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{l.customerName}</p>
                              <p className="text-xs text-gray-400">{l.loanId} · {l.customerPhone}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-bold hover:bg-green-800 transition-colors flex-shrink-0"
                          >
                            <FiPlus size={12} /> Pay
                          </button>
                        </div>

                        {/* amounts */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: "Loan Total",  value: fmt(l.totalPayment), color: "text-green-700" },
                            { label: "Paid",        value: fmt(l.totalPaid),    color: "text-blue-600"  },
                            { label: "Remaining",   value: fmt(remain),         color: "text-orange-600"},
                          ].map(item => (
                            <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                              <p className={`text-xs font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <ProgressBar value={pct} />
                        {l.lastPaymentDate && (
                          <p className="text-xs text-gray-400 mt-2">Last payment: {fmtDate(l.lastPaymentDate)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── PAYMENT HISTORY TAB ── */}
            {tab === "history" && (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Payment ID","Customer","Phone","Loan ID","Loan Amount","Amount Paid","Date","Notes",""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan={9} className="py-14 text-center">
                          <FiCheckCircle size={36} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No completed payments yet.</p>
                        </td></tr>
                      ) : (paginated as PaymentRecord[]).map((p, i) => (
                        <tr key={p.id} className={`border-t border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{p.id}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">{initials(p.customerName)}</div>
                              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{p.customerName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{p.customerPhone}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-400">{p.loanId}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-slate-800 whitespace-nowrap">{fmt(p.loanAmount)}</td>
                          <td className="px-4 py-3.5 text-sm font-bold text-green-700 whitespace-nowrap">{fmt(p.amountPaid)}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmtDate(p.paidDate)}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">{p.notes || "—"}</td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setViewRecord(p)} className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100 transition-colors">
                              <FiEye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile history cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <div className="py-14 text-center">
                      <FiCheckCircle size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No completed payments yet.</p>
                    </div>
                  ) : (paginated as PaymentRecord[]).map(p => (
                    <div key={p.id} className="p-4 hover:bg-blue-50/20 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{initials(p.customerName)}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.customerName}</p>
                            <p className="text-xs text-gray-400">{p.id} · {p.loanId}</p>
                          </div>
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Completed</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Phone</span>
                          <span className="font-semibold text-slate-700">{p.customerPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Loan Amount</span>
                          <span className="font-semibold text-slate-800">{fmt(p.loanAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Paid</span>
                          <span className="font-bold text-green-700">{fmt(p.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date</span>
                          <span className="font-semibold text-slate-700">{fmtDate(p.paidDate)}</span>
                        </div>
                        {p.notes && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Notes</span>
                            <span className="font-semibold text-slate-700 text-right">{p.notes}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setViewRecord(p)} className="w-full py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 active:scale-95 transition-all">
                        <FiEye size={13} /> View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Pagination ── */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400 order-2 sm:order-1">
                Showing {tableData.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, tableData.length)} of {tableData.length} records
              </p>
              <div className="flex gap-1.5 order-1 sm:order-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors">
                  <FiChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all
                      ${page === n ? "bg-green-700 border-green-700 text-white shadow shadow-green-200" : "bg-white border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-700"}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors">
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <RecordPaymentModal
          activeLoans={activeLoans}
          onClose={() => setShowModal(false)}
          onRecord={handleRecord}
        />
      )}
      {viewRecord && (
        <PaymentDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />
      )}
    </>
  );
}