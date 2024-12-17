const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = [
  {
    id: 1,
    username: "jai",
    email: "jaivinod@gmail.com",
    password: "password",
  },
];
let tasks = [
  { id: 1, title: "Task 1", status: "pending" },
  { id: 2, title: "Task 2", status: "pending" },
  { id: 3, title: "Task 3", status: "inProgress" },
];

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, "secretkey", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get("/users", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).send("User not found");
  res.json(user);
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).send("Invalid credentials");
  const token = jwt.sign({ id: user.id }, "secretkey", { expiresIn: "3h" });
  res.json({ token });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send("Username, email, and password are required");
  }
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).send("User already exists");
  }
  const newUser = {
    id: users.length + 1,
    username,
    email,
    password,
  };
  users.push(newUser);
  res.status(201).send("User registered successfully");
});

app.get("/tasks", authenticateToken, (req, res) => {
  res.json(tasks);
});

app.post("/tasks", authenticateToken, (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    status: "inProgress",
  };

  const inProgressTask = tasks.find((task) => task.status === "inProgress");
  if (inProgressTask) {
    inProgressTask.status = "pending";
  }

  tasks.push(newTask);
  res.json(newTask);
});

app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  tasks = tasks.filter((task) => task.id !== taskId);
  res.status(204).send();
});

app.put("/tasks/:id", authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].title = req.body.title;
    res.json(tasks[taskIndex]);
  } else {
    res.status(404).send("Task not found");
  }
});

app.put("/tasks/:id/status", authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].status = status;
    res.json(tasks[taskIndex]);
  } else {
    res.status(404).send("Task not found");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
