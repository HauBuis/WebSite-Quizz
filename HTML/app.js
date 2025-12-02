const API_BASE = "http://localhost:5500/api";
const AUTH_KEY = "quiz_auth";
const SETTINGS_KEY = "quiz_settings";

// Settings storage
function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    music: false,
    perQuestionTimer: false,
    avatar: "🙂",
  };
}

function setSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Không thể lưu cài đặt:", e.message);
  }
}

// Audio context and music
let audioContext = null;
let musicOscillator = null;
let musicGain = null;
let melodyLoopTimer = null;
let backgroundAudio = null; // HTML5 audio element

// Initialize audio element
function initAudioElement() {
  if (!backgroundAudio) {
    backgroundAudio = new Audio();
    backgroundAudio.src = "/music/background-music.mp3";
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.3; // 30% volume
  }
  return backgroundAudio;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext
      .resume()
      .catch((e) => console.warn("AudioContext resume failed:", e.message));
  }
  return audioContext;
}

function startBackgroundMusic() {
  const settings = getSettings();
  if (!settings.music) return;

  try {
    const audio = initAudioElement();
    // Resume AudioContext if needed
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    // Play the audio file
    audio.play().catch((e) => {
      console.warn("Không thể phát nhạc:", e.message);
    });
  } catch (e) {
    console.warn("Không thể phát nhạc:", e.message);
  }
}

function stopBackgroundMusic() {
  try {
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    }
    if (melodyLoopTimer) {
      clearTimeout(melodyLoopTimer);
      melodyLoopTimer = null;
    }
  } catch (e) {
    console.warn("Lỗi khi dừng nhạc:", e.message);
  }
}

function getAuth() {
  try {
    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (storedAuth) {
      return JSON.parse(storedAuth);
    }
    return null; // nếu không có dữ liệu auth
  } catch (e) {
    console.error("Lỗi khi lấy auth từ localStorage:", e);
    return null; // nếu có lỗi
  }
}

function setAuth(auth) {
  try {
    if (auth) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (e) {
    console.error("Lỗi khi lưu auth vào localStorage:", e);
  }
}

function updateHeaderAuthUI() {
  const auth = getAuth();

  const elLogin = document.getElementById("menu-login");
  const elReg = document.getElementById("menu-register");
  const elUser = document.getElementById("menu-user");
  const elEmail = document.getElementById("menu-user-email");
  const elAvatar = document.getElementById("menu-user-avatar");
  const elAdminMenu = document.getElementById("menu-admin");

  // Thay vì return sớm, kiểm tra đầy đủ
  if (!elLogin || !elReg || !elUser || !elEmail) {
    console.warn("Một hoặc nhiều phần tử không tồn tại.");
    return; // Nếu cần thiết, vẫn có thể giữ return nếu thiếu phần tử
  }

  if (auth && auth.email) {
    // Hiển thị user menu
    elLogin.style.display = "none";
    elReg.style.display = "none";
    elUser.style.display = "inline-flex";
    elEmail.textContent = auth.email;

    // Avatar
    if (elAvatar) {
      if (auth.avatar && auth.avatar.startsWith("data:image")) {
        elAvatar.innerHTML = `<img class="avatar-img" src="${auth.avatar}" alt="avatar" />`;
      } else {
        elAvatar.textContent = auth.avatar || "🙂";
      }
    }

    // Menu admin
    if (elAdminMenu) {
      elAdminMenu.style.display =
        auth.role === "admin" ? "inline-block" : "none";
    }
  } else {
    // Không đăng nhập
    elLogin.style.display = "inline-block";
    elReg.style.display = "inline-block";
    elUser.style.display = "none";

    if (elAdminMenu) elAdminMenu.style.display = "none";
  }
}

async function registerUser({ name, email, password }) {
  if (!name || !email || !password)
    throw new Error("Vui lòng nhập đủ thông tin.");
  if (!/.+@.+\..+/.test(email)) throw new Error("Email không hợp lệ.");
  if (password.length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự.");

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi đăng ký.");
  setAuth({
    name: data.name,
    email: data.email,
    avatar: data.avatar || "🙂",
    role: "user",
  });
  return data;
}

async function loginUser({ email, password }) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("Đã gửi yêu cầu đăng nhập", email, password); // Debug log

    const data = await res.json();
    console.log("Dữ liệu trả về từ server:", data); // Debug log

    if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập.");

    // Lưu thông tin người dùng vào localStorage
    setAuth({
      name: data.name,
      email: data.email,
      avatar: data.avatar || "🙂",
      role: data.role || "user",
    });

    return data; // Trả về thông tin người dùng đăng nhập
  } catch (e) {
    console.error("Lỗi khi đăng nhập:", e.message); // Log lỗi
    throw e; // Ném lỗi để có thể hiển thị thông báo cho người dùng
  }
}

function logoutUser() {
  setAuth(null);
}

function setupAuthForms() {
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      logoutUser();
      afterLogout();
    });

  const loginBtn = document.getElementById("btn-login");
  if (loginBtn)
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email")?.value.trim();
      const pass = document.getElementById("login-password")?.value;
      const msgEl = document.getElementById("login-msg");

      try {
        await loginUser({ email, password: pass });
        msgEl.textContent = "Đăng nhập thành công.";
        msgEl.className = "form-msg ok";
        afterLogin();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = "form-msg";
      }
    });
  const regBtn = document.getElementById("btn-register");
  if (regBtn)
    regBtn.addEventListener("click", async () => {
      const name = document.getElementById("reg-name")?.value.trim();
      const email = document.getElementById("reg-email")?.value.trim();
      const pass = document.getElementById("reg-pass")?.value;
      const pass2 = document.getElementById("reg-pass2")?.value;
      const msgEl = document.getElementById("reg-msg");
      try {
        if (pass !== pass2) throw new Error("Mật khẩu nhập lại không khớp.");
        await registerUser({ name, email, password: pass });
        msgEl.textContent = "Đăng ký thành công.";
        msgEl.className = "form-msg ok";
        afterLogin();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = "form-msg";
      }
    });
}

async function renderHistory() {
  const auth = getAuth();
  const wrap = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  if (!wrap || !empty) return; // Điều kiện ngắn gọn nhưng không gây lỗi

  wrap.innerHTML = "";

  if (!auth) {
    empty.style.display = "block";
    empty.innerHTML = 'Vui lòng <a href="#login">đăng nhập</a> để xem lịch sử.';
    return; // Trả về khi chưa đăng nhập
  }

  let list = [];
  try {
    const res = await fetch(`${API_BASE}/attempts/${auth.email}`);
    if (res.ok) {
      list = await res.json();
    } else {
      console.warn(
        "Không tải được lịch sử từ server, mã trạng thái:",
        res.status
      );
      list = [];
    }
  } catch (err) {
    console.warn("Lỗi khi gọi lịch sử từ server:", err.message);
    list = [];
  }
  const offlineAll = JSON.parse(
    localStorage.getItem(ATTEMPTS_OFFLINE_KEY) || "[]"
  );
  const offlineForUser = offlineAll.filter((a) => a.email === auth.email);

  let merged = Array.isArray(list) ? list.slice() : [];
  merged = merged.concat(offlineForUser);

  if (!Array.isArray(merged) || merged.length === 0) {
    empty.style.display = "block";
    empty.textContent = "Chưa có lịch sử làm bài.";
    MERGED_ATTEMPTS = [];
    return; // Dừng nếu không có dữ liệu
  }

  // Chuẩn hoá các attempt đã gộp và đảm bảo mỗi mục có một _localId ổn định để xem lại
  MERGED_ATTEMPTS = merged.map((att) => {
    const copy = Object.assign({}, att);
    copy._localId =
      copy._id || copy.createdAt || Math.random().toString(36).slice(2);
    return copy;
  });

  empty.style.display = "none";
  // Dùng MERGED_ATTEMPTS để render (đã gán _localId) để data-id trên DOM khớp khi tìm kiếm
  MERGED_ATTEMPTS.slice()
    .reverse()
    .forEach((att) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const itemId = att._localId;
      const offlineFlag = att._id ? "" : " (offline)";
      item.innerHTML = `
      <div>
        <div class="history-title">${att.quizTitle}${offlineFlag}</div>
        <div class="history-time">${att.timeText || ""}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="history-score">${att.score}/${att.total}</div>
        <a href="#review" class="review-btn" data-id="${itemId}">Xem lại</a>
      </div>`;
      wrap.appendChild(item);
    });

  wrap.querySelectorAll(".review-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      openReview(id, e.currentTarget);
    })
  );
}

