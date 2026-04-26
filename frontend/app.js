const API = "http://localhost:5000/api";

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");

  const searchBox = document.getElementById("searchResults");
  if (searchBox) searchBox.classList.add("hidden");

  loadDashboard();
  loadAssignments();
  loadTasks();
  loadMaterials();
  loadNotifications();
  loadProfile();
}

async function loadDashboard() {
  const res = await fetch(`${API}/dashboard`);
  const data = await res.json();

  document.getElementById("pendingCount").innerText = data.pendingAssignments;
  document.getElementById("materialCount").innerText = data.totalMaterials;
  document.getElementById("taskCount").innerText = data.totalTasks;

  document.getElementById("progressBar").style.width = data.progress + "%";
  document.getElementById("progressText").innerText = data.progress + "% Completed";
}

async function searchData() {
  const q = document.getElementById("searchInput").value.trim();
  const box = document.getElementById("searchResults");

  if (!q) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const res = await fetch(`${API}/search?q=${q}`);
  const data = await res.json();

  let html = "<h2>Search Results</h2>";

  html += "<h3>Assignments</h3>";
  html += data.assignments.length
    ? data.assignments.map(a => `<p>📌 ${a.title} - ${a.course}</p>`).join("")
    : "<p>No assignment found</p>";

  html += "<h3>Materials</h3>";
  html += data.materials.length
    ? data.materials.map(m => `<p>📚 ${m.title} - ${m.course}</p>`).join("")
    : "<p>No material found</p>";

  box.innerHTML = html;
  box.classList.remove("hidden");
}

async function loadAssignments() {
  const res = await fetch(`${API}/assignments`);
  const data = await res.json();

  document.getElementById("assignmentTable").innerHTML =
    data.map(a => `
      <tr>
        <td>${a.title}</td>
        <td>${a.course}</td>
        <td>${a.deadline}</td>
        <td>${a.completed ? "Completed" : "Pending"}</td>
        <td>
          <button onclick="toggleAssignment(${a.id})">
            ${a.completed ? "Undo" : "Done"}
          </button>
        </td>
      </tr>
    `).join("");
}

async function addAssignment() {
  const title = document.getElementById("assignmentTitle").value;
  const course = document.getElementById("assignmentCourse").value;
  const deadline = document.getElementById("assignmentDeadline").value;

  if (!title || !course || !deadline) {
    alert("Please fill all assignment fields");
    return;
  }

  await fetch(`${API}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, course, deadline })
  });

  document.getElementById("assignmentTitle").value = "";
  document.getElementById("assignmentCourse").value = "";
  document.getElementById("assignmentDeadline").value = "";

  loadAll();
}

async function toggleAssignment(id) {
  await fetch(`${API}/assignments/${id}`, {
    method: "PATCH"
  });

  loadAll();
}

async function showPendingAssignments() {
  showPage("pendingPage");

  const res = await fetch(`${API}/dashboard`);
  const data = await res.json();

  document.getElementById("pendingAssignmentPageList").innerHTML =
    data.pendingList.length
      ? data.pendingList.map(a =>
          `<p>📌 <b>${a.title}</b> - ${a.course} - Due Date: ${a.deadline}</p>`
        ).join("")
      : "<p>No pending assignments</p>";
}

async function loadTasks() {
  const res = await fetch(`${API}/tasks`);
  const tasks = await res.json();

  document.getElementById("taskList").innerHTML =
    tasks.length
      ? tasks.map(t => `
        <p>
          📝 ${t.text} - ${t.course || "General"}
          <button onclick="toggleTask(${t.id})">
            ${t.completed ? "Undo" : "Done"}
          </button>
        </p>
      `).join("")
      : "<p>No study tasks added yet.</p>";

  document.getElementById("taskCount").innerText = tasks.length;
}

async function addTask() {
  const text = document.getElementById("taskText").value;
  const course = document.getElementById("taskCourse").value;

  if (!text) {
    alert("Please enter task name");
    return;
  }

  await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, course })
  });

  document.getElementById("taskText").value = "";
  document.getElementById("taskCourse").value = "";

  loadTasks();
  loadDashboard();
}

async function toggleTask(id) {
  await fetch(`${API}/tasks/${id}`, {
    method: "PATCH"
  });

  loadTasks();
  loadDashboard();
}

async function uploadMaterial() {
  const form = new FormData();

  form.append("title", document.getElementById("materialTitle").value);
  form.append("course", document.getElementById("materialCourse").value);

  const file = document.getElementById("materialFile").files[0];
  if (file) form.append("file", file);

  if (!document.getElementById("materialTitle").value) {
    alert("Please enter material title");
    return;
  }

  await fetch(`${API}/materials`, {
    method: "POST",
    body: form
  });

  alert("Material uploaded successfully!");

  document.getElementById("materialTitle").value = "";
  document.getElementById("materialCourse").value = "";
  document.getElementById("materialFile").value = "";

  loadAll();
}

async function loadMaterials() {
  const res = await fetch(`${API}/materials`);
  const data = await res.json();

  document.getElementById("materialList").innerHTML =
    data.length
      ? data.map(m => `
        <p>
          📚 ${m.title} - ${m.course}
          ${m.fileName ? `<a href="http://localhost:5000/uploads/${m.fileName}" target="_blank">Open File</a>` : ""}
        </p>
      `).join("")
      : "<p>No materials uploaded yet.</p>";
}

async function loadNotifications() {
  const res = await fetch(`${API}/notifications`);
  const data = await res.json();

  document.getElementById("notificationList").innerHTML =
    data.length
      ? data.map(n => `<p>${n.read ? "✅" : "🔔"} ${n.message}</p>`).join("")
      : "<p>No notifications</p>";
}

async function markRead() {
  await fetch(`${API}/notifications/read`, {
    method: "PATCH"
  });

  loadNotifications();
}

async function loadProfile() {
  const res = await fetch(`${API}/profile`);
  const data = await res.json();

  document.getElementById("profileName").innerText = data.name;
  document.getElementById("profileEmail").innerText = data.email;
  document.getElementById("profileDepartment").innerText = data.department;
  document.getElementById("profileId").innerText = data.id || "";

  if (document.getElementById("settingName")) {
    document.getElementById("settingName").value = data.name;
    document.getElementById("settingId").value = data.id || "";
    document.getElementById("settingEmail").value = data.email;
    document.getElementById("settingDepartment").value = data.department;
  }
}

async function updateProfile() {
  const name = document.getElementById("settingName").value;
  const id = document.getElementById("settingId").value;
  const email = document.getElementById("settingEmail").value;
  const department = document.getElementById("settingDepartment").value;

  await fetch(`${API}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, id, email, department })
  });

  alert("Profile updated successfully!");
  loadProfile();
  showPage("profile");
}
// SIGN IN
async function signIn() {
  const name = document.getElementById("signName").value;
  const id = document.getElementById("signId").value;
  const email = document.getElementById("signEmail").value;
  const department = document.getElementById("signDepartment").value;

  if (!name || !id || !email || !department) {
    alert("Please fill all fields");
    return;
  }

  await fetch(`${API}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, id, email, department })
  });

  alert("Account created successfully!");
  showPage("profile");
  loadProfile();
}

// LOGOUT
function logout() {
  alert("Logged out!");
  showPage("signin");
}

function loadAll() {
  loadDashboard();
  loadAssignments();
  loadTasks();
  loadMaterials();
  loadNotifications();
  loadProfile();
  signIn();
}
loadAll();
