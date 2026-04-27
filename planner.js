const STORAGE_KEY = "complete-planner-tasks-v2";
const CLASS_KEY = "complete-planner-classes-v2";
const NOTES_KEY = "complete-planner-notes-v2";
const THEME_KEY = "complete-planner-theme-v2";
const DATE_FORMAT_KEY = "complete-planner-date-format"; // "mdy" or "dmy"

let tasks = [];
let classes = [];
let selectedClass = null;

// Date helpers
function formatDateISO(date) {
  return date.toISOString().slice(0, 10); // yyyy-mm-dd
}

function formatDateDisplay(date) {
  const format = localStorage.getItem(DATE_FORMAT_KEY) || "mdy";
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  if (format === "dmy") {
    return `${d}/${m}/${y}`;
  }
  return `${m}/${d}/${y}`;
}

function todayStr() {
  return formatDateISO(new Date());
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateISO(d);
}

function formatTodayLabel() {
  return formatDateDisplay(new Date());
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
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  const root = document.documentElement;
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

  if (savedTheme === "light") {
    root.classList.add("light");
    if (icon && label) {
      icon.textContent = "☀";
      label.textContent = "Light";
    }
  } else {
    root.classList.remove("light");
    if (icon && label) {
      icon.textContent = "☾";
      label.textContent = "Dark";
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

  const due = dueInput.value || null; // yyyy-mm-dd
  const className = classSelect.value || null;

  tasks.push({
    id: Date.now(),
    text,
    due,
    className,
    done: false,
  });

  textInput.value = "";
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id
      ? {
          ...t,
          done: !t.done,
        }
      : t
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
      const d = new Date(task.due);
      dSpan.textContent = formatDateDisplay(d);
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

// Theme toggle button in header
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
    applySavedThemeToSettings();
  });
}

// Settings panel helpers
function applySavedDateFormatToUI() {
  const format = localStorage.getItem(DATE_FORMAT_KEY) || "mdy";
  const chips = document.querySelectorAll(".settings-chip[data-date-format]");
  chips.forEach((chip) => {
    if (chip.dataset.dateFormat === format) {
      chip.classList.add("settings-chip--active");
    } else {
      chip.classList.remove("settings-chip--active");
    }
  });
}

function applySavedThemeToSettings() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  const chips = document.querySelectorAll(".settings-chip[data-theme]");
  chips.forEach((chip) => {
    if (chip.dataset.theme === savedTheme) {
      chip.classList.add("settings-chip--active");
    } else {
      chip.classList.remove("settings-chip--active");
    }
  });
}

function openSettingsDrawer() {
  const drawer = document.getElementById("settingsDrawer");
  const backdrop = document.getElementById("settingsBackdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.classList.add("visible");
}

function closeSettingsDrawer() {
  const drawer = document.getElementById("settingsDrawer");
  const backdrop = document.getElementById("settingsBackdrop");
  if (!drawer || !backdrop) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("visible");
}

function setupSettingsPanel() {
  const themeChips = document.querySelectorAll(".settings-chip[data-theme]");
  const formatChips = document.querySelectorAll(
    ".settings-chip[data-date-format]"
  );
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");

  themeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const theme = chip.dataset.theme;
      const root = document.documentElement;

      if (theme === "light") {
        root.classList.add("light");
        localStorage.setItem(THEME_KEY, "light");
        if (themeIcon && themeLabel) {
          themeIcon.textContent = "☀";
          themeLabel.textContent = "Light";
        }
      } else {
        root.classList.remove("light");
        localStorage.setItem(THEME_KEY, "dark");
        if (themeIcon && themeLabel) {
          themeIcon.textContent = "☾";
          themeLabel.textContent = "Dark";
        }
      }
      applySavedThemeToSettings();
    });
  });

  formatChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const format = chip.dataset.dateFormat || "mdy";
      localStorage.setItem(DATE_FORMAT_KEY, format);
      applySavedDateFormatToUI();
      renderTasks();
      const todayDisplay = document.getElementById("todayDisplay");
      if (todayDisplay) {
        todayDisplay.textContent = formatTodayLabel();
      }
    });
  });

  applySavedThemeToSettings();
  applySavedDateFormatToUI();

  // Drawer open/close
  const openBtn = document.getElementById("settingsToggle");
  const closeBtn = document.getElementById("settingsClose");
  const backdrop = document.getElementById("settingsBackdrop");
  openBtn?.addEventListener("click", openSettingsDrawer);
  closeBtn?.addEventListener("click", closeSettingsDrawer);
  backdrop?.addEventListener("click", closeSettingsDrawer);
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  const todayDisplay = document.getElementById("todayDisplay");
  if (todayDisplay) {
    todayDisplay.textContent = formatTodayLabel();
  }

  loadState();
  renderClasses();
  renderTasks();
  setupNotes();
  setupThemeToggle();
  setupSettingsPanel();

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
