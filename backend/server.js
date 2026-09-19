require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const hasDatabaseConfig = [
  process.env.DB_USER,
  process.env.DB_HOST,
  process.env.DB_NAME,
  process.env.DB_PASSWORD,
  process.env.DB_PORT,
].every(Boolean);

let memoryTasks = [];
let nextTaskId = 1;

// ===============================
// GET ALL TASKS
// ===============================
app.get("/api/tasks", async (req, res) => {
  try {
    if (!hasDatabaseConfig) {
      return res.json(memoryTasks);
    }

    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET error:", error);

    res.status(500).json({
      error: "Failed to get tasks"
    });
  }
});


// ===============================
// ADD TASK
// ===============================
app.post("/api/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Task title is required"
      });
    }

    if (!hasDatabaseConfig) {
      const task = { id: nextTaskId++, title: title.trim() };
      memoryTasks.unshift(task);
      return res.status(201).json(task);
    }

    const result = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
      [title.trim()]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("POST error:", error);

    res.status(500).json({
      error: "Failed to add task"
    });
  }
});


// ===============================
// DELETE TASK
// ===============================
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Deleting task ID:", id);

    if (!hasDatabaseConfig) {
      const taskIndex = memoryTasks.findIndex((task) => task.id === Number(id));

      if (taskIndex === -1) {
        return res.status(404).json({
          error: "Task not found"
        });
      }

      const [task] = memoryTasks.splice(taskIndex, 1);
      return res.json({
        message: "Task deleted successfully",
        task
      });
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    console.log("Deleted task:", result.rows[0]);

    res.json({
      message: "Task deleted successfully",
      task: result.rows[0]
    });

  } catch (error) {
    console.error("DELETE error:", error);

    res.status(500).json({
      error: "Failed to delete task"
    });
  }
});


// ===============================
// UPDATE TASK
// ===============================
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    console.log("Updating task ID:", id);
    console.log("New title:", title);

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Task title is required"
      });
    }

    if (!hasDatabaseConfig) {
      const task = memoryTasks.find((item) => item.id === Number(id));

      if (!task) {
        return res.status(404).json({
          error: "Task not found"
        });
      }

      task.title = title.trim();
      return res.json(task);
    }

    const result = await pool.query(
      "UPDATE tasks SET title = $1 WHERE id = $2 RETURNING *",
      [title.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    console.log("Updated task:", result.rows[0]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("PUT error:", error);

    res.status(500).json({
      error: "Failed to update task"
    });
  }
});


// ===============================
// START SERVER
// ===============================
app.listen(3002, "0.0.0.0", () => {
  console.log("HTTP API running on port 3002");
});
