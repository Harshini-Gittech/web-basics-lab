/* =========================================================================
   STULEAVE - Improved script.js
   Cleaner, safer, modular, no global onload overrides.
   Plays nicely with student_home.html, faculty_home.html, admin_home.html
   ========================================================================= */

/* ----------------------- Small utilities ----------------------- */
const STORAGE = {
  students: "students",
  faculty: "faculty",
  requests: "leaveRequests",
  loggedStudent: "loggedInStudent",
  loggedFaculty: "loggedInFaculty",
};

const q = selector => document.querySelector(selector);
const qa = selector => Array.from(document.querySelectorAll(selector));

const nowString = () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const load = key => JSON.parse(localStorage.getItem(key) || "[]");

const uid = () => Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);

/* ----------------------- Notifications ----------------------- */
function showStatusMessage(msg, el = "#statusMsg", timeout = 3000) {
  const node = document.querySelector(el);
  if (!node) return;
  node.textContent = msg;
  node.style.opacity = 1;
  setTimeout(() => node.style.opacity = 0, timeout);
}

/* ----------------------- LOGIN ----------------------- */
function login() {
  const userType = q("#userType")?.value;
  const username = q("#username")?.value.trim();
  const password = q("#password")?.value.trim();

  if (!userType || !username || !password) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  if (userType === "student") {
    const students = load(STORAGE.students);
    const match = students.find(s => s.id === username && s.pass === password);
    if (match) {
      localStorage.setItem(STORAGE.loggedStudent, JSON.stringify(match));
      window.location.href = "student_home.html";
    } else {
      alert("❌ Invalid Student ID or Password!");
    }
    return;
  }

  if (userType === "faculty") {
    const faculty = load(STORAGE.faculty);
    const match = faculty.find(f => f.id === username && f.pass === password);
    if (match) {
      localStorage.setItem(STORAGE.loggedFaculty, JSON.stringify(match));
      window.location.href = "faculty_home.html";
    } else {
      alert("❌ Invalid Faculty ID or Password!");
    }
    return;
  }

  if (userType === "admin") {
    if (username === "admin" && password === "admin123") {
      window.location.href = "admin_home.html";
    } else {
      alert("❌ Invalid Admin ID or Password!");
    }
  }
}

/* ----------------------- STUDENT ----------------------- */
function applyLeave() {
  const reason = q("#reason")?.value?.trim();
  const days = q("#days")?.value?.trim();
  const startDate = q("#startDate")?.value;
  const endDate = q("#endDate")?.value;
  const assignedFaculty = q("#facultySelect")?.value;

  if (!reason || !days || !startDate || !endDate || !assignedFaculty) {
    alert("⚠️ Please fill all fields (including faculty)!");
    return;
  }

  const student = JSON.parse(localStorage.getItem(STORAGE.loggedStudent) || "null");
  const leaveRequest = {
    id: uid(),
    user: student ? student.id : "Unknown",
    reason,
    days,
    startDate,
    endDate,
    status: "Pending",
    assignedFaculty,
    time: nowString()
  };

  const requests = load(STORAGE.requests);
  requests.push(leaveRequest);
  save(STORAGE.requests, requests);

  showStatusMessage("✅ Leave request submitted!", "#statusMsg", 2500);
  loadStudentLeaves();
}

/* Renders the student's own leave rows */
function loadStudentLeaves() {
  const table = q("#studentLeaveTable");
  if (!table) return;

  const student = JSON.parse(localStorage.getItem(STORAGE.loggedStudent) || "null");
  if (!student) {
    table.innerHTML = `<tr><td colspan="7">Please login as a student to view leaves.</td></tr>`;
    return;
  }

  const requests = load(STORAGE.requests)
    .filter(r => r.user === student.id)
    .sort((a, b) => b.id.localeCompare(a.id)); // newest first

  if (requests.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted)">No leave requests yet.</td></tr>`;
    return;
  }

  table.innerHTML = requests.map(r => `
    <tr>
      <td>${escapeHtml(r.reason)}</td>
      <td>${escapeHtml(r.days)}</td>
      <td>${escapeHtml(r.startDate)}</td>
      <td>${escapeHtml(r.endDate)}</td>
      <td>${escapeHtml(r.assignedFaculty)}</td>
      <td><span class="badge ${r.status.toLowerCase()}">${escapeHtml(r.status)}</span></td>
      <td><button class="btn btn-danger" onclick="deleteStudentLeave('${r.id}')">🗑 Delete</button></td>
    </tr>
  `).join("");
}

