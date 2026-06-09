import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const emptyProject = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
};

const emptyTask = {
  title: '',
  description: '',
  deadline: '',
  priority: 'MEDIUM',
  status: 'TODO',
  projectId: '',
  assignedUserId: '',
};

const views = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kanban', label: 'Kanban Board' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
];

const statusColumns = ['TODO', 'IN_PROGRESS', 'DONE'];

const formatStatus = (status) => status.replace('_', ' ');

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [notice, setNotice] = useState('');
  const isAdmin = user?.role === 'ADMIN';

  const loadData = useCallback(async () => {
    try {
      const requests = [
        api.get('/tasks'),
        api.get('/projects'),
      ];

      if (isAdmin) {
        requests.push(api.get('/users'));
      }

      const [taskRes, projectRes, userRes] = await Promise.all(requests);
      setTasks(taskRes.data || []);
      setProjects(projectRes.data || []);
      setUsers(userRes?.data || []);
    } catch {
      setNotice('Cannot load data. Check backend, token, and SQL Server connection.');
    }
  }, [isAdmin]);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const visibleTasks = useMemo(() => {
    if (isAdmin) return tasks;
    return tasks.filter((task) => task.assignedUser?.id === user?.id);
  }, [isAdmin, tasks, user?.id]);

  const stats = useMemo(() => {
    const done = visibleTasks.filter((task) => task.status === 'DONE').length;
    const progress = visibleTasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const todo = visibleTasks.filter((task) => task.status === 'TODO').length;
    return { done, progress, todo, total: visibleTasks.length };
  }, [visibleTasks]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const createProject = async (event) => {
    event.preventDefault();
    await api.post('/projects', projectForm);
    setProjectForm(emptyProject);
    setNotice('Project created successfully.');
    loadData();
  };

  const createTask = async (event) => {
    event.preventDefault();
    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      deadline: taskForm.deadline,
      priority: taskForm.priority,
      status: taskForm.status,
      project: taskForm.projectId ? { id: Number(taskForm.projectId) } : null,
      assignedUser: taskForm.assignedUserId ? { id: Number(taskForm.assignedUserId) } : null,
    };
    await api.post('/tasks', payload);
    setTaskForm(emptyTask);
    setNotice('Task created and assigned successfully.');
    loadData();
  };

  const updateTaskStatus = async (task, status) => {
    await api.put(`/tasks/${task.id}`, { ...task, status });
    setNotice('Task status updated.');
    loadData();
  };

  const renderOverview = () => (
    <>
      <section className="hero-strip">
        <div>
          <p className="eyebrow">{isAdmin ? 'Admin Workspace' : 'My Workspace'}</p>
          <h1>{isAdmin ? 'Manage projects, tasks, and assignments' : 'Track your assigned work'}</h1>
          <p>
            {isAdmin
              ? 'Create projects, assign tasks to members, and monitor progress across the team.'
              : 'Focus on assigned tasks, deadlines, priorities, and status updates.'}
          </p>
        </div>
        <button className="btn compact" onClick={() => setActiveView(isAdmin ? 'tasks' : 'kanban')}>
          {isAdmin ? 'Create Task' : 'View Board'}
        </button>
      </section>

      <section className="stats-grid">
        <div className="metric-card"><span>Total Tasks</span><strong>{stats.total}</strong></div>
        <div className="metric-card"><span>To Do</span><strong>{stats.todo}</strong></div>
        <div className="metric-card"><span>In Progress</span><strong>{stats.progress}</strong></div>
        <div className="metric-card"><span>Done</span><strong>{stats.done}</strong></div>
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <h3>Recent Tasks</h3>
            <button className="link-button" onClick={() => setActiveView('tasks')}>View all</button>
          </div>
          <TaskTable tasks={visibleTasks.slice(0, 6)} onStatusChange={updateTaskStatus} canUpdate={!isAdmin} />
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Projects</h3></div>
          <div className="project-list">
            {projects.slice(0, 5).map((project) => (
              <div className="project-row" key={project.id}>
                <span>{project.name}</span>
                <small>{tasks.filter((task) => task.project?.id === project.id).length} tasks</small>
              </div>
            ))}
            {projects.length === 0 && <p className="muted">No projects yet.</p>}
          </div>
        </div>
      </section>
    </>
  );

  const renderKanban = () => (
    <div className="board-container">
      {statusColumns.map((status) => (
        <div className="board-column" key={status}>
          <div className="board-column-title">
            <span>{formatStatus(status)}</span>
            <span>{visibleTasks.filter((task) => task.status === status).length}</span>
          </div>
          {visibleTasks.filter((task) => task.status === status).map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} canUpdate={!isAdmin} />
          ))}
        </div>
      ))}
    </div>
  );

  const renderTasks = () => (
    <section className="content-grid">
      {isAdmin && (
        <div className="panel">
          <div className="panel-header"><h3>Create Task</h3></div>
          <form className="stack-form" onSubmit={createTask}>
            <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <textarea className="form-input" placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <input className="form-input" type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
            <select className="form-input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <select className="form-input" value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}>
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select className="form-input" value={taskForm.assignedUserId} onChange={(e) => setTaskForm({ ...taskForm, assignedUserId: e.target.value })}>
              <option value="">Assign user</option>
              {users.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.role})</option>)}
            </select>
            <button className="btn">Create Task</button>
          </form>
        </div>
      )}
      <div className={isAdmin ? 'panel wide' : 'panel full'}>
        <div className="panel-header"><h3>{isAdmin ? 'All Tasks' : 'My Tasks'}</h3></div>
        <TaskTable tasks={visibleTasks} onStatusChange={updateTaskStatus} canUpdate={!isAdmin} />
      </div>
    </section>
  );

  const renderProjects = () => (
    <section className="content-grid">
      {isAdmin && (
        <div className="panel">
          <div className="panel-header"><h3>Create Project</h3></div>
          <form className="stack-form" onSubmit={createProject}>
            <input className="form-input" placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
            <textarea className="form-input" placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
            <input className="form-input" type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} />
            <input className="form-input" type="date" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} />
            <button className="btn">Create Project</button>
          </form>
        </div>
      )}
      <div className={isAdmin ? 'panel wide' : 'panel full'}>
        <div className="panel-header"><h3>Project List</h3></div>
        <div className="cards-list">
          {projects.map((project) => (
            <div className="list-card" key={project.id}>
              <strong>{project.name}</strong>
              <p>{project.description || 'No description'}</p>
              <small>{project.startDate || 'N/A'} - {project.endDate || 'N/A'}</small>
            </div>
          ))}
          {projects.length === 0 && <p className="muted">No projects yet.</p>}
        </div>
      </div>
    </section>
  );

  const renderTeam = () => (
    <section className="panel full">
      <div className="panel-header"><h3>Team Members</h3></div>
      <div className="team-grid">
        {users.map((member) => (
          <div className="team-card" key={member.id}>
            <div className="avatar">{member.name?.slice(0, 2).toUpperCase() || 'US'}</div>
            <div>
              <strong>{member.name}</strong>
              <p>{member.email}</p>
              <span className="status-pill">{member.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>TF</span><strong>TaskFlow</strong></div>
        <nav>
          {views.map((view) => (
            <button key={view.id} className={activeView === view.id ? 'active' : ''} onClick={() => setActiveView(view.id)}>
              {view.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.slice(0, 2).toUpperCase() || 'ME'}</div>
          <div><strong>{user?.name}</strong><small>{user?.role}</small></div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h2>{views.find((view) => view.id === activeView)?.label}</h2>
            <p>{isAdmin ? 'Admin can create projects, assign work, and monitor team progress.' : 'User can view assigned tasks and update progress.'}</p>
          </div>
          <button className="btn compact secondary" onClick={handleLogout}>Logout</button>
        </header>

        {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>Dismiss</button></div>}

        {activeView === 'dashboard' && renderOverview()}
        {activeView === 'kanban' && renderKanban()}
        {activeView === 'tasks' && renderTasks()}
        {activeView === 'projects' && renderProjects()}
        {activeView === 'team' && renderTeam()}
      </main>
    </div>
  );
};

const TaskCard = ({ task, onStatusChange, canUpdate }) => (
  <div className="task-card">
    <div className="task-title">{task.title}</div>
    <div className="task-desc">{task.description || 'No description'}</div>
    <div className="task-meta">
      <span className={`priority-${(task.priority || 'LOW').toLowerCase()}`}>{task.priority}</span>
      <span>{task.deadline || 'No deadline'}</span>
    </div>
    <small>{task.project?.name || 'No project'} · {task.assignedUser?.name || 'Unassigned'}</small>
    {canUpdate && (
      <select className="form-input mini" value={task.status} onChange={(e) => onStatusChange(task, e.target.value)}>
        {statusColumns.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
      </select>
    )}
  </div>
);

const TaskTable = ({ tasks, onStatusChange, canUpdate }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Project</th>
          <th>Assignee</th>
          <th>Priority</th>
          <th>Deadline</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td><strong>{task.title}</strong><small>{task.description}</small></td>
            <td>{task.project?.name || '-'}</td>
            <td>{task.assignedUser?.name || '-'}</td>
            <td><span className={`priority-${(task.priority || 'LOW').toLowerCase()}`}>{task.priority}</span></td>
            <td>{task.deadline || '-'}</td>
            <td>
              {canUpdate ? (
                <select className="form-input mini" value={task.status} onChange={(e) => onStatusChange(task, e.target.value)}>
                  {statusColumns.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                </select>
              ) : (
                <span className="status-pill">{formatStatus(task.status || 'TODO')}</span>
              )}
            </td>
          </tr>
        ))}
        {tasks.length === 0 && (
          <tr><td colSpan="6" className="empty-cell">No tasks found.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

export default Dashboard;
