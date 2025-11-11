// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

//  KẾT NỐI MONGODB
mongoose
  .connect("mongodb://localhost:27017/quiz_app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Kết nối MongoDB thành công"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

//  ĐỊNH NGHĨA CÁC SCHEMA
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
  quizTitle: String,
  questionText: String,
  options: [String],
  correctAnswer: String,
  difficulty: String,
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

// Nếu chưa có user trong MongoDB, seed từ file JSON/users.json (tiện cho môi trường dev)
const fs = require("fs");
const path = require("path");
async function seedUsersFromJson() {
  try {
    const c = await User.countDocuments();
    if (c === 0) {
      const usersPath = path.join(__dirname, "JSON", "users.json");
      if (fs.existsSync(usersPath)) {
        const raw = fs.readFileSync(usersPath, "utf8");
        const arr = JSON.parse(raw);
        const docs = arr.map((u) => ({
          name: u.username || u.name || "",
          email: u.email,
          password: u.password,
        }));
        if (docs.length > 0) {
          await User.insertMany(docs);
          console.log("✅ Seeded users into MongoDB from JSON/users.json");
        }
      }
    }
  } catch (err) {
    console.error("❌ Error seeding users:", err);
  }
}
// Đảm bảo quá trình seed chạy sau khi mongoose đã kết nối. Nếu chưa kết nối, đợi sự kiện 'open'
if (mongoose.connection.readyState === 1) {
  seedUsersFromJson();
} else {
  mongoose.connection.once("open", () => seedUsersFromJson());
}

// Seed dữ liệu quizzes từ JSON/quizzes.json nếu collection rỗng
async function seedQuizzesFromJson() {
  try {
    const c = await Quiz.countDocuments();
    if (c === 0) {
      const quizzesPath = path.join(__dirname, "JSON", "quizzes.json");
      if (fs.existsSync(quizzesPath)) {
        const raw = fs.readFileSync(quizzesPath, "utf8");
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          await Quiz.insertMany(arr);
          console.log("✅ Seeded quizzes into MongoDB from JSON/quizzes.json");
        }
      }
    }
  } catch (err) {
    console.error("❌ Error seeding quizzes:", err);
  }
}

// Seed dữ liệu questions từ JSON/questions.json nếu collection rỗng
async function seedQuestionsFromJson() {
  try {
    const c = await Question.countDocuments();
    if (c === 0) {
      const questionsPath = path.join(__dirname, "JSON", "questions.json");
      if (fs.existsSync(questionsPath)) {
        const raw = fs.readFileSync(questionsPath, "utf8");
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          await Question.insertMany(arr);
          console.log("✅ Seeded questions into MongoDB from JSON/questions.json");
        }
      }
    }
  } catch (err) {
    console.error("❌ Error seeding questions:", err);
  }
}

// Sinh các câu hỏi giả lập cho những đề chưa đủ số câu được gán
async function generateMissingQuestionsForQuizzes() {
  try {
    const quizzes = await Quiz.find();
    for (const quiz of quizzes) {
      const needed = (quiz.totalMarks || 15);
      const existing = await Question.countDocuments({ quizTitle: quiz.title });
      if (existing >= needed) continue;
      const toCreate = needed - existing;
      const docs = [];
      for (let i = 1; i <= toCreate; i++) {
        const qnum = existing + i;
  // xây dựng nội dung câu hỏi và các phương án phù hợp ngữ cảnh
        const text = `${quiz.title} - Câu ${qnum}: Nội dung câu hỏi về ${quiz.subject} (mẫu)`;
        const built = buildOptionsForQuestion(quiz, qnum);
        docs.push({
          subject: quiz.subject,
          quizTitle: quiz.title,
          questionText: text,
          options: built.options,
          correctAnswer: built.correct,
          difficulty: built.difficulty,
        });
      }
      if (docs.length > 0) {
        await Question.insertMany(docs);
        console.log(`✅ Generated ${docs.length} questions for quiz '${quiz.title}'`);
      }
    }
  } catch (err) {
    console.error("❌ Error generating missing questions:", err);
  }
}

