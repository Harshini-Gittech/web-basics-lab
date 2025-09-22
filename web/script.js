// ------------------ LOGIN FUNCTION ------------------
function login() {
  const userType = document.getElementById("userType").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!userType || !username || !password) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  if (userType === "student") {
    const students = JSON.parse(localStorage.getItem("students") || "[]");
    const match = students.find(s => s.id === username && s.pass === password);

    if (match) {
      localStorage.setItem("loggedInStudent", JSON.stringify(match));
      window.location.href = "student_home.html";
    } else {
      alert("❌ Invalid Student ID or Password!");
    }
  }

  if (userType === "faculty") {
    const faculty = JSON.parse(localStorage.getItem("faculty") || "[]");
    const match = faculty.find(f => f.id === username && f.pass === password);

    if (match) {
      localStorage.setItem("loggedInFaculty", JSON.stringify(match));
      window.location.href = "faculty_home.html";
    } else {
      alert("❌ Invalid Faculty ID or Password!");
    }
  }

  if (userType === "admin") {
    if (username === "admin" && password === "admin123") {
      window.location.href = "admin_home.html";
    } else {
      alert("❌ Invalid Admin ID or Password!");
    }
  }
}

// ------------------ STUDENT FUNCTIONS ------------------
function applyLeave() {
  const reason = document.getElementById("reason").value;
  const days = document.getElementById("days").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const facultySelect = document.getElementById("facultySelect");
  const assignedFaculty = facultySelect ? facultySelect.value : "";

  if (!reason || !days || !startDate || !endDate || !assignedFaculty) {
    alert("⚠️ Please fill all fields (including faculty)!");
    return;
  }

  const student = JSON.parse(localStorage.getItem("loggedInStudent"));

  const leaveRequest = {
    id: Date.now(), // ✅ unique ID
    user: student ? student.id : "Unknown",
    reason,
    days,
    startDate,
    endDate,
    status: "Pending",
    assignedFaculty,
    time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  requests.push(leaveRequest);
  localStorage.setItem("leaveRequests", JSON.stringify(requests));

  document.getElementById("statusMsg").textContent = "✅ Leave request submitted!";
  loadStudentLeaves();
}

function loadStudentLeaves() {
  const table = document.getElementById("studentLeaveTable");
  if (!table) return;

  table.innerHTML = "";
  const student = JSON.parse(localStorage.getItem("loggedInStudent"));
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

  requests
    .filter(r => r.user === student.id)
    .forEach(r => {
      const row = `<tr>
        <td>${r.reason}</td>
        <td>${r.days}</td>
        <td>${r.startDate}</td>
        <td>${r.endDate}</td>
        <td>${r.assignedFaculty}</td>
        <td>${r.status}</td>
        <td><button onclick="deleteStudentLeave(${r.id})">🗑 Delete</button></td>
      </tr>`;
      table.innerHTML += row;
    });
}

function deleteStudentLeave(requestId) {
  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  const student = JSON.parse(localStorage.getItem("loggedInStudent"));
  requests = requests.filter(r => !(r.id === requestId && r.user === student.id));
  localStorage.setItem("leaveRequests", JSON.stringify(requests));
  loadStudentLeaves();
}

// ------------------ FACULTY FUNCTIONS ------------------
function loadFacultyRequests() {
  const table = document.getElementById("facultyLeaveTable");
  if (!table) return;

  table.innerHTML = "";
  const faculty = JSON.parse(localStorage.getItem("loggedInFaculty"));
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

  requests
    .filter(r => r.assignedFaculty === faculty.id) // ✅ only this faculty’s requests
    .forEach(r => {
      const row = `<tr>
        <td>${r.user}</td>
        <td>${r.reason}</td>
        <td>${r.days}</td>
        <td>${r.startDate}</td>
        <td>${r.endDate}</td>
        <td>${r.time}</td>
        <td>
          <select id="status-${r.id}">
            <option value="Pending" ${r.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Approved" ${r.status === "Approved" ? "selected" : ""}>Approved</option>
            <option value="Rejected" ${r.status === "Rejected" ? "selected" : ""}>Rejected</option>
          </select>
        </td>
      </tr>`;
      table.innerHTML += row;
    });
}

function submitFacultyDecisions() {
  const faculty = JSON.parse(localStorage.getItem("loggedInFaculty"));
  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

  requests = requests.map(r => {
    if (r.assignedFaculty === faculty.id) {
      const statusSelect = document.getElementById(`status-${r.id}`);
      if (statusSelect) {
        r.status = statusSelect.value;
      }
    }
    return r;
  });

  localStorage.setItem("leaveRequests", JSON.stringify(requests));
  alert("✅ Leave statuses updated!");
  loadFacultyRequests();
}

// ------------------ ADMIN FUNCTIONS ------------------
function addStudent() {
  const id = document.getElementById("studentId").value.trim();
  const pass = document.getElementById("studentPass").value.trim();
  const mobile = document.getElementById("studentMobile").value.trim();

  if (!id || !pass || !mobile) {
    alert("⚠️ Fill all student fields!");
    return;
  }

  let students = JSON.parse(localStorage.getItem("students")) || [];
  students.push({ id, pass, mobile });
  localStorage.setItem("students", JSON.stringify(students));

  document.getElementById("studentId").value = "";
  document.getElementById("studentPass").value = "";
  document.getElementById("studentMobile").value = "";

  loadStudents();
}

function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;

  list.innerHTML = "";
  const students = JSON.parse(localStorage.getItem("students")) || [];

  students.forEach((s, i) => {
    const row = `<li>${s.id} - ${s.mobile} 
      <button onclick="deleteStudent(${i})">🗑 Delete</button></li>`;
    list.innerHTML += row;
  });
}