let ALL_QUIZZES = [];
let ALL_QUESTIONS = [];
let currentQuiz = null;
let currentRenderedQuestions = [];
let currentQuizStartTime = null;
const ATTEMPTS_OFFLINE_KEY = "quiz_attempts_offline";
let MERGED_ATTEMPTS = [];

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadDataFiles() {
  // Tải quizzes và questions từ API (server sẽ seed DB từ JSON nếu rỗng).
  const [qz, qs] = await Promise.all([
    fetch(`${API_BASE}/quizzes`).then((r) => (r.ok ? r.json() : [])),
    fetch(`${API_BASE}/questions`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);
  ALL_QUIZZES = qz;
  ALL_QUESTIONS = qs;
}

function setupSubjectButtons() {
  // Đảm bảo gọi sự kiện cho các nút "Xem đề" sau khi danh sách môn học đã được render xong
  document.querySelectorAll(".btn-view-quizzes").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".subject-card");
      const subjectTitle = card
        .querySelector(".subject-title")
        ?.textContent.trim();
      const auth = getAuth();
      if (!auth) {
        alert("Vui lòng đăng nhập để xem đề.");
        location.hash = "#login";
        return;
      }
      location.hash = "#quizzes";
      renderQuizzes(subjectTitle); // Render danh sách đề thi của môn học đã chọn
    });
  });
}
function renderQuizzes(subjectTitle) {
  const quizzesSection = document.getElementById("quizzes");
  const titleEl = quizzesSection.querySelector(".section-title");
  const grid = quizzesSection.querySelector(".card-grid");
  if (!titleEl || !grid) return;

  titleEl.textContent = `Đề luyện tập – ${subjectTitle}`;
  grid.innerHTML = "";

  const subjectQuizzes = ALL_QUIZZES.filter(
    (q) =>
      q.subject &&
      q.subject.trim().toLowerCase() === subjectTitle.trim().toLowerCase()
  );

  if (subjectQuizzes.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:#555;">Chưa có đề thi nào cho môn này.</p>`;
    return;
  }

  subjectQuizzes.forEach((quiz) => {
    const card = document.createElement("article");
    card.className = "quiz-card";
    // tính chỉ số theo môn để hiển thị số thứ tự (reset cho mỗi môn)
    const idx = subjectQuizzes.indexOf(quiz);
    const displayIndex = String(idx + 1).padStart(2, "0");
    const displayTitle = `Đề ${displayIndex} – ${quiz.subject}`;
    // lưu quiz.title thực tế vào dataset để handler click có thể tìm đúng quiz
    card.dataset.quizTitle = quiz.title;
    card.innerHTML = `
      <div class="quiz-title">${displayTitle}</div>
      <div class="quiz-info">${quiz.totalMarks} câu - ${
      quiz.duration || 30
    } phút</div>
      <button class="primary-btn btn-start-quiz">Bắt đầu thi</button>
    `;
    grid.appendChild(card);
  });

  setupStartButtons();
}

function findQuizByTitle(title) {
  const normalize = (s) =>
    (s || "").toString().trim().replace(/\s+/g, " ").normalize();
  return ALL_QUIZZES.find((q) => normalize(q.title) === normalize(title));
}

function setupStartButtons() {
  document.querySelectorAll(".btn-start-quiz").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".quiz-card");
      // dùng dataset.quizTitle (title gốc) để tìm object quiz
      const title =
        card.dataset.quizTitle ||
        card.querySelector(".quiz-title")?.textContent.trim();
      const auth = getAuth();
      if (!auth) {
        alert("Hãy đăng nhập để làm bài.");
        location.hash = "#login";
        return;
      }

      if (!confirm("Bạn có chắc muốn bắt đầu thi ngay bây giờ không?")) return;

      const quiz = findQuizByTitle(title) || {
        title,
        subject: "",
        totalMarks: 10,
      };
      currentQuiz = quiz;
      currentQuizStartTime = Date.now();
      location.hash = "#quiz";
      renderQuiz(quiz);
    })
  );
}

// ====================================
// PHẦN SỬA: RENDER QUIZ (dòng 540-600)
// ====================================

function renderQuiz(quiz) {
  const quizSection = document.getElementById("quiz");
  const titleEl = quizSection.querySelector(".section-title");

  // Hiển thị tên môn
  titleEl.textContent = quiz.subject || quiz.title;

  // Xóa hết câu hỏi cũ
  quizSection.querySelectorAll(".question-card").forEach((e) => e.remove());

  // Lọc câu hỏi đã được gán cho quiz này
  const assigned = ALL_QUESTIONS.filter(
    (q) => q.quizTitle && q.quizTitle === quiz.title
  );

  // Kiểm tra nếu không có câu hỏi
  if (assigned.length === 0) {
    const submitArea = quizSection.querySelector(".submit-area");
    const msg = document.createElement("div");

    msg.style.padding = "16px";
    msg.style.fontSize = "18px";
    msg.style.color = "#555";
    msg.style.textAlign = "center";
    msg.textContent = "Chưa có câu hỏi cho đề thi này.";

    if (submitArea) {
      quizSection.insertBefore(msg, submitArea);
    }

    return; // Dừng việc render nếu không có câu hỏi
  }

  // ✅ FIX: Khai báo biến selected ở đây
  const selected = assigned.slice(0, quiz.totalMarks || 10);

  // ✅ FIX: Tạo currentRenderedQuestions ngay sau khi có selected
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const quizTitleEsc = escapeRegExp((quiz.title || "").trim());
  const quizPrefixRegex = quizTitleEsc
    ? new RegExp("^\\s*" + quizTitleEsc + "\\s*[-–—:]?\\s*", "i")
    : null;

  currentRenderedQuestions = selected.map((q) => {
    let text = (q.questionText || "").toString();
    if (quizPrefixRegex) text = text.replace(quizPrefixRegex, "");
    text = text.replace(/^\s*Câu\s*\d+\s*[:.\-]?\s*/i, "");

    const opts = (q.options || []).map((t) => ({
      text: t,
      isCorrect: t === q.correctAnswer,
    }));

    shuffleArray(opts);
    return { text, options: opts };
  });

  // ✅ FIX: Render câu hỏi ở đây (không phải trong validateSubmit)
  const submitArea = quizSection.querySelector(".submit-area");
  const settings = getSettings();

  currentRenderedQuestions.forEach((q, i) => {
    const card = document.createElement("article");
    card.className = "question-card";
    card.dataset.qindex = i; // Thêm data-qindex cho observer

    const timerHtml = settings.perQuestionTimer
      ? `<div class="question-timer" data-qindex="${i}" style="font-weight:600;color:#d32f2f;margin-bottom:8px;">30s</div>`
      : "";

    card.innerHTML = `
      <div class="question-number">Câu ${i + 1}</div>
      ${timerHtml}
      <div class="question-text">${q.text}</div>
      <ul class="answer-list" data-qindex="${i}">
        ${q.options
          .map(
            (opt, j) =>
              `<li class="answer-option"><label><input type="radio" name="q${i}" value="${j}" /> ${opt.text}</label></li>`
          )
          .join("")}
      </ul>
    `;

    quizSection.insertBefore(card, submitArea);
  });

  // Cập nhật timer và thông tin trong topbar
  const topbar = quizSection.querySelector(".quiz-topbar");
  if (topbar) {
    const chips = topbar.querySelectorAll(".quiz-chip");
    if (chips[0]) chips[0].textContent = `${selected.length} câu`;
    const minutes = quiz.duration || 30;
    if (chips[1]) chips[1].textContent = `Thời gian: ${minutes} phút`;

    const fill = topbar.querySelector(".quiz-timer-fill");
    if (fill) {
      fill.style.animation = "none";
      fill.offsetWidth;
      fill.style.width = "100%";
      fill.style.animation = `timerFill ${minutes * 60}s linear forwards`;
    }
  }

  // ✅ Khởi động timer từng câu nếu được bật
  if (settings.perQuestionTimer) {
    startPerQuestionTimers();
  }
}

