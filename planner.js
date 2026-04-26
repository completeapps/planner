// THEME TOGGLE
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

function applyTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('planner-theme', theme);
  if (theme === 'light') {
    themeIcon.textContent = '☀';
    themeLabel.textContent = 'Light';
  } else {
    themeIcon.textContent = '☾';
    themeLabel.textContent = 'Dark';
  }
}

const savedTheme = localStorage.getItem('planner-theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// DATA
let tasks = JSON.parse(localStorage.getItem('planner-tasks-v3')) || [];
let classes = JSON.parse(localStorage.getItem('planner-classes')) || [];
let selectedClassId = null;

const taskInput = document.getElementById('taskInput');
const dueInput = document.getElementById('dueInput');
const taskCount = document.getElementById('taskCount');

const todayList = document.getElementById('list-today');
const tomorrowList = document.getElementById('list-tomorrow');
const upcomingList = document.getElementById('list-upcoming');
const todayCount = document.getElementById('todayCount');
const tomorrowCount = document.getElementById('tomorrowCount');
const upcomingCount = document.getElementById('upcomingCount');

const classChips = document.getElementById('classChips');
const classInput = document.getElementById('classInput');

// DATE HELPERS
function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayTomorrow() {
  const now = new Date();
  const todayStr = toDateOnlyString(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = toDateOnlyString(tomorrow);
  return { todayStr, tomorrowStr };
}

function getDateBadge(taskDateStr) {
  if (!taskDateStr) return { label: 'No date set', className: '' };

  const { todayStr, tomorrowStr } = getTodayTomorrow();
  const today = new Date(todayStr);
  const due = new Date(taskDateStr);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (taskDateStr === todayStr) return { label: 'Due today', className: 'soon' };
  if (taskDateStr === tomorrowStr) return { label: 'Due tomorrow', className: 'soon' };
  if (diffDays < 0) return { label: 'PAST DUE', className: 'overdue' };
  return { label: `Due ${taskDateStr}`, className: '' };
}

// CLASSES
function getClassById(id) {
  return classes.find(c => c.id === id) || null;
}

function renderClasses() {
  classChips.innerHTML = '';
  classes.forEach(cls => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'class-chip' + (cls.id === selectedClassId ? ' selected' : '');
    chip.textContent = cls.name;
    chip.onclick = () => {
      selectedClassId = cls.id === selectedClassId ? null : cls.id;
      renderClasses();
    };
    classChips.appendChild(chip);
  });
}

function addClass() {
  const name = classInput.value.trim();
  if (!name) return;
  const id = Date.now().toString();
  classes.push({ id, name });
  classInput.value = '';
  selectedClassId = id;
  renderClasses();
  saveAll();
}

// STORAGE
function saveAll() {
  localStorage.setItem('planner-tasks-v3', JSON.stringify(tasks));
  localStorage.setItem('planner-classes', JSON.stringify(classes));
}

// NOTIFICATIONS
function canUseNotifications() {
  return 'Notification' in window;
}

function requestNotificationPermissionOnce() {
  if (!canUseNotifications()) return;

  const key = 'planner-notif-permission-requested';
  const alreadyAsked = localStorage.getItem(key);
  if (alreadyAsked) return;

  Notification.requestPermission().then(result => {
    localStorage.setItem(key, '1');
    console.log('Notification permission:', result);
  });
}

function notifyIfOverdueOrToday(stats) {
  if (!canUseNotifications()) return;
  if (Notification.permission !== 'granted') return;

  const totalCritical = stats.overdue + stats.today;
  if (totalCritical <= 0) return;

  const title = 'Homework planner reminder';
  const body = `You have ${stats.overdue} overdue and ${stats.today} due today.`;

  try {
    new Notification(title, { body });
  } catch (e) {
    console.log('Notification error:', e);
  }
}

// RENDER TASKS
function renderTasks() {
  todayList.innerHTML = '';
  tomorrowList.innerHTML = '';
  upcomingList.innerHTML = '';

  const { todayStr, tomorrowStr } = getTodayTomorrow();

  let todayNum = 0, tomorrowNum = 0, upcomingNum = 0;
  let overdueNum = 0;

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const badge = getDateBadge(task.due || null);
    const statusClass = task.completed ? 'inactive' : 'active';
    const cls = task.classId ? getClassById(task.classId) : null;

    if (badge.className === 'overdue' && !task.completed) {
      li.classList.add('overdue-row');
      overdueNum++;
    }

    li.innerHTML = `
      <div class="task-main">
        <div class="task-top-row">
          <span class="status-dot ${statusClass}"></span>
          <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        </div>
        <div class="task-meta-row">
          <span class="task-date ${badge.className}">${badge.label}</span>
          ${cls ? `<span class="class-pill">${cls.name}</span>` : ''}
        </div>
      </div>
      <div class="task-controls">
        <label>
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
          Done
        </label>
        <button class="delete-btn" onclick="deleteTask(${index})">✕</button>
      </div>
    `;

    const due = task.due || null;

    if (due === todayStr) {
      todayList.appendChild(li);
      todayNum++;
    } else if (due === tomorrowStr) {
      tomorrowList.appendChild(li);
      tomorrowNum++;
    } else {
      upcomingList.appendChild(li);
      upcomingNum++;
    }
  });

  taskCount.textContent = tasks.length;
  todayCount.textContent = todayNum;
  tomorrowCount.textContent = tomorrowNum;
  upcomingCount.textContent = upcomingNum;

  const stats = {
    total: tasks.length,
    overdue: overdueNum,
    today: todayNum,
    tomorrow: tomorrowNum
  };

  saveAll();
  notifyIfOverdueOrToday(stats);
}

// TASK CRUD
function addTask() {
  const text = taskInput.value.trim();
  const due = dueInput.value.trim(); // yyyy-mm-dd or empty
  if (!text) return;

  tasks.unshift({
    text,
    completed: false,
    due: due || null,
    classId: selectedClassId
  });

  taskInput.value = '';
  dueInput.value = '';
  renderTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

function deleteTask(index) {
  const allLis = document.querySelectorAll('li.task-item');
  const li = allLis[index];
  if (li) {
    li.classList.add('removing');
    setTimeout(() => {
      tasks.splice(index, 1);
      renderTasks();
    }, 150);
  } else {
    tasks.splice(index, 1);
    renderTasks();
  }
}

function clearCompleted() {
  tasks = tasks.filter(task => !task.completed);
  renderTasks();
}

// EVENTS
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

window.addEventListener('load', () => {
  taskInput.focus();
  renderClasses();
  renderTasks();
  requestNotificationPermissionOnce();
});
