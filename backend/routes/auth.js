const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

router.post("/signup", AuthController.signup);
router.post("/signin", AuthController.login);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/forgot-otp", AuthController.forgotOtp);

module.exports = router;



// const dotenv = require("dotenv");
// dotenv.config();
// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const User = require("../model/user");
// const { nanoid } = require("nanoid");
// const jwt = require("jsonwebtoken");
// const validator = require("validator");

// // Format user response - ✅ FIXED: Return access_token at root level
// const formatDatatoSend = (user) => {
//   const access_token = jwt.sign(
//     { id: user._id },
//     process.env.SECRET_ACCESS_KEY,
//     { expiresIn: "7d" }
//   );

//   return {
//     access_token,
//     profilePhoto: user.profilePhoto,
//     username: user.username,
//     email: user.email,
//     isVerified: user.isVerified,
//   };
// };

// // Generate unique username
// const generateUsername = async (email) => {
//   let base = email.split("@")[0];
//   let username = base;
//   while (await User.exists({ username })) {
//     username = base + nanoid(5);
//   }
//   return username;
// };

// // ========== SIGN UP ==========
// router.post("/signup", async (req, res) => {
//   console.log("📝 Signup request received:", req.body);

//   const { username, email, password } = req.body;

//   // 1️⃣ Input validations
//   if (!username || !email || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   if (!validator.isEmail(email)) {
//     return res.status(400).json({ message: "Invalid email format" });
//   }

//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       message:
//         "Password must be at least 8 characters, include uppercase, lowercase, number, and a special character",
//     });
//   }

//   if (username.length < 3) {
//     return res
//       .status(400)
//       .json({ message: "Username must be at least 3 letters long" });
//   }

//   try {
//     // 2️⃣ Check if user already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email already exists" });
//     }

//     // 3️⃣ Generate OTP & expiry
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
//     // 5️⃣ Save user
//     const user = new User({
//       email: email.toLowerCase(),
//       username,
//       password,
//       verifyOTP: otp,
//       otpExpiry,
//       isVerified: false,
//     });

//     await user.save();
//     console.log("✅ User created successfully");

//     // 6️⃣ Send OTP (email service or console in dev)
//     if (process.env.NODE_ENV !== "production") {
//       console.log(`✅ OTP for ${email}: ${otp}`);
//     }

//     // 7️⃣ Return response with JWT & user data
//     const userData = formatDatatoSend(user);

//     return res.status(201).json({
//       message: "User registered. OTP sent to email.",
//       ...userData,
//     });
//   } catch (err) {
//     console.error("❌ Signup error:", err.stack);
//     return res.status(500).json({ message: "Server error during signup" });
//   }
// });


// router.post("/signin", async (req, res) => {
//   const { email, password } = req.body;
//   console.log(email, password)

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     console.log(user)
//     console.log(user.password)
//     console.log(password)
//     // 2. Compare password with hashed password
//     const isMatch = await bcrypt.compare(password, user.password);
//     console.log("📌 Match result:", isMatch);

//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid credentials (wrong password)",
//       });
//     }
//     // 3. (Optional) Check if account is verified
//     if (!user.isVerified) {
//       return res.status(403).json({
//         success: false,
//         message: "Please verify your email before logging in",
//       });
//     }

//     // 4. Create JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.SECRET_ACCESS_KEY,
//       { expiresIn: "7d" }
//     );

//     // 5. Send success response
//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         username: user.username,
//       },
//     });
//     console.log("loggin succesfull")
//   } catch (error) {
//     console.error("❌ Signin error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error during signin",
//     });
//   }
// });

// ========== VERIFY OTP ==========
// router.post("/verify-otp", async (req, res) => {
//   console.log("📝 OTP verification request:", req.body);

//   const { email, otp } = req.body;
//   if (!email || !otp) {
//     return res.status(400).json({ message: "Email and OTP are required" });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log("❌ User not found for OTP verification");
//       return res.status(400).json({ message: "User not found" });
//     }