// ====================================
// FUNCTION: START PER-QUESTION TIMERS
// ====================================

let perQuestionTimers = {}; // Track active timers

function startPerQuestionTimers() {
  const quizSection = document.getElementById("quiz");
  const questionCards = quizSection.querySelectorAll(".question-card");
  const timerElements = quizSection.querySelectorAll(".question-timer");

  if (timerElements.length === 0) return;

  function startTimerForQuestion(qIndex) {
    // Clear previous timer for this question
    if (perQuestionTimers[qIndex]) {
      clearInterval(perQuestionTimers[qIndex]);
    }

    let timeRemaining = 30;
    const timerEl = quizSection.querySelector(
      `.question-timer[data-qindex="${qIndex}"]`
    );
    if (!timerEl) return;

    const timerInterval = setInterval(() => {
      timeRemaining--;
      if (timerEl) {
        timerEl.textContent = `${timeRemaining}s`;
        timerEl.style.color =
          timeRemaining <= 10
            ? "#d32f2f"
            : timeRemaining <= 5
            ? "#ff6f00"
            : "#d32f2f";
      }

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        delete perQuestionTimers[qIndex];

        // Auto-advance to next question
        const nextIndex = qIndex + 1;
        if (nextIndex < currentRenderedQuestions.length) {
          const nextCard = questionCards[nextIndex];
          if (nextCard) {
            nextCard.scrollIntoView({ behavior: "smooth", block: "start" });
            startTimerForQuestion(nextIndex);
          }
        }
      }
    }, 1000);

    perQuestionTimers[qIndex] = timerInterval;
  }

  // Scroll observer
  const observerOptions = {
    root: null,
    rootMargin: "-50% 0px -50% 0px",
    threshold: 0,
  };

  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const qIndex = parseInt(entry.target.dataset.qindex || "0", 10);
        Object.keys(perQuestionTimers).forEach((idx) => {
          if (idx != qIndex) {
            clearInterval(perQuestionTimers[idx]);
            delete perQuestionTimers[idx];
          }
        });
        startTimerForQuestion(qIndex);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  questionCards.forEach((card) => observer.observe(card));

  if (questionCards.length > 0) {
    startTimerForQuestion(0);
  }
}

function stopPerQuestionTimers() {
  Object.values(perQuestionTimers).forEach((timer) => {
    clearInterval(timer);
  });
  perQuestionTimers = {};
}

function controlAccessUI() {
  const auth = getAuth();
  const landing = document.getElementById("landing");
  const header = document.querySelector(".header");
  const sections = document.querySelectorAll(
    "main, section:not(#landing):not(.overlay), footer"
  );

  if (!auth) {
    sections.forEach((el) => (el.style.display = "none"));
    if (header) header.style.display = "none";
    if (landing) landing.style.display = "flex";
  } else {
    sections.forEach((el) => (el.style.display = "block"));
    if (header) header.style.display = "flex";
    if (landing) landing.style.display = "none";
  }
}

function afterLogin() {
  updateHeaderAuthUI();
  renderHistory();
  controlAccessUI();

  // đóng tất cả overlay
  document
    .querySelectorAll(".overlay")
    .forEach((ov) => (ov.style.display = "none"));
  document.body.classList.remove("overlay-open");

  const auth = getAuth();

  // ⭐ TỰ ĐỘNG ĐIỀU HƯỚNG THEO ROLE
  if (auth && auth.role === "admin") {
    location.hash = "#admin"; // giao diện admin
  } else {
    location.hash = "#home"; // giao diện user
  }

  navigateToHash();

  // bật nhạc nếu ON
  const settings = getSettings();
  if (settings.music) {
    startBackgroundMusic();
  }
}

function afterLogout() {
  updateHeaderAuthUI();
  controlAccessUI();
  location.hash = "#";
  document.body.classList.remove("overlay-open");
  stopBackgroundMusic();
}

document.addEventListener("DOMContentLoaded", () => {
  const btnOpenLogin = document.getElementById("btn-open-login");
  const btnOpenRegister = document.getElementById("btn-open-register");

  if (btnOpenLogin)
    btnOpenLogin.addEventListener("click", () => {
      location.hash = "#login";
    });

  if (btnOpenRegister)
    btnOpenRegister.addEventListener("click", () => {
      location.hash = "#register";
    });
});

