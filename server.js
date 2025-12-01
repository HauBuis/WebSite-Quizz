// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Serve static files từ folder HTML
app.use(express.static(path.join(__dirname, "HTML")));

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
  avatar: String,
  role: { type: String, default: "user" },
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
const Subject = mongoose.model("subjects", {
  name: String,
});
app.post("/api/update-avatar", async (req, res) => {
  const { email, avatar } = req.body;
  try {
    await User.updateOne({ email }, { avatar });
    res.json({ success: true, avatar }); // ★ TRẢ AVATAR CHO FRONTEND
  } catch (err) {
    res.status(500).json({ message: "Update avatar failed" });
  }
});

// Nếu chưa có user trong MongoDB, seed từ file JSON/users.json (tiện cho môi trường dev)
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
          console.log("✅ Đã chèn users vào MongoDB từ JSON/users.json");
        }
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi seed users:", err);
  }
}
// Đảm bảo quá trình seed chạy sau khi mongoose đã kết nối. Nếu chưa kết nối, đợi sự kiện 'open'
if (mongoose.connection.readyState === 1) {
  seedUsersFromJson();
} else {
  mongoose.connection.once("open", () => seedUsersFromJson());
}

// Seed dữ liệu quizzes từ JSON/quizzes.json - Luôn reload từ file để đồng bộ
async function seedQuizzesFromJson() {
  try {
    const quizzesPath = path.join(__dirname, "JSON", "quizzes.json");
    if (fs.existsSync(quizzesPath)) {
      const raw = fs.readFileSync(quizzesPath, "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        // Xóa hết quizzes cũ và chèn lại từ JSON
        await Quiz.deleteMany({});
        await Quiz.insertMany(arr);
        console.log(`✅ Đã đồng bộ ${arr.length} quizzes từ JSON/quizzes.json`);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi seed quizzes:", err);
  }
}

// Seed dữ liệu questions từ JSON/questions.json - Luôn reload từ file để đồng bộ
async function seedQuestionsFromJson() {
  try {
    const questionsPath = path.join(__dirname, "JSON", "questions.json");
    const quizzesPath = path.join(__dirname, "JSON", "quizzes.json");

    if (fs.existsSync(questionsPath) && fs.existsSync(quizzesPath)) {
      const rawQuestions = fs.readFileSync(questionsPath, "utf8");
      const rawQuizzes = fs.readFileSync(quizzesPath, "utf8");

      const questions = JSON.parse(rawQuestions);
      const quizzes = JSON.parse(rawQuizzes);

      if (Array.isArray(questions) && questions.length > 0) {
        // Map môn học với các đề thi (giữ thứ tự)
        const subjectQuizzes = {};
        quizzes.forEach((q) => {
          if (!subjectQuizzes[q.subject]) {
            subjectQuizzes[q.subject] = [];
          }
          subjectQuizzes[q.subject].push(q.title);
        });

        // Gán quizTitle cho từng câu hỏi
        // Mỗi môn học: câu 1-10 -> đề 1, câu 11-20 -> đề 2, v.v...
        let qIndex = {};
        const updatedQuestions = questions.map((q) => {
          const subject = q.subject;
          const quizList = subjectQuizzes[subject] || [];

          if (!qIndex[subject]) {
            qIndex[subject] = 0;
          }

          // Tính chỉ số đề (0-indexed), không vượt quá số đề có sẵn
          const quizIdx = Math.min(
            Math.floor(qIndex[subject] / 10),
            quizList.length - 1
          );
          const quizTitle = quizList[quizIdx];

          qIndex[subject]++;

          return { ...q, quizTitle };
        });

        // Xóa hết questions cũ và chèn lại từ JSON
        await Question.deleteMany({});
        await Question.insertMany(updatedQuestions);
        console.log(
          `✅ Đã đồng bộ ${updatedQuestions.length} questions từ JSON/questions.json`
        );
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi seed questions:", err);
  }
}

// Seed dữ liệu subjects từ JSON/subjects.json - Luôn reload từ file để đồng bộ
async function seedSubjectsFromJson() {
  try {
    const subjectsPath = path.join(__dirname, "JSON", "subjects.json");
    if (fs.existsSync(subjectsPath)) {
      const raw = fs.readFileSync(subjectsPath, "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        // Chuyển đổi format: subjectName -> name
        const converted = arr.map((item) => ({
          name: item.subjectName || item.name,
        }));
        // Xóa hết subjects cũ và chèn lại từ JSON
        await Subject.deleteMany({});
        await Subject.insertMany(converted);
        console.log(
          `✅ Đã đồng bộ ${converted.length} subjects từ JSON/subjects.json`
        );
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi seed subjects:", err);
  }
}

// Sinh các câu hỏi giả lập cho những đề chưa đủ số câu được gán

// if (mongoose.connection.readyState === 1) {
//   seedSubjectsFromJson();
//   seedQuizzesFromJson();
//   seedQuestionsFromJson();
// } else {
//   mongoose.connection.once("open", () => {
//     seedSubjectsFromJson();
//     seedQuizzesFromJson();
//     seedQuestionsFromJson();
//   });
// }

// CÁC API ENDPOINT

// Đăng ký
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email đã tồn tại" });

  const user = await User.create({
    name,
    email,
    password,
    avatar: "🙂",
  });

  res.json({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
});

// Đăng nhập
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user)
    return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

  res.json({
    name: user.name,
    email: user.email,
    avatar: user.avatar || "🙂",
    role: user.role || "user",
  });
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
// route cũ (giữ tương thích)
app.post("/api/attempt", async (req, res) => {
  const payload = req.body || {};
  const userEmail = payload.userEmail || payload.email || payload.user || "";
  const doc = Object.assign({}, payload, { userEmail });
  const att = await Attempt.create(doc);
  res.json(att);
});

// chấp nhận đường dẫn số nhiều /api/attempts để tương thích với client
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
app.get("/api/quizzes/count/:subject", async (req, res) => {
  const subject = req.params.subject;
  const count = await Quiz.countDocuments({ subject });
  res.json({ subject, count });
});
// Admin: đồng bộ lại DB từ các file JSON (an toàn: yêu cầu secret trong body)
// app.post("/api/admin/reseed", async (req, res) => {
//   try {
//     const SECRET = process.env.RESEED_SECRET || "please-reseed";
//     const { secret, dropHistory } = req.body || {};
//     if (secret !== SECRET)
//       return res.status(403).json({ message: "Không được phép" });

//     // Remove quizzes and questions so seeding will re-insert them
//     await Subject.deleteMany({});
//     await Quiz.deleteMany({});
//     await Question.deleteMany({});
//     if (dropHistory) await Attempt.deleteMany({});

//     await seedSubjectsFromJson();
//     await seedQuizzesFromJson();
//     await seedQuestionsFromJson();
//     // optionally reseed users as well if none exist
//     await seedUsersFromJson();

//     const qc = await Quiz.countDocuments();
//     const qsc = await Question.countDocuments();
//     return res.json({
//       message: "Đã đồng bộ lại dữ liệu",
//       quizzes: qc,
//       questions: qsc,
//     });
//   } catch (err) {
//     console.error("❌ Lỗi tại endpoint reseed:", err);
//     return res
//       .status(500)
//       .json({ message: "Đồng bộ thất bại", error: err.message });
//   }
// });
app.get("/api/subjects", async (req, res) => {
  try {
    const list = await Subject.find().sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.post("/api/subjects", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên môn học không hợp lệ" });
    }

    // kiểm tra trùng tên
    const exists = await Subject.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (exists) {
      return res.status(400).json({ message: "Môn học đã tồn tại" });
    }

    const subj = await Subject.create({ name });
    res.json(subj);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Subject.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.put("/api/subjects/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const id = req.params.id;

    const subj = await Subject.findByIdAndUpdate(id, { name }, { new: true });
    res.json(subj);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.put("/api/subjects/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Tên môn không hợp lệ" });
  }

  const subj = subjects.find((s) => s._id === id);
  if (!subj) {
    return res.status(404).json({ message: "Không tìm thấy môn học" });
  }

  subj.name = name;
  save("subjects.json", subjects);

  res.json({ message: "Đã cập nhật", subject: subj });
});

// ====== QUIZZES ENDPOINTS ======
app.post("/api/quizzes/add", async (req, res) => {
  try {
    const { title, subject, duration, totalMarks } = req.body;
    if (!title || !subject || !duration || !totalMarks) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const quiz = await Quiz.create({ title, subject, duration, totalMarks });
    res.json(quiz);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/api/quizzes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Không tìm thấy đề thi" });
    }
    // Xóa tất cả câu hỏi của đề này
    await Question.deleteMany({ quizTitle: quiz.title });
    await Quiz.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ====== QUESTIONS ENDPOINTS ======
app.post("/api/questions/add", async (req, res) => {
  try {
    const {
      subject,
      questionText,
      options,
      correctAnswer,
      difficulty,
      quizTitle,
    } = req.body;
    if (
      !subject ||
      !questionText ||
      !options ||
      !correctAnswer ||
      !difficulty
    ) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const question = await Question.create({
      subject,
      questionText,
      options,
      correctAnswer,
      difficulty,
      quizTitle: quizTitle || null,
    });
    res.json(question);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/api/questions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Question.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4️⃣ CHẠY SERVER
const PORT = 5500;
app.listen(PORT, () =>
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
);
