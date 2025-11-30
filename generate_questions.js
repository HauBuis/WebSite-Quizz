const fs = require("fs");
const path = require("path");

const subjects = [
  "Cấu trúc dữ liệu & Giải thuật",
  "Lập trình C cơ bản",
  "Mạng máy tính",
  "Cơ sở dữ liệu",
  "Hệ điều hành",
];

const questionBanks = {
  "Cấu trúc dữ liệu & Giải thuật": [
    {
      q: "Ngăn xếp hoạt động theo nguyên tắc nào?",
      a: ["FIFO", "LIFO", "Random", "Circular"],
      correct: "LIFO",
      d: "easy",
    },
    {
      q: "Hàng đợi hoạt động theo nguyên tắc nào?",
      a: ["LIFO", "FIFO", "Random", "Stack"],
      correct: "FIFO",
      d: "easy",
    },
    {
      q: "Độ phức tạp của tìm kiếm nhị phân là?",
      a: ["O(n)", "O(log n)", "O(n²)", "O(2n)"],
      correct: "O(log n)",
      d: "medium",
    },
    {
      q: "Quick Sort có độ phức tạp trung bình là?",
      a: ["O(n)", "O(n log n)", "O(n²)", "O(2n)"],
      correct: "O(n log n)",
      d: "medium",
    },
    {
      q: "Cây nhị phân tìm kiếm là gì?",
      a: [
        "Cây 2 con",
        "Con trái < nút < con phải",
        "Cây cân bằng",
        "Cây đỏ-đen",
      ],
      correct: "Con trái < nút < con phải",
      d: "medium",
    },
    {
      q: "Đồ thị là gì?",
      a: [
        "Tập hợp điểm",
        "Tập hợp nút và cạnh",
        "Tập hợp đường thẳng",
        "Tập hợp hình tròn",
      ],
      correct: "Tập hợp nút và cạnh",
      d: "easy",
    },
    {
      q: "DFS sử dụng cấu trúc dữ liệu nào?",
      a: ["Hàng đợi", "Ngăn xếp", "Danh sách", "Cây"],
      correct: "Ngăn xếp",
      d: "medium",
    },
    {
      q: "BFS sử dụng cấu trúc dữ liệu nào?",
      a: ["Ngăn xếp", "Hàng đợi", "Danh sách", "Cây"],
      correct: "Hàng đợi",
      d: "medium",
    },
    {
      q: "Dijkstra dùng để làm gì?",
      a: ["Sắp xếp", "Tìm đường ngắn nhất", "Duyệt cây", "Tìm kiếm"],
      correct: "Tìm đường ngắn nhất",
      d: "hard",
    },
    {
      q: "Hash table có độ phức tạp tìm kiếm?",
      a: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correct: "O(1)",
      d: "medium",
    },
    {
      q: "Bubble Sort có độ phức tạp?",
      a: ["O(log n)", "O(n)", "O(n²)", "O(2n)"],
      correct: "O(n²)",
      d: "easy",
    },
    {
      q: "Merge Sort có độ phức tạp?",
      a: ["O(n)", "O(n log n)", "O(n²)", "O(2n)"],
      correct: "O(n log n)",
      d: "medium",
    },
    {
      q: "Danh sách liên kết là gì?",
      a: ["Mảng", "Nút liên kết bằng con trỏ", "Cây", "Đồ thị"],
      correct: "Nút liên kết bằng con trỏ",
      d: "medium",
    },
    {
      q: "Cây đỏ-đen là gì?",
      a: ["Cây nhị phân", "Cây BST cân bằng", "Cây nhỏ", "Không nút"],
      correct: "Cây BST cân bằng",
      d: "hard",
    },
    {
      q: "Heap là gì?",
      a: ["Stack", "Cây nhị phân hoàn toàn", "Mảng", "Danh sách"],
      correct: "Cây nhị phân hoàn toàn",
      d: "medium",
    },
    {
      q: "Greedy chọn?",
      a: ["Toàn bộ", "Tối ưu cục bộ", "Ngẫu nhiên", "Nhỏ nhất"],
      correct: "Tối ưu cục bộ",
      d: "hard",
    },
    {
      q: "Insertion Sort complexity?",
      a: ["O(log n)", "O(n)", "O(n²)", "O(2n)"],
      correct: "O(n²)",
      d: "easy",
    },
    {
      q: "Graph traversal methods?",
      a: ["DFS, BFS", "Sắp xếp", "Tìm kiếm", "Cây"],
      correct: "DFS, BFS",
      d: "medium",
    },
    {
      q: "Binary search requires?",
      a: ["Không", "Sắp xếp", "Cây", "Hash"],
      correct: "Sắp xếp",
      d: "easy",
    },
    {
      q: "Stack push complexity?",
      a: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correct: "O(1)",
      d: "easy",
    },
  ],
  "Lập trình C cơ bản": [
    {
      q: "Khai báo biến trong C?",
      a: ["var x;", "int x;", "x int;", "declare x;"],
      correct: "int x;",
      d: "easy",
    },
    {
      q: "printf dùng để?",
      a: ["Đọc", "In", "Tạo", "Xóa"],
      correct: "In",
      d: "easy",
    },
    {
      q: "scanf dùng để?",
      a: ["In", "Đọc", "Tạo", "Xóa"],
      correct: "Đọc",
      d: "easy",
    },
    {
      q: "Con trỏ là gì?",
      a: ["Biến giá trị", "Biến địa chỉ", "Biến kiểu", "Hằng"],
      correct: "Biến địa chỉ",
      d: "medium",
    },
    {
      q: "Toán tử & dùng?",
      a: ["AND", "Địa chỉ", "Nhân", "Chia"],
      correct: "Địa chỉ",
      d: "medium",
    },
    {
      q: "Toán tử * trước biến?",
      a: ["Nhân", "Khởi tạo", "Truy cập giá trị", "XOR"],
      correct: "Truy cập giá trị",
      d: "medium",
    },
    {
      q: "Mảng là gì?",
      a: ["Biến khác", "Biến cùng kiểu", "Con trỏ", "Hàm"],
      correct: "Biến cùng kiểu",
      d: "easy",
    },
    {
      q: "for cú pháp?",
      a: ["for i in", "for(i=0;i<n;i++)", "for each", "while"],
      correct: "for(i=0;i<n;i++)",
      d: "easy",
    },
    {
      q: "struct dùng?",
      a: ["Hàm", "Mảng", "Gom biến", "Bộ nhớ"],
      correct: "Gom biến",
      d: "medium",
    },
    {
      q: "malloc dùng?",
      a: ["Giải phóng", "Cấp phát", "Sắp xếp", "Tìm"],
      correct: "Cấp phát",
      d: "medium",
    },
    {
      q: "strlen dùng?",
      a: ["Sao chép", "Độ dài", "So sánh", "Nối"],
      correct: "Độ dài",
      d: "easy",
    },
    {
      q: "strcpy dùng?",
      a: ["So sánh", "Sao chép", "Độ dài", "Nối"],
      correct: "Sao chép",
      d: "easy",
    },
    {
      q: "strcat dùng?",
      a: ["Sao chép", "So sánh", "Nối", "Độ dài"],
      correct: "Nối",
      d: "easy",
    },
    {
      q: "Biến global phạm vi?",
      a: ["Hàm", "Chương trình", "File", "Khối"],
      correct: "Chương trình",
      d: "medium",
    },
    {
      q: "Biến local phạm vi?",
      a: ["Chương trình", "Hàm/khối", "File", "Thư viện"],
      correct: "Hàm/khối",
      d: "medium",
    },
    {
      q: "Thư viện chuẩn?",
      a: ["stdio.h", "stdlib.h", "string.h", "Tất cả"],
      correct: "Tất cả",
      d: "easy",
    },
    {
      q: "free dùng?",
      a: ["Cấp phát", "Giải phóng", "Tạo", "Xóa"],
      correct: "Giải phóng",
      d: "medium",
    },
    {
      q: "Mảng 2D khai báo?",
      a: ["int a[10]", "int a[10][5]", "int a[][]", "int *a[10]"],
      correct: "int a[10][5]",
      d: "easy",
    },
    {
      q: "if-else cú pháp?",
      a: ["if() {} else{}", "if() then", "if: else:", "if{} else{}"],
      correct: "if() {} else{}",
      d: "easy",
    },
    {
      q: "while loop là?",
      a: ["Đếm lần", "Lặp điều kiện", "Hàm", "Array"],
      correct: "Lặp điều kiện",
      d: "easy",
    },
  ],
  "Mạng máy tính": [
    {
      q: "OSI có bao nhiêu tầng?",
      a: ["5", "6", "7", "8"],
      correct: "7",
      d: "easy",
    },
    {
      q: "TCP ở tầng nào?",
      a: ["Physical", "Data Link", "Transport", "App"],
      correct: "Transport",
      d: "medium",
    },
    {
      q: "IP ở tầng nào?",
      a: ["Transport", "Network", "Data Link", "Physical"],
      correct: "Network",
      d: "medium",
    },
    {
      q: "HTTP port mặc định?",
      a: ["22", "80", "443", "3306"],
      correct: "80",
      d: "easy",
    },
    {
      q: "HTTPS port mặc định?",
      a: ["80", "22", "443", "3306"],
      correct: "443",
      d: "easy",
    },
    {
      q: "DNS dùng để?",
      a: ["Mã hóa", "Phân giải tên miền", "Định tuyến", "Xác thực"],
      correct: "Phân giải tên miền",
      d: "easy",
    },
    {
      q: "IPv4 bao nhiêu bit?",
      a: ["16", "32", "64", "128"],
      correct: "32",
      d: "easy",
    },
    {
      q: "IPv6 bao nhiêu bit?",
      a: ["32", "64", "128", "256"],
      correct: "128",
      d: "easy",
    },
    {
      q: "Switch là?",
      a: ["Công tắc", "Kết nối LAN", "Định tuyến", "Modem"],
      correct: "Kết nối LAN",
      d: "easy",
    },
    {
      q: "Router dùng?",
      a: ["Kết nối máy", "Định tuyến gói tin", "Tốc độ", "Nén"],
      correct: "Định tuyến gói tin",
      d: "easy",
    },
    {
      q: "Bandwidth là?",
      a: ["Tên miền", "Dung lượng truyền", "IP", "Mật khẩu"],
      correct: "Dung lượng truyền",
      d: "easy",
    },
    {
      q: "Latency là?",
      a: ["Dung lượng", "Tốc độ", "Độ trễ", "Khoảng cách"],
      correct: "Độ trễ",
      d: "medium",
    },
    {
      q: "VPN dùng?",
      a: ["Tốc độ", "Kết nối an toàn", "Nén", "Sắp xếp"],
      correct: "Kết nối an toàn",
      d: "medium",
    },
    {
      q: "Proxy server dùng?",
      a: ["Sắp xếp", "Đại diện client", "Nén", "Mã hóa"],
      correct: "Đại diện client",
      d: "medium",
    },
    {
      q: "MAC address là?",
      a: ["Internet", "Phần cứng", "Máy tính", "Mật khẩu"],
      correct: "Phần cứng",
      d: "medium",
    },
    {
      q: "Subnetting dùng?",
      a: ["Chia mạng con", "Nối mạng", "Tốc độ", "Mã hóa"],
      correct: "Chia mạng con",
      d: "hard",
    },
    {
      q: "Firewall dùng?",
      a: ["Tốc độ", "Bảo vệ", "Sắp xếp", "Nén"],
      correct: "Bảo vệ",
      d: "easy",
    },
    {
      q: "Ping dùng?",
      a: ["Tốc độ", "Kiểm tra kết nối", "Nén", "Mã hóa"],
      correct: "Kiểm tra kết nối",
      d: "easy",
    },
    {
      q: "TCP handshake?",
      a: ["1 bước", "2 bước", "3 bước", "4 bước"],
      correct: "3 bước",
      d: "hard",
    },
    {
      q: "UDP đặc điểm?",
      a: ["Tin cậy", "Nhanh", "An toàn", "Chậm"],
      correct: "Nhanh",
      d: "medium",
    },
  ],
  "Cơ sở dữ liệu": [
    {
      q: "RDBMS là?",
      a: ["Random DB", "Relational DB", "Remote DB", "Real-time DB"],
      correct: "Relational DB",
      d: "easy",
    },
    {
      q: "Bảng là?",
      a: ["Danh sách", "Hàng/cột", "File", "CSDL"],
      correct: "Hàng/cột",
      d: "easy",
    },
    {
      q: "Primary Key là?",
      a: ["Khóa bảo", "Định danh duy nhất", "Khóa tạm", "Mã hóa"],
      correct: "Định danh duy nhất",
      d: "easy",
    },
    {
      q: "Foreign Key dùng?",
      a: ["Bảo vệ", "Kết nối bảng", "Xóa", "Sắp xếp"],
      correct: "Kết nối bảng",
      d: "medium",
    },
    {
      q: "JOIN là?",
      a: ["Xóa", "Gộp dữ liệu", "Sắp xếp", "Tìm"],
      correct: "Gộp dữ liệu",
      d: "medium",
    },
    {
      q: "INNER JOIN?",
      a: ["Trái", "Khớp", "Phải", "Tất cả"],
      correct: "Khớp",
      d: "medium",
    },
    {
      q: "LEFT JOIN?",
      a: ["Phải", "Trái + khớp", "Khớp", "Tất cả"],
      correct: "Trái + khớp",
      d: "medium",
    },
    {
      q: "Normalization dùng?",
      a: ["Tốc độ", "Loại trùng", "Nén", "Mã hóa"],
      correct: "Loại trùng",
      d: "medium",
    },
    {
      q: "SQL là?",
      a: ["Query", "Simple", "Secure", "Sequential"],
      correct: "Query",
      d: "easy",
    },
    {
      q: "SELECT dùng?",
      a: ["Thêm", "Lấy", "Xóa", "Sửa"],
      correct: "Lấy",
      d: "easy",
    },
    {
      q: "INSERT dùng?",
      a: ["Lấy", "Thêm", "Xóa", "Sửa"],
      correct: "Thêm",
      d: "easy",
    },
    {
      q: "UPDATE dùng?",
      a: ["Thêm", "Sửa", "Xóa", "Lấy"],
      correct: "Sửa",
      d: "easy",
    },
    {
      q: "DELETE dùng?",
      a: ["Thêm", "Sửa", "Xóa", "Lấy"],
      correct: "Xóa",
      d: "easy",
    },
    {
      q: "WHERE dùng?",
      a: ["Sắp xếp", "Lọc", "Nhóm", "Nối"],
      correct: "Lọc",
      d: "easy",
    },
    {
      q: "ORDER BY dùng?",
      a: ["Lọc", "Sắp xếp", "Nhóm", "Nối"],
      correct: "Sắp xếp",
      d: "easy",
    },
    {
      q: "GROUP BY dùng?",
      a: ["Sắp xếp", "Lọc", "Nhóm cột", "Nối"],
      correct: "Nhóm cột",
      d: "medium",
    },
    {
      q: "COUNT() dùng?",
      a: ["Tổng", "Đếm", "Trung bình", "Max"],
      correct: "Đếm",
      d: "easy",
    },
    {
      q: "SUM() dùng?",
      a: ["Đếm", "Tính tổng", "Trung bình", "Min"],
      correct: "Tính tổng",
      d: "easy",
    },
    {
      q: "AVG() dùng?",
      a: ["Tổng", "Trung bình", "Max", "Min"],
      correct: "Trung bình",
      d: "easy",
    },
    {
      q: "Index dùng?",
      a: ["Bảo vệ", "Tốc độ tìm", "Mã hóa", "Nén"],
      correct: "Tốc độ tìm",
      d: "hard",
    },
  ],
  "Hệ điều hành": [
    {
      q: "Hệ điều hành là?",
      a: ["Ứng dụng", "Quản lý tài nguyên", "Cứng", "Mạng"],
      correct: "Quản lý tài nguyên",
      d: "easy",
    },
    {
      q: "Process là?",
      a: ["Biên dịch", "Chương trình chạy", "Lưu trữ", "Cài đặt"],
      correct: "Chương trình chạy",
      d: "easy",
    },
    {
      q: "Thread là?",
      a: ["Con", "Thực thi nhỏ", "Bộ nhớ", "CPU"],
      correct: "Thực thi nhỏ",
      d: "medium",
    },
    {
      q: "CPU Scheduling?",
      a: ["Bộ nhớ", "Chia thời gian CPU", "File", "Mạng"],
      correct: "Chia thời gian CPU",
      d: "medium",
    },
    {
      q: "Deadlock là?",
      a: ["Lỗi", "Chờ vô hạn", "Mất dữ", "Sự cố"],
      correct: "Chờ vô hạn",
      d: "hard",
    },
    {
      q: "Virtual Memory?",
      a: ["Tốc độ", "Bộ nhớ lớn", "Nén", "Mã hóa"],
      correct: "Bộ nhớ lớn",
      d: "medium",
    },
    {
      q: "Paging là?",
      a: ["File", "Chia trang", "Process", "I/O"],
      correct: "Chia trang",
      d: "hard",
    },
    {
      q: "Context Switching?",
      a: ["Dữ liệu", "Process sang process", "File", "Mạng"],
      correct: "Process sang process",
      d: "medium",
    },
    {
      q: "Semaphore dùng?",
      a: ["File", "Đồng bộ", "Bộ nhớ", "I/O"],
      correct: "Đồng bộ",
      d: "hard",
    },
    {
      q: "Mutex là?",
      a: ["Biến", "Khóa bảo vệ", "Hàm", "File"],
      correct: "Khóa bảo vệ",
      d: "hard",
    },
    {
      q: "Interrupt là?",
      a: ["Ngừng", "CPU ngừng", "Thư mục", "File"],
      correct: "CPU ngừng",
      d: "medium",
    },
    {
      q: "File descriptor?",
      a: ["Mô tả", "Con số file", "Tên", "Loại"],
      correct: "Con số file",
      d: "medium",
    },
    {
      q: "Inode là?",
      a: ["Tên", "Thông tin file", "Đường dẫn", "Kích thước"],
      correct: "Thông tin file",
      d: "hard",
    },
    {
      q: "FCFS là?",
      a: ["Ưu tiên", "Vào trước", "Ngắn nhất", "Deadline"],
      correct: "Vào trước",
      d: "medium",
    },
    {
      q: "SJF là?",
      a: ["Vào trước", "Ngắn nhất", "Ưu tiên", "Deadline"],
      correct: "Ngắn nhất",
      d: "medium",
    },
    {
      q: "Priority scheduling?",
      a: ["Thời gian", "Ưu tiên cao", "Ngắn", "Deadline"],
      correct: "Ưu tiên cao",
      d: "medium",
    },
    {
      q: "Round Robin?",
      a: ["Ưu tiên", "Vòng quanh", "Ngắn nhất", "Deadline"],
      correct: "Vòng quanh",
      d: "medium",
    },
    {
      q: "Swapping là?",
      a: ["Mã hóa", "Đổi bộ nhớ", "Nén", "Loại"],
      correct: "Đổi bộ nhớ",
      d: "hard",
    },
    {
      q: "Page replacement?",
      a: ["Thêm", "FIFO/LRU", "Xóa", "Sắp xếp"],
      correct: "FIFO/LRU",
      d: "hard",
    },
    {
      q: "Fork là?",
      a: ["Tạo file", "Tạo process", "Tạo thread", "Tạo bộ nhớ"],
      correct: "Tạo process",
      d: "hard",
    },
  ],
};

// Extend each bank to 100 questions
function generateQuestions() {
  const questions = [];

  subjects.forEach((subject) => {
    const baseQuestions = questionBanks[subject] || [];
    const needed = 100;

    // Add base questions
    baseQuestions.forEach((q) => {
      questions.push({
        subject: subject,
        questionText: q.q,
        options: q.a,
        correctAnswer: q.correct,
        difficulty: q.d,
      });
    });

    // Generate additional questions to reach 100
    for (let i = baseQuestions.length; i < needed; i++) {
      const baseQ = baseQuestions[i % baseQuestions.length];
      questions.push({
        subject: subject,
        questionText: `${baseQ.q} (Biến thể ${i - baseQuestions.length + 1})`,
        options: baseQ.a,
        correctAnswer: baseQ.correct,
        difficulty: baseQ.d,
      });
    }
  });

  return questions;
}

const allQuestions = generateQuestions();
const jsonPath = path.join(__dirname, "JSON", "questions.json");
fs.writeFileSync(jsonPath, JSON.stringify(allQuestions, null, 2));
console.log(`✅ Generated ${allQuestions.length} questions in ${jsonPath}`);