function formatTimeText(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

async function submitCurrentQuiz(e) {
  if (e && e.preventDefault) e.preventDefault();
  const auth = getAuth();
  if (!auth) {
    alert("Vui lòng đăng nhập trước khi nộp bài.");
    location.hash = "#login";
    return;
  }
  if (!currentRenderedQuestions || currentRenderedQuestions.length === 0) {
    alert("Không có câu hỏi để nộp.");
    return;
  }

  let score = 0;
  const answers = [];
  console.debug(
    "Đang nộp bài, currentRenderedQuestions:",
    currentRenderedQuestions
  );
  for (let i = 0; i < currentRenderedQuestions.length; i++) {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    const selectedIndex = sel ? parseInt(sel.value, 10) : null;
    const isCorrect =
      selectedIndex !== null &&
      currentRenderedQuestions[i].options[selectedIndex] &&
      currentRenderedQuestions[i].options[selectedIndex].isCorrect;
    console.debug(
      `q${i}: selectedIndex=`,
      selectedIndex,
      "isCorrect=",
      isCorrect
    );
    if (isCorrect) score++;
    answers.push({
      selected: selectedIndex,
      correct: currentRenderedQuestions[i].options.findIndex(
        (opt) => opt.isCorrect
      ),
    });
  }

  const total = currentRenderedQuestions.length;
  const timeSpentSec = currentQuizStartTime
    ? Math.floor((Date.now() - currentQuizStartTime) / 1000)
    : 0;
  const timeText = formatTimeText(timeSpentSec);
  // Scale score to maximum 10 points for each quiz
  const scaledScore = total > 0 ? Math.round((score / total) * 10) : 0;
  const attempt = {
    email: auth.email,
    quizTitle: currentQuiz?.title || "(Không tiêu đề)",

    score: scaledScore,
    total: 10,
    rawScore: score,
    rawTotal: total,
    timeSpent: timeSpentSec,
    timeText,
    answers,
    questions: currentRenderedQuestions,
    createdAt: new Date().toISOString(),
  };
  console.log("Attempt data to send:", attempt);

  try {
    const res = await fetch(`${API_BASE}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attempt),
    });
    if (!res.ok) throw new Error("Lỗi từ server");
    location.hash = "#history";
    await renderHistory();
    alert(`Nộp bài thành công. Điểm của bạn: ${scaledScore}/10`);
  } catch (err) {
    // Save offline
    const offlineAll = JSON.parse(
      localStorage.getItem(ATTEMPTS_OFFLINE_KEY) || "[]"
    );
    offlineAll.push(attempt);
    localStorage.setItem(ATTEMPTS_OFFLINE_KEY, JSON.stringify(offlineAll));
    location.hash = "#history";
    await renderHistory();
    alert(
      `Không thể lưu trên server, đã lưu tạm. Điểm của bạn: ${scaledScore}/10`
    );
  }
}

function setupSubmitButton() {
  const submitBtn = document.querySelector(".submit-area .primary-btn");
  if (submitBtn) submitBtn.addEventListener("click", submitCurrentQuiz);
}

function openReview(id, clickedEl) {
  if (!id) {
    alert("Không tìm thấy kết quả để xem lại.");
    return;
  }

  console.debug("openReview gọi với id=", id);
  console.debug(
    "MERGED_ATTEMPTS length=",
    Array.isArray(MERGED_ATTEMPTS) ? MERGED_ATTEMPTS.length : 0
  );
  if (Array.isArray(MERGED_ATTEMPTS) && MERGED_ATTEMPTS.length > 0) {
    console.debug(
      "Ví dụ MERGED_ATTEMPTS:",
      MERGED_ATTEMPTS.slice(0, 3).map((a) => ({
        _id: a._id,
        _localId: a._localId,
        quizTitle: a.quizTitle,
        timeText: a.timeText,
      }))
    );
  }
  const attempt = MERGED_ATTEMPTS.find(
    (a) => a._id === id || a.createdAt === id || a._localId === id
  );
  console.debug("openReview tìm được attempt=", attempt);

  // Fallback: if not found by id, try to locate using DOM context (quiz title/time)
  if (!attempt && clickedEl) {
    try {
      const item = clickedEl.closest(".history-item");
      const title = item.querySelector(".history-title")?.textContent.trim();
      const time = item.querySelector(".history-time")?.textContent.trim();
      console.debug("openReview cố tìm bằng tiêu đề/thời gian", title, time);
      // clean title (remove " (offline)" suffix if present)
      const cleanedTitle = (title || "")
        .replace(/\s*\(offline\)\s*$/, "")
        .trim();
      let fallback = MERGED_ATTEMPTS.find(
        (a) =>
          (a.quizTitle || "").trim() === cleanedTitle &&
          (a.timeText || "").trim() === (time || "").trim()
      );
      // relaxed fallback: match by contains or by time only
      if (!fallback) {
        fallback = MERGED_ATTEMPTS.find(
          (a) =>
            (a.quizTitle || "")
              .toLowerCase()
              .includes((cleanedTitle || "").toLowerCase()) ||
            (a.timeText || "").trim() === (time || "").trim()
        );
      }
      if (fallback) {
        console.debug("openReview fallback đã tìm thấy", fallback);
        // use fallback as attempt
        return openReview(
          fallback._localId || fallback._id || fallback.createdAt,
          clickedEl
        );
      }
    } catch (e) {
      console.warn("openReview fallback thất bại", e);
    }
  }
  if (!attempt) {
    console.warn(
      "openReview: không tìm thấy attempt cho id=",
      id,
      "MERGED_ATTEMPTS length=",
      MERGED_ATTEMPTS.length
    );
    alert("Không tìm thấy dữ liệu để xem lại.");
    return;
  }

  const titleEl = document.getElementById("review-title");
  const subEl = document.getElementById("review-sub");
  const qWrap = document.getElementById("review-questions");
  if (titleEl) titleEl.textContent = attempt.quizTitle || "Xem lại đề";
  if (subEl)
    subEl.textContent = `Điểm: ${attempt.score}/${attempt.total} - Thời gian: ${
      attempt.timeText || formatTimeText(attempt.timeSpent || 0)
    }`;

  if (!qWrap) return;
  qWrap.innerHTML = "";
  if (Array.isArray(attempt.questions) && attempt.questions.length > 0) {
    attempt.questions.forEach((q, i) => {
      const card = document.createElement("div");
      card.className = "question-card";
      const optsArr = Array.isArray(q.options) ? q.options : [];
      const selectedIdx =
        Array.isArray(attempt.answers) && attempt.answers[i]
          ? attempt.answers[i].selected
          : null;
      // If attempt.answers also stored selectedText, prefer that for fuzzy matching
      const selectedText =
        Array.isArray(attempt.answers) && attempt.answers[i]
          ? attempt.answers[i].selectedText
          : null;

      const answersEntry =
        Array.isArray(attempt.answers) && attempt.answers[i]
          ? attempt.answers[i]
          : null;
      console.debug(
        `review: q=${i}, answersEntry=`,
        answersEntry,
        `optsArr=`,
        optsArr
      );
      const optionsHtml = optsArr
        .map((opt, idx) => {
          // opt may be a string or an object { text, isCorrect }
          const optText =
            typeof opt === "string"
              ? opt
              : (opt && (opt.text || opt.value || opt.label)) || "";
          let isCorrect = false;
          if (opt && typeof opt === "object" && "isCorrect" in opt)
            isCorrect = !!opt.isCorrect;
          // fallback: if question has a correctAnswer field, compare texts
          else if (q.correctAnswer)
            isCorrect =
              String(q.correctAnswer).trim() === String(optText).trim();
          // fallback2: if attempt.answers stored correct index, use it
          else if (answersEntry && typeof answersEntry.correct === "number")
            isCorrect = answersEntry.correct === idx;

          // determine selected: either by index, or by matching text (resilient to data-shape changes)
          let isSelected = false;
          if (
            selectedIdx !== null &&
            selectedIdx !== undefined &&
            !isNaN(selectedIdx)
          ) {
            isSelected = Number(selectedIdx) === idx;
          }
          if (!isSelected && selectedText) {
            isSelected = String(selectedText).trim() === String(optText).trim();
          }

          // Extra fallback: some attempts may store selectedAnswerText under different key names
          if (!isSelected && answersEntry) {
            const alt =
              answersEntry.selectedAnswer ||
              answersEntry.selected_text ||
              answersEntry.choice ||
              null;
            if (alt) isSelected = String(alt).trim() === String(optText).trim();
          }

          console.debug(
            `review q=${i} opt=${idx} text=`,
            optText,
            `isCorrect=`,
            isCorrect,
            `isSelected=`,
            isSelected
          );

          const classes = [];
          if (isCorrect) classes.push("correct");
          if (isSelected) classes.push("selected");
          const selectedLabel = isSelected ? " (Bạn chọn)" : "";
          const correctLabel = isCorrect ? " (Đáp án đúng)" : "";
          return `<li class="answer-option ${classes.join(" ")}">${escapeHtml(
            optText
          )}${selectedLabel}${correctLabel}</li>`;
        })
        .join("");

      card.innerHTML = `
        <div class="question-number">Câu ${i + 1}</div>
        <div class="question-text">${escapeHtml(q.text || "")}</div>
        <ul class="answer-list">${optionsHtml}</ul>
      `;
      qWrap.appendChild(card);
    });
  } else if (Array.isArray(attempt.answers) && attempt.answers.length > 0) {
    attempt.answers.forEach((ans, i) => {
      const card = document.createElement("div");
      card.className = "question-card";
      const selected =
        ans.selected === null
          ? "(Không trả lời)"
          : `Lựa chọn ${ans.selected + 1}`;
      const correct =
        typeof ans.correct === "number"
          ? `Đáp án đúng: ${ans.correct + 1}`
          : "";
      card.innerHTML = `
        <div class="question-number">Câu ${i + 1}</div>
        <div class="question-text">${selected}</div>
        <div class="question-text">${correct}</div>
      `;
      qWrap.appendChild(card);
    });
  } else {
    // No detailed question objects available — show message and also update subtitle
    qWrap.innerHTML =
      "<div style='padding:12px;color:#555;'>Không có dữ liệu chi tiết để xem lại.</div>";
    const sub = document.getElementById("review-sub");
    if (sub) sub.textContent = "Không có dữ liệu chi tiết để xem lại.";
  }

  location.hash = "#review";
  // Ensure overlay is visible even if hash didn't change (force update)
  try {
    updateOverlayBodyClass();
    const reviewSection = document.getElementById("review");
    if (reviewSection) reviewSection.style.display = "flex";
    document.body.classList.add("overlay-open");
  } catch (e) {
    console.warn("openReview: không thể bật overlay", e);
  }
}
function updateOverlayBodyClass() {
  try {
    const hash = location.hash;
    // Hiện / ẩn tất cả các overlay dựa trên hash hiện tại.
    // Nếu hash trỏ tới một overlay (ví dụ '#review'), hiển thị overlay đó và thêm class body;
    // ngược lại, ẩn tất cả overlay và bỏ class 'overlay-open'.
    const overlays = document.querySelectorAll(".overlay");
    overlays.forEach((ov) => {
      try {
        const idHash = ov.id ? "#" + ov.id : null;
        if (idHash && hash === idHash) {
          ov.style.display = "flex";
        } else {
          ov.style.display = "none";
        }
      } catch (e) {
        ov.style.display = "none";
      }
    });

    if (!hash) {
      document.body.classList.remove("overlay-open");
      return;
    }
    const target = document.querySelector(hash);
    const isOverlay =
      target && target.classList && target.classList.contains("overlay");
    if (isOverlay) document.body.classList.add("overlay-open");
    else document.body.classList.remove("overlay-open");
  } catch (e) {
    document.body.classList.remove("overlay-open");
    document
      .querySelectorAll(".overlay")
      .forEach((ov) => (ov.style.display = "none"));
  }
}

// tiny helper to escape HTML when injecting innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener("hashchange", updateOverlayBodyClass);
document.addEventListener("DOMContentLoaded", updateOverlayBodyClass);
function navigateToHash() {
  const auth = getAuth();
  controlAccessUI();

  const home = document.getElementById("home");
  const quizzes = document.getElementById("quizzes");
  const quiz = document.getElementById("quiz");
  const historySec = document.getElementById("history");
  const adminSec = document.getElementById("admin");
  const loginSec = document.getElementById("login");
  const registerSec = document.getElementById("register");

  // Ẩn tất cả trước
  [home, quizzes, quiz, historySec, adminSec, loginSec, registerSec].forEach(
    (el) => {
      if (el) el.style.display = "none";
    }
  );

  const h = location.hash || "#home";

  // ❗ Nếu chưa đăng nhập → không hiển thị gì, chỉ overlay background
  if (!auth) {
    updateOverlayBodyClass();
    return;
  }

  // ⭐ Điều hướng theo hash (khi đã đăng nhập)
  if (h === "" || h === "#" || h === "#home") {
    if (home) home.style.display = "block";
  } else if (h.startsWith("#quizzes")) {
    if (quizzes) quizzes.style.display = "block";
  } else if (h.startsWith("#quiz")) {
    if (quiz) quiz.style.display = "block";
  } else if (h === "#history") {
    if (historySec) historySec.style.display = "block";
  } else if (h === "#admin") {
    if (auth.role === "admin") {
      if (adminSec) adminSec.style.display = "block";
    } else {
      alert("Bạn không có quyền truy cập trang Admin!");
      location.hash = "#home";
      if (home) home.style.display = "block";
    }
  } else if (h === "#login") {
    if (loginSec) loginSec.style.display = "block";
  } else if (h === "#register") {
    if (registerSec) registerSec.style.display = "block";
  }
  if (h === "#admin") {
    if (adminSec) adminSec.style.display = "block";
    loadAdminData(); // ⭐ Load tất cả dữ liệu admin mỗi khi vào admin
  }
  // === HIỆN / ẨN NÚT CHUYỂN GIAO DIỆN ===
  const btnGoAdmin = document.getElementById("btn-go-admin");
  const btnGoUser = document.getElementById("btn-go-user");

  if (auth && auth.role === "admin") {
    if (h === "#admin") {
      btnGoAdmin.style.display = "none";
      btnGoUser.style.display = "inline-block";
    } else {
      btnGoAdmin.style.display = "inline-block";
      btnGoUser.style.display = "none";
    }
  } else {
    // User bình thường không được thấy nút admin
    btnGoAdmin.style.display = "none";
    btnGoUser.style.display = "none";
  }

  updateHeaderAuthUI();
  updateOverlayBodyClass();
}

window.addEventListener("hashchange", () => {
  updateOverlayBodyClass();
  navigateToHash();
});
// document.addEventListener("DOMContentLoaded", () => {
//   updateOverlayBodyClass();
//   navigateToHash();
// });

function setupSettings() {
  const settingMusic = document.getElementById("setting-music");
  const settingPerqTimer = document.getElementById("setting-perq-timer");
  const avatarUpload = document.getElementById("avatar-upload");
  const avatarChoices = document.querySelectorAll(".avatar-choice");
  const btnSave = document.getElementById("btn-save-settings");

  const settings = getSettings();

  // Load current settings into UI
  if (settingMusic) settingMusic.checked = settings.music;
  if (settingPerqTimer) settingPerqTimer.checked = settings.perQuestionTimer;

  // Music toggle
  if (settingMusic) {
    settingMusic.addEventListener("change", () => {
      if (settingMusic.checked) {
        startBackgroundMusic();
      } else {
        stopBackgroundMusic();
      }
    });
  }

  // Avatar emoji choices
  avatarChoices.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const avatar = e.currentTarget.textContent.trim();
      // Update UI to show selected
      avatarChoices.forEach((b) => (b.style.opacity = "0.6"));
      e.currentTarget.style.opacity = "1";
      settings.avatar = avatar;
    });
    // Highlight current selection
    if (btn.textContent.trim() === settings.avatar) {
      btn.style.opacity = "1";
    } else {
      btn.style.opacity = "0.6";
    }
  });

  // Avatar file upload
  if (avatarUpload) {
    avatarUpload.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;

        const auth = getAuth();
        if (!auth) return alert("Bạn cần đăng nhập trước khi đổi avatar.");

        // Gửi avatar lên backend
        const res = await fetch(`${API_BASE}/update-avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: auth.email,
            avatar: dataUrl,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          alert("Không thể cập nhật avatar: " + err);
          return;
        }

        // Cập nhật vào AUTH local
        auth.avatar = dataUrl;
        setAuth(auth);

        // Cập nhật settings (để nút emoji highlight đúng)
        const settings = getSettings();
        settings.avatar = dataUrl;
        setSettings(settings);

        // Cập nhật giao diện header
        updateHeaderAuthUI();

        alert("Đã cập nhật avatar thành công!");
      };

      reader.readAsDataURL(file);
    });
  }

  // Save button
  if (btnSave) {
    btnSave.addEventListener("click", (e) => {
      e.preventDefault();
      settings.music = settingMusic ? settingMusic.checked : false;
      settings.perQuestionTimer = settingPerqTimer
        ? settingPerqTimer.checked
        : false;
      setSettings(settings);

      // Apply music setting
      if (settings.music && !musicOscillator) {
        startBackgroundMusic();
      } else if (!settings.music && musicOscillator) {
        stopBackgroundMusic();
      }

      updateHeaderAuthUI();
      alert("Cài đặt đã được lưu.");
      location.hash = "#home";
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  localStorage.removeItem(AUTH_KEY);
  updateHeaderAuthUI();
  setupAuthForms();
  setupSettings();

  await loadDataFiles();
  await renderSubjects();
  setupSubjectButtons();
  setupSubmitButton();
  renderHistory();
  controlAccessUI();
  setupAdminEvents();
  // ⭐ Chỉ router sau khi mọi thứ đã tải xong
  navigateToHash();
  updateOverlayBodyClass();

  // Resume AudioContext on any user interaction (to comply with autoplay policy)
  document.addEventListener(
    "click",
    () => {
      const ctx = ensureAudioContext();
    },
    { once: true }
  );

  // ⭐ giữ nguyên — không mất nhạc
  const auth = getAuth();
  const settings = getSettings();
  if (auth && settings.music) {
    startBackgroundMusic();
  }
});
async function loadAdminSubjects() {
  const ul = document.getElementById("admin-subject-list");
  if (!ul) return;

  ul.innerHTML = "<li>Đang tải...</li>";

  try {
    const res = await fetch(`${API_BASE}/subjects`);
    let list = [];
    if (res.ok) list = await res.json();

    ul.innerHTML = "";

    list.forEach((subj) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
          <div style="flex: 1; font-weight: 500">${subj.name}</div>
          <div style="display: flex; gap: 4px">
            <button class="secondary-btn btn-edit-subject" data-id="${subj._id}" data-name="${subj.name}" style="white-space: nowrap">
              Sửa
            </button>
            <button class="secondary-btn btn-delete-subject" data-id="${subj._id}" style="white-space: nowrap">
              Xóa
            </button>
          </div>
        </div>
      `;
      ul.appendChild(li);
    });

    // Xóa môn học
    ul.querySelectorAll(".btn-delete-subject").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Bạn có chắc muốn xóa môn này?")) return;

        const id = btn.dataset.id;

        try {
          const res = await fetch(`${API_BASE}/subjects/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            loadAdminSubjects(); // reload
          } else {
            alert("Lỗi xóa môn học");
          }
        } catch (e) {
          alert("Lỗi: " + e.message);
        }
      })
    );
  } catch (err) {
    ul.innerHTML = "<li>Lỗi khi tải dữ liệu</li>";
    console.error("Error loading subjects:", err);
  }
  document.querySelectorAll(".btn-edit-subject").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;

      // Lưu ID đang sửa
      window.currentEditingSubject = id;

      // Gán tên cũ vào input
      document.getElementById("edit-subject-name").value = name;

      // Mở popup sửa
      location.hash = "#edit-subject";
    });
  });
}

