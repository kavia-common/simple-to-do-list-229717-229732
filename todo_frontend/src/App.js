import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import retroBg from "./assets/Screenshot_2024-08-16_015356.png";

const STORAGE_KEY = "retroTodo.tasks.v1";

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} text
 * @property {boolean} completed
 * @property {number} createdAt
 */

/** @returns {string} */
function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** @returns {Todo[]} */
function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Minimal validation so we don't crash on corrupt storage.
    return parsed
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: typeof t.id === "string" ? t.id : makeId(),
        text: typeof t.text === "string" ? t.text : "",
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      }))
      .filter((t) => t.text.trim().length > 0);
  } catch {
    return [];
  }
}

/** @param {Todo[]} todos */
function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Intentionally ignore (e.g., private mode / quota exceeded).
  }
}

// PUBLIC_INTERFACE
function App() {
  /** @type {[Todo[], Function]} */
  const [todos, setTodos] = useState(() => loadTodos());
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  // Persist to localStorage on every change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.completed).length;
    return { total, done, left: total - done };
  }, [todos]);

  // PUBLIC_INTERFACE
  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;

    /** @type {Todo} */
    const newTodo = {
      id: makeId(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setDraft("");
    // Keep the typing flow fast.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // PUBLIC_INTERFACE
  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // PUBLIC_INTERFACE
  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  // PUBLIC_INTERFACE
  const clearAll = () => {
    setTodos([]);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    addTodo();
  };

  return (
    <div className="retroApp" style={{ "--app-bg-image": `url(${retroBg})` }}>
      <RetroBackground />

      <div className="appShell">
        <header className="retroHeader">
          <div className="retroTitleRow">
            <h1 className="retroTitle">Retro To‑Do</h1>
            <span className="retroBadge" aria-label="Memphis style badge">
              Memphis
            </span>
          </div>
          <p className="retroSubtitle">
            Add tasks, check them off, and everything stays saved on this device.
          </p>
        </header>

        <main className="retroMain" aria-label="To-do list application">
          <section className="retroCard" aria-label="Add a task">
            <form className="todoForm" onSubmit={onSubmit}>
              <label className="srOnly" htmlFor="todoText">
                New task
              </label>
              <input
                id="todoText"
                ref={inputRef}
                className="todoInput"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a task and press Enter…"
                maxLength={180}
                autoComplete="off"
              />
              <button className="btnPrimary" type="submit">
                Add
              </button>
            </form>

            <div className="toolbar" aria-label="To-do actions">
              <div className="stats" aria-live="polite">
                <span>
                  <strong>{stats.left}</strong> left
                </span>
                <span className="dotSep" aria-hidden="true">
                  •
                </span>
                <span>
                  <strong>{stats.done}</strong> done
                </span>
                <span className="dotSep" aria-hidden="true">
                  •
                </span>
                <span>
                  <strong>{stats.total}</strong> total
                </span>
              </div>

              <div className="toolbarActions">
                <button
                  className="btnGhost"
                  type="button"
                  onClick={clearCompleted}
                  disabled={stats.done === 0}
                >
                  Clear done
                </button>
                <button
                  className="btnDanger"
                  type="button"
                  onClick={clearAll}
                  disabled={stats.total === 0}
                >
                  Clear all
                </button>
              </div>
            </div>
          </section>

          <section className="retroCard" aria-label="Tasks">
            {todos.length === 0 ? (
              <div className="emptyState" role="status">
                <p className="emptyTitle">Nothing here yet.</p>
                <p className="emptyHint">Add your first task above.</p>
              </div>
            ) : (
              <ul className="todoList" aria-label="Task list">
                {todos.map((t) => (
                  <li key={t.id} className="todoItem">
                    <label className="todoCheck">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTodo(t.id)}
                        aria-label={`Mark "${t.text}" as ${
                          t.completed ? "incomplete" : "complete"
                        }`}
                      />
                      <span className="checkVisual" aria-hidden="true" />
                    </label>

                    <div className="todoTextWrap">
                      <span className={t.completed ? "todoText done" : "todoText"}>
                        {t.text}
                      </span>
                    </div>

                    <button
                      className="btnIcon"
                      type="button"
                      onClick={() => deleteTodo(t.id)}
                      aria-label={`Delete "${t.text}"`}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="retroFooter">
          <span>Tip: Your list is saved automatically (localStorage).</span>
        </footer>
      </div>
    </div>
  );
}

/**
 * Retro/Memphis style fixed SVG background layer.
 * Built to match the extracted design notes: off-white canvas, scattered triangles,
 * thin connector lines, and dot nodes.
 */
function RetroBackground() {
  return (
    <svg
      className="retroBg"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="1200" height="800" className="bgCanvas" />

      {/* Connectors (thin, warm-gray) */}
      <g className="bgLines">
        <line x1="120" y1="130" x2="260" y2="210" />
        <line x1="260" y1="210" x2="380" y2="160" />
        <line x1="380" y1="160" x2="520" y2="250" />
        <line x1="520" y1="250" x2="640" y2="190" />
        <line x1="640" y1="190" x2="770" y2="260" />
        <line x1="770" y1="260" x2="900" y2="210" />
        <line x1="240" y1="520" x2="360" y2="460" />
        <line x1="360" y1="460" x2="520" y2="540" />
        <line x1="520" y1="540" x2="680" y2="480" />
        <line x1="680" y1="480" x2="820" y2="560" />
        <line x1="820" y1="560" x2="980" y2="500" />
        <line x1="1040" y1="110" x2="920" y2="210" />
        <line x1="120" y1="680" x2="240" y2="520" />
        <line x1="980" y1="500" x2="1090" y2="650" />
      </g>

      {/* Triangles / polygons */}
      <g className="bgTriangles">
        <polygon className="triPurple" points="170,105 230,165 140,185" />
        <polygon className="triCoral" points="520,105 585,160 480,185" />
        <polygon className="triPeach" points="830,120 900,165 800,195" />

        <polygon className="triCoral" points="260,600 330,655 220,685" />
        <polygon className="triPurple" points="620,590 690,650 580,680" />
        <polygon className="triPeach" points="980,610 1050,665 940,690" />

        <polygon className="triPurple soft" points="1040,80 1120,130 1010,155" />
        <polygon className="triCoral soft" points="90,610 160,660 70,700" />
      </g>

      {/* Nodes */}
      <g className="bgDots">
        <circle cx="120" cy="130" r="3" className="dotWarm" />
        <circle cx="260" cy="210" r="2.5" className="dotCool" />
        <circle cx="380" cy="160" r="3" className="dotWarm" />
        <circle cx="520" cy="250" r="2.5" className="dotCool" />
        <circle cx="640" cy="190" r="3" className="dotWarm" />
        <circle cx="770" cy="260" r="2.5" className="dotCool" />
        <circle cx="900" cy="210" r="3" className="dotWarm" />
        <circle cx="1040" cy="110" r="3" className="dotWarm" />

        <circle cx="240" cy="520" r="3" className="dotCool" />
        <circle cx="360" cy="460" r="2.5" className="dotWarm" />
        <circle cx="520" cy="540" r="3" className="dotCool" />
        <circle cx="680" cy="480" r="2.5" className="dotWarm" />
        <circle cx="820" cy="560" r="3" className="dotCool" />
        <circle cx="980" cy="500" r="2.5" className="dotWarm" />
        <circle cx="1090" cy="650" r="3" className="dotCool" />
        <circle cx="120" cy="680" r="3" className="dotWarm" />
      </g>
    </svg>
  );
}

export default App;
