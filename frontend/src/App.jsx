import { useEffect, useState } from "react";

const api = async (path, options) => {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.status === 204 ? null : res.json();
};

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    api("/health").then(() => setHealth("connected")).catch(() => setHealth("offline"));
    api("/todos").then(setTodos).catch((e) => setError(e.message));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const todo = await api("/todos", { method: "POST", body: JSON.stringify({ title }) });
      setTodos([todo, ...todos]);
      setTitle("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (id) => {
    try {
      const updated = await api(`/todos/${id}`, { method: "PATCH" });
      setTodos(todos.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`/todos/${id}`, { method: "DELETE" });
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app">
      <header>
        <h1>My Task Tracker</h1>
        <span className={`status ${health}`}>API {health}</span>
      </header>

      <form onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task"
          aria-label="New task"
        />
        <button type="submit">Add task</button>
      </form>

      {error && <p className="error">{error}</p>}

      {todos.length === 0 ? (
        <p className="empty">No tasks yet. Add your first one above.</p>
      ) : (
        <ul>
          {todos.map((t) => (
            <li key={t.id} className={t.done ? "done" : ""}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                <span>{t.title}</span>
              </label>
              <button className="ghost" onClick={() => remove(t.id)} aria-label={`Delete ${t.title}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