/* Delete student leave (only their own) */
function deleteStudentLeave(requestId) {
  if (!confirm("Delete this leave request?")) return;
  let requests = load(STORAGE.requests);
  const student = JSON.parse(localStorage.getItem(STORAGE.loggedStudent) || "null");
  requests = requests.filter(r => !(r.id === requestId && r.user === student.id));
  save(STORAGE.requests, requests);
  loadStudentLeaves();
}

/* ----------------------- FACULTY ----------------------- */
function loadFacultyRequests() {
  const table = q("#facultyLeaveTable");
  if (!table) return;

  const faculty = JSON.parse(localStorage.getItem(STORAGE.loggedFaculty) || "null");
  if (!faculty) {
    table.innerHTML = `<tr><td colspan="8">Please login as faculty to view requests.</td></tr>`;
    return;
  }

  const requests = load(STORAGE.requests)
    .filter(r => r.assignedFaculty === faculty.id)
    .sort((a, b) => b.id.localeCompare(a.id));

  if (requests.length === 0) {
    table.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted)">No requests assigned to you.</td></tr>`;
    return;
  }

  // Build rows with select controls unique per request
  table.innerHTML = requests.map(r => `
    <tr>
      <td>${escapeHtml(r.user)}</td>
      <td>${escapeHtml(r.reason)}</td>
      <td>${escapeHtml(r.days)}</td>
      <td>${escapeHtml(r.startDate)}</td>
      <td>${escapeHtml(r.endDate)}</td>
      <td>${escapeHtml(r.time)}</td>
      <td>
        <select data-reqid="${r.id}" class="status-select">
          <option value="Pending" ${r.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Approved" ${r.status === "Approved" ? "selected" : ""}>Approved</option>
          <option value="Rejected" ${r.status === "Rejected" ? "selected" : ""}>Rejected</option>
        </select>
      </td>
    </tr>
  `).join("");
}

/* Save faculty decisions by reading select elements */
function submitFacultyDecisions() {
  const faculty = JSON.parse(localStorage.getItem(STORAGE.loggedFaculty) || "null");
  if (!faculty) { alert("Please login as faculty."); return; }

  const selects = qa("select.status-select");
  if (selects.length === 0) { alert("No decisions to save."); return; }

  let requests = load(STORAGE.requests);
  let changed = 0;

  selects.forEach(sel => {
    const id = sel.dataset.reqid;
    const newStatus = sel.value;
    const idx = requests.findIndex(r => r.id === id && r.assignedFaculty === faculty.id);
    if (idx !== -1 && requests[idx].status !== newStatus) {
      requests[idx].status = newStatus;
      changed++;
    }
  });

  if (changed === 0) {
    alert("No changes detected.");
    return;
  }

  save(STORAGE.requests, requests);
  alert(`✅ ${changed} decision(s) saved.`);
  loadFacultyRequests();
}

/* ----------------------- ADMIN (students & faculty) ----------------------- */
function addStudent() {
  const id = q("#studentId")?.value?.trim();
  const pass = q("#studentPass")?.value?.trim();
  const mobile = q("#studentMobile")?.value?.trim();

  if (!id || !pass || !mobile) {
    alert("⚠️ Fill all student fields!");
    return;
  }

  let students = load(STORAGE.students);
  if (students.some(s => s.id === id)) {
    alert("Student ID already exists.");
    return;
  }

  students.push({ id, pass, mobile });
  save(STORAGE.students, students);

  q("#studentId").value = "";
  q("#studentPass").value = "";
  q("#studentMobile").value = "";

  renderStudents();
  // update faculty select on student page if present
  if (typeof loadFacultyForStudents === "function") loadFacultyForStudents();
  showStatusMessage("✅ Student added.", "#statusMsg", 2000);
}