function deleteStudent(index) {
  let students = JSON.parse(localStorage.getItem("students")) || [];
  students.splice(index, 1);
  localStorage.setItem("students", JSON.stringify(students));
  loadStudents();
}

function addFaculty() {
  const id = document.getElementById("facultyId").value.trim();
  const pass = document.getElementById("facultyPass").value.trim();

  if (!id || !pass) {
    alert("⚠️ Fill all faculty fields!");
    return;
  }

  let faculty = JSON.parse(localStorage.getItem("faculty")) || [];
  faculty.push({ id, pass });
  localStorage.setItem("faculty", JSON.stringify(faculty));

  document.getElementById("facultyId").value = "";
  document.getElementById("facultyPass").value = "";

  loadFaculty();
}

function loadFaculty() {
  const list = document.getElementById("facultyList");
  if (!list) return;

  list.innerHTML = "";
  const faculty = JSON.parse(localStorage.getItem("faculty")) || [];

  faculty.forEach((f, i) => {
    const row = `<li>${f.id} 
      <button onclick="deleteFaculty(${i})">🗑 Delete</button></li>`;
    list.innerHTML += row;
  });
}

function deleteFaculty(index) {
  let faculty = JSON.parse(localStorage.getItem("faculty")) || [];
  faculty.splice(index, 1);
  localStorage.setItem("faculty", JSON.stringify(faculty));
  loadFaculty();
}

function loadFacultyForStudents() {
  const facultySelect = document.getElementById("facultySelect");
  if (!facultySelect) return;

  facultySelect.innerHTML = "";
  const faculty = JSON.parse(localStorage.getItem("faculty")) || [];

  faculty.forEach(f => {
    const option = document.createElement("option");
    option.value = f.id;
    option.textContent = f.id;
    facultySelect.appendChild(option);
  });
}

// ------------------ AUTO LOAD ------------------
if (window.location.pathname.includes("student_home.html")) {
  window.onload = function () {
    loadFacultyForStudents();
    loadStudentLeaves();
  };
}
if (window.location.pathname.includes("faculty_home.html")) {
  window.onload = function () {
    loadFacultyRequests();
  };
}