async function loadAdminQuizzes() {
  const ul = document.getElementById("admin-quiz-list");
  if (!ul) return;

  ul.innerHTML = "<li>Đang tải...</li>";

  try {
    const res = await fetch(`${API_BASE}/quizzes`);
    let list = [];
    if (res.ok) list = await res.json();

    ul.innerHTML = "";

    if (list.length === 0) {
      ul.innerHTML = "<li>Chưa có đề thi nào</li>";
      return;
    }

    list.forEach((quiz) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
          <div style="flex: 1">
            <div style="font-weight: 500">${quiz.title}</div>
            <div style="font-size: 12px; color: #666">
              Môn: ${quiz.subject} | Thời gian: ${quiz.duration}p | Điểm: ${quiz.totalMarks}
            </div>
          </div>
          <button class="secondary-btn btn-delete-quiz" data-id="${quiz._id}" style="white-space: nowrap">
            Xóa
          </button>
        </div>
      `;
      ul.appendChild(li);
    });

    // Xóa đề thi
    ul.querySelectorAll(".btn-delete-quiz").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Bạn có chắc muốn xóa đề thi này?")) return;

        const id = btn.dataset.id;

        try {
          const res = await fetch(`${API_BASE}/quizzes/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            loadAdminQuizzes(); // reload
          } else {
            alert("Lỗi xóa đề thi");
          }
        } catch (e) {
          alert("Lỗi: " + e.message);
        }
      })
    );
  } catch (err) {
    ul.innerHTML = "<li>Lỗi khi tải dữ liệu</li>";
    console.error("Error loading quizzes:", err);
  }
}

