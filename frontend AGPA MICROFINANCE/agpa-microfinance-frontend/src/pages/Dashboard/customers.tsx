import { useState, useEffect  } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "../../services/customer.service";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiPhone,
  FiMapPin,
  FiDownload,
  FiUser,
  FiPackage,
  FiShield,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomerStatus = "Active" | "Inactive" | "Suspended";
type ModalMode = "view" | "add" | "edit" | "delete" | null;

interface Customer {
  id: string;
  clientName: string;
  clientPhone: string;
  clientLocation: string;
  clientGuaranteeItem: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorLocation: string;
  guarantorItem: string;
  chairpersonName: string;
  status: CustomerStatus;
  joinedDate: string;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const customerSchema = z.object({
  clientName: z.string().min(3, "Client name must be at least 3 characters"),
  clientPhone: z
    .string()
    .min(9, "Phone number is too short")
    .regex(/^[+\d\s\-()]+$/, "Invalid phone number"),
  clientLocation: z.string().min(2, "Client location is required"),
  clientGuaranteeItem: z.string().min(3, "Please describe the guarantee item"),
  guarantorName: z.string().min(3, "Guarantor name must be at least 3 characters"),
  guarantorPhone: z
    .string()
    .min(9, "Guarantor phone is too short")
    .regex(/^[+\d\s\-()]+$/, "Invalid phone number"),
  guarantorLocation: z.string().min(2, "Guarantor location is required"),
  guarantorItem: z.string().min(3, "Please describe the item guarantor provides"),
  chairpersonName: z.string().min(3, "Chairperson name is required"),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type FormErrors = Partial<Record<keyof CustomerFormData, string>>;


// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: CustomerStatus }) => {
  const map = {
    Active:    "bg-green-100 text-green-700",
    Inactive:  "bg-gray-100 text-gray-500",
    Suspended: "bg-red-100 text-red-700",
  };
  const dot = {
    Active: "bg-green-500", Inactive: "bg-gray-400", Suspended: "bg-red-500",
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

// ─── Reusable Input ───────────────────────────────────────────────────────────
const InputField = ({
  label, value, onChange, error, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
      {label} <span className="text-red-500">*</span>
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 outline-none transition-all
        ${error
          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white"
        }`}
    />
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
        <FiAlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ─── Reusable Select ──────────────────────────────────────────────────────────
const SelectField = ({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-green-800 uppercase tracking-wide">
      {label} <span className="text-red-500">*</span>
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 cursor-pointer transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ─── Section Divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 border-t border-dashed border-green-200" />
    <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 border-t border-dashed border-green-200" />
  </div>
);

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({
  customer, onClose, onEdit,
}: { customer: Customer; onClose: () => void; onEdit: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      {/* Handle bar on mobile */}
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-green-800 to-green-600 px-5 py-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <FiX size={15} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials(customer.clientName)}
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider">Member Profile</p>
            <h2 className="text-white font-bold text-lg leading-snug">{customer.clientName}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-white/50 text-xs">{customer.id}</span>
              <StatusBadge status={customer.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">

        {/* Client */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-green-700 flex items-center justify-center">
              <FiUser size={11} className="text-white" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Client Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: <FiPhone size={12} />, label: "Phone", value: customer.clientPhone },
              { icon: <FiMapPin size={12} />, label: "Location", value: customer.clientLocation },
              { icon: <FiPackage size={12} />, label: "Guarantee Item", value: customer.clientGuaranteeItem },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 flex gap-2.5 items-start">
                <div className="text-green-600 mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5 break-words">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* Guarantor */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center">
              <FiShield size={11} className="text-white" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Guarantor Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: <FiUser size={12} />, label: "Guarantor Name", value: customer.guarantorName },
              { icon: <FiPhone size={12} />, label: "Phone", value: customer.guarantorPhone },
              { icon: <FiMapPin size={12} />, label: "Location", value: customer.guarantorLocation },
              { icon: <FiPackage size={12} />, label: "Guarantee Item", value: customer.guarantorItem },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 flex gap-2.5 items-start">
                <div className="text-green-600 mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5 break-words">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* Chairperson & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-green-50 rounded-xl p-3 flex gap-2.5 items-start">
            <FiUserCheck size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Chairperson</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{customer.chairpersonName}</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 flex gap-2.5 items-start">
            <FiCheckCircle size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Member Since</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{fmtDate(customer.joinedDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-2.5">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-colors"
        >
          <FiEdit2 size={14} /> Edit Customer
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
const CustomerFormModal = ({
  mode, customer, onClose, onSave,
}: {
  mode: "add" | "edit";
  customer?: Customer;
  onClose: () => void;
  onSave: (data: CustomerFormData, id?: string) => Promise<void>;
}) => {
  const blank: CustomerFormData = {
    clientName: "", clientPhone: "", clientLocation: "", clientGuaranteeItem: "",
    guarantorName: "", guarantorPhone: "", guarantorLocation: "", guarantorItem: "",
    chairpersonName: "", status: "Active",
  };

  const fromC = (c: Customer): CustomerFormData => ({
    clientName: c.clientName, clientPhone: c.clientPhone,
    clientLocation: c.clientLocation, clientGuaranteeItem: c.clientGuaranteeItem,
    guarantorName: c.guarantorName, guarantorPhone: c.guarantorPhone,
    guarantorLocation: c.guarantorLocation, guarantorItem: c.guarantorItem,
    chairpersonName: c.chairpersonName, status: c.status,
  });

  const [form, setForm] = useState<CustomerFormData>(customer ? fromC(customer) : blank);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  const set = (field: keyof CustomerFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
  const result = customerSchema.safeParse(form);

  if (!result.success) {
    const errs: FormErrors = {};

    result.error.issues.forEach(e => {
      errs[e.path[0] as keyof CustomerFormData] = e.message;
    });

    setErrors(errs);
    return;
  }

  setSaved(true);

  await onSave(result.data, customer?.id);

  onClose();
};

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2
              className="font-bold text-lg text-slate-800"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {mode === "add" ? "Add New Customer" : "Edit Customer"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add"
                ? "Register a new member into the system"
                : `Editing — ${customer?.clientName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto px-5 py-5 space-y-5 flex-1">

          {/* ── Client Section ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center flex-shrink-0">
                <FiUser size={13} className="text-white" />
              </div>
              <span className="font-bold text-green-800 text-sm">Client Details</span>
            </div>
            <div className="space-y-3">
              <InputField
                label="Client Full Name"
                value={form.clientName}
                onChange={v => set("clientName", v)}
                error={errors.clientName}
                placeholder="e.g. Amina Juma"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Client Phone Number"
                  value={form.clientPhone}
                  onChange={v => set("clientPhone", v)}
                  error={errors.clientPhone}
                  placeholder="+255 7XX XXX XXX"
                  type="tel"
                />
                <InputField
                  label="Client Location"
                  value={form.clientLocation}
                  onChange={v => set("clientLocation", v)}
                  error={errors.clientLocation}
                  placeholder="e.g. Dar es Salaam"
                />
              </div>
              <InputField
                label="Client Guarantee Item"
                value={form.clientGuaranteeItem}
                onChange={v => set("clientGuaranteeItem", v)}
                error={errors.clientGuaranteeItem}
                placeholder="e.g. Sewing machine, Toyota Premio, Land title..."
              />
            </div>
          </div>

          <SectionDivider label="Guarantor Information" />

          {/* ── Guarantor Section ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                <FiShield size={13} className="text-white" />
              </div>
              <span className="font-bold text-green-800 text-sm">Guarantor Details</span>
            </div>
            <div className="space-y-3">
              <InputField
                label="Guarantor Full Name"
                value={form.guarantorName}
                onChange={v => set("guarantorName", v)}
                error={errors.guarantorName}
                placeholder="e.g. Halima Musa"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Guarantor Phone Number"
                  value={form.guarantorPhone}
                  onChange={v => set("guarantorPhone", v)}
                  error={errors.guarantorPhone}
                  placeholder="+255 7XX XXX XXX"
                  type="tel"
                />
                <InputField
                  label="Guarantor Location"
                  value={form.guarantorLocation}
                  onChange={v => set("guarantorLocation", v)}
                  error={errors.guarantorLocation}
                  placeholder="e.g. Kinondoni, DSM"
                />
              </div>
              <InputField
                label="Item Guaranteed by Guarantor"
                value={form.guarantorItem}
                onChange={v => set("guarantorItem", v)}
                error={errors.guarantorItem}
                placeholder="e.g. Motorcycle, House plot, Land title..."
              />
            </div>
          </div>

          <SectionDivider label="Administrative" />

          {/* ── Admin Section ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Chairperson Name"
              value={form.chairpersonName}
              onChange={v => set("chairpersonName", v)}
              error={errors.chairpersonName}
              placeholder="e.g. John Maganga"
            />
            <SelectField
              label="Member Status"
              value={form.status}
              onChange={v => set("status", v)}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Suspended", label: "Suspended" },
              ]}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-[2] py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all
              ${saved
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800 shadow-lg shadow-green-200 active:scale-95"
              }`}
          >
            {saved ? (
              <><FiCheckCircle size={15} /> {mode === "add" ? "Customer Added!" : "Changes Saved!"}</>
            ) : mode === "add" ? (
              <><FiPlus size={15} /> Add Customer</>
            ) : (
              <><FiCheckCircle size={15} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({
  customer, onClose, onConfirm,
}: { customer: Customer; onClose: () => void; onConfirm: () => void }) => {
  const [going, setGoing] = useState(false);
  const go = () => { setGoing(true); setTimeout(() => { onConfirm(); onClose(); }, 600); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiTrash2 size={22} className="text-red-600" />
          </div>
          <h3
            className="font-bold text-lg text-slate-800 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Delete Customer?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            You are about to permanently remove{" "}
            <span className="font-bold text-slate-700">{customer.clientName}</span>{" "}
            <span className="text-gray-400">({customer.id})</span>. This action cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-7 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={go}
            disabled={going}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${going ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
          >
            <FiTrash2 size={14} /> {going ? "Removing..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ITEMS_PER_PAGE = 7;

export default function Customers() {
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | CustomerStatus>("All");
  const [page, setPage]             = useState(1);
  const [modalMode, setModalMode]   = useState<ModalMode>(null);
  const [selected, setSelected]     = useState<Customer | null>(null);


useEffect(() => {
  fetchCustomers();
}, []);
const fetchCustomers = async () => {
  try {

    const res = await getCustomers();

   const formatted = res.map((c: any) => ({
  id: c._id,

  clientName: c.clientName,

  clientPhone: c.clientPhone || c.phone || "",
  clientLocation: c.clientLocation || c.location || "",
  clientGuaranteeItem: c.clientGuaranteeItem || c.guaranteeItem || "",

  guarantorName: c.guarantorName || "",
  guarantorPhone: c.guarantorPhone || "",
  guarantorLocation: c.guarantorLocation || "",
  guarantorItem: c.guarantorItem || "",

  chairpersonName: c.chairpersonName || "",

  status: c.status || "Active",

  joinedDate: c.createdAt
}));

    setCustomers(formatted);

  } catch (error) {

    console.error(error);

    toast.error("Failed to load customers");

  }
};
  const openView   = (c: Customer) => { setSelected(c); setModalMode("view"); };
  const openEdit   = (c: Customer) => { setSelected(c); setModalMode("edit"); };
  const openDelete = (c: Customer) => { setSelected(c); setModalMode("delete"); };
  const closeModal = ()            => { setModalMode(null); setSelected(null); };

const handleSave = async (data: CustomerFormData, id?: string) => {
  try {

    if (id) {
      await updateCustomer(id, data);
      toast.success("Customer updated successfully");
    } else {
      await createCustomer(data);
      toast.success("Customer created successfully");
    }

    await fetchCustomers(); 

  } catch (error) {
    console.error(error);
    toast.error("Operation failed");
  }
};

const handleDelete = async () => {
  try {

    if (!selected) return;

    await deleteCustomer(selected.id);

    toast.success("Customer deleted successfully");

    await fetchCustomers();

  } catch (error) {

    console.error(error);

    toast.error("Delete failed");

  }
};

  // Filter + search
  const filtered = customers.filter(c => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      c.clientName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.clientPhone || "").includes(q) ||
      c.clientLocation.toLowerCase().includes(q) ||
      c.guarantorName.toLowerCase().includes(q) ||
      c.chairpersonName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = {
    active:    customers.filter(c => c.status === "Active").length,
    inactive:  customers.filter(c => c.status === "Inactive").length,
    suspended: customers.filter(c => c.status === "Suspended").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 99px; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto p-3 sm:p-5 xl:p-7 space-y-5">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Customers
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {customers.length} registered members
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                <FiDownload size={15} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => { setSelected(null); setModalMode("add"); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 active:scale-95 transition-all shadow-lg shadow-green-200"
              >
                <FiPlus size={16} />
                Add Customer
              </button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Members",  value: customers.length, icon: <FiUsers size={19} />,     colorClass: "text-green-700 bg-green-50" },
              { label: "Active",         value: counts.active,    icon: <FiUserCheck size={19} />,  colorClass: "text-green-700 bg-green-100" },
              { label: "Inactive",       value: counts.inactive,  icon: <FiUser size={19} />,       colorClass: "text-gray-500 bg-gray-100" },
              { label: "Suspended",      value: counts.suspended, icon: <FiUserX size={19} />,      colorClass: "text-red-600 bg-red-50" },
            ].map(s => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.colorClass}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-2xl font-bold leading-none ${s.colorClass.split(" ")[0]}`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search & Filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search box */}
            <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <FiSearch size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, ID, phone, location..."
                className="w-full text-sm text-slate-700 outline-none bg-transparent placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 flex-shrink-0">
              {(["All", "Active", "Inactive", "Suspended"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all
                    ${statusFilter === s
                      ? "bg-green-700 text-white border-green-700 shadow shadow-green-200"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-700"
                    }`}
                >
                  {s}
                  {s !== "All" && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                      ${statusFilter === s ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                      {counts[s.toLowerCase() as keyof typeof counts]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Desktop table — scrolls horizontally if needed */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Member", "ID", "Phone", "Location",
                      "Guarantor", "Guarantee Items", "Chairperson",
                      "Joined", "Status", "Actions",
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <FiUsers size={38} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">No customers found.</p>
                      </td>
                    </tr>
                  ) : paginated.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-t border-gray-50 hover:bg-green-50/40 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                    >
                      {/* Member */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold flex-shrink-0">
                            {initials(c.clientName)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{c.clientName}</span>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{c.id}</span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{c.clientPhone}</td>

                      {/* Location */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{c.clientLocation}</td>

                      {/* Guarantor */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{c.guarantorName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.guarantorPhone}</p>
                      </td>

                      {/* Guarantee Items */}
                      <td className="px-4 py-3.5 max-w-[170px]">
                        <p className="text-xs text-gray-600 truncate" title={c.clientGuaranteeItem}>
                          <span className="font-bold text-green-700">C: </span>{c.clientGuaranteeItem}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-0.5" title={c.guarantorItem}>
                          <span className="font-bold text-green-600">G: </span>{c.guarantorItem}
                        </p>
                      </td>

                      {/* Chairperson */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{c.chairpersonName}</td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.joinedDate)}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openView(c)}
                            title="View"
                            className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100 transition-colors"
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            title="Edit"
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => openDelete(c)}
                            title="Delete"
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / small tablet: vertical card stack */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <div className="py-14 text-center">
                  <FiUsers size={36} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No customers found.</p>
                </div>
              ) : paginated.map(c => (
                <div key={c.id} className="p-4 hover:bg-green-50/30 transition-colors">

                  {/* Top row: avatar + name + status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm flex-shrink-0">
                        {initials(c.clientName)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{c.clientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.id} · {c.clientLocation}</p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Detail rows */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3 text-xs">
                    <div className="flex gap-2 items-start">
                      <FiPhone size={11} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{c.clientPhone}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <FiPackage size={11} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        <span className="font-semibold text-green-700">Client item: </span>
                        {c.clientGuaranteeItem}
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <FiShield size={11} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        <span className="font-semibold text-green-700">Guarantor: </span>
                        {c.guarantorName} ({c.guarantorPhone}) — {c.guarantorItem}
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <FiUserCheck size={11} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        <span className="font-semibold text-green-700">Chairperson: </span>
                        {c.chairpersonName}
                      </span>
                    </div>
                  </div>

                  {/* Mobile action buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openView(c)}
                      className="py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 active:scale-95 transition-all"
                    >
                      <FiEye size={13} /> View
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      <FiEdit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => openDelete(c)}
                      className="py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400 order-2 sm:order-1">
                Showing{" "}
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}{" "}
                of {filtered.length} customers
              </p>
              <div className="flex gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors"
                >
                  <FiChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all
                      ${page === n
                        ? "bg-green-700 border-green-700 text-white shadow shadow-green-200"
                        : "bg-white border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-700"
                      }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-500 hover:text-green-700 transition-colors"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {modalMode === "view" && selected && (
        <ViewModal
          customer={selected}
          onClose={closeModal}
          onEdit={() => setModalMode("edit")}
        />
      )}
      {(modalMode === "add" || modalMode === "edit") && (
        <CustomerFormModal
          mode={modalMode}
          customer={selected ?? undefined}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
      {modalMode === "delete" && selected && (
        <DeleteModal
          customer={selected}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}