// Tạo phương án và đáp án đúng dựa trên môn học và số thứ tự câu
function buildOptionsForQuestion(quiz, qnum) {
  const subject = (quiz.subject || "").toLowerCase();
  const difficulty = qnum % 5 === 0 ? "hard" : qnum % 3 === 0 ? "medium" : "easy";
  const idx = (qnum - 1) % 4;
  // phương án mặc định chung
  let opts = ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"];
  let correct = opts[idx];

  if (subject.includes("cấu trúc dữ liệu") || subject.includes("giải thuật")) {
    const choices = [
      "Array (mảng)",
      "LinkedList (danh sách liên kết)",
      "Stack (ngăn xếp)",
      "Queue (hàng đợi)",
    ];
    opts = rotateArray(choices, idx);
    correct = opts[0];
  } else if (subject.includes("lập trình c")) {
    const choices = ["printf()", "scanf()", "malloc()", "free()"];
    opts = rotateArray(choices, idx);
  // chọn phương án phù hợp (ví dụ printf() cho một số câu, malloc cho câu khác)
    correct = qnum % 2 === 1 ? "printf()" : "malloc()";
    if (!opts.includes(correct)) opts[0] = correct;
  } else if (subject.includes("mạng")) {
    const choices = ["TCP", "UDP", "ARP", "ICMP"];
    opts = rotateArray(choices, idx);
    correct = opts[0];
  } else if (subject.includes("cơ sở dữ liệu") || subject.includes("csdl")) {
    const choices = ["SELECT", "INSERT", "UPDATE", "DELETE"];
    opts = rotateArray(choices, idx);
    correct = opts[0];
  } else if (subject.includes("hệ điều hành")) {
    const choices = ["Semaphore", "Mutex", "Scheduler", "Virtual Memory"];
    opts = rotateArray(choices, idx);
    correct = opts[0];
  } else {
    opts = [
      `${quiz.subject} - phương án A`,
      `${quiz.subject} - phương án B`,
      `${quiz.subject} - phương án C`,
      `${quiz.subject} - phương án D`,
    ];
    correct = opts[0];
  }

  // đảm bảo đáp án đúng nằm trong danh sách phương án
  if (!opts.includes(correct)) correct = opts[0];
  return { options: opts, correct, difficulty };
}

function rotateArray(arr, shift) {
  const n = arr.length;
  const s = ((shift % n) + n) % n;
  return arr.slice(s).concat(arr.slice(0, s));
}

if (mongoose.connection.readyState === 1) {
  seedQuizzesFromJson();
  seedQuestionsFromJson();
  // sau khi seed từ JSON, đảm bảo mỗi đề có ít nhất quiz.totalMarks câu hỏi
  mongoose.connection.once("open", () => {});
  // gọi hàm sinh thêm sau một khoảng delay để các insert trước đó hoàn tất
  setTimeout(() => generateMissingQuestionsForQuizzes(), 1200);
} else {
  mongoose.connection.once("open", () => {
    seedQuizzesFromJson();
    seedQuestionsFromJson();
    setTimeout(() => generateMissingQuestionsForQuizzes(), 1200);
  });
}

// CÁC API ENDPOINT

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

// Lấy tất cả câu hỏi
app.get("/api/questions", async (req, res) => {
  const qs = await Question.find();
  res.json(qs);
});

// Lưu lịch sử bài làm
// legacy single route
app.post("/api/attempt", async (req, res) => {
  const payload = req.body || {};
  const userEmail = payload.userEmail || payload.email || payload.user || "";
  const doc = Object.assign({}, payload, { userEmail });
  const att = await Attempt.create(doc);
  res.json(att);
});

// accept plural /api/attempts to match client code
app.post("/api/attempts", async (req, res) => {
  const payload = req.body || {};
  const userEmail = payload.userEmail || payload.email || payload.user || "";
  const doc = Object.assign({}, payload, { userEmail });
  const att = await Attempt.create(doc);
  res.json(att);
});

// Lấy lịch sử theo user
app.get("/api/attempts/:email", async (req, res) => {
  const list = await Attempt.find({ userEmail: req.params.email });
  res.json(list);
});

// Admin: reseed DB from JSON files (safe: requires secret in body)
app.post("/api/admin/reseed", async (req, res) => {
  try {
    const SECRET = process.env.RESEED_SECRET || "please-reseed";
    const { secret, dropHistory } = req.body || {};
    if (secret !== SECRET) return res.status(403).json({ message: "Forbidden" });

    // Remove quizzes and questions so seeding will re-insert them
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    if (dropHistory) await Attempt.deleteMany({});

    await seedQuizzesFromJson();
    await seedQuestionsFromJson();
    // optionally reseed users as well if none exist
    await seedUsersFromJson();

  // ensure every quiz has enough questions (and generate contextual options)
  await generateMissingQuestionsForQuizzes();

    const qc = await Quiz.countDocuments();
    const qsc = await Question.countDocuments();
  return res.json({ message: "Đã đồng bộ lại dữ liệu", quizzes: qc, questions: qsc });
  } catch (err) {
    console.error('Error in reseed endpoint:', err);
    return res.status(500).json({ message: 'Reseed failed', error: err.message });
  }
});

// 4️⃣ CHẠY SERVER
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
);