async function loadAdminQuestions() {
  const ul = document.getElementById("admin-question-list");
  if (!ul) return;

  ul.innerHTML = "<li>Đang tải...</li>";

  try {
    const res = await fetch(`${API_BASE}/quizzes`);
    let list = [];
    if (res.ok) list = await res.json();

    ul.innerHTML = "";

    if (list.length === 0) {
      ul.innerHTML = "<li>Chưa có đề thi nào</li>";
      return;
    }

    // Hiển thị danh sách đề thi - click vào để xem câu hỏi
    list.forEach((quiz) => {
      const li = document.createElement("li");
      li.style.cursor = "pointer";
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; transition: background 0.2s">
          <div style="flex: 1">
            <div style="font-weight: 500">${quiz.title}</div>
            <div style="font-size: 12px; color: #666">
              Môn: ${quiz.subject} | Thời gian: ${quiz.duration}p | Điểm: ${quiz.totalMarks}
            </div>
          </div>
          <button class="secondary-btn" style="white-space: nowrap">
            Xem câu hỏi
          </button>
        </div>
      `;

      // Click vào item để xem câu hỏi
      li.addEventListener("click", async () => {
        await viewQuizQuestions(quiz);
      });

      ul.appendChild(li);
    });
  } catch (err) {
    ul.innerHTML = "<li>Lỗi khi tải dữ liệu</li>";
    console.error("Error loading quizzes:", err);
  }
}

async function viewQuizQuestions(quiz) {
  // Tìm tất cả câu hỏi của đề này
  try {
    const res = await fetch(`${API_BASE}/questions`);
    let allQuestions = [];
    if (res.ok) allQuestions = await res.json();

    // Lọc câu hỏi theo môn học AND tiêu đề đề thi
    const quizQuestions = allQuestions.filter(
      (q) => q.subject === quiz.subject && q.quizTitle === quiz.title
    );

    // Hiển thị modal
    const modal = document.getElementById("quiz-questions");
    const title = document.getElementById("quiz-questions-title");
    const info = document.getElementById("quiz-questions-info");
    const content = document.getElementById("quiz-questions-content");

    title.textContent = `Câu hỏi của đề: ${quiz.title}`;
    info.textContent = `Môn: ${quiz.subject} | Số câu: ${quizQuestions.length} / ${quiz.totalMarks}`;

    content.innerHTML = "";

    if (quizQuestions.length === 0) {
      content.innerHTML =
        "<p style='text-align: center; color: #666; padding: 20px'>Chưa có câu hỏi cho đề thi này</p>";
    } else {
      quizQuestions.forEach((q, idx) => {
        const div = document.createElement("div");
        div.style.cssText =
          "border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin-bottom: 12px";

        const difficultyEmoji =
          q.difficulty === "easy"
            ? "🟢"
            : q.difficulty === "medium"
            ? "�"
            : "🔴";

        div.innerHTML = `
          <div style="display: flex; gap: 8px; margin-bottom: 8px">
            <span style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-size: 12px">Câu ${
              idx + 1
            }</span>
            <span style="color: #666; font-size: 12px">${difficultyEmoji} ${
          q.difficulty === "easy"
            ? "Dễ"
            : q.difficulty === "medium"
            ? "Trung bình"
            : "Khó"
        }</span>
          </div>
          <div style="margin-bottom: 8px; font-weight: 500">${
            q.questionText
          }</div>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 3px; margin-bottom: 8px">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px">Các lựa chọn:</div>
            <ul style="margin: 4px 0 0 16px; padding: 0">
              ${q.options
                .map(
                  (opt, i) => `
                <li style="color: ${
                  opt === q.correctAnswer ? "#10b981" : "#666"
                }; font-weight: ${opt === q.correctAnswer ? "600" : "400"}">
                  ${opt} ${opt === q.correctAnswer ? "✓" : ""}
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
          <div style="display: flex; gap: 4px">
            <button class="secondary-btn btn-edit-inline-question" data-id="${
              q._id
            }" style="font-size: 12px; padding: 4px 8px">
              Sửa
            </button>
            <button class="secondary-btn btn-delete-inline-question" data-id="${
              q._id
            }" style="font-size: 12px; padding: 4px 8px">
              Xóa
            </button>
          </div>
        `;
        content.appendChild(div);
      });

      // Xóa câu hỏi inline
      content.querySelectorAll(".btn-delete-inline-question").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

          try {
            const res = await fetch(`${API_BASE}/questions/${btn.dataset.id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              await viewQuizQuestions(quiz); // Reload
            } else {
              alert("Lỗi xóa câu hỏi");
            }
          } catch (e) {
            alert("Lỗi: " + e.message);
          }
        });
      });
    }

    // Lưu quiz đang xem để thêm câu hỏi
    window.currentViewingQuiz = quiz;

    modal.style.display = "block";
    location.hash = "#quiz-questions";
  } catch (err) {
    alert("Lỗi khi tải câu hỏi");
    console.error("Error loading questions:", err);
  }
}

async function loadAdminData() {
  await Promise.all([
    loadAdminSubjects(),
    loadAdminQuizzes(),
    loadAdminQuestions(),
  ]);
}
function setupAdminEvents() {
  // ==========================
  // ⭐ QUẢN LÝ MÔN HỌC
  // ==========================

  // Nút mở popup Thêm môn
  const btnAddSubject = document.getElementById("btn-add-subject");
  if (btnAddSubject) {
    btnAddSubject.addEventListener("click", () => {
      location.hash = "#add-subject";
    });
  }

  // ==========================
  // ⭐ QUẢN LÝ ĐỀ THI
  // ==========================

  // Nút mở popup Thêm đề thi
  const btnAddQuiz = document.getElementById("btn-add-quiz");
  if (btnAddQuiz) {
    btnAddQuiz.addEventListener("click", async () => {
      // Load danh sách môn học vào select
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        const subjects = res.ok ? await res.json() : [];
        const select = document.getElementById("new-quiz-subject");
        select.innerHTML = '<option value="">-- Chọn môn học --</option>';
        subjects.forEach((s) => {
          const opt = document.createElement("option");
          // Kiểm tra xem s là object hay string
          const subjectName = typeof s === "object" ? s.name : s;
          opt.value = subjectName;
          opt.textContent = subjectName;
          select.appendChild(opt);
        });
      } catch (e) {
        console.error("Lỗi tải môn học:", e);
      }
      location.hash = "#add-quiz";
    });
  }

  // Nút lưu đề thi
  const btnSaveQuiz = document.getElementById("btn-save-quiz");
  if (btnSaveQuiz) {
    btnSaveQuiz.addEventListener("click", async () => {
      const title = document.getElementById("new-quiz-title").value.trim();
      const subject = document.getElementById("new-quiz-subject").value;
      const duration =
        parseInt(document.getElementById("new-quiz-duration").value) || 0;
      const totalMarks =
        parseInt(document.getElementById("new-quiz-marks").value) || 0;

      if (!title || !subject || duration <= 0 || totalMarks <= 0) {
        alert("Vui lòng điền đầy đủ và hợp lệ tất cả thông tin.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/quizzes/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, subject, duration, totalMarks }),
        });

        if (!res.ok) throw new Error("Lỗi thêm đề thi");

        alert("✅ Thêm đề thi thành công!");
        document.getElementById("new-quiz-title").value = "";
        document.getElementById("new-quiz-subject").value = "";
        document.getElementById("new-quiz-duration").value = "";
        document.getElementById("new-quiz-marks").value = "";
        location.hash = "#admin";
        loadAdminData();
      } catch (e) {
        alert(`❌ ${e.message}`);
      }
    });
  }

  // ==========================
  // ⭐ QUẢN LÝ CÂU HỎI
  // ==========================

  // Nút mở popup Thêm câu hỏi
  const btnAddQuestion = document.getElementById("btn-add-question");
  if (btnAddQuestion) {
    btnAddQuestion.addEventListener("click", async () => {
      // Khi chọn môn → tự động load danh sách đề của môn đó
      document
        .getElementById("new-question-subject")
        .addEventListener("change", async (e) => {
          const subjectSelected = e.target.value;
          const quizSelect = document.getElementById("new-question-quiz");

          quizSelect.innerHTML = '<option value="">-- Chọn đề thi --</option>';

          if (!subjectSelected) return;

          try {
            const resQuiz = await fetch(`${API_BASE}/quizzes`);
            const quizList = resQuiz.ok ? await resQuiz.json() : [];

            // Chỉ lấy đề thuộc môn được chọn
            const filteredQuizzes = quizList.filter(
              (q) => q.subject === subjectSelected
            );

            filteredQuizzes.forEach((q) => {
              const opt = document.createElement("option");
              opt.value = q.title;
              opt.textContent = `${q.title}`;
              quizSelect.appendChild(opt);
            });
          } catch (err) {
            console.error("Lỗi load đề theo môn:", err);
          }
        });
      // Load danh sách môn học vào select
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        const subjects = res.ok ? await res.json() : [];
        const select = document.getElementById("new-question-subject");
        select.innerHTML = '<option value="">-- Chọn môn học --</option>';
        subjects.forEach((s) => {
          const opt = document.createElement("option");
          // Kiểm tra xem s là object hay string
          const subjectName = typeof s === "object" ? s.name : s;
          opt.value = subjectName;
          opt.textContent = subjectName;
          select.appendChild(opt);
        });
      } catch (e) {
        console.error("Lỗi tải môn học:", e);
      }
      location.hash = "#add-question";
    });
  }

  // Nút thêm câu hỏi từ trong modal (cho đề thi cụ thể)
  const btnAddToQuiz = document.getElementById("btn-add-to-quiz");
  if (btnAddToQuiz) {
    btnAddToQuiz.addEventListener("click", async () => {
      if (!window.currentViewingQuiz) {
        alert("Vui lòng chọn một đề thi trước");
        return;
      }

      const quiz = window.currentViewingQuiz;

      // Load danh sách môn học vào select
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        const subjects = res.ok ? await res.json() : [];
        const select = document.getElementById("new-question-subject");
        select.innerHTML = '<option value="">-- Chọn môn học --</option>';

        // Set mặc định là môn của đề hiện tại
        subjects.forEach((s) => {
          const opt = document.createElement("option");
          const subjectName = typeof s === "object" ? s.name : s;
          opt.value = subjectName;
          opt.textContent = subjectName;
          if (subjectName === quiz.subject) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
      } catch (e) {
        console.error("Lỗi tải môn học:", e);
      }

      // Reset form và set subject mặc định
      document.getElementById("new-question-text").value = "";
      document.getElementById("new-question-a").value = "";
      document.getElementById("new-question-b").value = "";
      document.getElementById("new-question-c").value = "";
      document.getElementById("new-question-d").value = "";
      document.getElementById("new-question-subject").value = quiz.subject;
      document.getElementById("new-question-difficulty").value = "easy";
      document.querySelector(
        'input[name="new-question-type"][value="multiple"]'
      ).checked = true;

      location.hash = "#add-question";
    });
  }

  // Toggle loại câu hỏi
  const questionTypeRadios = document.querySelectorAll(
    'input[name="new-question-type"]'
  );
  questionTypeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const multipleSection = document.getElementById(
        "new-question-multiple-section"
      );
      const trueFalseSection = document.getElementById(
        "new-question-truefalse-section"
      );
      const answerSection = document.getElementById(
        "new-question-multiple-answer-section"
      );

      if (radio.value === "multiple") {
        multipleSection.style.display = "block";
        trueFalseSection.style.display = "none";
        answerSection.style.display = "block";
      } else {
        multipleSection.style.display = "none";
        trueFalseSection.style.display = "flex";
        answerSection.style.display = "none";
      }
    });
  });

  // Nút lưu câu hỏi
  const btnSaveQuestion = document.getElementById("btn-save-question");
  if (btnSaveQuestion) {
    btnSaveQuestion.addEventListener("click", async () => {
      const questionType = document.querySelector(
        'input[name="new-question-type"]:checked'
      ).value;
      const subject = document.getElementById("new-question-subject").value;
      const quizTitle = document.getElementById("new-question-quiz").value;
      const questionText = document
        .getElementById("new-question-text")
        .value.trim();
      const difficulty = document.getElementById(
        "new-question-difficulty"
      ).value;

      // Kiểm tra thông tin cơ bản
      if (!subject || !questionText || !difficulty || !quizTitle) {
        alert("Vui lòng điền đầy đủ tất cả thông tin.");
        return;
      }

      let options = [];
      let correctAnswer = "";

      // XỬ LÝ TRẮC NGHIỆM 4 LỰA CHỌN
      if (questionType === "multiple") {
        const a = document.getElementById("new-question-a").value.trim();
        const b = document.getElementById("new-question-b").value.trim();
        const c = document.getElementById("new-question-c").value.trim();
        const d = document.getElementById("new-question-d").value.trim();

        const selectedCorrect = document.getElementById(
          "new-question-correct-answer"
        ).value;

        if (!a || !b || !c || !d || !selectedCorrect) {
          alert("Vui lòng điền đầy đủ tất cả lựa chọn và đáp án.");
          return;
        }

        options = [a, b, c, d];

        // ✅ GÁN ĐÚNG GIÁ TRỊ CHO correctAnswer
        switch (selectedCorrect) {
          case "A":
            correctAnswer = a;
            break;
          case "B":
            correctAnswer = b;
            break;
          case "C":
            correctAnswer = c;
            break;
          case "D":
            correctAnswer = d;
            break;
          default:
            alert("Vui lòng chọn đáp án đúng.");
            return;
        }
      }
      // XỬ LÝ CÂU HỎI ĐÚNG/SAI
      else if (questionType === "truefalse") {
        const tfAnswer = document.querySelector(
          'input[name="new-question-tf-answer"]:checked'
        );

        if (!tfAnswer) {
          alert("Vui lòng chọn đáp án Đúng hoặc Sai.");
          return;
        }

        correctAnswer = tfAnswer.value; // "Đúng" hoặc "Sai"
        options = ["Đúng", "Sai"];
      }

      // GỬI DỮ LIỆU LÊN SERVER
      try {
        const res = await fetch(`${API_BASE}/questions/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            questionText,
            options,
            correctAnswer,
            difficulty,
            quizTitle,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Lỗi thêm câu hỏi");
        }

        alert("✅ Thêm câu hỏi thành công!");

        // RESET FORM
        document.getElementById("new-question-text").value = "";
        document.getElementById("new-question-a").value = "";
        document.getElementById("new-question-b").value = "";
        document.getElementById("new-question-c").value = "";
        document.getElementById("new-question-d").value = "";
        document.getElementById("new-question-subject").value = "";
        document.getElementById("new-question-quiz").value = "";
        document.getElementById("new-question-difficulty").value = "easy";
        document.getElementById("new-question-correct-answer").value = "";

        // Reset radio buttons
        document.querySelector(
          'input[name="new-question-type"][value="multiple"]'
        ).checked = true;
        const tfRadios = document.querySelectorAll(
          'input[name="new-question-tf-answer"]'
        );
        tfRadios.forEach((r) => (r.checked = false));

        // QUAY VỀ TRANG ADMIN
        if (window.currentViewingQuiz) {
          await viewQuizQuestions(window.currentViewingQuiz);
          location.hash = "#quiz-questions";
        } else {
          location.hash = "#admin";
          loadAdminData();
        }
      } catch (e) {
        console.error("Lỗi khi thêm câu hỏi:", e);
        alert(`❌ ${e.message}`);
      }
    });
  }
  // ==========================
  // ⭐ THÊM MÔN HỌC
  // ==========================
  const btnSaveSubject = document.getElementById("btn-save-subject");
  if (btnSaveSubject) {
    btnSaveSubject.addEventListener("click", async () => {
      const nameInput = document.getElementById("new-subject-name");
      const name = nameInput.value.trim();

      // Lấy danh sách môn tránh trùng
      let existing = [];
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        if (res.ok) existing = await res.json();
      } catch {}

      const err = validateSubjectName(name, existing);
      if (err) return alert(err);

      try {
        const res = await fetch(`${API_BASE}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) throw new Error("Không thể tạo môn học");

        alert("Đã thêm môn học thành công!");
        nameInput.value = "";
        location.hash = "#admin";
        loadAdminSubjects();
      } catch (e) {
        alert("Lỗi: " + e.message);
      }
    });
  }

  // ==========================
  // ⭐ SỬA MÔN HỌC
  // ==========================

  // 1. Gán sự kiện cho nút Sửa trong danh sách
  document.querySelectorAll(".btn-edit-subject").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;

      window.currentEditingSubject = id;
      document.getElementById("edit-subject-name").value = name;

      location.hash = "#edit-subject";
    });
  });

  // 2. Nút Cập nhật môn
  const btnUpdateSubject = document.getElementById("btn-update-subject");
  if (btnUpdateSubject) {
    btnUpdateSubject.addEventListener("click", async () => {
      const id = window.currentEditingSubject;
      const newName = document.getElementById("edit-subject-name").value.trim();

      if (!id) return alert("Không xác định được môn để sửa.");

      // Lấy danh sách môn để kiểm tra trùng tên
      let existing = [];
      try {
        const res = await fetch(`${API_BASE}/subjects`);
        if (res.ok) existing = await res.json();
      } catch {}

      // bỏ môn hiện tại ra khỏi danh sách
      existing = existing.filter((s) => s._id !== id);

      const err = validateSubjectName(newName, existing);
      if (err) return alert(err);

      try {
        const res = await fetch(`${API_BASE}/subjects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });

        if (!res.ok) throw new Error("Không thể cập nhật môn học");

        alert("Đã cập nhật thành công!");
        location.hash = "#admin";
        loadAdminSubjects();
      } catch (e) {
        alert("Lỗi: " + e.message);
      }
    });
  }
}

