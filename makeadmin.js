// makeadmin.js - Cấp quyền admin cho user
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/quiz_app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    const User = mongoose.model("users", {
      name: String,
      email: String,
      password: String,
      isAdmin: { type: Boolean, default: false },
    });

    // Tạo user admin nếu chưa tồn tại
    const adminEmail = "admin@gmail.com";
    const adminPassword = "123456";

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      // Tạo mới
      admin = await User.create({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        isAdmin: true,
      });
      console.log("✅ Đã tạo tài khoản admin:", admin.email);
    } else {
      // Cập nhật isAdmin
      admin.isAdmin = true;
      await admin.save();
      console.log("✅ Đã cập nhật quyền admin cho:", admin.email);
    }

    console.log("\n📝 Thông tin admin:");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("isAdmin:", admin.isAdmin);

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  });