//     if (user.verifyOTP !== otp) {
//       console.log("❌ Invalid OTP");
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     if (user.otpExpiry < Date.now()) {
//       console.log("❌ OTP expired");
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     user.isVerified = true;
//     user.verifyOTP = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     console.log("✅ Account verified successfully");

//     // ✅ FIXED: Return user data directly
//     const userData = formatDatatoSend(user);
//     return res.status(200).json({
//       message: "Account verified successfully",
//       ...userData,
//     });
//   } catch (err) {
//     console.error("❌ OTP verification error:", err);
//     return res.status(500).json({ message: "Server error during verification" });
//   }
// });

// // ========== RESEND OTP ==========
// router.post("/resend-otp", async (req, res) => {
//   console.log("📝 Resend OTP request:", req.body);

//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email is required" });

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log("❌ User not found for OTP resend");
//       return res.status(404).json({ message: "User not found" });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

//     user.verifyOTP = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     if (process.env.NODE_ENV !== "production") {
//       console.log(`🔁 Resent OTP for ${email}: ${otp}`);
//     }

//     console.log("✅ OTP resent successfully");
//     res.status(200).json({ message: "OTP resent to email" });
//   } catch (err) {
//     console.error("❌ Resend OTP error:", err);
//     return res.status(500).json({ message: "Server error during OTP resend" });
//   }
// });

// ========== SIGN IN (DEBUG VERSION) ==========
// router.post("/signin", async (req, res) => {
//   console.log("📝 Signin request received:", req.body);

//   const { email, password } = req.body;

//   console.log(req.body)
//   // Input validation
//   if (!email || !password) {
//     console.log("❌ Missing email or password");
//     return res.status(400).json({ message: "Email and password are required" });
//   }

//   // Trim and normalize email
//   const normalizedEmail = email.toLowerCase().trim();
//   console.log("🔍 Looking for user with email:", normalizedEmail);

//   try {
//     // Check database connection
//     const user = await User.findOne({ email: normalizedEmail });
//     console.log("👤 User found:", user ? "Yes" : "No");

//     if (!user) {
//       console.log("❌ User not found in database");
//       // In production, use generic message: "Invalid credentials"
//       return res.status(400).json({ 
//         message: process.env.NODE_ENV === 'development' ? "User not found" : "Invalid credentials" 
//       });
//     }

//     console.log("🔐 User verification status:", user.isVerified);
//     console.log("🔐 Stored password hash exists:", !!user.password);
//     console.log("🔐 Stored password hash length:", user.password ? user.password.length : 0);

//     // Check password
//     console.log("🔍 Comparing passwords...");
//     console.log("🔍 saved passwords...", user.password);
//     console.log("🔍 got passwords...", password);
//     const isMatch = await bcrypt.compare(password, user.password);
//     console.log("🔐 Password match result:", isMatch);

//     if (!isMatch) {
//       console.log("❌ Password incorrect");
//       return res.status(400).json({ 
//         message: process.env.NODE_ENV === 'development' ? "Password incorrect" : "Invalid credentials" 
//       });
//     }

//     // Check verification status
//     if (!user.isVerified) {
//       console.log("⚠️ User account not verified");
//       return res.status(400).json({ 
//         message: "Please verify your email before signing in",
//         needsVerification: true,
//         email: user.email
//       });
//     }

//     console.log("✅ All checks passed, generating token...");

//     // Generate token
//     try {
//       const userData = formatDatatoSend(user);
//       console.log("✅ Token generated successfully");

//       return res.status(200).json({
//         message: "Logged in successfully",
//         ...userData,
//       });
//     } catch (tokenError) {
//       console.error("❌ Token generation error:", tokenError);
//       return res.status(500).json({ message: "Error generating authentication token" });
//     }

//   } catch (err) {
//     console.error("❌ Signin error details:", {
//       message: err.message,
//       stack: err.stack,
//       name: err.name
//     });

//     // Check for specific MongoDB errors
//     if (err.name === 'MongoError' || err.name === 'MongooseError') {
//       console.error("🔴 Database connection issue");
//       return res.status(500).json({ message: "Database connection error" });
//     }

//     return res.status(500).json({ message: "Server error during signin" });
//   }
// });

// // ========== ADDITIONAL DEBUG ROUTE ==========
// router.get("/debug/user/:email", async (req, res) => {
//   if (process.env.NODE_ENV === 'production') {
//     return res.status(404).json({ message: "Not found" });
//   }

//   try {
//     const email = req.params.email.toLowerCase().trim();
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.json({ found: false, email });
//     }

//     return res.json({
//       found: true,
//       email: user.email,
//       username: user.username,
//       isVerified: user.isVerified,
//       hasPassword: !!user.password,
//       passwordLength: user.password ? user.password.length : 0,
//       createdAt: user.createdAt,
//       hasOTP: !!user.verifyOTP,
//       otpExpired: user.otpExpiry ? user.otpExpiry < Date.now() : null
//     });
//   } catch (err) {
//     console.error("Debug route error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// });

// // ========== PASSWORD RESET FUNCTIONALITY ==========
// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   try {
//     const user = await User.findOne({ email: email.toLowerCase().trim() });

//     if (!user) {
//       // Don't reveal if email exists or not
//       return res.status(200).json({ 
//         message: "If the email exists, a password reset link has been sent" 
//       });
//     }

//     const resetToken = nanoid(32);
//     const resetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpiry = resetExpiry;
//     await user.save();

//     console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

//     return res.status(200).json({ 
//       message: "If the email exists, a password reset link has been sent" 
//     });
//   } catch (err) {
//     console.error("Forgot password error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

module.exports = router;