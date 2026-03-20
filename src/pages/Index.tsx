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
  district: string;
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

const INITIAL_CASES: CaseRecord[] = [
  { id: "1", number: "УД-2024-001847", date: "2024-01-15", category: "Кража", suspect: "Петров Алексей Владимирович", investigator: "Соколов И.П.", status: "Расследование", description: "Кража имущества из жилого помещения, ул. Ленина д.12", district: "Центральный" },
  { id: "2", number: "УД-2024-001923", date: "2024-01-22", category: "Мошенничество", suspect: "Зайцева Марина Сергеевна", investigator: "Кузнецова А.В.", status: "Активное", description: "Мошенничество с банковскими картами на сумму 340 000 руб.", district: "Северный" },
  { id: "3", number: "УД-2024-002105", date: "2024-02-03", category: "ДТП", suspect: "Морозов Дмитрий Иванович", investigator: "Волков С.Н.", status: "Закрыто", description: "ДТП с пострадавшими, пр. Мира д.45", district: "Южный" },
  { id: "4", number: "УД-2024-002341", date: "2024-02-14", category: "Хулиганство", suspect: "Козлов Павел Андреевич", investigator: "Соколов И.П.", status: "Закрыто", description: "Хулиганство в общественном месте, ТЦ «Центр»", district: "Центральный" },
  { id: "5", number: "УД-2024-002678", date: "2024-03-01", category: "Разбой", suspect: "Новиков Антон Романович", investigator: "Лебедев К.М.", status: "Расследование", description: "Вооружённый разбой, ул. Садовая д.7", district: "Восточный" },
  { id: "6", number: "УД-2024-002901", date: "2024-03-10", category: "Наркотики", suspect: "Тихонов Виктор Сергеевич", investigator: "Кузнецова А.В.", status: "Приостановлено", description: "Сбыт наркотических веществ в особо крупном размере", district: "Северный" },
  { id: "7", number: "УД-2024-003012", date: "2024-03-18", category: "Кража", suspect: "Блинова Ольга Николаевна", investigator: "Волков С.Н.", status: "Активное", description: "Кража из супермаркета «Пятёрочка»", district: "Западный" },
  { id: "8", number: "УД-2024-003247", date: "2024-04-02", category: "Мошенничество", suspect: "Симонов Григорий Павлович", investigator: "Лебедев К.М.", status: "Расследование", description: "Мошенничество при купле-продаже автомобиля", district: "Южный" },
];

