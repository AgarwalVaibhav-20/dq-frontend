const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const DBConnect = require("./DB/DBconnect.js");
const authRouter = require("./routes/auth.js");
const transactionRoutes = require("./routes/transactionRoute.js");
const userProfileRoutes = require("./routes/userProfileRoute.js");
const category = require('./routes/category.js')
const supplier = require('./routes/supplierRoute.js')
// const sub = require('./routes/subcategory.js')
const subcategory = require('./routes/subcategory.js')
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
// DB connection
DBConnect("mongodb://127.0.0.1:27017/dqdashboard");

// Default route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Routes
app.use("/", authRouter);
app.use(category)
app.use(supplier)
app.use(subcategory)
app.use("/transactions", transactionRoutes);
app.use("/account", userProfileRoutes);
// app.use("/api/user-profiles", userProfileRoutes);
// app.use("/api" , qr)
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});