function renderStudents() {
  const list = q("#studentList");
  if (!list) return;
  const students = load(STORAGE.students);
  if (students.length === 0) {
    list.innerHTML = `<li style="color:var(--muted)">No students added yet.</li>`;
    return;
  }
  list.innerHTML = students.map((s, i) => `
    <li>
      <strong>${escapeHtml(s.id)}</strong> — ${escapeHtml(s.mobile)}
      <button class="btn btn-danger" onclick="deleteStudent(${i})">🗑 Delete</button>
    </li>
  `).join("");
}

function deleteStudent(index) {
  if (!confirm("Delete this student?")) return;
  let students = load(STORAGE.students);
  students.splice(index, 1);
  save(STORAGE.students, students);
  renderStudents();
  if (typeof loadFacultyForStudents === "function") loadFacultyForStudents();
}

function addFaculty() {
  const id = q("#facultyId")?.value?.trim();
  const pass = q("#facultyPass")?.value?.trim();

  if (!id || !pass) {
    alert("⚠️ Fill all faculty fields!");
    return;
  }

  let faculty = load(STORAGE.faculty);
  if (faculty.some(f => f.id === id)) {
    alert("Faculty ID already exists.");
    return;
  }

  faculty.push({ id, pass });
  save(STORAGE.faculty, faculty);

  q("#facultyId").value = "";
  q("#facultyPass").value = "";

  renderFaculty();
  if (typeof loadFacultyForStudents === "function") loadFacultyForStudents();
  showStatusMessage("✅ Faculty added.", "#statusMsg", 2000);
}

function renderFaculty() {
  const list = q("#facultyList");
  if (!list) return;
  const faculty = load(STORAGE.faculty);
  if (faculty.length === 0) {
    list.innerHTML = `<li style="color:var(--muted)">No faculty added yet.</li>`;
    return;
  }
  list.innerHTML = faculty.map((f, i) => `
    <li>
      <strong>${escapeHtml(f.id)}</strong>
      <button class="btn btn-danger" onclick="deleteFaculty(${i})">🗑 Delete</button>
    </li>
  `).join("");
}

function deleteFaculty(index) {
  if (!confirm("Delete this faculty?")) return;
  let faculty = load(STORAGE.faculty);
  faculty.splice(index, 1);
  save(STORAGE.faculty, faculty);
  renderFaculty();
  if (typeof loadFacultyForStudents === "function") loadFacultyForStudents();
}

/* populate faculty select used in student form */
function loadFacultyForStudents() {
  const facultySelect = q("#facultySelect");
  if (!facultySelect) return;
  facultySelect.innerHTML = "";
  const faculty = load(STORAGE.faculty);
  faculty.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.id;
    facultySelect.appendChild(opt);
  });
}

/* ----------------------- Helpers ----------------------- */
/* escape simple HTML to avoid injection in table strings */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ----------------------- Boot / Auto-load ----------------------- */
function setupPage() {
  const path = window.location.pathname;

  if (path.includes("index.html") || path.endsWith("/")) {
    // nothing heavy: keep login handler available
    const loginBtn = q('button[onclick="login()"]') || q(".btn.btn-primary");
    if (loginBtn) loginBtn.addEventListener("click", login);
  }

  if (path.includes("student_home.html")) {
    loadFacultyForStudents();
    loadStudentLeaves();
    // make sure the apply button is wired
    const applyBtn = q('button[onclick="applyLeave()"]');
    if (applyBtn) applyBtn.addEventListener("click", applyLeave);
  }

  if (path.includes("faculty_home.html")) {
    loadFacultyRequests();
    // wire submit button
    const submitBtn = q('button[onclick="submitFacultyDecisions()"]') || q(".btn.btn-primary");
    if (submitBtn) submitBtn.addEventListener("click", submitFacultyDecisions);
  }

  if (path.includes("admin_home.html")) {
    renderStudents();
    renderFaculty();
    // wire admin buttons if present
    const addSBtn = q('button[onclick="addStudent()"]');
    if (addSBtn) addSBtn.addEventListener("click", addStudent);
    const addFBtn = q('button[onclick="addFaculty()"]');
    if (addFBtn) addFBtn.addEventListener("click", addFaculty);
  }
}

/* run on DOM ready */
document.addEventListener("DOMContentLoaded", setupPage);
