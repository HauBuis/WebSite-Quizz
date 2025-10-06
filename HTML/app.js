// ==== LƯU/TRUY XUẤT LỊCH SỬ LÀM BÀI (localStorage) ====
const KEY = "quiz_attempts";

// Lấy danh sách attempts từ localStorage
function getAttempts() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveAttempt(attempt) {
  const list = getAttempts();
  list.unshift(attempt); // thêm lên đầu
  localStorage.setItem(KEY, JSON.stringify(list));
}

function seedSample() {
  const sample = {
    id: crypto.randomUUID(),
    quizTitle: "Đề 01 – Mảng & Danh sách liên kết",
    timeText: "18:30 • 12/10/2025",
    score: 26,
    total: 30,
    durationText: "28 phút",
    questions: [
      {
        text: "Cấu trúc dữ liệu nào cho phép chèn/xóa ở cuối O(1)?",
        options: [
          { text: "Mảng tĩnh", isCorrect: false },
          { text: "Danh sách liên kết đơn", isCorrect: false },
          { text: "Ngăn xếp (Stack)", isCorrect: true },
          { text: "Hàng đợi ưu tiên", isCorrect: false },
        ],
        chosenIndex: 2,
      },
      {
        text: "Cấu trúc dữ liệu nào phù hợp để duyệt BFS?",
        options: [
          { text: "Ngăn xếp", isCorrect: false },
          { text: "Hàng đợi", isCorrect: true },
          { text: "Cây nhị phân", isCorrect: false },
          { text: "Bảng băm", isCorrect: false },
        ],
        chosenIndex: 0,
      },
    ],
  };
  saveAttempt(sample);
}

// ==== RENDER LỊCH SỬ ====
function renderHistory() {
  const list = getAttempts();
  const wrap = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  if (!wrap || !empty) return;

  wrap.innerHTML = "";
  if (list.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.forEach((att) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <div class="history-title">${att.quizTitle}</div>
        <div class="history-time">${att.timeText || ""}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="history-score">${att.score}/${att.total}</div>
        <a href="#review" class="review-btn" data-id="${att.id}">Xem lại</a>
      </div>
    `;
    wrap.appendChild(item);
  });

  // Gắn sự kiện cho nút Xem lại
  wrap.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      openReview(id);
    });
  });
}

// ==== XEM LẠI CHI TIẾT ====
function openReview(id) {
  const list = getAttempts();
  const att = list.find((a) => a.id === id);
  if (!att) return;

  const title = document.getElementById("review-title");
  const sub = document.getElementById("review-sub");
  const qwrap = document.getElementById("review-questions");

  title.textContent = att.quizTitle || "Xem lại đề";
  sub.textContent = `Điểm: ${att.score}/${att.total} • Thời gian: ${
    att.durationText || "—"
  }`;
  qwrap.innerHTML = "";

  (att.questions || []).forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "review-card";
    const answersHtml = (q.options || [])
      .map((opt, i) => {
        const chosen = q.chosenIndex === i;
        const classes = [
          "review-answer",
          opt.isCorrect ? "is-correct" : "",
          !opt.isCorrect && chosen ? "is-wrong" : "",
          chosen ? "is-chosen" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const badges = [
          opt.isCorrect
            ? `<span class="answer-badge badge-true">Đúng</span>`
            : `<span class="answer-badge badge-false">Sai</span>`,
          chosen
            ? `<span class="answer-badge badge-chosen">Bạn chọn</span>`
            : "",
        ].join(" ");

        return `<li class="${classes}">
        ${opt.text} ${badges}
      </li>`;
      })
      .join("");

    card.innerHTML = `
      <div class="review-q-index">Câu ${idx + 1}</div>
      <div class="review-q-text">${q.text || ""}</div>
      <ul class="review-answers">
        ${answersHtml}
      </ul>
    `;
    qwrap.appendChild(card);
  });
}

// ==== KHỞI TẠO ====
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
});
