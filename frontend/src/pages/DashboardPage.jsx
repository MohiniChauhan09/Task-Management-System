import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const statuses = ["All", "Pending", "Completed"];

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = async (nextFilter = filter) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTasks(token, nextFilter);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(filter);
  }, [filter]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "Completed").length;
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed
    };
  }, [tasks]);

  const createTask = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.createTask(token, { title, description });
      setTitle("");
      setDescription("");
      await loadTasks(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markCompleted = async (taskId) => {
    try {
      await api.completeTask(token, taskId);
      await loadTasks(filter);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTask = async (taskId) => {
    try {
      await api.deleteTask(token, taskId);
      await loadTasks(filter);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p>Stay on top of your priorities.</p>
        </div>
        <button type="button" className="ghost-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="stats-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </article>
      </section>

      <section className="card">
        <h2>Create task</h2>
        <form className="task-form" onSubmit={createTask}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ship assignment"
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Break it down into clear steps"
            />
          </label>
          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="tasks-head">
          <h2>Your tasks</h2>
          <div className="filter-row">
            {statuses.map((status) => (
              <button
                key={status}
                className={`chip ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">No tasks in this view.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <div>
                  <div className="title-row">
                    <h3>{task.title}</h3>
                    <span className={`badge ${task.status.toLowerCase()}`}>{task.status}</span>
                  </div>
                  <p>{task.description || "No description"}</p>
                  <small>{new Date(task.created_at).toLocaleString()}</small>
                </div>
                <div className="actions">
                  {task.status !== "Completed" && (
                    <button className="success-btn" onClick={() => markCompleted(task.id)} type="button">
                      Complete
                    </button>
                  )}
                  <button className="danger-btn" onClick={() => removeTask(task.id)} type="button">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
