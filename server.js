const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const User = require("./models/user");

dotenv.config();
const app = express();

// توصيل MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// إعدادات الوسيط
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("index");
});

// مسار الرسائل
app.get("/index/messages", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "غير مسموح" });
  }
  try {
    const user = await User.findById(req.session.userId);
    const sortedMessages = user.messages.sort((a, b) => b.timestamp - a.timestamp);
    res.json(sortedMessages);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في تحميل الرسائل" });
  }
});

// مسار الملف الشخصي
app.get("/profile", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/auth/index");
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect("/auth/logout");
    }
    res.redirect("/profile.html"); // توجيه إلى ملف ثابت
  } catch (error) {
    res.status(500).send("حدث خطأ");
  }
});

// مسار API للحصول على بيانات المستخدم
app.get("/api/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("غير مسجل دخول");
  }
  try {
    const user = await User.findById(req.session.userId);
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).send("حدث خطأ");
  }
});

// مسار API للحصول على اسم المستخدم
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
    res.json({ name: user.name });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// توجيهات أخرى
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);

// تصدير التطبيق كوظيفة Serverless
module.exports = app;
