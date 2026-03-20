import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  cases: "https://functions.poehali.dev/04b24d28-ddd4-47d2-868f-e953bf2f1d2a",
  orders: "https://functions.poehali.dev/260471d7-b7bb-4e98-adc2-bd58d1d8e1e1",
  staff: "https://functions.poehali.dev/a1fac567-a35e-459d-ac8e-28c058523115",
};

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  return res.json();
}

type CaseStatus = "Активное" | "Расследование" | "Приостановлено" | "Закрыто";

interface CaseRecord {
  id: string;
  number: string;
  date: string;
  category: string;
  article: string;
  suspect: string;
  suspectDob: string;
  suspectAddress: string;
  suspectPhoto: string;
  investigator: string;
  status: CaseStatus;
  description: string;
  materials: string;
}

interface Order {
  id: string;
  number: string;
  date: string;
  title: string;
  author: string;
  type: "Внутренний" | "Нормативный" | "Оперативный";
  signed: boolean;
}

interface Employee {
  id: string;
  name: string;
  rank: string;
  position: string;
  department: string;
  phone: string;
  since: string;
}

type Tab = "database" | "new-case" | "orders" | "staff" | "analytics";

const STATUS_CLASS: Record<CaseStatus, string> = {
  "Активное": "status-active",
  "Расследование": "status-investigation",
  "Приостановлено": "status-suspended",
  "Закрыто": "status-closed",
};
const STATUS_ICON: Record<CaseStatus, string> = {
  "Активное": "CircleDot",
  "Расследование": "Search",
  "Приостановлено": "PauseCircle",
  "Закрыто": "CheckCircle",
};
const STATUSES: CaseStatus[] = ["Активное", "Расследование", "Приостановлено", "Закрыто"];

const CREDENTIALS = { login: "Полковник", password: "89223109976" };

function genNumber() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 900000) + 100000);
  return `УД-${year}-${n}`;
}

const EMPTY_CASE: Omit<CaseRecord, "id"> = {
  number: "",
  date: new Date().toISOString().split("T")[0],
  category: "",
  article: "",
  suspect: "",
  suspectDob: "",
  suspectAddress: "",
  suspectPhoto: "",
  investigator: "",
  status: "Активное",
  description: "",
  materials: "",
};

const EMPTY_EMPLOYEE: Omit<Employee, "id"> = {
  name: "",
  rank: "",
  position: "",
  department: "",
  phone: "",
  since: new Date().toISOString().split("T")[0],
};

