const STORAGE_KEY = "complete-planner-tasks-v1";
const CLASS_KEY = "complete-planner-classes-v1";
const THEME_KEY = "complete-planner-theme-v1";

let tasks = [];
let classes = [];
let selectedClass = null;

// Load
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const savedClasses = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
    const savedTheme = localStorage.getItem(THEME_KEY);

    tasks = saved;
    classes = savedClasses;

    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.getElementById("themeIcon").textContent = "☀";
      document.getElementById("themeLabel").textContent = "Light";
    }
  } catch (e) {
    tasks = [];
    classes = [];
  }
}

// Save
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(CLASS_KEY, JSON.stringify(classes));
}

// Helpers
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Add/remove classes
function addClass() {
  const input = document.getElementById("classInput");
  const name = input.value.trim();
  if (!name) return;
  if (!classes.includes(name)) {
    classes.push(name);
    saveState();
    renderClasses();
  }
  input.value = "";
}

function selectClass(name) {
  selectedClass = selectedClass === name ? null : name;
  renderClasses();
  renderTasks();
}

function renderClasses() {
  const container = document.getElementById("classChips");
  container.innerHTML = "";
  classes.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "class-chip" + (selectedClass === name ? " class-chip--active" : "");
    btn.textContent = name;
    btn.onclick = () => selectClass(name);
    container.appendChild(btn);
  });
}

// Task ops
function addTask() {
  const textInput = document.getElementById("taskInput");
  const dueInput = document.getElementById("dueInput");
  const text = textInput.value.trim();
  const dueDate = dueInput.value || null;

  if (!text) return;

  tasks.push({
    id: Date.now(),
    text,
    due: dueDate,
    done: false,
    className: selectedClass
  });

  textInput.value = "";
  saveState();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveState();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.done);
  saveState();
  renderTasks();
}

// Rendering
function renderTasks() {
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const listToday = document.getElementById("list-today");
  const listTomorrow = document.getElementById("list-tomorrow");
  const listUpcoming = document.getElementById("list-upcoming");

  listToday.innerHTML = "";
  listTomorrow.innerHTML = "";
  listUpcoming.innerHTML = "";

  let todayCount = 0;
  let tomorrowCount = 0;
  let upcomingCount = 0;

  const filtered = selectedClass
    ? tasks.filter((t) => t.className === selectedClass)
    : tasks;

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " task--done" : "");

    const label = document.createElement("label");
    label.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.onchange = () => toggleTask(task.id);

    const body = document.createElement("div");
    body.className = "task-body";

    const top = document.createElement("div");
    top.className = "task-top";

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;

    top.appendChild(textSpan);

    const meta = document.createElement("div");
    meta.className = "task-meta-line";

    if (task.className) {
      const cSpan = document.createElement("span");
      cSpan.className = "task-class";
      cSpan.textContent = task.className;
      meta.appendChild(cSpan);
    }

    if (task.due) {
      const dueSpan = document.createElement("span");
      dueSpan.className = "task-due";
      dueSpan.textContent = task.due;
      meta.appendChild(dueSpan);
    }

    body.appendChild(top);
    if (meta.childNodes.length > 0) {
      body.appendChild(meta);
    }

    label.appendChild(checkbox);
    label.appendChild(body);
    li.appendChild(label);

    // section
    if (task.due === today) {
      listToday.appendChild(li);
      todayCount++;
    } else if (task.due === tomorrow) {
      listTomorrow.appendChild(li);
      tomorrowCount++;
    } else {
      listUpcoming.appendChild(li);
      upcomingCount++;
    }
  });

  document.getElementById("todayCount").textContent = todayCount;
  document.getElementById("tomorrowCount").textContent = tomorrowCount;
  document.getElementById("upcomingCount").textContent = upcomingCount;
  document.getElementById("taskCount").textContent = tasks.length;
}

// Theme toggle
function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

  btn.addEventListener("click", () => {
    const root = document.documentElement;
    const isLight = root.classList.toggle("light");
    if (isLight) {
      icon.textContent = "☀";
      label.textContent = "Light";
      localStorage.setItem(THEME_KEY, "light");
    } else {
      icon.textContent = "☾";
      label.textContent = "Dark";
      localStorage.setItem(THEME_KEY, "dark");
    }
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderClasses();
  renderTasks();
  setupThemeToggle();
});
