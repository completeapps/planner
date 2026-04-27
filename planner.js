const STORAGE_KEY = "complete-planner-tasks-v2";
const CLASS_KEY = "complete-planner-classes-v2";
const NOTES_KEY = "complete-planner-notes-v2";
const THEME_KEY = "complete-planner-theme-v2";

let tasks = [];
let classes = [];
let selectedClass = null;

// Date helpers
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatTodayLabel() {
  const d = new Date();
  const opts = { weekday: "long", month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

// Load state
function loadState() {
  try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    classes = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
  } catch {
    tasks = [];
    classes = [];
  }

  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
    const icon = document.getElementById("themeIcon");
    const label = document.getElementById("themeLabel");
    if (icon && label) {
      icon.textContent = "☀";
      label.textContent = "Light";
    }
  }

  // Notes
  const savedNotes = localStorage.getItem(NOTES_KEY);
  const notesArea = document.getElementById("notesArea");
  if (notesArea && savedNotes != null) {
    notesArea.value = savedNotes;
  }
}

// Save state
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveClasses() {
  localStorage.setItem(CLASS_KEY, JSON.stringify(classes));
}

// Classes
function addClass() {
  const input = document.getElementById("classInput");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  if (!classes.includes(name)) {
    classes.push(name);
    saveClasses();
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
  const chips = document.getElementById("classChips");
  const select = document.getElementById("classSelect");
  if (!chips || !select) return;

  chips.innerHTML = "";
  select.innerHTML = "";
  const optNone = document.createElement("option");
  optNone.value = "";
  optNone.textContent = "No class";
  select.appendChild(optNone);

  classes.forEach((name) => {
    // chip
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className =
      "class-chip" + (selectedClass === name ? " class-chip--active" : "");
    chip.textContent = name;
    chip.onclick = () => selectClass(name);
    chips.appendChild(chip);

    // select option
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// Tasks
function addTask() {
  const textInput = document.getElementById("taskInput");
  const dueInput = document.getElementById("dueInput");
  const classSelect = document.getElementById("classSelect");
  if (!textInput || !dueInput || !classSelect) return;

  const text = textInput.value.trim();
  if (!text) return;

  const due = dueInput.value || null;
  const className = classSelect.value || null;

  tasks.push({
    id: Date.now(),
    text,
    due,
    className,
    done: false
  });

  textInput.value = "";
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  renderTasks();
}

function isOverdue(task) {
  if (!task.due) return false;
  if (task.done) return false;
  const today = todayStr();
  return task.due < today;
}

function renderTasks() {
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const todayList = document.getElementById("list-today");
  const tomorrowList = document.getElementById("list-tomorrow");
  const upcomingList = document.getElementById("list-upcoming");
  const todayEmpty = document.getElementById("todayEmpty");
  const tomorrowEmpty = document.getElementById("tomorrowEmpty");
  const upcomingEmpty = document.getElementById("upcomingEmpty");
  const todayCountEl = document.getElementById("todayCount");
  const tomorrowCountEl = document.getElementById("tomorrowCount");
  const upcomingCountEl = document.getElementById("upcomingCount");
  const totalCountEl = document.getElementById("taskCount");

  if (
    !todayList ||
    !tomorrowList ||
    !upcomingList ||
    !todayEmpty ||
    !tomorrowEmpty ||
    !upcomingEmpty
  ) {
    return;
  }

  todayList.innerHTML = "";
  tomorrowList.innerHTML = "";
  upcomingList.innerHTML = "";

  let todayCount = 0;
  let tomorrowCount = 0;
  let upcomingCount = 0;

  const filtered = selectedClass
    ? tasks.filter((t) => t.className === selectedClass)
    : tasks;

  filtered.forEach((task) => {
    const li = document.createElement("li");
    const overdue = isOverdue(task);
    li.className =
      "task" +
      (task.done ? " task--done" : "") +
      (overdue ? " task--overdue" : "");

    const label = document.createElement("label");
    label.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
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
      const dSpan = document.createElement("span");
      dSpan.className = "task-due";
      dSpan.textContent = task.due;
      meta.appendChild(dSpan);
    }

    body.appendChild(top);
    if (meta.childNodes.length > 0) {
      body.appendChild(meta);
    }

    label.appendChild(checkbox);
    label.appendChild(body);
    li.appendChild(label);

    // Decide which section
    if (task.due === today) {
      todayList.appendChild(li);
      todayCount++;
    } else if (task.due === tomorrow) {
      tomorrowList.appendChild(li);
      tomorrowCount++;
    } else {
      upcomingList.appendChild(li);
      upcomingCount++;
    }
  });

  // Counts
  if (todayCountEl) todayCountEl.textContent = todayCount;
  if (tomorrowCountEl) tomorrowCountEl.textContent = tomorrowCount;
  if (upcomingCountEl) upcomingCountEl.textContent = upcomingCount;
  if (totalCountEl) totalCountEl.textContent = tasks.length;

  // Empty states
  todayEmpty.style.display = todayCount === 0 ? "block" : "none";
  tomorrowEmpty.style.display = tomorrowCount === 0 ? "block" : "none";
  upcomingEmpty.style.display = upcomingCount === 0 ? "block" : "none";
}

// Notes
function setupNotes() {
  const notesArea = document.getElementById("notesArea");
  if (!notesArea) return;
  notesArea.addEventListener("input", () => {
    localStorage.setItem(NOTES_KEY, notesArea.value);
  });
}

// Theme toggle
function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");
  if (!btn || !icon || !label) return;

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
  // Today label
  const todayDisplay = document.getElementById("todayDisplay");
  if (todayDisplay) {
    todayDisplay.textContent = formatTodayLabel();
  }

  loadState();
  renderClasses();
  renderTasks();
  setupNotes();
  setupThemeToggle();

  // Button events
  const addClassBtn = document.getElementById("addClassBtn");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");

  if (addClassBtn) addClassBtn.addEventListener("click", addClass);
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
  if (clearCompletedBtn)
    clearCompletedBtn.addEventListener("click", clearCompleted);

  const taskInput = document.getElementById("taskInput");
  if (taskInput) {
    taskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addTask();
      }
    });
  }
});
