const API_BASE = "http://localhost:5000/api";
const AUTH_KEY = "quiz_auth";

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}
function setAuth(auth) {
  if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_KEY);
}

function updateHeaderAuthUI() {
  const auth = getAuth();
  const elLogin = document.getElementById("menu-login");
  const elReg = document.getElementById("menu-register");
  const elUser = document.getElementById("menu-user");
  const elEmail = document.getElementById("menu-user-email");
  if (!elLogin || !elReg || !elUser || !elEmail) return;

  if (auth && auth.email) {
    elLogin.style.display = "none";
    elReg.style.display = "none";
    elUser.style.display = "inline-flex";
    elEmail.textContent = auth.email;
  } else {
    elLogin.style.display = "inline-block";
    elReg.style.display = "inline-block";
    elUser.style.display = "none";
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
  setAuth(data);
  return data;
}

async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập.");
  setAuth(data);
  return data;
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
    loginBtn.addEventListener("click", async () => {
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
  if (!wrap || !empty) return;
  wrap.innerHTML = "";

  if (!auth) {
    empty.style.display = "block";
    empty.innerHTML = 'Vui lòng <a href="#login">đăng nhập</a> để xem lịch sử.';
    return;
  }

  let list = [];
  try {
    const res = await fetch(`${API_BASE}/attempts/${auth.email}`);
    if (res.ok) {
      list = await res.json();
    } else {
      console.warn("Không tải được lịch sử từ server, mã trạng thái:", res.status);
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
    return;
  }

  // Chuẩn hoá các attempt đã gộp và đảm bảo mỗi mục có một _localId ổn định để xem lại
  MERGED_ATTEMPTS = merged.map((att) => {
    const copy = Object.assign({}, att);
    copy._localId = copy._id || copy.createdAt || Math.random().toString(36).slice(2);
    return copy;
  });

  empty.style.display = "none";
  // Dùng MERGED_ATTEMPTS để render (đã gán _localId) để data-id trên DOM khớp khi tìm kiếm
  MERGED_ATTEMPTS
    .slice()
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
      renderQuizzes(subjectTitle);
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
      <div class="quiz-info">${quiz.totalMarks} câu - ${quiz.duration || 30} phút</div>
      <button class="primary-btn btn-start-quiz">Bắt đầu thi</button>
    `;
    grid.appendChild(card);
  });

  setupStartButtons();
}

function findQuizByTitle(title) {
  const normalize = (s) => (s || '').toString().trim().replace(/\s+/g,' ').normalize();
  return ALL_QUIZZES.find((q) => normalize(q.title) === normalize(title));
}

function setupStartButtons() {
  document.querySelectorAll(".btn-start-quiz").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".quiz-card");
  // dùng dataset.quizTitle (title gốc) để tìm object quiz
      const title = card.dataset.quizTitle || card.querySelector(".quiz-title")?.textContent.trim();
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

function renderQuiz(quiz) {
  const quizSection = document.getElementById("quiz");
  const titleEl = quizSection.querySelector(".section-title");
  // Hiển thị chỉ tên môn (loại bỏ tiền tố số trong quiz.title)
  titleEl.textContent = quiz.subject || quiz.title;

  quizSection.querySelectorAll(".question-card").forEach((e) => e.remove());
  // Ưu tiên câu hỏi đã gán cho quiz này (quizTitle). Nếu không đủ,
  // dùng kho câu hỏi theo môn làm dự phòng, đồng thời tránh trùng lặp.
  const normalize = (s) => (s || '').toString().trim().replace(/\s+/g,' ').normalize();
  const assigned = ALL_QUESTIONS.filter(
    (q) => q.quizTitle && normalize(q.quizTitle) === normalize(quiz.title || "")
  );
  let pool = [];
  if (assigned.length >= (quiz.totalMarks || 10)) {
    pool = assigned;
  } else {
  // bắt đầu với các câu đã gán (có thể rỗng), sau đó thêm câu theo môn, loại trừ những câu đã thêm
    pool = assigned.slice();
    const subjectPool = ALL_QUESTIONS.filter(
      (q) => normalize(q.subject) === normalize(quiz.subject) && normalize(q.quizTitle) !== normalize(quiz.title)
    );
  // Tránh trùng lặp dựa trên questionText
    const seen = new Set(pool.map((p) => p.questionText));
    for (const q of subjectPool) {
      if (seen.size >= (quiz.totalMarks || 10)) break;
      if (!seen.has(q.questionText)) {
        pool.push(q);
        seen.add(q.questionText);
      }
    }
    if (pool.length === 0) pool = ALL_QUESTIONS.slice(0, quiz.totalMarks || 10);
  }
  const selected = pool.slice(0, quiz.totalMarks || 10);

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

  // Tạo danh sách câu hỏi hiển thị với options đã xáo (giữ flag isCorrect)
  // Ngoài ra loại bỏ các tiền tố vô tình (quiz title hoặc "Câu N:") trong questionText
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  const quizTitleEsc = escapeRegExp((quiz.title || "").trim());
  const quizPrefixRegex = quizTitleEsc ? new RegExp('^\\s*' + quizTitleEsc + '\\s*[-–—:]?\\s*', 'i') : null;
  currentRenderedQuestions = selected.map((q) => {
    let text = (q.questionText || '').toString();
    if (quizPrefixRegex) text = text.replace(quizPrefixRegex, '');
    // remove leading 'Câu 1:', 'Câu 1 -', etc.
    text = text.replace(/^\s*Câu\s*\d+\s*[:.-]?\s*/i, '');
    const opts = (q.options || []).map((t) => ({ text: t, isCorrect: t === q.correctAnswer }));
    shuffleArray(opts);
    return { text, options: opts };
  });

  const submitArea = quizSection.querySelector(".submit-area");
  if (selected.length === 0) {
    const msg = document.createElement("div");
    msg.style.padding = "12px";
    msg.style.color = "#555";
    msg.textContent = "Không có câu hỏi cho đề này.";
    quizSection.insertBefore(msg, submitArea);
    return;
  }
  currentRenderedQuestions.forEach((q, i) => {
    const card = document.createElement("article");
    card.className = "question-card";
    card.innerHTML = `
      <div class="question-number">Câu ${i + 1}</div>
      <div class="question-text">${q.text}</div>
      <ul class="answer-list" data-qindex="${i}">
        ${q.options
          .map(
            (opt, j) =>
              `<li class="answer-option"><label><input type="radio" name="q${i}" value="${j}" /> ${opt.text}</label></li>`
          )
          .join("")}
      </ul>`;
    quizSection.insertBefore(card, submitArea);
  });
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
  document
    .querySelectorAll(".overlay")
    .forEach((ov) => (ov.style.display = "none"));
  document.body.classList.remove("overlay-open");
  history.pushState("", document.title, window.location.pathname);
  navigateToHash();
}

function afterLogout() {
  updateHeaderAuthUI();
  controlAccessUI();
  location.hash = "#";
  document.body.classList.remove("overlay-open");
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
  console.debug("Đang nộp bài, currentRenderedQuestions:", currentRenderedQuestions);
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
    // store scaled score so maximum possible is 10
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

  try {
    const res = await fetch(`${API_BASE}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attempt),
    });
    if (!res.ok) throw new Error("Server returned error");
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

  console.debug('openReview gọi với id=', id);
  const attempt = MERGED_ATTEMPTS.find(
    (a) => a._id === id || a.createdAt === id || a._localId === id
  );
  console.debug('openReview tìm được attempt=', attempt);

  // Fallback: if not found by id, try to locate using DOM context (quiz title/time)
  if (!attempt && clickedEl) {
    try {
      const item = clickedEl.closest('.history-item');
      const title = item.querySelector('.history-title')?.textContent.trim();
      const time = item.querySelector('.history-time')?.textContent.trim();
      console.debug('openReview fallback search by title/time', title, time);
      const fallback = MERGED_ATTEMPTS.find((a) => (a.quizTitle || '').trim() === (title || '').trim() && (a.timeText || '').trim() === (time || '').trim());
      if (fallback) {
        console.debug('openReview fallback found', fallback);
        // use fallback as attempt
        arguments[1] = clickedEl;
        return openReview(fallback._localId || fallback._id || fallback.createdAt, clickedEl);
      }
    } catch (e) {
      console.warn('openReview fallback failed', e);
    }
  }

  if (!attempt) {
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
      const optionsHtml = (q.options || [])
          .map((opt, idx) => {
          const isCorrect = !!opt.isCorrect;
          const selectedIdx =
            Array.isArray(attempt.answers) && attempt.answers[i]
              ? attempt.answers[i].selected
              : null;
          const isSelected = selectedIdx === idx;
          const classes = [];
          if (isCorrect) classes.push("correct");
          if (isSelected) classes.push("selected");
          return `<li class="answer-option ${classes.join(" ")}">${opt.text}${isCorrect ? " (Đúng)" : ""}</li>`;
        })
        .join("");

      card.innerHTML = `
        <div class="question-number">Câu ${i + 1}</div>
        <div class="question-text">${q.text}</div>
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
    const sub = document.getElementById('review-sub');
    if (sub) sub.textContent = 'Không có dữ liệu chi tiết để xem lại.';
  }

  location.hash = "#review";
}
function updateOverlayBodyClass() {
  try {
    const hash = location.hash;
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
  }
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

  if (!auth) {
    updateOverlayBodyClass();
    return;
  }
  [home, quizzes, quiz, historySec].forEach((el) => {
    if (el) el.style.display = "none";
  });

  const h = location.hash || "#home";
  if (h === "" || h === "#" || h === "#home") {
    if (home) home.style.display = "block";
  } else if (h.startsWith("#quizzes")) {
    if (quizzes) quizzes.style.display = "block";
  } else if (h.startsWith("#quiz")) {
    if (quiz) quiz.style.display = "block";
  } else if (h === "#history") {
    if (historySec) historySec.style.display = "block";
  }

  updateHeaderAuthUI();
  updateOverlayBodyClass();
}

window.addEventListener("hashchange", () => {
  updateOverlayBodyClass();
  navigateToHash();
});
document.addEventListener("DOMContentLoaded", () => {
  updateOverlayBodyClass();
  navigateToHash();
});

document.addEventListener("DOMContentLoaded", async () => {
  updateHeaderAuthUI();
  setupAuthForms();
  await loadDataFiles();
  setupSubjectButtons();
  setupSubmitButton();
  renderHistory();
  controlAccessUI();
  if (["#login", "#register", "#review"].includes(location.hash)) {
    history.pushState("", document.title, window.location.pathname);
  }
});