const INITIAL_ORDERS: Order[] = [
  { id: "1", number: "ПР-2024-0041", date: "2024-01-10", title: "О порядке ведения уголовных дел в 2024 году", author: "Полковник Громов В.А.", type: "Нормативный", signed: true },
  { id: "2", number: "ПР-2024-0078", date: "2024-01-25", title: "Об усилении охраны общественного порядка", author: "Подполковник Рыбаков И.С.", type: "Оперативный", signed: true },
  { id: "3", number: "ПР-2024-0112", date: "2024-02-08", title: "О проведении профилактических мероприятий", author: "Майор Столяров Д.П.", type: "Внутренний", signed: true },
  { id: "4", number: "ПР-2024-0156", date: "2024-02-20", title: "О дополнительном штатном расписании отдела", author: "Полковник Громов В.А.", type: "Нормативный", signed: false },
  { id: "5", number: "ПР-2024-0189", date: "2024-03-05", title: "Об организации дежурств в праздничные дни", author: "Подполковник Рыбаков И.С.", type: "Оперативный", signed: true },
  { id: "6", number: "ПР-2024-0223", date: "2024-03-22", title: "О внедрении новых форм отчётности", author: "Майор Столяров Д.П.", type: "Внутренний", signed: false },
];

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

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("database");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Все");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>(INITIAL_CASES);
  const [orders] = useState<Order[]>(INITIAL_ORDERS);

  const [newCase, setNewCase] = useState({
    number: `УД-2024-${String(Math.floor(Math.random() * 9000) + 1000).padStart(6, "0")}`,
    date: new Date().toISOString().split("T")[0],
    category: "Кража" as CaseCategory,
    suspect: "",
    investigator: "",
    description: "",
    district: "Центральный",
    status: "Активное" as CaseStatus,
  });

  const [formSaved, setFormSaved] = useState(false);

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
        c.category.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q);
      const matchStatus = filterStatus === "Все" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [cases, searchQuery, filterStatus]);

  const analytics = useMemo(() => {
    const total = cases.length;
    const byStatus = {
      Активное: cases.filter((c) => c.status === "Активное").length,
      Расследование: cases.filter((c) => c.status === "Расследование").length,
      Приостановлено: cases.filter((c) => c.status === "Приостановлено").length,
      Закрыто: cases.filter((c) => c.status === "Закрыто").length,
    };
    const byCategory = {} as Record<string, number>;
    cases.forEach((c) => { byCategory[c.category] = (byCategory[c.category] || 0) + 1; });
    const byDistrict = {} as Record<string, number>;
    cases.forEach((c) => { byDistrict[c.district] = (byDistrict[c.district] || 0) + 1; });
    const closedRate = Math.round((byStatus.Закрыто / total) * 100);
    return { total, byStatus, byCategory, byDistrict, closedRate };
  }, [cases]);

  const handleSaveCase = () => {
    if (!newCase.suspect || !newCase.investigator || !newCase.description) return;
    const created: CaseRecord = { id: String(Date.now()), ...newCase };
    setCases((prev) => [created, ...prev]);
    setFormSaved(true);
    setTimeout(() => {
      setFormSaved(false);
      setActiveTab("database");
      setNewCase({
        number: `УД-2024-${String(Math.floor(Math.random() * 9000) + 1000).padStart(6, "0")}`,
        date: new Date().toISOString().split("T")[0],
        category: "Кража",
        suspect: "",
        investigator: "",
        description: "",
        district: "Центральный",
        status: "Активное",
      });
    }, 1200);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "database", label: "База данных", icon: "Database" },
    { id: "new-case", label: "Новое дело", icon: "FilePlus" },
    { id: "orders", label: "Приказы", icon: "FileText" },
    { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  ];

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
              <div className="text-xs mono px-3 py-1.5 rounded" style={{ background: "hsl(220 22% 11%)", color: "hsl(215 15% 60%)", border: "1px solid hsl(220 18% 18%)" }}>
                Майор Соколов И.П.
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? "active" : ""}`}
                style={{
                  color: activeTab === tab.id ? "hsl(210 80% 62%)" : "hsl(215 15% 50%)",
                }}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
                {tab.id === "database" && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded mono" style={{ background: "hsl(210 80% 52% / 0.15)", color: "hsl(210 80% 62%)" }}>
                    {cases.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(215 15% 45%)" }} />
                <input
                  type="text"
                  placeholder="Поиск по номеру дела, фамилии, дате, статусу, категории..."
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

            {/* Stats row */}
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
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>НОМЕР ДЕЛА</th>
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>ДАТА</th>
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>КАТЕГОРИЯ</th>
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>ПОДОЗРЕВАЕМЫЙ</th>
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>СЛЕДОВАТЕЛЬ</th>
                    <th className="text-left px-4 py-3 font-medium text-xs mono" style={{ color: "hsl(215 15% 45%)" }}>СТАТУС</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12" style={{ color: "hsl(215 15% 40%)" }}>
                        <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-40" />
                        <div className="text-sm">Записи не найдены</div>
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
                        onClick={() => setSelectedCase(c)}
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
                          <Icon name="ChevronRight" size={14} style={{ color: "hsl(215 15% 35%)" }} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2 flex items-center justify-between" style={{ background: "hsl(220 22% 10%)", borderTop: "1px solid hsl(220 18% 18%)" }}>
                <span className="text-xs mono" style={{ color: "hsl(215 15% 40%)" }}>
                  Показано: {filteredCases.length} из {cases.length} записей
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CASE DETAIL MODAL */}
        {selectedCase && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setSelectedCase(null)}
          >
            <div
              className="w-full max-w-lg rounded-lg p-6 animate-scale-in"
              style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 22%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="mono text-xs mb-1" style={{ color: "hsl(210 80% 52%)" }}>{selectedCase.number}</div>
                  <div className="font-semibold text-base" style={{ color: "hsl(210 20% 92%)" }}>{selectedCase.category}</div>
                </div>
                <button onClick={() => setSelectedCase(null)} style={{ color: "hsl(215 15% 45%)" }}>
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Дата возбуждения", value: selectedCase.date, mono: true },
                  { label: "Подозреваемый", value: selectedCase.suspect, mono: false },
                  { label: "Следователь", value: selectedCase.investigator, mono: false },
                  { label: "Район", value: selectedCase.district, mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between" style={{ borderBottom: "1px solid hsl(220 18% 18%)", paddingBottom: "8px" }}>
                    <span style={{ color: "hsl(215 15% 45%)" }}>{label}</span>
                    <span className={mono ? "mono" : ""} style={{ color: "hsl(210 20% 85%)" }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between" style={{ borderBottom: "1px solid hsl(220 18% 18%)", paddingBottom: "8px" }}>
                  <span style={{ color: "hsl(215 15% 45%)" }}>Статус</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[selectedCase.status]}`}>
                    <Icon name={STATUS_ICON[selectedCase.status]} size={10} />
                    {selectedCase.status}
                  </span>
                </div>
                <div>
                  <div className="mb-1 text-xs" style={{ color: "hsl(215 15% 45%)" }}>Описание</div>
                  <div style={{ color: "hsl(210 20% 78%)" }}>{selectedCase.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW CASE TAB */}
        {activeTab === "new-case" && (
          <div className="animate-fade-in max-w-2xl">
            <div className="mb-5">
              <h2 className="text-base font-semibold mb-0.5" style={{ color: "hsl(210 20% 90%)" }}>Регистрация нового дела</h2>
              <p className="text-xs" style={{ color: "hsl(215 15% 45%)" }}>Заполните все обязательные поля для создания записи в базе данных</p>
            </div>

            <div className="rounded-lg p-6 space-y-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>НОМЕР ДЕЛА</label>
                  <input
                    value={newCase.number}
                    readOnly
                    className="w-full px-3 py-2.5 rounded text-sm mono outline-none"
                    style={{ background: "hsl(220 25% 8%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 80% 62%)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ДАТА ВОЗБУЖДЕНИЯ</label>
                  <input
                    type="date"
                    value={newCase.date}
                    onChange={(e) => setNewCase({ ...newCase, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded text-sm outline-none"
                    style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)", colorScheme: "dark" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>КАТЕГОРИЯ *</label>
                  <select
                    value={newCase.category}
                    onChange={(e) => setNewCase({ ...newCase, category: e.target.value as CaseCategory })}
                    className="w-full px-3 py-2.5 rounded text-sm outline-none"
                    style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  >
                    {["Кража", "Мошенничество", "Хулиганство", "ДТП", "Разбой", "Наркотики"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>РАЙОН</label>
                  <select
                    value={newCase.district}
                    onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded text-sm outline-none"
                    style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  >
                    {["Центральный", "Северный", "Южный", "Восточный", "Западный"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ПОДОЗРЕВАЕМЫЙ (ФИО) *</label>
                <input
                  type="text"
                  placeholder="Фамилия Имя Отчество"
                  value={newCase.suspect}
                  onChange={(e) => setNewCase({ ...newCase, suspect: e.target.value })}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none"
                  style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>СЛЕДОВАТЕЛЬ *</label>
                <input
                  type="text"
                  placeholder="Звание, Фамилия И.О."
                  value={newCase.investigator}
                  onChange={(e) => setNewCase({ ...newCase, investigator: e.target.value })}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none"
                  style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 mono" style={{ color: "hsl(215 15% 50%)" }}>ОПИСАНИЕ *</label>
                <textarea
                  placeholder="Краткое описание обстоятельств дела..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none resize-none"
                  style={{ background: "hsl(220 22% 13%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(210 20% 85%)" }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(210 80% 52%)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(220 18% 18%)")}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSaveCase}
                  disabled={!newCase.suspect || !newCase.investigator || !newCase.description || formSaved}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: formSaved ? "hsl(142 70% 40%)" : "hsl(210 80% 52%)", color: "white" }}
                >
                  <Icon name={formSaved ? "Check" : "Save"} size={14} />
                  {formSaved ? "Сохранено!" : "Зарегистрировать дело"}
                </button>
                <button
                  onClick={() => setActiveTab("database")}
                  className="px-4 py-2.5 rounded text-sm transition-all"
                  style={{ background: "hsl(220 22% 15%)", color: "hsl(215 15% 55%)", border: "1px solid hsl(220 18% 20%)" }}
                >
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
            </div>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(220 18% 18%)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(220 22% 10%)", borderBottom: "1px solid hsl(220 18% 18%)" }}>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>НОМЕР</th>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>ДАТА</th>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>НАИМЕНОВАНИЕ</th>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>АВТОР</th>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>ТИП</th>
                    <th className="text-left px-4 py-3 text-xs mono font-medium" style={{ color: "hsl(215 15% 45%)" }}>СТАТУС</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr
                      key={o.id}
                      className="table-row-hover cursor-pointer"
                      style={{
                        background: i % 2 === 0 ? "hsl(220 22% 11%)" : "hsl(220 22% 12%)",
                        borderBottom: "1px solid hsl(220 18% 16%)",
                      }}
                    >
                      <td className="px-4 py-3 mono text-xs font-medium" style={{ color: "hsl(210 80% 62%)" }}>{o.number}</td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.date}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(210 20% 85%)" }}>{o.title}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "hsl(215 15% 60%)" }}>{o.author}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{
                          background: o.type === "Нормативный" ? "rgba(99,102,241,0.15)" : o.type === "Оперативный" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)",
                          color: o.type === "Нормативный" ? "#818cf8" : o.type === "Оперативный" ? "#f59e0b" : "#9ca3af",
                          border: `1px solid ${o.type === "Нормативный" ? "rgba(99,102,241,0.3)" : o.type === "Оперативный" ? "rgba(245,158,11,0.25)" : "rgba(107,114,128,0.2)"}`,
                        }}>
                          {o.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${o.signed ? "status-active" : "status-investigation"}`}>
                          <Icon name={o.signed ? "CheckCircle" : "Clock"} size={10} />
                          {o.signed ? "Подписан" : "На подписи"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              </div>

              <div className="rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                <h3 className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>По районам города</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.byDistrict).sort((a, b) => b[1] - a[1]).map(([district, count], idx) => {
                    const pct = Math.round((count / analytics.total) * 100);
                    const colors = ["hsl(210 80% 52%)", "hsl(142 70% 45%)", "hsl(38 90% 50%)", "hsl(280 70% 55%)", "hsl(0 70% 55%)"];
                    return (
                      <div key={district}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "hsl(210 20% 78%)" }}>{district} р-н</span>
                          <span className="mono" style={{ color: colors[idx % colors.length] }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 18% 18%)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[idx % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-2 rounded-lg p-4" style={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 18% 18%)" }}>
                <h3 className="text-sm font-medium mb-4" style={{ color: "hsl(210 20% 85%)" }}>Распределение по статусам</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(["Активное", "Расследование", "Приостановлено", "Закрыто"] as CaseStatus[]).map((s) => {
                    const count = analytics.byStatus[s];
                    const pct = Math.round((count / analytics.total) * 100);
                    return (
                      <div key={s} className="text-center p-3 rounded" style={{ background: "hsl(220 25% 8%)" }}>
                        <div className="text-2xl font-bold mono mb-1" style={{ color: "hsl(210 20% 90%)" }}>{count}</div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${STATUS_CLASS[s]}`}>
                          <Icon name={STATUS_ICON[s]} size={10} />
                          {s}
                        </span>
                        <div className="text-xs mono mt-2" style={{ color: "hsl(215 15% 40%)" }}>{pct}%</div>
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
          <span className="text-xs mono" style={{ color: "hsl(215 15% 35%)" }}>© 2024 МВД РФ</span>
        </div>
      </footer>
    </div>
  );
}