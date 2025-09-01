// controllers/AuthController.js
const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
// Generate JWT token
const formatDatatoSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECRET_ACCESS_KEY,
    { expiresIn: "7d" }
  );

  return {
    access_token,
    profilePhoto: user.profilePhoto,
    username: user.username,
    email: user.email,
    isVerified: user.isVerified,
  };
};

module.exports = {
  // SIGNUP
  async signup(req, res) {
    console.log("📝 Signup request received:", req.body);

    const { username, email, password } = req.body;

    // 1️⃣ Input validations
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, number, and a special character",
      });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 letters long" });
    }

    try {
      // 2️⃣ Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // 3️⃣ Generate OTP & expiry
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      // 5️⃣ Save user
      const user = new User({
        email: email.toLowerCase(),
        username,
        password,
        verifyOTP: otp,
        otpExpiry,
        isVerified: false,
      });

      await user.save();
      console.log("✅ User created successfully");

      // 6️⃣ Send OTP (email service or console in dev)
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ OTP for ${email}: ${otp}`);
      }

      // 7️⃣ Return response with JWT & user data
      const userData = formatDatatoSend(user);

      return res.status(201).json({
        message: "User registered. OTP sent to email.",
        ...userData,
      });
    } catch (err) {
      console.error("❌ Signup error:", err.stack);
      return res.status(500).json({ message: "Server error during signup" });
    }
  },

  // LOGIN
  async login(req, res) {
    const { email, password } = req.body;
    console.log(email, password)

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      console.log(user)
      console.log(user.password)
      console.log(password)
      // 2. Compare password with hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("📌 Match result:", isMatch);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials (wrong password)",
        });
      }
      // 3. (Optional) Check if account is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in",
        });
      }

      // 4. Create JWT
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.SECRET_ACCESS_KEY,
        { expiresIn: "7d" }
      );
      
      // 5. Send success response
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          userId: user.userId, 
          restaurantId: user.restaurantId ,
          categoryId:user.categoryId
        }

      });

    } catch (error) {
      console.error("❌ Signin error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during signin",
      });
    }
  },

  // VERIFY OTP
  async verifyOtp(req, res) {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log("❌ User not found for OTP verification");
        return res.status(400).json({ message: "User not found" });
      }

      if (user.verifyOTP !== otp) {
        console.log("❌ Invalid OTP");
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.otpExpiry < Date.now()) {
        console.log("❌ OTP expired");
        return res.status(400).json({ message: "OTP expired" });
      }

      user.isVerified = true;
      user.verifyOTP = undefined;
      user.otpExpiry = undefined;
      await user.save();

      console.log("✅ Account verified successfully");

      // ✅ FIXED: Return user data directly
      const userData = formatDatatoSend(user);
      return res.status(200).json({
        message: "Account verified successfully",
        ...userData,
      });
    } catch (err) {
      console.error("❌ OTP verification error:", err);
      return res.status(500).json({ message: "Server error during verification" });
    }
  },

  // FORGOT OTP (resend OTP)
  async forgotOtp(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min expiry
      await user.save();

      // In real project -> send OTP by email/SMS
      res.json({ message: "OTP resent successfully", otp }); // remove OTP in prod
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