export default function Index() {
  // Auth
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (loginForm.login === CREDENTIALS.login && loginForm.password === CREDENTIALS.password) {
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Неверный логин или пароль");
    }
  };

  // App state
  const [activeTab, setActiveTab] = useState<Tab>("database");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Все");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [c, o, s] = await Promise.all([
      apiFetch(API.cases),
      apiFetch(API.orders),
      apiFetch(API.staff),
    ]);
    if (Array.isArray(c)) setCases(c);
    if (Array.isArray(o)) setOrders(o);
    if (Array.isArray(s)) setStaff(s);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  // Quick status change
  const [statusPopup, setStatusPopup] = useState<string | null>(null);

  // Case modals
  const [viewCase, setViewCase] = useState<CaseRecord | null>(null);
  const [printCase, setPrintCase] = useState<CaseRecord | null>(null);
  const [editCase, setEditCase] = useState<CaseRecord | null>(null);
  const [deleteCase, setDeleteCase] = useState<CaseRecord | null>(null);

  // New case form
  const [newCase, setNewCase] = useState<Omit<CaseRecord, "id">>({ ...EMPTY_CASE, number: genNumber() });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaved, setFormSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  // Orders
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ number: "", date: new Date().toISOString().split("T")[0], title: "", author: "", type: "Внутренний" as Order["type"], signed: false });
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [orderSaved, setOrderSaved] = useState(false);

  // Staff
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({ ...EMPTY_EMPLOYEE });
  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({});
  const [staffSaved, setStaffSaved] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const match = !q || c.number.toLowerCase().includes(q) || c.suspect.toLowerCase().includes(q) ||
        c.investigator.toLowerCase().includes(q) || c.date.includes(q) ||
        c.status.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) ||
        c.article.toLowerCase().includes(q);
      return match && (filterStatus === "Все" || c.status === filterStatus);
    });
  }, [cases, searchQuery, filterStatus]);

  const analytics = useMemo(() => {
    const byStatus = { Активное: 0, Расследование: 0, Приостановлено: 0, Закрыто: 0 } as Record<CaseStatus, number>;
    const byCategory: Record<string, number> = {};
    cases.forEach((c) => {
      byStatus[c.status]++;
      if (c.category) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });
    const closedRate = cases.length === 0 ? 0 : Math.round((byStatus.Закрыто / cases.length) * 100);
    return { total: cases.length, byStatus, byCategory, closedRate };
  }, [cases]);

  const validateCase = (data: Omit<CaseRecord, "id">) => {
    const e: Record<string, string> = {};
    if (!data.number.trim()) e.number = "Введите номер дела";
    if (!data.suspect.trim()) e.suspect = "Введите ФИО подозреваемого";
    if (!data.investigator.trim()) e.investigator = "Введите следователя";
    if (!data.description.trim()) e.description = "Введите описание";
    if (!data.date) e.date = "Выберите дату";
    return e;
  };

  const handleSaveCase = async () => {
    const errs = validateCase(newCase);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const created = { id: String(Date.now()), ...newCase };
    await apiFetch(API.cases, { method: "POST", body: JSON.stringify(created) });
    setCases((prev) => [created, ...prev]);
    setFormSaved(true);
    setTimeout(() => { setFormSaved(false); setActiveTab("database"); setNewCase({ ...EMPTY_CASE, number: genNumber() }); setFormErrors({}); }, 1000);
  };

  const handleUpdateCase = async () => {
    if (!editCase) return;
    const errs = validateCase(editCase);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await apiFetch(API.cases, { method: "PUT", body: JSON.stringify(editCase) });
    setCases((prev) => prev.map((c) => c.id === editCase.id ? editCase : c));
    setEditCase(null); setFormErrors({});
  };

  const handleDeleteCase = async (id: string) => {
    await apiFetch(`${API.cases}?id=${id}`, { method: "DELETE" });
    setCases((prev) => prev.filter((c) => c.id !== id));
    setDeleteCase(null); setViewCase(null);
  };

  const handleQuickStatus = async (id: string, status: CaseStatus) => {
    const c = cases.find((x) => x.id === id);
    if (!c) return;
    const updated = { ...c, status };
    await apiFetch(API.cases, { method: "PUT", body: JSON.stringify(updated) });
    setCases((prev) => prev.map((x) => x.id === id ? updated : x));
    setStatusPopup(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (target === "new") setNewCase((prev) => ({ ...prev, suspectPhoto: result }));
      else if (editCase) setEditCase((prev) => prev ? { ...prev, suspectPhoto: result } : null);
    };
    reader.readAsDataURL(file);
  };

  // Order handlers
  const validateOrder = (d: typeof newOrder) => {
    const e: Record<string, string> = {};
    if (!d.number.trim()) e.number = "Введите номер"; if (!d.title.trim()) e.title = "Введите наименование";
    if (!d.author.trim()) e.author = "Введите автора"; if (!d.date) e.date = "Выберите дату";
    return e;
  };
  const handleSaveOrder = async () => {
    const errs = validateOrder(newOrder); setOrderErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const created = { id: String(Date.now()), ...newOrder };
    await apiFetch(API.orders, { method: "POST", body: JSON.stringify(created) });
    setOrders((prev) => [created, ...prev]);
    setOrderSaved(true);
    setTimeout(() => { setOrderSaved(false); setShowOrderForm(false); setNewOrder({ number: "", date: new Date().toISOString().split("T")[0], title: "", author: "", type: "Внутренний", signed: false }); setOrderErrors({}); }, 1000);
  };
  const handleUpdateOrder = async () => {
    if (!editOrder) return;
    const errs = validateOrder(editOrder); setOrderErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await apiFetch(API.orders, { method: "PUT", body: JSON.stringify(editOrder) });
    setOrders((prev) => prev.map((o) => o.id === editOrder.id ? editOrder : o));
    setEditOrder(null); setOrderErrors({});
  };

  // Staff handlers
  const validateEmployee = (d: Omit<Employee, "id">) => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Введите ФИО"; if (!d.rank.trim()) e.rank = "Введите звание";
    if (!d.position.trim()) e.position = "Введите должность";
    return e;
  };
  const handleSaveEmployee = async () => {
    const errs = validateEmployee(newEmployee); setStaffErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const created = { id: String(Date.now()), ...newEmployee };
    await apiFetch(API.staff, { method: "POST", body: JSON.stringify(created) });
    setStaff((prev) => [created, ...prev]);
    setStaffSaved(true);
    setTimeout(() => { setStaffSaved(false); setShowStaffForm(false); setNewEmployee({ ...EMPTY_EMPLOYEE }); setStaffErrors({}); }, 1000);
  };
  const handleUpdateEmployee = async () => {
    if (!editEmployee) return;
    const errs = validateEmployee(editEmployee); setStaffErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await apiFetch(API.staff, { method: "PUT", body: JSON.stringify(editEmployee) });
    setStaff((prev) => prev.map((e) => e.id === editEmployee.id ? editEmployee : e));
    setEditEmployee(null); setStaffErrors({});
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "database", label: "База данных", icon: "Database" },
    { id: "new-case", label: "Новое дело", icon: "FilePlus" },
    { id: "orders", label: "Приказы", icon: "FileText" },
    { id: "staff", label: "Сотрудники", icon: "Users" },
    { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  ];

  const IS = (err?: string) => ({ background: "hsl(220 22% 13%)", border: `1px solid ${err ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)"}`, color: "hsl(210 20% 85%)" });
  const FE = (msg?: string) => msg ? <span className="text-xs mt-1 block" style={{ color: "hsl(0 70% 55%)" }}>{msg}</span> : null;

  // ── LOGIN ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 25% 8%)" }}>
        <div className="w-full max-w-sm animate-scale-in">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded flex items-center justify-center" style={{ background: "hsl(210 80% 52%)" }}>
              <Icon name="Shield" size={28} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white tracking-wide">МВД РОССИЙСКОЙ ФЕДЕРАЦИИ</div>
              <div className="text-xs mono mt-0.5" style={{ color: "hsl(215 15% 50%)" }}>Автоматизированная информационная система</div>
            </div>
          </div>
          <div className="rounded-lg p-6" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
            <h2 className="text-sm font-semibold mb-5 text-center tracking-widest" style={{ color: "hsl(210 20% 70%)" }}>ВХОД В СИСТЕМУ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ЛОГИН</label>
                <input type="text" placeholder="Введите логин" value={loginForm.login}
                  onChange={(e) => { setLoginForm({ ...loginForm, login: e.target.value }); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS(loginError)}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ПАРОЛЬ</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Введите пароль" value={loginForm.password}
                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full px-3 py-2.5 pr-10 rounded text-sm outline-none" style={IS(loginError)}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }}>
                    <Icon name={showPassword ? "EyeOff" : "Eye"} size={14} />
                  </button>
                </div>
                {loginError && <div className="flex items-center gap-1.5 mt-2"><Icon name="AlertCircle" size={12} style={{ color: "hsl(0 70% 55%)" }} /><span className="text-xs" style={{ color: "hsl(0 70% 55%)" }}>{loginError}</span></div>}
              </div>
              <button onClick={handleLogin} className="w-full py-2.5 rounded text-sm font-medium mt-2 transition-all" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                Войти в систему
              </button>
            </div>
          </div>
          <div className="text-center mt-4 text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>Доступ только для уполномоченных сотрудников</div>
        </div>
      </div>
    );
  }

  // ── PRINT VIEW ────────────────────────────────────────────────────────
  if (printCase) {
    return (
      <div className="min-h-screen bg-white text-black font-sans">
        <div className="no-print flex items-center gap-3 px-6 py-3 border-b" style={{ background: "hsl(220 28% 6%)", borderColor: "hsl(220 18% 14%)" }}>
          <button onClick={() => setPrintCase(null)} className="flex items-center gap-2 text-sm px-4 py-2 rounded" style={{ background: "hsl(220 22% 15%)", color: "hsl(210 20% 80%)" }}>
            <Icon name="ArrowLeft" size={14} />Назад
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 text-sm px-4 py-2 rounded" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
            <Icon name="Printer" size={14} />Печать
          </button>
          <span className="text-xs mono ml-2" style={{ color: "hsl(215 15% 50%)" }}>Предпросмотр печати — 3 страницы</span>
        </div>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          .print-page { max-width: 794px; margin: 0 auto; padding: 48px 60px; min-height: 1123px; border-bottom: 2px dashed #ddd; }
          @media print { .print-page { border: none; padding: 40px 50px; } }
        `}</style>

        {/* Страница 1 — Реквизиты дела */}
        <div className="print-page page-break">
          <div className="text-center mb-10">
            <div className="text-xs tracking-widest mb-1" style={{ color: "#666" }}>МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ РОССИЙСКОЙ ФЕДЕРАЦИИ</div>
            <div className="w-16 h-0.5 bg-black mx-auto my-3"></div>
            <div className="text-2xl font-bold tracking-wide mb-1">УГОЛОВНОЕ ДЕЛО</div>
            <div className="text-xl font-mono font-bold" style={{ color: "#1a3a6b" }}>{printCase.number}</div>
          </div>
          <table className="w-full text-sm border-collapse mb-6">
            <tbody>
              {[
                ["Дата возбуждения", printCase.date],
                ["Категория", printCase.category || "—"],
                ["Статья УК РФ", printCase.article || "—"],
                ["Статус дела", printCase.status],
                ["Следователь", printCase.investigator],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td className="py-2.5 pr-4 font-medium text-xs w-44" style={{ color: "#555" }}>{label}</td>
                  <td className="py-2.5 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 text-xs" style={{ color: "#888" }}>Страница 1 из 3 — Реквизиты дела</div>
        </div>

        {/* Страница 2 — Подозреваемый */}
        <div className="print-page page-break">
          <div className="text-center mb-8">
            <div className="text-xs tracking-widest mb-1" style={{ color: "#666" }}>МВД РФ · Уголовное дело {printCase.number}</div>
            <div className="text-xl font-bold">СВЕДЕНИЯ О ПОДОЗРЕВАЕМОМ</div>
          </div>
          <div className="flex gap-8 mb-6">
            <div className="flex-shrink-0">
              {printCase.suspectPhoto ? (
                <img src={printCase.suspectPhoto} alt="фото" className="w-36 h-44 object-cover border-2 border-gray-300" />
              ) : (
                <div className="w-36 h-44 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">Фото отсутствует</div>
              )}
              <div className="text-center text-xs mt-1 text-gray-500">Фотография</div>
            </div>
            <div className="flex-1">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["ФИО", printCase.suspect],
                    ["Дата рождения", printCase.suspectDob || "—"],
                    ["Адрес", printCase.suspectAddress || "—"],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td className="py-2.5 pr-4 font-medium text-xs w-36" style={{ color: "#555" }}>{label}</td>
                      <td className="py-2.5 font-semibold">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-auto pt-16 text-xs" style={{ color: "#888" }}>Страница 2 из 3 — Сведения о подозреваемом</div>
        </div>

        {/* Страница 3 — Материалы дела */}
        <div className="print-page">
          <div className="text-center mb-8">
            <div className="text-xs tracking-widest mb-1" style={{ color: "#666" }}>МВД РФ · Уголовное дело {printCase.number}</div>
            <div className="text-xl font-bold">МАТЕРИАЛЫ ДЕЛА</div>
          </div>
          <div className="mb-6">
            <div className="font-semibold text-sm mb-2 border-b pb-1">Обстоятельства дела</div>
            <p className="text-sm leading-relaxed" style={{ color: "#333" }}>{printCase.description || "—"}</p>
          </div>
          <div className="mb-6">
            <div className="font-semibold text-sm mb-2 border-b pb-1">Дополнительные материалы</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#333" }}>{printCase.materials || "—"}</p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
            <div><div className="border-t border-black pt-1 text-xs text-gray-500">Следователь: {printCase.investigator}</div></div>
            <div><div className="border-t border-black pt-1 text-xs text-gray-500">Подпись, дата</div></div>
          </div>
          <div className="mt-8 text-xs" style={{ color: "#888" }}>Страница 3 из 3 — Материалы дела</div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(220 25% 8%)" }} onClick={() => setStatusPopup(null)}>
      <header style={{ background: "hsl(220 28% 6%)", borderBottom: "1px solid hsl(220 18% 14%)" }}>
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-center gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "hsl(210 80% 52%)" }}>
                <Icon name="Shield" size={20} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-white tracking-wide text-sm">МВД РОССИЙСКОЙ ФЕДЕРАЦИИ</div>
                <div className="text-xs mono" style={{ color: "hsl(215 15% 50%)" }}>АИС · Автоматизированная информационная система</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs mono" style={{ color: "hsl(215 15% 50%)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>Система активна</span>
              </div>
              <button onClick={() => setAuthed(false)} className="flex items-center gap-2 text-xs mono px-3 py-1.5 rounded transition-all" style={{ background: "hsl(220 22% 11%)", color: "hsl(215 15% 60%)", border: "1px solid hsl(220 18% 18%)" }}>
                <Icon name="LogOut" size={12} />Выход
              </button>
            </div>
          </div>
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`nav-tab flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? "active" : ""}`}
                style={{ color: activeTab === tab.id ? "hsl(210 80% 62%)" : "hsl(215 15% 50%)" }}>
                <Icon name={tab.icon} size={15} />
                {tab.label}
                {tab.id === "database" && cases.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded mono" style={{ background: "hsl(210 80% 52% / 0.15)", color: "hsl(210 80% 62%)" }}>{cases.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3" style={{ color: "hsl(215 15% 45%)" }}>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span className="text-sm mono">Загрузка данных...</span>
            </div>
          </div>
        )}
        {!loading && (<>

        {/* ── DATABASE ── */}
        {activeTab === "database" && (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }} />
                <input type="text" placeholder="Поиск по номеру, ФИО, статье, дате, статусу..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded outline-none mono"
                  style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={14} /></button>}
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 text-sm rounded outline-none" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}>
                <option>Все</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "Все" : s)}
                  className="rounded p-3 text-left transition-all hover:scale-[1.01]"
                  style={{ background: filterStatus === s ? "hsl(220 22% 14%)" : "hsl(220 22% 11%)", border: filterStatus === s ? "1px solid hsl(210 80% 52% / 0.4)" : "1px solid hsl(220 18% 18%)" }}>
                  <div className="text-2xl font-bold mono mb-0.5" style={{ color: "hsl(210 20% 90%)" }}>{analytics.byStatus[s]}</div>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${STATUS_CLASS[s]}`}>
                    <Icon name={STATUS_ICON[s]} size={10} />{s}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                    {["НОМЕР ДЕЛА", "ДАТА", "СТАТЬЯ", "ПОДОЗРЕВАЕМЫЙ", "СЛЕДОВАТЕЛЬ", "СТАТУС", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16" style={{ color: "hsl(215 15% 40%)" }}>
                      <Icon name="FolderOpen" size={36} className="mx-auto mb-3 opacity-30" />
                      <div className="text-sm">{cases.length === 0 ? "База пуста — добавьте первое дело" : "Ничего не найдено"}</div>
                    </td></tr>
                  ) : filteredCases.map((c, i) => (
                    <tr key={c.id} className="table-row-hover cursor-pointer"
                      style={{ background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)", borderBottom: "1px solid hsl(220 18% 16%)" }}
                      onClick={() => setViewCase(c)}>
                      <td className="px-4 py-3 mono font-medium text-xs" style={{ color: "hsl(210 80% 62%)" }}>{c.number}</td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: "hsl(215 15% 60%)" }}>{c.date}</td>
                      <td className="px-4 py-3 text-xs mono" style={{ color: "hsl(215 15% 65%)" }}>{c.article || "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "hsl(210 20% 88%)" }}>{c.suspect}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 65%)" }}>{c.investigator}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setStatusPopup(statusPopup === c.id ? null : c.id); }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer ${STATUS_CLASS[c.status]}`}>
                            <Icon name={STATUS_ICON[c.status]} size={10} />{c.status}
                            <Icon name="ChevronDown" size={10} />
                          </button>
                          {statusPopup === c.id && (
                            <div className="absolute top-full left-0 mt-1 z-30 rounded overflow-hidden shadow-xl animate-scale-in" style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 22%)", minWidth: "150px" }}
                              onClick={(e) => e.stopPropagation()}>
                              {STATUSES.map((s) => (
                                <button key={s} onClick={() => handleQuickStatus(c.id, s)}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-[hsl(220_22%_18%)] ${c.status === s ? "opacity-50" : ""}`}
                                  style={{ color: "hsl(210 20% 80%)" }}>
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${STATUS_CLASS[s]}`}>
                                    <Icon name={STATUS_ICON[s]} size={9} />{s}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setPrintCase(c)} className="p-1.5 rounded" style={{ color: "hsl(142 70% 50%)", background: "hsl(142 70% 45% / 0.1)" }} title="Печать"><Icon name="Printer" size={13} /></button>
                          <button onClick={() => { setEditCase({ ...c }); setFormErrors({}); }} className="p-1.5 rounded" style={{ color: "hsl(210 80% 55%)", background: "hsl(210 80% 52% / 0.1)" }} title="Редактировать"><Icon name="Pencil" size={13} /></button>
                          <button onClick={() => setDeleteCase(c)} className="p-1.5 rounded" style={{ color: "hsl(0 70% 55%)", background: "hsl(0 70% 50% / 0.1)" }} title="Удалить"><Icon name="Trash2" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2" style={{ background: "hsl(220 22% 10%)", borderTop: "1px solid hsl(220 18% 18%)" }}>
                <span className="text-xs mono" style={{ color: "hsl(215 15% 40%)" }}>Показано: {filteredCases.length} из {cases.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW CASE MODAL ── */}
        {viewCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setViewCase(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div><div className="mono text-xs mb-1" style={{ color: "hsl(210 80% 52%)" }}>{viewCase.number}</div>
                  <div className="font-semibold" style={{ color: "hsl(210 20% 92%)" }}>{viewCase.category || "Без категории"}</div></div>
                <button onClick={() => setViewCase(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-2 text-sm">
                {[["Дата", viewCase.date], ["Статья УК РФ", viewCase.article || "—"], ["Подозреваемый", viewCase.suspect], ["Дата рождения", viewCase.suspectDob || "—"], ["Следователь", viewCase.investigator]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2" style={{ borderBottom: "1px solid hsl(220 18% 18%)" }}>
                    <span style={{ color: "hsl(215 15% 45%)" }}>{l}</span>
                    <span style={{ color: "hsl(210 20% 85%)" }}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2" style={{ borderBottom: "1px solid hsl(220 18% 18%)" }}>
                  <span style={{ color: "hsl(215 15% 45%)" }}>Статус</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[viewCase.status]}`}>
                    <Icon name={STATUS_ICON[viewCase.status]} size={10} />{viewCase.status}
                  </span>
                </div>
                <div className="py-2"><div className="text-xs mb-1" style={{ color: "hsl(215 15% 45%)" }}>Описание</div>
                  <div className="text-sm" style={{ color: "hsl(210 20% 78%)" }}>{viewCase.description}</div></div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setPrintCase(viewCase)} className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium" style={{ background: "hsl(142 70% 40%)", color: "white" }}><Icon name="Printer" size={12} />Печать</button>
                <button onClick={() => { setEditCase({ ...viewCase }); setViewCase(null); setFormErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}><Icon name="Pencil" size={12} />Редактировать</button>
                <button onClick={() => { setDeleteCase(viewCase); setViewCase(null); }} className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)", border: "1px solid hsl(0 70% 50% / 0.3)" }}><Icon name="Trash2" size={12} />Удалить</button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT CASE MODAL ── */}
        {editCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditCase(null)}>
            <div className="w-full max-w-2xl rounded-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Редактирование дела</div>
                <button onClick={() => setEditCase(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР *</label>
                    <input value={editCase.number} onChange={(e) => setEditCase({ ...editCase, number: e.target.value })} className="w-full px-3 py-2 rounded text-sm mono outline-none" style={IS(formErrors.number)} />{FE(formErrors.number)}</div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={editCase.date} onChange={(e) => setEditCase({ ...editCase, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(formErrors.date), colorScheme: "dark" }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>КАТЕГОРИЯ</label>
                    <input value={editCase.category} onChange={(e) => setEditCase({ ...editCase, category: e.target.value })} placeholder="Кража, ДТП, Разбой..." className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()} /></div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТЬЯ УК РФ</label>
                    <input value={editCase.article} onChange={(e) => setEditCase({ ...editCase, article: e.target.value })} placeholder="ст. 158 УК РФ" className="w-full px-3 py-2 rounded text-sm mono outline-none" style={IS()} /></div>
                </div>
                <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                  <select value={editCase.status} onChange={(e) => setEditCase({ ...editCase, status: e.target.value as CaseStatus })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select></div>
                <div className="border-t pt-3" style={{ borderColor: "hsl(220 18% 18%)" }}>
                  <div className="text-xs font-medium mb-2 mono" style={{ color: "hsl(215 15% 50%)" }}>ПОДОЗРЕВАЕМЫЙ</div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-24 rounded overflow-hidden mb-1" style={{ background: "hsl(220 25% 8%)", border: "1px solid hsl(220 18% 22%)" }}>
                        {editCase.suspectPhoto ? <img src={editCase.suspectPhoto} alt="фото" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={24} style={{ color: "hsl(215 15% 35%)" }} /></div>}
                      </div>
                      <button onClick={() => editPhotoRef.current?.click()} className="text-xs px-2 py-1 rounded w-full" style={{ background: "hsl(220 22% 16%)", color: "hsl(215 15% 55%)" }}>Фото</button>
                      <input ref={editPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "edit")} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ФИО *</label>
                        <input value={editCase.suspect} onChange={(e) => setEditCase({ ...editCase, suspect: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(formErrors.suspect)} />{FE(formErrors.suspect)}</div>
                      <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА РОЖДЕНИЯ</label>
                        <input type="date" value={editCase.suspectDob} onChange={(e) => setEditCase({ ...editCase, suspectDob: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(), colorScheme: "dark" }} /></div>
                      <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>АДРЕС</label>
                        <input value={editCase.suspectAddress} onChange={(e) => setEditCase({ ...editCase, suspectAddress: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()} /></div>
                    </div>
                  </div>
                </div>
                <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>СЛЕДОВАТЕЛЬ *</label>
                  <input value={editCase.investigator} onChange={(e) => setEditCase({ ...editCase, investigator: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(formErrors.investigator)} />{FE(formErrors.investigator)}</div>
                <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ОПИСАНИЕ *</label>
                  <textarea value={editCase.description} onChange={(e) => setEditCase({ ...editCase, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={IS(formErrors.description)} />{FE(formErrors.description)}</div>
                <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>МАТЕРИАЛЫ ДЕЛА</label>
                  <textarea value={editCase.materials} onChange={(e) => setEditCase({ ...editCase, materials: e.target.value })} rows={3} placeholder="Перечень доказательств, экспертизы, свидетели..." className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={IS()} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateCase} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}><Icon name="Check" size={14} />Сохранить</button>
                <button onClick={() => setEditCase(null)} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE CASE ── */}
        {deleteCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeleteCase(null)}>
            <div className="w-full max-w-sm rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(0 70% 40% / 0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "hsl(0 70% 50% / 0.15)" }}><Icon name="Trash2" size={16} style={{ color: "hsl(0 70% 60%)" }} /></div>
                <div><div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Удалить дело?</div>
                  <div className="text-xs mono" style={{ color: "hsl(210 80% 55%)" }}>{deleteCase.number}</div></div>
              </div>
              <p className="text-xs mb-5" style={{ color: "hsl(215 15% 50%)" }}>Это действие необратимо. Запись будет удалена из базы данных.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteCase(deleteCase.id)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(0 70% 50%)", color: "white" }}><Icon name="Trash2" size={13} />Удалить</button>
                <button onClick={() => setDeleteCase(null)} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW CASE ── */}
        {activeTab === "new-case" && (
          <div className="animate-fade-in max-w-2xl">
            <div className="mb-5">
              <h2 className="text-base font-semibold mb-0.5" style={{ color: "hsl(210 20% 90%)" }}>Регистрация нового дела</h2>
              <p className="text-xs" style={{ color: "hsl(215 15% 45%)" }}>Поля со * обязательны для заполнения</p>
            </div>
            <div className="rounded-lg p-6 space-y-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР ДЕЛА *</label>
                  <input value={newCase.number} onChange={(e) => setNewCase({ ...newCase, number: e.target.value })} placeholder="УД-2024-000001" className="w-full px-3 py-2.5 rounded text-sm mono outline-none" style={IS(formErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.number ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />{FE(formErrors.number)}</div>
                <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА ВОЗБУЖДЕНИЯ *</label>
                  <input type="date" value={newCase.date} onChange={(e) => setNewCase({ ...newCase, date: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={{ ...IS(formErrors.date), colorScheme: "dark" }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>КАТЕГОРИЯ</label>
                  <input value={newCase.category} onChange={(e) => setNewCase({ ...newCase, category: e.target.value })} placeholder="Кража, ДТП, Разбой..." className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS()} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} /></div>
                <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТЬЯ УК РФ</label>
                  <input value={newCase.article} onChange={(e) => setNewCase({ ...newCase, article: e.target.value })} placeholder="ст. 158 ч.1 УК РФ" className="w-full px-3 py-2.5 rounded text-sm mono outline-none" style={IS()} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} /></div>
              </div>
              <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                <select value={newCase.status} onChange={(e) => setNewCase({ ...newCase, status: e.target.value as CaseStatus })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS()}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select></div>

              {/* Подозреваемый */}
              <div className="border-t pt-4" style={{ borderColor: "hsl(220 18% 18%)" }}>
                <div className="text-xs font-semibold mono mb-3" style={{ color: "hsl(215 15% 55%)" }}>ПОДОЗРЕВАЕМЫЙ</div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-28 rounded overflow-hidden mb-2" style={{ background: "hsl(220 25% 8%)", border: "1px solid hsl(220 18% 22%)" }}>
                      {newCase.suspectPhoto ? <img src={newCase.suspectPhoto} alt="фото" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="User" size={28} style={{ color: "hsl(215 15% 35%)" }} /></div>}
                    </div>
                    <button onClick={() => photoRef.current?.click()} className="text-xs px-2 py-1.5 rounded w-full flex items-center justify-center gap-1" style={{ background: "hsl(220 22% 16%)", color: "hsl(215 15% 60%)", border: "1px solid hsl(220 18% 20%)" }}>
                      <Icon name="Camera" size={11} />Фото
                    </button>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "new")} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ФИО *</label>
                      <input type="text" placeholder="Фамилия Имя Отчество" value={newCase.suspect} onChange={(e) => setNewCase({ ...newCase, suspect: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS(formErrors.suspect)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.suspect ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />{FE(formErrors.suspect)}</div>
                    <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА РОЖДЕНИЯ</label>
                      <input type="date" value={newCase.suspectDob} onChange={(e) => setNewCase({ ...newCase, suspectDob: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={{ ...IS(), colorScheme: "dark" }} /></div>
                    <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>АДРЕС</label>
                      <input type="text" placeholder="Адрес регистрации" value={newCase.suspectAddress} onChange={(e) => setNewCase({ ...newCase, suspectAddress: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS()} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} /></div>
                  </div>
                </div>
              </div>

              <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СЛЕДОВАТЕЛЬ *</label>
                <input type="text" placeholder="Звание Фамилия И.О." value={newCase.investigator} onChange={(e) => setNewCase({ ...newCase, investigator: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={IS(formErrors.investigator)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.investigator ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />{FE(formErrors.investigator)}</div>
              <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ОПИСАНИЕ / ОБСТОЯТЕЛЬСТВА ДЕЛА *</label>
                <textarea placeholder="Краткое описание обстоятельств..." value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none" style={IS(formErrors.description)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.description ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />{FE(formErrors.description)}</div>
              <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>МАТЕРИАЛЫ ДЕЛА</label>
                <textarea placeholder="Доказательства, экспертизы, свидетели, протоколы..." value={newCase.materials} onChange={(e) => setNewCase({ ...newCase, materials: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none" style={IS()} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} /></div>

              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleSaveCase} disabled={formSaved} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all disabled:opacity-60" style={{ background: formSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}>
                  <Icon name={formSaved ? "Check" : "Save"} size={14} />{formSaved ? "Зарегистрировано!" : "Зарегистрировать дело"}
                </button>
                <button onClick={() => { setActiveTab("database"); setFormErrors({}); }} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === "orders" && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-base font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Реестр приказов</h2>
                <p className="text-xs mt-0.5" style={{ color: "hsl(215 15% 45%)" }}>Документов: {orders.length}</p></div>
              <button onClick={() => { setShowOrderForm(true); setOrderErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                <Icon name="Plus" size={14} />Добавить приказ
              </button>
            </div>
            {showOrderForm && (
              <div className="rounded-lg p-5 mb-4 animate-fade-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }}>
                <div className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Новый приказ</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР *</label>
                    <input value={newOrder.number} onChange={(e) => setNewOrder({ ...newOrder, number: e.target.value })} placeholder="ПР-2024-0001" className="w-full px-3 py-2 rounded text-sm mono outline-none" style={IS(orderErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(orderErrors.number)}</div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={newOrder.date} onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(orderErrors.date), colorScheme: "dark" }} /></div>
                </div>
                <div className="mb-3"><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НАИМЕНОВАНИЕ *</label>
                  <input value={newOrder.title} onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })} placeholder="Наименование приказа" className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(orderErrors.title)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(orderErrors.title)}</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>АВТОР *</label>
                    <input value={newOrder.author} onChange={(e) => setNewOrder({ ...newOrder, author: e.target.value })} placeholder="Звание Фамилия И.О." className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(orderErrors.author)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(orderErrors.author)}</div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ТИП</label>
                    <select value={newOrder.type} onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as Order["type"] })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()}>
                      {["Внутренний", "Нормативный", "Оперативный"].map((t) => <option key={t}>{t}</option>)}
                    </select></div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                    <select value={newOrder.signed ? "Подписан" : "На подписи"} onChange={(e) => setNewOrder({ ...newOrder, signed: e.target.value === "Подписан" })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()}>
                      <option>На подписи</option><option>Подписан</option>
                    </select></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveOrder} disabled={orderSaved} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: orderSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}>
                    <Icon name={orderSaved ? "Check" : "Save"} size={13} />{orderSaved ? "Сохранено!" : "Добавить"}
                  </button>
                  <button onClick={() => { setShowOrderForm(false); setOrderErrors({}); }} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
                </div>
              </div>
            )}
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                  {["НОМЕР", "ДАТА", "НАИМЕНОВАНИЕ", "АВТОР", "ТИП", "СТАТУС", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16" style={{ color: "hsl(215 15% 40%)" }}>
                      <Icon name="FileX" size={36} className="mx-auto mb-3 opacity-30" /><div className="text-sm">Нет приказов — добавьте первый</div>
                    </td></tr>
                  ) : orders.map((o, i) => (
                    <tr key={o.id} className="table-row-hover" style={{ background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)", borderBottom: "1px solid hsl(220 18% 16%)" }}>
                      <td className="px-4 py-3 mono text-xs font-medium" style={{ color: "hsl(210 80% 62%)" }}>{o.number}</td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.date}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 20% 85%)" }}>{o.title}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.author}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: o.type === "Нормативный" ? "rgba(99,102,241,0.15)" : o.type === "Оперативный" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)", color: o.type === "Нормативный" ? "#818cf8" : o.type === "Оперативный" ? "#f59e0b" : "#9ca3af", border: `1px solid ${o.type === "Нормативный" ? "rgba(99,102,241,0.3)" : o.type === "Оперативный" ? "rgba(245,158,11,0.25)" : "rgba(107,114,128,0.2)"}` }}>{o.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${o.signed ? "status-active" : "status-investigation"}`}>
                          <Icon name={o.signed ? "CheckCircle" : "Clock"} size={10} />{o.signed ? "Подписан" : "На подписи"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditOrder({ ...o }); setOrderErrors({}); }} className="p-1.5 rounded" style={{ color: "hsl(210 80% 55%)", background: "hsl(210 80% 52% / 0.1)" }}><Icon name="Pencil" size={13} /></button>
                          <button onClick={() => setDeleteOrder(o)} className="p-1.5 rounded" style={{ color: "hsl(0 70% 55%)", background: "hsl(0 70% 50% / 0.1)" }}><Icon name="Trash2" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EDIT ORDER ── */}
        {editOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditOrder(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Редактирование приказа</div>
                <button onClick={() => setEditOrder(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР *</label>
                    <input value={editOrder.number} onChange={(e) => setEditOrder({ ...editOrder, number: e.target.value })} className="w-full px-3 py-2 rounded text-sm mono outline-none" style={IS(orderErrors.number)} />{FE(orderErrors.number)}</div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={editOrder.date} onChange={(e) => setEditOrder({ ...editOrder, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(), colorScheme: "dark" }} /></div>
                </div>
                <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>НАИМЕНОВАНИЕ *</label>
                  <input value={editOrder.title} onChange={(e) => setEditOrder({ ...editOrder, title: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(orderErrors.title)} />{FE(orderErrors.title)}</div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>АВТОР *</label>
                    <input value={editOrder.author} onChange={(e) => setEditOrder({ ...editOrder, author: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(orderErrors.author)} />{FE(orderErrors.author)}</div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ТИП</label>
                    <select value={editOrder.type} onChange={(e) => setEditOrder({ ...editOrder, type: e.target.value as Order["type"] })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()}>
                      {["Внутренний", "Нормативный", "Оперативный"].map((t) => <option key={t}>{t}</option>)}
                    </select></div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                    <select value={editOrder.signed ? "Подписан" : "На подписи"} onChange={(e) => setEditOrder({ ...editOrder, signed: e.target.value === "Подписан" })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()}>
                      <option>На подписи</option><option>Подписан</option>
                    </select></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateOrder} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}><Icon name="Check" size={14} />Сохранить</button>
                <button onClick={() => setEditOrder(null)} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {deleteOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeleteOrder(null)}>
            <div className="w-full max-w-sm rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(0 70% 40% / 0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "hsl(0 70% 50% / 0.15)" }}><Icon name="Trash2" size={16} style={{ color: "hsl(0 70% 60%)" }} /></div>
                <div><div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Удалить приказ?</div>
                  <div className="text-xs mono" style={{ color: "hsl(210 80% 55%)" }}>{deleteOrder.number}</div></div>
              </div>
              <p className="text-xs mb-5" style={{ color: "hsl(215 15% 50%)" }}>Документ будет удалён из реестра.</p>
              <div className="flex gap-2">
                <button onClick={async () => { await apiFetch(`${API.orders}?id=${deleteOrder.id}`, { method: "DELETE" }); setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id)); setDeleteOrder(null); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(0 70% 50%)", color: "white" }}><Icon name="Trash2" size={13} />Удалить</button>
                <button onClick={() => setDeleteOrder(null)} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STAFF ── */}
        {activeTab === "staff" && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-base font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Личный состав</h2>
                <p className="text-xs mt-0.5" style={{ color: "hsl(215 15% 45%)" }}>Сотрудников: {staff.length}</p></div>
              <button onClick={() => { setShowStaffForm(true); setStaffErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                <Icon name="UserPlus" size={14} />Добавить сотрудника
              </button>
            </div>

            {showStaffForm && (
              <div className="rounded-lg p-5 mb-4 animate-fade-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }}>
                <div className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Новый сотрудник</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ФИО *</label>
                    <input value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Фамилия Имя Отчество" className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.name)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(staffErrors.name)}</div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ЗВАНИЕ *</label>
                    <input value={newEmployee.rank} onChange={(e) => setNewEmployee({ ...newEmployee, rank: e.target.value })} placeholder="Майор, Лейтенант..." className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.rank)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(staffErrors.rank)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДОЛЖНОСТЬ *</label>
                    <input value={newEmployee.position} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} placeholder="Следователь, Участковый..." className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.position)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} />{FE(staffErrors.position)}</div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ОТДЕЛ</label>
                    <input value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} placeholder="Отдел уголовного розыска" className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ТЕЛЕФОН</label>
                    <input value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} placeholder="+7 (000) 000-00-00" className="w-full px-3 py-2 rounded text-sm outline-none mono" style={IS()} /></div>
                  <div><label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>В ДОЛЖНОСТИ С</label>
                    <input type="date" value={newEmployee.since} onChange={(e) => setNewEmployee({ ...newEmployee, since: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(), colorScheme: "dark" }} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEmployee} disabled={staffSaved} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: staffSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}>
                    <Icon name={staffSaved ? "Check" : "UserPlus"} size={13} />{staffSaved ? "Добавлен!" : "Добавить"}
                  </button>
                  <button onClick={() => { setShowStaffForm(false); setStaffErrors({}); }} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
                </div>
              </div>
            )}

            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                  {["ФИО", "ЗВАНИЕ", "ДОЛЖНОСТЬ", "ОТДЕЛ", "ТЕЛЕФОН", "В ДОЛ. С", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16" style={{ color: "hsl(215 15% 40%)" }}>
                      <Icon name="Users" size={36} className="mx-auto mb-3 opacity-30" /><div className="text-sm">Личный состав не добавлен</div>
                    </td></tr>
                  ) : staff.map((e, i) => (
                    <tr key={e.id} className="table-row-hover" style={{ background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)", borderBottom: "1px solid hsl(220 18% 16%)" }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "hsl(210 20% 88%)" }}>{e.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 80% 62%)" }}>{e.rank}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 20% 80%)" }}>{e.position}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 60%)" }}>{e.department || "—"}</td>
                      <td className="px-4 py-3 text-xs mono" style={{ color: "hsl(215 15% 60%)" }}>{e.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs mono" style={{ color: "hsl(215 15% 55%)" }}>{e.since}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditEmployee({ ...e }); setStaffErrors({}); }} className="p-1.5 rounded" style={{ color: "hsl(210 80% 55%)", background: "hsl(210 80% 52% / 0.1)" }}><Icon name="Pencil" size={13} /></button>
                          <button onClick={() => setDeleteEmployee(e)} className="p-1.5 rounded" style={{ color: "hsl(0 70% 55%)", background: "hsl(0 70% 50% / 0.1)" }}><Icon name="Trash2" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EDIT EMPLOYEE ── */}
        {editEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditEmployee(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Редактирование сотрудника</div>
                <button onClick={() => setEditEmployee(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ФИО *</label>
                    <input value={editEmployee.name} onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.name)} />{FE(staffErrors.name)}</div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ЗВАНИЕ *</label>
                    <input value={editEmployee.rank} onChange={(e) => setEditEmployee({ ...editEmployee, rank: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.rank)} />{FE(staffErrors.rank)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ДОЛЖНОСТЬ *</label>
                    <input value={editEmployee.position} onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS(staffErrors.position)} />{FE(staffErrors.position)}</div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ОТДЕЛ</label>
                    <input value={editEmployee.department} onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={IS()} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>ТЕЛЕФОН</label>
                    <input value={editEmployee.phone} onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })} className="w-full px-3 py-2 rounded text-sm mono outline-none" style={IS()} /></div>
                  <div><label className="block text-xs mb-1 mono" style={{ color: "hsl(215 15% 50%)" }}>В ДОЛ. С</label>
                    <input type="date" value={editEmployee.since} onChange={(e) => setEditEmployee({ ...editEmployee, since: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...IS(), colorScheme: "dark" }} /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateEmployee} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}><Icon name="Check" size={14} />Сохранить</button>
                <button onClick={() => setEditEmployee(null)} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {deleteEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeleteEmployee(null)}>
            <div className="w-full max-w-sm rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(0 70% 40% / 0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "hsl(0 70% 50% / 0.15)" }}><Icon name="UserMinus" size={16} style={{ color: "hsl(0 70% 60%)" }} /></div>
                <div><div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Удалить сотрудника?</div>
                  <div className="text-xs" style={{ color: "hsl(215 15% 55%)" }}>{deleteEmployee.name}</div></div>
              </div>
              <p className="text-xs mb-5" style={{ color: "hsl(215 15% 50%)" }}>Запись будет удалена из списка личного состава.</p>
              <div className="flex gap-2">
                <button onClick={async () => { await apiFetch(`${API.staff}?id=${deleteEmployee.id}`, { method: "DELETE" }); setStaff((prev) => prev.filter((e) => e.id !== deleteEmployee.id)); setDeleteEmployee(null); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(0 70% 50%)", color: "white" }}><Icon name="Trash2" size={13} />Удалить</button>
                <button onClick={() => setDeleteEmployee(null)} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === "analytics" && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h2 className="text-base font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Аналитика и статистика</h2>
              <p className="text-xs mt-0.5" style={{ color: "hsl(215 15% 45%)" }}>Сводные данные по всем зарегистрированным делам</p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Всего дел", value: analytics.total, icon: "Folder", color: "hsl(210 80% 52%)" },
                { label: "Раскрываемость", value: `${analytics.closedRate}%`, icon: "TrendingUp", color: "hsl(142 70% 45%)" },
                { label: "Активных", value: analytics.byStatus.Активное + analytics.byStatus.Расследование, icon: "AlertCircle", color: "hsl(38 90% 50%)" },
                { label: "Сотрудников", value: staff.length, icon: "Users", color: "hsl(280 70% 60%)" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: "hsl(215 15% 45%)" }}>{label}</span>
                    <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Icon name={icon} size={14} style={{ color }} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mono" style={{ color: "hsl(210 20% 92%)" }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                <h3 className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>По категориям преступлений</h3>
                {Object.keys(analytics.byCategory).length === 0 ? (
                  <div className="text-xs text-center py-8" style={{ color: "hsl(215 15% 40%)" }}>Нет данных</div>
                ) : Object.entries(analytics.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                  const pct = Math.round((count / analytics.total) * 100);
                  return (
                    <div key={cat} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "hsl(210 20% 78%)" }}>{cat}</span>
                        <span className="mono" style={{ color: "hsl(210 80% 62%)" }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 18% 18%)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(210 80% 52%)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                <h3 className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Распределение по статусам</h3>
                <div className="grid grid-cols-2 gap-3">
                  {STATUSES.map((s) => {
                    const count = analytics.byStatus[s];
                    const pct = analytics.total === 0 ? 0 : Math.round((count / analytics.total) * 100);
                    return (
                      <div key={s} className="text-center p-3 rounded" style={{ background: "hsl(220 25% 8%)" }}>
                        <div className="text-2xl font-bold mono mb-1" style={{ color: "hsl(210 20% 90%)" }}>{count}</div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[s]}`}>
                          <Icon name={STATUS_ICON[s]} size={10} />{s}
                        </span>
                        <div className="text-xs mono mt-1.5" style={{ color: "hsl(215 15% 40%)" }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        </>)}
      </main>

      <footer className="py-3 px-6" style={{ borderTop: "1px solid hsl(220 18% 14%)", background: "hsl(220 28% 6%)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <span className="text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>АИС МВД · v1.1 · Для служебного пользования</span>
          <span className="text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>© {new Date().getFullYear()} МВД РФ</span>
        </div>
      </footer>
    </div>
  );
}