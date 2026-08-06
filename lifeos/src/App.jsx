import React, { useState, useEffect, useRef, useMemo } from "react";
import { LayoutDashboard, CalendarDays, Flame, Wallet, CheckSquare, Plus, Trash2, ChevronLeft, ChevronRight, X, Circle, CheckCircle2 } from "lucide-react";

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');";

const MODULES = {
  calendar: { label: "Calendar", accent: "#6C8EBF", tint: "#1C2733", icon: CalendarDays },
  habits: { label: "Habits", accent: "#7FA37A", tint: "#1B241C", icon: Flame },
  finance: { label: "Finance", accent: "#C9A227", tint: "#26210F", icon: Wallet },
  tasks: { label: "Tasks", accent: "#B8735F", tint: "#271D18", icon: CheckSquare },
};

const CATEGORIES_EXPENSE = ["Food", "Rent", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Other"];
const CATEGORIES_INCOME = ["Salary", "Freelance", "Gift", "Other"];
const HABIT_COLORS = ["#7FA37A", "#6C8EBF", "#C9A227", "#B8735F", "#9D8AC7"];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
}

function last7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ key: dateStr(d.getFullYear(), d.getMonth(), d.getDate()), label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
  }
  return days;
}

function computeStreak(log) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = dateStr(d.getFullYear(), d.getMonth(), d.getDate());
    if (log[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export default function LifeOS() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [events, setEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [saveError, setSaveError] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lifeos-data");
      if (raw) {
        const d = JSON.parse(raw);
        setTasks(d.tasks || []);
        setHabits(d.habits || []);
        setEvents(d.events || []);
        setTransactions(d.transactions || []);
      }
    } catch (e) {
      // no saved data yet, or storage unavailable
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (firstRun.current) { firstRun.current = false; return; }
    try {
      localStorage.setItem("lifeos-data", JSON.stringify({ tasks, habits, events, transactions }));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, [tasks, habits, events, transactions, loaded]);

  if (!loaded) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#141920", color: "#EDEAE2", padding: "3rem", textAlign: "center" }}>
        <style>{FONT_IMPORT}</style>
        Loading LifeOS…
      </div>
    );
  }

  const today = todayStr();
  const tasksDueToday = tasks.filter((t) => t.dueDate === today);
  const tasksDoneToday = tasksDueToday.filter((t) => t.done).length;
  const eventsToday = events.filter((e) => e.date === today);
  const txToday = transactions.filter((t) => t.date === today);
  const spentToday = txToday.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const habitsToday = habits.filter((h) => h.log[today]).length;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#141920", color: "#EDEAE2", minHeight: "100vh", display: "flex" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        .num { font-family: 'Fraunces', serif; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
        ::placeholder { color: #6b7280; }
        .scrollbar::-webkit-scrollbar { width: 6px; }
        .scrollbar::-webkit-scrollbar-thumb { background: #2A313D; border-radius: 3px; }
      `}</style>

      <Sidebar tab={tab} setTab={setTab} />

      <div style={{ flex: 1, padding: "2rem 2.5rem", maxWidth: 980, overflowY: "auto" }} className="scrollbar">
        <LedgerStrip
          tasksDoneToday={tasksDoneToday}
          tasksDueToday={tasksDueToday.length}
          habitsToday={habitsToday}
          totalHabits={habits.length}
          eventsToday={eventsToday.length}
          spentToday={spentToday}
        />

        {saveError && (
          <div style={{ background: "#271D18", border: "1px solid #B8735F", color: "#E8B9AA", padding: "0.6rem 1rem", borderRadius: 8, fontSize: 13, marginBottom: "1.5rem" }}>
            Could not save your changes. They may not persist — try again in a moment.
          </div>
        )}

        {tab === "dashboard" && (
          <Dashboard
            tasks={tasks} habits={habits} events={events} transactions={transactions}
            setTab={setTab} today={today}
          />
        )}
        {tab === "calendar" && <CalendarView events={events} setEvents={setEvents} />}
        {tab === "habits" && <HabitsView habits={habits} setHabits={setHabits} />}
        {tab === "finance" && <FinanceView transactions={transactions} setTransactions={setTransactions} />}
        {tab === "tasks" && <TasksView tasks={tasks} setTasks={setTasks} />}
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, accent: "#EDEAE2" },
    { key: "calendar", label: "Calendar", icon: CalendarDays, accent: MODULES.calendar.accent },
    { key: "habits", label: "Habits", icon: Flame, accent: MODULES.habits.accent },
    { key: "finance", label: "Finance", icon: Wallet, accent: MODULES.finance.accent },
    { key: "tasks", label: "Tasks", icon: CheckSquare, accent: MODULES.tasks.accent },
  ];
  return (
    <div style={{ width: 200, borderRight: "1px solid #232A34", padding: "2rem 0.75rem", flexShrink: 0 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, padding: "0 0.75rem", marginBottom: "2rem", letterSpacing: 0.2 }}>
        LifeOS
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              background: active ? "#1D242E" : "transparent",
              border: "none", borderLeft: active ? `3px solid ${it.accent}` : "3px solid transparent",
              color: active ? "#EDEAE2" : "#9AA3AF",
              padding: "0.6rem 0.65rem", borderRadius: 6, marginBottom: 4,
              fontSize: 14, textAlign: "left",
            }}
          >
            <Icon size={16} color={active ? it.accent : "#7A828E"} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function LedgerStrip({ tasksDoneToday, tasksDueToday, habitsToday, totalHabits, eventsToday, spentToday }) {
  const now = new Date();
  const dayNum = now.getDate();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const stubs = [
    { label: "tasks done", value: `${tasksDoneToday}/${tasksDueToday}`, accent: MODULES.tasks.accent },
    { label: "habits today", value: `${habitsToday}/${totalHabits}`, accent: MODULES.habits.accent },
    { label: "events today", value: `${eventsToday}`, accent: MODULES.calendar.accent },
    { label: "spent today", value: fmtMoney(spentToday), accent: MODULES.finance.accent },
  ];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 0, marginBottom: "2.5rem", borderBottom: "1px solid #232A34", paddingBottom: 0 }}>
      <div style={{ paddingRight: "1.5rem", paddingBottom: "1rem" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 500, lineHeight: 1 }}>{dayNum}</div>
        <div style={{ fontSize: 13, color: "#9AA3AF", marginTop: 4 }}>{dayName}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{monthName}</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stubs.map((s, i) => (
          <div key={i} style={{
            background: "#1D242E",
            borderTop: `2px dashed ${s.accent}66`,
            borderLeft: "1px solid #232A34", borderRight: "1px solid #232A34",
            borderRadius: "6px 6px 0 0",
            padding: "0.6rem 1rem 0.75rem",
            minWidth: 100,
          }}>
            <div className="num" style={{ fontSize: 20, color: s.accent, fontWeight: 500 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: "#9AA3AF", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, margin: 0 }}>{children}</h2>
    </div>
  );
}

function Panel({ children, style }) {
  return <div style={{ background: "#1D242E", border: "1px solid #232A34", borderRadius: 10, padding: "1.25rem", ...style }}>{children}</div>;
}

// ---------- Dashboard ----------
function Dashboard({ tasks, habits, events, transactions, setTab, today }) {
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const openTasks = tasks.filter((t) => !t.done).slice(0, 5);
  const month = today.slice(0, 7);
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
      <Panel>
        <SectionTitle accent={MODULES.tasks.accent}>Open tasks</SectionTitle>
        {openTasks.length === 0 && <Empty text="Nothing open. Add a task to get started." />}
        {openTasks.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: 14, borderBottom: "1px solid #232A34" }}>
            <span>{t.title}</span>
            {t.dueDate && <span style={{ color: "#9AA3AF", fontSize: 12 }}>{t.dueDate}</span>}
          </div>
        ))}
        <button onClick={() => setTab("tasks")} style={ghostBtn}>Go to tasks →</button>
      </Panel>

      <Panel>
        <SectionTitle accent={MODULES.calendar.accent}>Upcoming events</SectionTitle>
        {upcoming.length === 0 && <Empty text="Nothing scheduled. Add an event to your calendar." />}
        {upcoming.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: 14, borderBottom: "1px solid #232A34" }}>
            <span>{e.title}</span>
            <span style={{ color: "#9AA3AF", fontSize: 12 }}>{e.date}{e.time ? ` · ${e.time}` : ""}</span>
          </div>
        ))}
        <button onClick={() => setTab("calendar")} style={ghostBtn}>Go to calendar →</button>
      </Panel>

      <Panel>
        <SectionTitle accent={MODULES.habits.accent}>Habit streaks</SectionTitle>
        {habits.length === 0 && <Empty text="No habits yet. Add one to start a streak." />}
        {habits.slice(0, 5).map((h) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", fontSize: 14, borderBottom: "1px solid #232A34" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.color }} />
              {h.name}
            </span>
            <span className="num" style={{ color: MODULES.habits.accent, fontSize: 14 }}>{computeStreak(h.log)}d</span>
          </div>
        ))}
        <button onClick={() => setTab("habits")} style={ghostBtn}>Go to habits →</button>
      </Panel>

      <Panel>
        <SectionTitle accent={MODULES.finance.accent}>This month</SectionTitle>
        <div style={{ display: "flex", gap: 24, margin: "0.5rem 0 1rem" }}>
          <div>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Income</div>
            <div className="num" style={{ fontSize: 18, color: "#9BC08F" }}>{fmtMoney(income)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Expense</div>
            <div className="num" style={{ fontSize: 18, color: "#D2A18E" }}>{fmtMoney(expense)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Balance</div>
            <div className="num" style={{ fontSize: 18, color: MODULES.finance.accent }}>{fmtMoney(income - expense)}</div>
          </div>
        </div>
        <button onClick={() => setTab("finance")} style={ghostBtn}>Go to finance →</button>
      </Panel>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ fontSize: 13, color: "#6b7280", padding: "0.75rem 0" }}>{text}</div>;
}

const ghostBtn = {
  background: "transparent", border: "none", color: "#9AA3AF", fontSize: 13,
  padding: "0.5rem 0 0", textAlign: "left",
};

// ---------- Calendar ----------
function CalendarView({ events, setEvents }) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, [events]);

  function addEvent() {
    if (!newTitle.trim()) return;
    setEvents([...events, { id: uid(), title: newTitle.trim(), date: selectedDay, time: newTime, color: MODULES.calendar.accent }]);
    setNewTitle(""); setNewTime("");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <SectionTitle accent={MODULES.calendar.accent}>{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</SectionTitle>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={iconBtn}><ChevronLeft size={16} /></button>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={iconBtn}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = dateStr(year, month, d);
            const isToday = key === todayStr();
            const isSelected = key === selectedDay;
            const dayEvents = eventsByDay[key] || [];
            return (
              <button key={i} onClick={() => setSelectedDay(key)} style={{
                aspectRatio: "1", background: isSelected ? "#242B36" : "transparent",
                border: isToday ? `1px solid ${MODULES.calendar.accent}` : "1px solid transparent",
                borderRadius: 6, color: "#EDEAE2", fontSize: 13, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2, padding: 2,
              }}>
                {d}
                {dayEvents.length > 0 && <div style={{ width: 4, height: 4, borderRadius: "50%", background: MODULES.calendar.accent }} />}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <SectionTitle accent={MODULES.calendar.accent}>{selectedDay}</SectionTitle>
        {(eventsByDay[selectedDay] || []).length === 0 && <Empty text="No events this day." />}
        {(eventsByDay[selectedDay] || []).map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #232A34", fontSize: 14 }}>
            <span>{e.title}{e.time ? <span style={{ color: "#9AA3AF", fontSize: 12 }}> · {e.time}</span> : null}</span>
            <button onClick={() => setEvents(events.filter((x) => x.id !== e.id))} style={trashBtn}><Trash2 size={14} /></button>
          </div>
        ))}
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Event title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={inputStyle} />
          <input placeholder="Time (optional)" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={inputStyle} />
          <button onClick={addEvent} style={addBtn(MODULES.calendar.accent)}><Plus size={14} /> Add event</button>
        </div>
      </Panel>
    </div>
  );
}

// ---------- Habits ----------
function HabitsView({ habits, setHabits }) {
  const [newName, setNewName] = useState("");
  const days = last7Days();

  function addHabit() {
    if (!newName.trim()) return;
    const color = HABIT_COLORS[habits.length % HABIT_COLORS.length];
    setHabits([...habits, { id: uid(), name: newName.trim(), color, log: {} }]);
    setNewName("");
  }

  function toggleDay(habitId, dayKey) {
    setHabits(habits.map((h) => h.id === habitId ? { ...h, log: { ...h.log, [dayKey]: !h.log[dayKey] } } : h));
  }

  return (
    <div>
      <Panel style={{ marginBottom: "1.25rem" }}>
        <SectionTitle accent={MODULES.habits.accent}>Add habit</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="e.g. Read 20 minutes" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addHabit()} />
          <button onClick={addHabit} style={addBtn(MODULES.habits.accent)}><Plus size={14} /> Add</button>
        </div>
      </Panel>

      {habits.length === 0 && <Empty text="No habits yet. Add your first one above." />}

      {habits.map((h) => (
        <Panel key={h.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: h.color }} />
              <span style={{ fontSize: 15 }}>{h.name}</span>
              <span className="num" style={{ fontSize: 13, color: MODULES.habits.accent }}>{computeStreak(h.log)} day streak</span>
            </div>
            <button onClick={() => setHabits(habits.filter((x) => x.id !== h.id))} style={trashBtn}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
            {days.map((d) => {
              const done = !!h.log[d.key];
              return (
                <button key={d.key} onClick={() => toggleDay(h.id, d.key)} style={{
                  width: 34, height: 34, borderRadius: 8, border: `1px solid ${done ? h.color : "#2A313D"}`,
                  background: done ? h.color + "33" : "transparent", color: done ? h.color : "#6b7280",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                }}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ---------- Finance ----------
function FinanceView({ transactions, setTransactions }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES_EXPENSE[0]);
  const [note, setNote] = useState("");

  const month = todayStr().slice(0, 7);
  const monthTx = transactions.filter((t) => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const byCategory = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTx]);
  const maxCat = byCategory.length ? byCategory[0][1] : 1;

  function addTx() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setTransactions([...transactions, { id: uid(), type, category, amount: amt, note: note.trim(), date: todayStr() }]);
    setAmount(""); setNote("");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: "1.25rem" }}>
          <Panel style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Income</div>
            <div className="num" style={{ fontSize: 22, color: "#9BC08F" }}>{fmtMoney(income)}</div>
          </Panel>
          <Panel style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Expense</div>
            <div className="num" style={{ fontSize: 22, color: "#D2A18E" }}>{fmtMoney(expense)}</div>
          </Panel>
          <Panel style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#9AA3AF", textTransform: "uppercase" }}>Balance</div>
            <div className="num" style={{ fontSize: 22, color: MODULES.finance.accent }}>{fmtMoney(income - expense)}</div>
          </Panel>
        </div>

        <Panel style={{ marginBottom: "1.25rem" }}>
          <SectionTitle accent={MODULES.finance.accent}>Spending by category</SectionTitle>
          {byCategory.length === 0 && <Empty text="No expenses logged this month." />}
          {byCategory.map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                <span>{cat}</span>
                <span className="num" style={{ color: "#D2A18E" }}>{fmtMoney(amt)}</span>
              </div>
              <div style={{ height: 6, background: "#242B36", borderRadius: 3 }}>
                <div style={{ height: 6, width: `${(amt / maxCat) * 100}%`, background: MODULES.finance.accent, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <SectionTitle accent={MODULES.finance.accent}>Recent transactions</SectionTitle>
          {monthTx.length === 0 && <Empty text="No transactions this month." />}
          {monthTx.slice(0, 12).map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #232A34", fontSize: 13 }}>
              <div>
                <div>{t.category}{t.note ? <span style={{ color: "#6b7280" }}> · {t.note}</span> : null}</div>
                <div style={{ color: "#6b7280", fontSize: 11 }}>{t.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="num" style={{ color: t.type === "income" ? "#9BC08F" : "#D2A18E" }}>{t.type === "income" ? "+" : "-"}{fmtMoney(t.amount).replace("-", "")}</span>
                <button onClick={() => setTransactions(transactions.filter((x) => x.id !== t.id))} style={trashBtn}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <Panel style={{ alignSelf: "flex-start" }}>
        <SectionTitle accent={MODULES.finance.accent}>Add transaction</SectionTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["expense", "income"].map((tp) => (
            <button key={tp} onClick={() => { setType(tp); setCategory(tp === "income" ? CATEGORIES_INCOME[0] : CATEGORIES_EXPENSE[0]); }} style={{
              flex: 1, padding: "0.4rem", borderRadius: 6, fontSize: 13, textTransform: "capitalize",
              border: `1px solid ${type === tp ? MODULES.finance.accent : "#2A313D"}`,
              background: type === tp ? MODULES.finance.accent + "22" : "transparent",
              color: type === tp ? MODULES.finance.accent : "#9AA3AF",
            }}>{tp}</button>
          ))}
        </div>
        <input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }}>
          {(type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
        <button onClick={addTx} style={addBtn(MODULES.finance.accent)}><Plus size={14} /> Add transaction</button>
      </Panel>
    </div>
  );
}

// ---------- Tasks ----------
function TasksView({ tasks, setTasks }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [filter, setFilter] = useState("open");

  function addTask() {
    if (!newTitle.trim()) return;
    setTasks([...tasks, { id: uid(), title: newTitle.trim(), done: false, dueDate: newDue, priority: newPriority }]);
    setNewTitle(""); setNewDue("");
  }

  function toggle(id) {
    setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }

  const priorityColor = { high: MODULES.tasks.accent, medium: "#C9A227", low: "#7A828E" };
  const visible = tasks.filter((t) => filter === "all" ? true : filter === "open" ? !t.done : t.done)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <div>
      <Panel style={{ marginBottom: "1.25rem" }}>
        <SectionTitle accent={MODULES.tasks.accent}>Add task</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ ...inputStyle, flex: "2 1 200px" }} onKeyDown={(e) => e.key === "Enter" && addTask()} />
          <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} style={{ ...inputStyle, flex: "1 1 140px" }} />
          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ ...inputStyle, flex: "1 1 100px" }}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={addTask} style={addBtn(MODULES.tasks.accent)}><Plus size={14} /> Add</button>
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["open", "done", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "0.35rem 0.8rem", borderRadius: 6, fontSize: 12, textTransform: "capitalize",
            border: `1px solid ${filter === f ? MODULES.tasks.accent : "#2A313D"}`,
            background: filter === f ? MODULES.tasks.accent + "22" : "transparent",
            color: filter === f ? MODULES.tasks.accent : "#9AA3AF",
          }}>{f}</button>
        ))}
      </div>

      <Panel>
        {visible.length === 0 && <Empty text="Nothing here." />}
        {visible.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0", borderBottom: "1px solid #232A34" }}>
            <button onClick={() => toggle(t.id)} style={{ background: "none", border: "none", padding: 0, display: "flex" }}>
              {t.done ? <CheckCircle2 size={18} color={MODULES.tasks.accent} /> : <Circle size={18} color="#4b5563" />}
            </button>
            <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#6b7280" : "#EDEAE2" }}>{t.title}</span>
            {t.dueDate && <span style={{ fontSize: 11, color: "#9AA3AF" }}>{t.dueDate}</span>}
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColor[t.priority] }} />
            <button onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} style={trashBtn}><Trash2 size={13} /></button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ---------- shared styles ----------
const inputStyle = {
  background: "#141920", border: "1px solid #2A313D", borderRadius: 6, color: "#EDEAE2",
  padding: "0.5rem 0.65rem", fontSize: 13, width: "100%", outline: "none",
};
const iconBtn = {
  background: "#242B36", border: "1px solid #2A313D", borderRadius: 6, color: "#EDEAE2",
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
};
const trashBtn = { background: "none", border: "none", color: "#6b7280", display: "flex" };
const addBtn = (color) => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  background: color + "22", border: `1px solid ${color}`, color, borderRadius: 6,
  padding: "0.5rem 0.9rem", fontSize: 13, whiteSpace: "nowrap",
});