function validateSubjectName(name, existingSubjects) {
  if (!name || name.trim().length === 0) {
    return "Tên môn học không được để trống.";
  }

  if (name.trim().length < 3) {
    return "Tên môn học phải dài ít nhất 3 ký tự.";
  }

  // Không chỉ chứa số
  if (/^\d+$/.test(name.trim())) {
    return "Tên môn học không hợp lệ (không được chỉ có số).";
  }

  // Kiểm tra trùng tên (không phân biệt hoa thường)
  const lower = name.trim().toLowerCase();
  if (existingSubjects.some((s) => s.name.trim().toLowerCase() === lower)) {
    return "Tên môn học đã tồn tại.";
  }

  return null; // hợp lệ
}
async function loadQuizCount(subjectName) {
  try {
    const res = await fetch(
      `${API_BASE}/quizzes/count/${encodeURIComponent(subjectName)}`
    );
    const data = await res.json();
    return data.count || 0; // Trả về số lượng đề thi của môn học
  } catch (error) {
    console.error("Lỗi khi lấy số lượng đề thi:", error);
    return 0; // Trả về 0 nếu gặp lỗi
  }
}

async function renderSubjects() {
  const grid = document.querySelector("#home .card-grid");
  if (!grid) return;

  grid.innerHTML = "<p>Đang tải...</p>";

  try {
    const res = await fetch(`${API_BASE}/subjects`);
    const list = res.ok ? await res.json() : [];

    if (list.length === 0) {
      grid.innerHTML =
        "<p style='text-align:center;color:#666'>Chưa có môn học nào.</p>";
      return;
    }

    grid.innerHTML = ""; // Xóa nội dung cũ trong grid

    // 🟦 Dùng for..of thay vì forEach để await hoạt động đúng
    for (const sub of list) {
      // Đợi lấy số lượng đề cho môn học này
      const count = await loadQuizCount(sub.name);

      const card = document.createElement("article");
      card.className = "subject-card";
      card.innerHTML = `
        <h3 class="subject-title">${sub.name}</h3>
        <p class="subject-info">${count} đề - Độ khó: Trung bình</p>
        <button class="primary-btn btn-view-quizzes">Xem đề</button>
      `;
      grid.appendChild(card); // Thêm card vào trong grid
    }

    // 🔥 Gọi sau khi render xong toàn bộ card để gắn sự kiện cho các nút "Xem đề"
    setupSubjectButtons();
  } catch (e) {
    grid.innerHTML = "<p style='color:red'>Lỗi tải môn học</p>";
    console.error("Lỗi khi tải môn học:", e);
  }
}
async function loadQuizCount(subjectName) {
  const res = await fetch(
    `/api/quizzes/count/${encodeURIComponent(subjectName)}`
  );
  const data = await res.json();
  return data.count;
}
const header = document.querySelector(".header");

