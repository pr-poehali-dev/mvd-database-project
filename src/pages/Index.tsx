import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";

type CaseStatus = "Активное" | "Расследование" | "Приостановлено" | "Закрыто";
type CaseCategory = "Кража" | "Мошенничество" | "Хулиганство" | "ДТП" | "Разбой" | "Наркотики";

interface CaseRecord {
  id: string;
  number: string;
  date: string;
  category: CaseCategory;
  suspect: string;
  investigator: string;
  status: CaseStatus;
  description: string;
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

type Tab = "database" | "new-case" | "orders" | "analytics";

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

const EMPTY_CASE = {
  number: "",
  date: new Date().toISOString().split("T")[0],
  category: "Кража" as CaseCategory,
  suspect: "",
  investigator: "",
  description: "",
  status: "Активное" as CaseStatus,
};

function genNumber() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 900000) + 100000);
  return `УД-${year}-${n}`;
}

// Верификация логин/пароль
const CREDENTIALS = { login: "admin", password: "mvd2024" };

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

  // Modal state
  const [viewCase, setViewCase] = useState<CaseRecord | null>(null);
  const [editCase, setEditCase] = useState<CaseRecord | null>(null);
  const [deleteCase, setDeleteCase] = useState<CaseRecord | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  // New case form
  const [newCase, setNewCase] = useState({ ...EMPTY_CASE, number: genNumber() });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaved, setFormSaved] = useState(false);

  // New order form
  const [newOrder, setNewOrder] = useState({
    number: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    author: "",
    type: "Внутренний" as Order["type"],
    signed: false,
  });
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [orderSaved, setOrderSaved] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Edit order
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.number.toLowerCase().includes(q) ||
        c.suspect.toLowerCase().includes(q) ||
        c.investigator.toLowerCase().includes(q) ||
        c.date.includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchStatus = filterStatus === "Все" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [cases, searchQuery, filterStatus]);

  const analytics = useMemo(() => {
    const total = cases.length || 1;
    const byStatus = {
      Активное: cases.filter((c) => c.status === "Активное").length,
      Расследование: cases.filter((c) => c.status === "Расследование").length,
      Приостановлено: cases.filter((c) => c.status === "Приостановлено").length,
      Закрыто: cases.filter((c) => c.status === "Закрыто").length,
    };
    const byCategory = {} as Record<string, number>;
    cases.forEach((c) => { byCategory[c.category] = (byCategory[c.category] || 0) + 1; });
    const closedRate = cases.length === 0 ? 0 : Math.round((byStatus.Закрыто / cases.length) * 100);
    return { total: cases.length, byStatus, byCategory, closedRate };
  }, [cases]);

  // Validate new case
  const validateCase = (data: typeof newCase) => {
    const errs: Record<string, string> = {};
    if (!data.number.trim()) errs.number = "Введите номер дела";
    if (!data.suspect.trim()) errs.suspect = "Введите ФИО подозреваемого";
    if (!data.investigator.trim()) errs.investigator = "Введите следователя";
    if (!data.description.trim()) errs.description = "Введите описание";
    if (!data.date) errs.date = "Выберите дату";
    return errs;
  };

  const handleSaveCase = () => {
    const errs = validateCase(newCase);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const created: CaseRecord = { id: String(Date.now()), ...newCase };
    setCases((prev) => [created, ...prev]);
    setFormSaved(true);
    setTimeout(() => {
      setFormSaved(false);
      setActiveTab("database");
      setNewCase({ ...EMPTY_CASE, number: genNumber() });
      setFormErrors({});
    }, 1000);
  };

  const handleUpdateCase = () => {
    if (!editCase) return;
    const errs = validateCase(editCase);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCases((prev) => prev.map((c) => c.id === editCase.id ? editCase : c));
    setEditCase(null);
    setFormErrors({});
  };

  const handleDeleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    setDeleteCase(null);
    setViewCase(null);
  };

  // Validate order
  const validateOrder = (data: typeof newOrder) => {
    const errs: Record<string, string> = {};
    if (!data.number.trim()) errs.number = "Введите номер приказа";
    if (!data.title.trim()) errs.title = "Введите наименование";
    if (!data.author.trim()) errs.author = "Введите автора";
    if (!data.date) errs.date = "Выберите дату";
    return errs;
  };

  const handleSaveOrder = () => {
    const errs = validateOrder(newOrder);
    setOrderErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const created: Order = { id: String(Date.now()), ...newOrder };
    setOrders((prev) => [created, ...prev]);
    setOrderSaved(true);
    setTimeout(() => {
      setOrderSaved(false);
      setShowOrderForm(false);
      setNewOrder({ number: "", date: new Date().toISOString().split("T")[0], title: "", author: "", type: "Внутренний", signed: false });
      setOrderErrors({});
    }, 1000);
  };

  const handleUpdateOrder = () => {
    if (!editOrder) return;
    const errs = validateOrder(editOrder);
    setOrderErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setOrders((prev) => prev.map((o) => o.id === editOrder.id ? editOrder : o));
    setEditOrder(null);
    setOrderErrors({});
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setDeleteOrder(null);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "database", label: "База данных", icon: "Database" },
    { id: "new-case", label: "Новое дело", icon: "FilePlus" },
    { id: "orders", label: "Приказы", icon: "FileText" },
    { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  ];

  const inputStyle = (err?: string) => ({
    background: "hsl(220 22% 13%)",
    border: `1px solid ${err ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)"}`,
    color: "hsl(210 20% 85%)",
  });

  const fieldErr = (msg?: string) => msg ? (
    <span className="text-xs mt-1 block" style={{ color: "hsl(0 70% 55%)" }}>{msg}</span>
  ) : null;

  // LOGIN SCREEN
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 25% 8%)" }}>
        <div className="w-full max-w-sm animate-scale-in">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: "hsl(210 80% 52%)" }}>
              <Icon name="Shield" size={24} className="text-white" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white tracking-wide text-sm">МВД РОССИЙСКОЙ ФЕДЕРАЦИИ</div>
              <div className="text-xs mono" style={{ color: "hsl(215 15% 50%)" }}>Автоматизированная информационная система</div>
            </div>
          </div>

          <div className="rounded-lg p-6" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
            <h2 className="text-sm font-semibold mb-5 text-center" style={{ color: "hsl(210 20% 80%)" }}>ВХОД В СИСТЕМУ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ЛОГИН</label>
                <input
                  type="text"
                  placeholder="Введите логин"
                  value={loginForm.login}
                  onChange={(e) => { setLoginForm({ ...loginForm, login: e.target.value }); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none"
                  style={inputStyle(loginError ? " " : "")}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = loginError ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ПАРОЛЬ</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={loginForm.password}
                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full px-3 py-2.5 pr-10 rounded text-sm outline-none"
                    style={inputStyle(loginError ? " " : "")}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                    onBlur={(e) => (e.target.style.borderColor = loginError ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(215 15% 45%)" }}
                  >
                    <Icon name={showPassword ? "EyeOff" : "Eye"} size={14} />
                  </button>
                </div>
                {loginError && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Icon name="AlertCircle" size={12} style={{ color: "hsl(0 70% 55%)" }} />
                    <span className="text-xs" style={{ color: "hsl(0 70% 55%)" }}>{loginError}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-2.5 rounded text-sm font-medium mt-2 transition-all"
                style={{ background: "hsl(210 80% 52%)", color: "white" }}
              >
                Войти в систему
              </button>
            </div>
          </div>
          <div className="text-center mt-4 text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>
            Доступ только для уполномоченных сотрудников
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(220 25% 8%)" }}>
      {/* Header */}
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
              <button
                onClick={() => setAuthed(false)}
                className="flex items-center gap-2 text-xs mono px-3 py-1.5 rounded transition-all"
                style={{ background: "hsl(220 22% 11%)", color: "hsl(215 15% 60%)", border: "1px solid hsl(220 18% 18%)" }}
              >
                <Icon name="LogOut" size={12} />
                Выход
              </button>
            </div>
          </div>

          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? "active" : ""}`}
                style={{ color: activeTab === tab.id ? "hsl(210 80% 62%)" : "hsl(215 15% 50%)" }}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
                {tab.id === "database" && cases.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded mono" style={{ background: "hsl(210 80% 52% / 0.15)", color: "hsl(210 80% 62%)" }}>
                    {cases.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }} />
                <input
                  type="text"
                  placeholder="Поиск по номеру, фамилии, дате, статусу, категории..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded outline-none mono"
                  style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }}>
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 text-sm rounded outline-none"
                style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
              >
                <option>Все</option>
                <option>Активное</option>
                <option>Расследование</option>
                <option>Приостановлено</option>
                <option>Закрыто</option>
              </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(["Активное", "Расследование", "Приостановлено", "Закрыто"] as CaseStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "Все" : s)}
                  className="rounded p-3 text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: filterStatus === s ? "hsl(220 22% 14%)" : "hsl(220 22% 11%)",
                    border: filterStatus === s ? "1px solid hsl(210 80% 52% / 0.4)" : "1px solid hsl(220 18% 18%)",
                  }}
                >
                  <div className="text-2xl font-bold mono mb-0.5" style={{ color: "hsl(210 20% 90%)" }}>
                    {analytics.byStatus[s]}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${STATUS_CLASS[s]}`}>
                    <Icon name={STATUS_ICON[s]} size={10} />
                    {s}
                  </div>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                    {["НОМЕР ДЕЛА", "ДАТА", "КАТЕГОРИЯ", "ПОДОЗРЕВАЕМЫЙ", "СЛЕДОВАТЕЛЬ", "СТАТУС", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16" style={{ color: "hsl(215 15% 40%)" }}>
                        <Icon name="FolderOpen" size={36} className="mx-auto mb-3 opacity-30" />
                        <div className="text-sm">{cases.length === 0 ? "База данных пуста — добавьте первое дело" : "Записи не найдены"}</div>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c, i) => (
                      <tr
                        key={c.id}
                        className="table-row-hover cursor-pointer"
                        style={{
                          background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)",
                          borderBottom: "1px solid hsl(220 18% 16%)",
                        }}
                        onClick={() => setViewCase(c)}
                      >
                        <td className="px-4 py-3 mono font-medium text-xs" style={{ color: "hsl(210 80% 62%)" }}>{c.number}</td>
                        <td className="px-4 py-3 mono text-xs" style={{ color: "hsl(215 15% 60%)" }}>{c.date}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 20% 80%)" }}>{c.category}</td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: "hsl(210 20% 88%)" }}>{c.suspect}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 65%)" }}>{c.investigator}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[c.status]}`}>
                            <Icon name={STATUS_ICON[c.status]} size={10} />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setEditCase({ ...c }); setFormErrors({}); }}
                              className="p-1.5 rounded transition-all"
                              style={{ color: "hsl(210 80% 55%)", background: "hsl(210 80% 52% / 0.1)" }}
                              title="Редактировать"
                            >
                              <Icon name="Pencil" size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteCase(c)}
                              className="p-1.5 rounded transition-all"
                              style={{ color: "hsl(0 70% 55%)", background: "hsl(0 70% 50% / 0.1)" }}
                              title="Удалить"
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2" style={{ background: "hsl(220 22% 10%)", borderTop: "1px solid hsl(220 18% 18%)" }}>
                <span className="text-xs mono" style={{ color: "hsl(215 15% 40%)" }}>
                  Показано: {filteredCases.length} из {cases.length} записей
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW CASE MODAL */}
        {viewCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setViewCase(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="mono text-xs mb-1" style={{ color: "hsl(210 80% 52%)" }}>{viewCase.number}</div>
                  <div className="font-semibold text-base" style={{ color: "hsl(210 20% 92%)" }}>{viewCase.category}</div>
                </div>
                <button onClick={() => setViewCase(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3 text-sm">
                {([["Дата", viewCase.date, true], ["Подозреваемый", viewCase.suspect, false], ["Следователь", viewCase.investigator, false]] as [string, string, boolean][]).map(([label, value, mono]) => (
                  <div key={label} className="flex justify-between" style={{ borderBottom: "1px solid hsl(220 18% 18%)", paddingBottom: "8px" }}>
                    <span style={{ color: "hsl(215 15% 45%)" }}>{label}</span>
                    <span className={mono ? "mono" : ""} style={{ color: "hsl(210 20% 85%)" }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between" style={{ borderBottom: "1px solid hsl(220 18% 18%)", paddingBottom: "8px" }}>
                  <span style={{ color: "hsl(215 15% 45%)" }}>Статус</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[viewCase.status]}`}>
                    <Icon name={STATUS_ICON[viewCase.status]} size={10} />{viewCase.status}
                  </span>
                </div>
                <div>
                  <div className="mb-1 text-xs" style={{ color: "hsl(215 15% 45%)" }}>Описание</div>
                  <div style={{ color: "hsl(210 20% 78%)" }}>{viewCase.description}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEditCase({ ...viewCase }); setViewCase(null); setFormErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                  <Icon name="Pencil" size={12} />Редактировать
                </button>
                <button onClick={() => { setDeleteCase(viewCase); setViewCase(null); }} className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)", border: "1px solid hsl(0 70% 50% / 0.3)" }}>
                  <Icon name="Trash2" size={12} />Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT CASE MODAL */}
        {editCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditCase(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Редактирование дела</div>
                <button onClick={() => setEditCase(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР ДЕЛА *</label>
                    <input value={editCase.number} onChange={(e) => setEditCase({ ...editCase, number: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none mono" style={inputStyle(formErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.number ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                    {fieldErr(formErrors.number)}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={editCase.date} onChange={(e) => setEditCase({ ...editCase, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...inputStyle(formErrors.date), colorScheme: "dark" }} />
                    {fieldErr(formErrors.date)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>КАТЕГОРИЯ</label>
                    <select value={editCase.category} onChange={(e) => setEditCase({ ...editCase, category: e.target.value as CaseCategory })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      {["Кража", "Мошенничество", "Хулиганство", "ДТП", "Разбой", "Наркотики"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                    <select value={editCase.status} onChange={(e) => setEditCase({ ...editCase, status: e.target.value as CaseStatus })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      {["Активное", "Расследование", "Приостановлено", "Закрыто"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ПОДОЗРЕВАЕМЫЙ *</label>
                  <input value={editCase.suspect} onChange={(e) => setEditCase({ ...editCase, suspect: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(formErrors.suspect)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.suspect ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(formErrors.suspect)}
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СЛЕДОВАТЕЛЬ *</label>
                  <input value={editCase.investigator} onChange={(e) => setEditCase({ ...editCase, investigator: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(formErrors.investigator)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.investigator ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(formErrors.investigator)}
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ОПИСАНИЕ *</label>
                  <textarea value={editCase.description} onChange={(e) => setEditCase({ ...editCase, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={inputStyle(formErrors.description)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.description ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(formErrors.description)}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateCase} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                  <Icon name="Check" size={14} />Сохранить
                </button>
                <button onClick={() => setEditCase(null)} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CASE CONFIRM */}
        {deleteCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeleteCase(null)}>
            <div className="w-full max-w-sm rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(0 70% 40% / 0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "hsl(0 70% 50% / 0.15)" }}>
                  <Icon name="Trash2" size={16} style={{ color: "hsl(0 70% 60%)" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Удалить дело?</div>
                  <div className="text-xs mono" style={{ color: "hsl(210 80% 55%)" }}>{deleteCase.number}</div>
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: "hsl(215 15% 50%)" }}>Это действие необратимо. Запись будет удалена из базы данных.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteCase(deleteCase.id)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(0 70% 50%)", color: "white" }}>
                  <Icon name="Trash2" size={13} />Удалить
                </button>
                <button onClick={() => setDeleteCase(null)} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW CASE TAB */}
        {activeTab === "new-case" && (
          <div className="animate-fade-in max-w-2xl">
            <div className="mb-5">
              <h2 className="text-base font-semibold mb-0.5" style={{ color: "hsl(210 20% 90%)" }}>Регистрация нового дела</h2>
              <p className="text-xs" style={{ color: "hsl(215 15% 45%)" }}>Поля, отмеченные * обязательны для заполнения</p>
            </div>
            <div className="rounded-lg p-6 space-y-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР ДЕЛА *</label>
                  <input value={newCase.number} onChange={(e) => setNewCase({ ...newCase, number: e.target.value })} placeholder="УД-2024-000001" className="w-full px-3 py-2.5 rounded text-sm mono outline-none" style={inputStyle(formErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.number ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(formErrors.number)}
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА ВОЗБУЖДЕНИЯ *</label>
                  <input type="date" value={newCase.date} onChange={(e) => setNewCase({ ...newCase, date: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={{ ...inputStyle(formErrors.date), colorScheme: "dark" }} />
                  {fieldErr(formErrors.date)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>КАТЕГОРИЯ</label>
                  <select value={newCase.category} onChange={(e) => setNewCase({ ...newCase, category: e.target.value as CaseCategory })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={inputStyle()}>
                    {["Кража", "Мошенничество", "Хулиганство", "ДТП", "Разбой", "Наркотики"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                  <select value={newCase.status} onChange={(e) => setNewCase({ ...newCase, status: e.target.value as CaseStatus })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={inputStyle()}>
                    {["Активное", "Расследование", "Приостановлено", "Закрыто"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ПОДОЗРЕВАЕМЫЙ (ФИО) *</label>
                <input type="text" placeholder="Фамилия Имя Отчество" value={newCase.suspect} onChange={(e) => setNewCase({ ...newCase, suspect: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={inputStyle(formErrors.suspect)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.suspect ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                {fieldErr(formErrors.suspect)}
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СЛЕДОВАТЕЛЬ *</label>
                <input type="text" placeholder="Звание Фамилия И.О." value={newCase.investigator} onChange={(e) => setNewCase({ ...newCase, investigator: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm outline-none" style={inputStyle(formErrors.investigator)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.investigator ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                {fieldErr(formErrors.investigator)}
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ОПИСАНИЕ *</label>
                <textarea placeholder="Краткое описание обстоятельств дела..." value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none" style={inputStyle(formErrors.description)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = formErrors.description ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                {fieldErr(formErrors.description)}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleSaveCase} disabled={formSaved} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all disabled:opacity-60" style={{ background: formSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}>
                  <Icon name={formSaved ? "Check" : "Save"} size={14} />
                  {formSaved ? "Зарегистрировано!" : "Зарегистрировать дело"}
                </button>
                <button onClick={() => { setActiveTab("database"); setFormErrors({}); }} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Реестр приказов</h2>
                <p className="text-xs mt-0.5" style={{ color: "hsl(215 15% 45%)" }}>Всего документов: {orders.length}</p>
              </div>
              <button onClick={() => { setShowOrderForm(true); setOrderErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                <Icon name="Plus" size={14} />Добавить приказ
              </button>
            </div>

            {/* Add order form */}
            {showOrderForm && (
              <div className="rounded-lg p-5 mb-4 animate-fade-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }}>
                <div className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Новый приказ</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР *</label>
                    <input value={newOrder.number} onChange={(e) => setNewOrder({ ...newOrder, number: e.target.value })} placeholder="ПР-2024-0001" className="w-full px-3 py-2 rounded text-sm mono outline-none" style={inputStyle(orderErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.number ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                    {fieldErr(orderErrors.number)}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={newOrder.date} onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...inputStyle(orderErrors.date), colorScheme: "dark" }} />
                    {fieldErr(orderErrors.date)}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НАИМЕНОВАНИЕ *</label>
                  <input value={newOrder.title} onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })} placeholder="Наименование приказа" className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(orderErrors.title)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.title ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(orderErrors.title)}
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>АВТОР *</label>
                    <input value={newOrder.author} onChange={(e) => setNewOrder({ ...newOrder, author: e.target.value })} placeholder="Звание Фамилия И.О." className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(orderErrors.author)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.author ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                    {fieldErr(orderErrors.author)}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ТИП</label>
                    <select value={newOrder.type} onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as Order["type"] })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      {["Внутренний", "Нормативный", "Оперативный"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                    <select value={newOrder.signed ? "Подписан" : "На подписи"} onChange={(e) => setNewOrder({ ...newOrder, signed: e.target.value === "Подписан" })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      <option>На подписи</option>
                      <option>Подписан</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveOrder} disabled={orderSaved} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: orderSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}>
                    <Icon name={orderSaved ? "Check" : "Save"} size={13} />{orderSaved ? "Сохранено!" : "Добавить"}
                  </button>
                  <button onClick={() => { setShowOrderForm(false); setOrderErrors({}); }} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                    {["НОМЕР", "ДАТА", "НАИМЕНОВАНИЕ", "АВТОР", "ТИП", "СТАТУС", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16" style={{ color: "hsl(215 15% 40%)" }}>
                        <Icon name="FileX" size={36} className="mx-auto mb-3 opacity-30" />
                        <div className="text-sm">Нет приказов — добавьте первый</div>
                      </td>
                    </tr>
                  ) : orders.map((o, i) => (
                    <tr key={o.id} className="table-row-hover" style={{ background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)", borderBottom: "1px solid hsl(220 18% 16%)" }}>
                      <td className="px-4 py-3 mono text-xs font-medium" style={{ color: "hsl(210 80% 62%)" }}>{o.number}</td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.date}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 20% 85%)" }}>{o.title}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.author}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{
                          background: o.type === "Нормативный" ? "rgba(99,102,241,0.15)" : o.type === "Оперативный" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)",
                          color: o.type === "Нормативный" ? "#818cf8" : o.type === "Оперативный" ? "#f59e0b" : "#9ca3af",
                          border: `1px solid ${o.type === "Нормативный" ? "rgba(99,102,241,0.3)" : o.type === "Оперативный" ? "rgba(245,158,11,0.25)" : "rgba(107,114,128,0.2)"}`,
                        }}>{o.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${o.signed ? "status-active" : "status-investigation"}`}>
                          <Icon name={o.signed ? "CheckCircle" : "Clock"} size={10} />
                          {o.signed ? "Подписан" : "На подписи"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditOrder({ ...o }); setOrderErrors({}); }} className="p-1.5 rounded" style={{ color: "hsl(210 80% 55%)", background: "hsl(210 80% 52% / 0.1)" }} title="Редактировать">
                            <Icon name="Pencil" size={13} />
                          </button>
                          <button onClick={() => setDeleteOrder(o)} className="p-1.5 rounded" style={{ color: "hsl(0 70% 55%)", background: "hsl(0 70% 50% / 0.1)" }} title="Удалить">
                            <Icon name="Trash2" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT ORDER MODAL */}
        {editOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditOrder(null)}>
            <div className="w-full max-w-lg rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Редактирование приказа</div>
                <button onClick={() => setEditOrder(null)} style={{ color: "hsl(215 15% 45%)" }}><Icon name="X" size={18} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР *</label>
                    <input value={editOrder.number} onChange={(e) => setEditOrder({ ...editOrder, number: e.target.value })} className="w-full px-3 py-2 rounded text-sm mono outline-none" style={inputStyle(orderErrors.number)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.number ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                    {fieldErr(orderErrors.number)}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА *</label>
                    <input type="date" value={editOrder.date} onChange={(e) => setEditOrder({ ...editOrder, date: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ ...inputStyle(orderErrors.date), colorScheme: "dark" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НАИМЕНОВАНИЕ *</label>
                  <input value={editOrder.title} onChange={(e) => setEditOrder({ ...editOrder, title: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(orderErrors.title)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.title ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                  {fieldErr(orderErrors.title)}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>АВТОР *</label>
                    <input value={editOrder.author} onChange={(e) => setEditOrder({ ...editOrder, author: e.target.value })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle(orderErrors.author)} onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")} onBlur={(e) => (e.target.style.borderColor = orderErrors.author ? "hsl(0 70% 50%)" : "hsl(220 18% 18%)")} />
                    {fieldErr(orderErrors.author)}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ТИП</label>
                    <select value={editOrder.type} onChange={(e) => setEditOrder({ ...editOrder, type: e.target.value as Order["type"] })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      {["Внутренний", "Нормативный", "Оперативный"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СТАТУС</label>
                    <select value={editOrder.signed ? "Подписан" : "На подписи"} onChange={(e) => setEditOrder({ ...editOrder, signed: e.target.value === "Подписан" })} className="w-full px-3 py-2 rounded text-sm outline-none" style={inputStyle()}>
                      <option>На подписи</option>
                      <option>Подписан</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateOrder} className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium" style={{ background: "hsl(210 80% 52%)", color: "white" }}>
                  <Icon name="Check" size={14} />Сохранить
                </button>
                <button onClick={() => setEditOrder(null)} className="px-4 py-2.5 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE ORDER CONFIRM */}
        {deleteOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeleteOrder(null)}>
            <div className="w-full max-w-sm rounded-lg p-6 animate-scale-in" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(0 70% 40% / 0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "hsl(0 70% 50% / 0.15)" }}>
                  <Icon name="Trash2" size={16} style={{ color: "hsl(0 70% 60%)" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "hsl(210 20% 90%)" }}>Удалить приказ?</div>
                  <div className="text-xs mono" style={{ color: "hsl(210 80% 55%)" }}>{deleteOrder.number}</div>
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: "hsl(215 15% 50%)" }}>Это действие необратимо. Документ будет удалён из реестра.</p>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteOrder(deleteOrder.id)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{ background: "hsl(0 70% 50%)", color: "white" }}>
                  <Icon name="Trash2" size={13} />Удалить
                </button>
                <button onClick={() => setDeleteOrder(null)} className="px-4 py-2 rounded text-sm" style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
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
                { label: "Приостановлено", value: analytics.byStatus.Приостановлено, icon: "PauseCircle", color: "hsl(0 70% 55%)" },
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
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                      const pct = Math.round((count / analytics.total) * 100);
                      return (
                        <div key={cat}>
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
                )}
              </div>

              <div className="rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                <h3 className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Распределение по статусам</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(["Активное", "Расследование", "Приостановлено", "Закрыто"] as CaseStatus[]).map((s) => {
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
      </main>

      <footer className="py-3 px-6" style={{ borderTop: "1px solid hsl(220 18% 14%)", background: "hsl(220 28% 6%)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <span className="text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>АИС МВД · v1.0 · Для служебного пользования</span>
          <span className="text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>© {new Date().getFullYear()} МВД РФ</span>
        </div>
      </footer>
    </div>
  );
}
