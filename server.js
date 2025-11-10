// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1️⃣ KẾT NỐI MONGODB
mongoose
  .connect("mongodb://localhost:27017/quiz_app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Kết nối MongoDB thành công"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

// 2️⃣ ĐỊNH NGHĨA CÁC SCHEMA
const User = mongoose.model("users", {
  name: String,
  email: String,
  password: String,
});
const Quiz = mongoose.model("quizzes", {
  title: String,
  subject: String,
  duration: Number,
  totalMarks: Number,
});
const Question = mongoose.model("questions", {
  subject: String,
  questionText: String,
  options: [String],
  correctAnswer: String,
});
const Attempt = mongoose.model("history", {
  userEmail: String,
  quizTitle: String,
  score: Number,
  total: Number,
  durationText: String,
  timeText: String,
  questions: Array,
});

// 3️⃣ API ENDPOINTS

// Đăng ký
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email đã tồn tại" });
  const user = await User.create({ name, email, password });
  res.json(user);
});

// Đăng nhập
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user)
    return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
  res.json(user);
});

// Lấy danh sách quiz
app.get("/api/quizzes", async (req, res) => {
  const quizzes = await Quiz.find();
  res.json(quizzes);
});

// Lấy câu hỏi theo môn
app.get("/api/questions/:subject", async (req, res) => {
  const qs = await Question.find({ subject: req.params.subject });
  res.json(qs);
});

// Lưu lịch sử bài làm
app.post("/api/attempt", async (req, res) => {
  const att = await Attempt.create(req.body);
  res.json(att);
});

// Lấy lịch sử theo user
app.get("/api/attempts/:email", async (req, res) => {
  const list = await Attempt.find({ userEmail: req.params.email });
  res.json(list);
});

// 4️⃣ CHẠY SERVER
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
);
