import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const defaultAuth = {
  mode: "login",
  name: "",
  email: "",
  password: ""
};

const defaultProject = { name: "", description: "" };
const defaultMember = { projectId: "", email: "", role: "MEMBER" };
const defaultTask = { title: "", description: "", dueDate: "", projectId: "", assignedTo: "" };

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
  );
  const [authForm, setAuthForm] = useState(defaultAuth);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projectForm, setProjectForm] = useState(defaultProject);
  const [memberForm, setMemberForm] = useState(defaultMember);
  const [taskForm, setTaskForm] = useState(defaultTask);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const projectMembers = useMemo(() => {
    const project = projects.find((p) => p._id === taskForm.projectId);
    return project?.members || [];
  }, [projects, taskForm.projectId]);

  useEffect(() => {
    if (token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const authedFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || "Request failed");
    }

    return response.json();
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, taskData, summaryData] = await Promise.all([
        authedFetch("/projects"),
        authedFetch("/tasks"),
        authedFetch("/tasks/dashboard/summary")
      ]);
      setProjects(projectData);
      setTasks(taskData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const endpoint = authForm.mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload =
        authForm.mode === "signup"
          ? { name: authForm.name, email: authForm.email, password: authForm.password }
          : { email: authForm.email, password: authForm.password };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || "Authentication failed");
      }

      setToken(body.token);
      setUser(body.user);
      localStorage.setItem("token", body.token);
      localStorage.setItem("user", JSON.stringify(body.user));
      setAuthForm(defaultAuth);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setProjects([]);
    setTasks([]);
    setSummary(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const createProject = async (event) => {
    event.preventDefault();
    try {
      await authedFetch("/projects", {
        method: "POST",
        body: JSON.stringify(projectForm)
      });
      setProjectForm(defaultProject);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    try {
      await authedFetch(`/projects/${memberForm.projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: memberForm.email, role: memberForm.role })
      });
      setMemberForm(defaultMember);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      await authedFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm)
      });
      setTaskForm(defaultTask);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await authedFetch(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <main className="container">
        <h1>Team Task Manager</h1>
        <p>Create projects, manage members, and track tasks.</p>
        {error && <p className="error">{error}</p>}
        <form className="card" onSubmit={handleAuth}>
          <h2>{authForm.mode === "signup" ? "Sign up" : "Log in"}</h2>
          {authForm.mode === "signup" && (
            <input
              placeholder="Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
          <button type="submit">Continue</button>
          <button
            type="button"
            className="muted"
            onClick={() =>
              setAuthForm({ ...authForm, mode: authForm.mode === "signup" ? "login" : "signup" })
            }
          >
            Switch to {authForm.mode === "signup" ? "login" : "signup"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="row-between">
        <div>
          <h1>Team Task Manager</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="actions">
          <button onClick={loadData} disabled={loading}>
            Refresh
          </button>
          <button className="muted" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {summary && (
        <section className="grid summary">
          <div className="card">My Tasks: {summary.myTasks}</div>
          <div className="card">Todo: {summary.status.TODO}</div>
          <div className="card">In Progress: {summary.status.IN_PROGRESS}</div>
          <div className="card">Done: {summary.status.DONE}</div>
          <div className="card">Overdue: {summary.overdue}</div>
        </section>
      )}

      <section className="grid">
        <form className="card" onSubmit={createProject}>
          <h3>Create Project</h3>
          <input
            placeholder="Project name"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
          />
          <button type="submit">Create</button>
        </form>

        <form className="card" onSubmit={addMember}>
          <h3>Add Member</h3>
          <select
            value={memberForm.projectId}
            onChange={(e) => setMemberForm({ ...memberForm, projectId: e.target.value })}
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option value={project._id} key={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <input
            type="email"
            placeholder="Member email"
            value={memberForm.email}
            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            required
          />
          <select
            value={memberForm.role}
            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
          >
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <form className="card" onSubmit={createTask}>
          <h3>Create Task</h3>
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            required
          />
          <select
            value={taskForm.projectId}
            onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value, assignedTo: "" })}
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option value={project._id} key={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={taskForm.assignedTo}
            onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
            required
          >
            <option value="">Assign to</option>
            {projectMembers.map((member) => (
              <option value={member.user._id} key={member.user._id}>
                {member.user.name} ({member.role})
              </option>
            ))}
          </select>
          <button type="submit">Create Task</button>
        </form>
      </section>

      <section className="card">
        <h3>Tasks</h3>
        {!tasks.length && <p>No tasks yet. Create one above.</p>}
        {tasks.map((task) => (
          <article className="task" key={task._id}>
            <div>
              <strong>{task.title}</strong>
              <p>{task.project?.name || "Unknown Project"}</p>
              <p>
                Assigned to {task.assignedTo?.name || "Unknown"} | Due{" "}
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
            <select value={task.status} onChange={(e) => updateTaskStatus(task._id, e.target.value)}>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
