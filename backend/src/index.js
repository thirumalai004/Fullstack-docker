import express from "express";
import cors from "cors";
import { pool, initDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.get("/api/todos", wrap(async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM todos ORDER BY id DESC");
  res.json(rows);
}));

app.post("/api/todos", wrap(async (req, res) => {
  const title = (req.body?.title || "").trim();
  if (!title) return res.status(400).json({ error: "Title is required" });
  const { rows } = await pool.query(
    "INSERT INTO todos (title) VALUES ($1) RETURNING *",
    [title]
  );
  res.status(201).json(rows[0]);
}));

app.patch("/api/todos/:id", wrap(async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE todos SET done = NOT done WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
}));

app.delete("/api/todos/:id", wrap(async (req, res) => {
  await pool.query("DELETE FROM todos WHERE id = $1", [req.params.id]);
  res.status(204).end();
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 5000;

initDb()
  .then(() => app.listen(port, "0.0.0.0", () => console.log(`API listening on ${port}`)))
  .catch((err) => {
    console.error("Database init failed:", err);
    process.exit(1);
  });
