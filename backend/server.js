const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, "data.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const upload = multer({ dest: UPLOAD_DIR });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      assignments: [],
      tasks: [],
      materials: [],
      notifications: [],
      profile: {
        name: "Mehnaj Akter",
        id: "CSE349",
        email: "mehnaj@example.com",
        department: "CSE"
      }
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateDueNotifications(data) {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  data.assignments.forEach(a => {
    const dueDate = new Date(a.deadline);
    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(dueDate.getDate() - 1);
    const notifyDate = oneDayBefore.toISOString().split("T")[0];

    const alreadyExists = data.notifications.some(n =>
      n.assignmentId === a.id && n.type === "due-reminder"
    );

    if (!a.completed && notifyDate === todayString && !alreadyExists) {
      data.notifications.unshift({
        id: Date.now(),
        assignmentId: a.id,
        type: "due-reminder",
        message: `${a.title} is due tomorrow (${a.deadline})`,
        read: false
      });
    }
  });

  writeData(data);
}

app.get("/api/dashboard", (req, res) => {
  const data = readData();
  generateDueNotifications(data);

  const pending = data.assignments.filter(a => !a.completed);
  const completedAssignments = data.assignments.filter(a => a.completed).length;
  const completedTasks = data.tasks.filter(t => t.completed).length;
  const total = data.assignments.length + data.tasks.length;
  const completed = completedAssignments + completedTasks;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  res.json({
    pendingAssignments: pending.length,
    pendingList: pending,
    totalTasks: data.tasks.length,
    totalMaterials: data.materials.length,
    progress
  });
});

app.get("/api/assignments", (req, res) => {
  res.json(readData().assignments);
});

app.post("/api/assignments", (req, res) => {
  const data = readData();

  const assignment = {
    id: Date.now(),
    title: req.body.title,
    course: req.body.course,
    deadline: req.body.deadline,
    completed: false
  };

  data.assignments.push(assignment);

  data.notifications.unshift({
    id: Date.now(),
    message: `New assignment added: ${assignment.title}`,
    read: false
  });

  writeData(data);
  res.json(assignment);
});

app.patch("/api/assignments/:id", (req, res) => {
  const data = readData();
  const item = data.assignments.find(a => a.id == req.params.id);

  if (!item) return res.status(404).json({ error: "Assignment not found" });

  item.completed = !item.completed;
  writeData(data);
  res.json(item);
});

app.get("/api/tasks", (req, res) => {
  const data = readData();
  if (!data.tasks) data.tasks = [];
  res.json(data.tasks);
});

app.post("/api/tasks", (req, res) => {
  const data = readData();

  if (!data.tasks) data.tasks = [];

  const task = {
    id: Date.now(),
    text: req.body.text,
    course: req.body.course || "General",
    completed: false
  };

  data.tasks.push(task);
  writeData(data);
  res.json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const data = readData();
  const task = data.tasks.find(t => t.id == req.params.id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.completed = !task.completed;
  writeData(data);
  res.json(task);
});

app.get("/api/materials", (req, res) => {
  res.json(readData().materials);
});

app.post("/api/materials", upload.single("file"), (req, res) => {
  const data = readData();

  const material = {
    id: Date.now(),
    title: req.body.title,
    course: req.body.course,
    fileName: req.file ? req.file.filename : "",
    originalName: req.file ? req.file.originalname : "",
    uploadedAt: new Date().toISOString().split("T")[0]
  };

  data.materials.push(material);
  writeData(data);
  res.json(material);
});

app.get("/api/notifications", (req, res) => {
  const data = readData();
  generateDueNotifications(data);
  res.json(data.notifications);
});

app.patch("/api/notifications/read", (req, res) => {
  const data = readData();
  data.notifications.forEach(n => n.read = true);
  writeData(data);
  res.json({ message: "All notifications marked as read" });
});

app.get("/api/profile", (req, res) => {
  res.json(readData().profile);
});

app.patch("/api/profile", (req, res) => {
  const data = readData();

  data.profile = {
    ...data.profile,
    name: req.body.name,
    id: req.body.id,
    email: req.body.email,
    department: req.body.department
  };

  writeData(data);
  res.json(data.profile);
});

app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const data = readData();

  const assignments = data.assignments.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.course.toLowerCase().includes(q)
  );

  const materials = data.materials.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.course.toLowerCase().includes(q)
  );

  res.json({ assignments, materials });
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