/**
 * Kiểm tra hash hiện tại để áp dụng lớp exam-mode vào Header.
 */
function checkExamMode() {
  // 1. Dừng timer (nếu có) khi rời khỏi #quiz (Hàm stopPerQuestionTimers đã được bổ sung trước đó)
  if (window.location.hash !== "#quiz") {
    // Dừng timer tổng và timer từng câu hỏi khi rời khỏi trang quiz
    stopPerQuestionTimers();
  }

  // 2. Áp dụng/Xóa lớp CSS ẩn nút
  if (window.location.hash === "#quiz") {
    // Đang làm bài thi: Thêm lớp exam-mode để ẩn các nút điều hướng
    if (header) {
      header.classList.add("exam-mode");
    }
  } else {
    // Không làm bài thi (ở #history, #home, #login...): Xóa lớp exam-mode
    if (header) {
      header.classList.remove("exam-mode");
    }
  }
}
function stopPerQuestionTimers() {
  console.debug("Stopping all per-question timers.");
  Object.values(perQuestionTimers).forEach((timer) => {
    clearInterval(timer);
  });
  perQuestionTimers = {}; // Đảm bảo reset lại object
}

// Bổ sung: Dừng timer tổng của bài thi (thanh màu đỏ/xanh lá trên cùng)
function stopTotalQuizTimer() {
  const fill = document.querySelector(".quiz-timer-fill");
  if (fill) {
    fill.style.animation = "none";
    // Nếu bạn có một global timer interval cho bài thi, hãy xóa nó ở đây.
    // Hiện tại code chỉ dùng CSS animation, nên không cần clearInterval.
  }
}

// Gọi hàm checkExamMode khi trang tải và khi hash thay đổi
document.addEventListener("DOMContentLoaded", () => {
  // ... (Các code DOMContentLoaded khác của bạn)

  // Khởi tạo trạng thái ban đầu
  checkExamMode();
});

// Lắng nghe sự kiện thay đổi hash (chuyển trang)
window.addEventListener("hashchange", checkExamMode);
async function setupEditButtons() {
  document.querySelectorAll(".btn-edit-question").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const questionId = e.currentTarget.dataset.id; // Cần có data-id trên nút
      if (!questionId) return;

      // 1. Lấy dữ liệu câu hỏi hiện tại từ API
      const auth = getAuth();
      if (!auth || auth.role !== "admin") {
        alert("Bạn không có quyền này.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/questions/${questionId}`);
        if (!res.ok) throw new Error("Không tìm thấy câu hỏi.");
        const questionData = await res.json();

        // 2. Hiển thị form/modal chỉnh sửa và điền dữ liệu (Cần có mã HTML cho modal này)
        openEditQuestionModal(questionData);
      } catch (error) {
        console.error("Lỗi khi tải câu hỏi để sửa:", error);
        alert("Lỗi: " + error.message);
      }
    });
  });
}
