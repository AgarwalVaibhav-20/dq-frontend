const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require('../model/User');
dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      // ✅ decoded.id comes from login/signup
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      req.user = user;
      req.userId = user._id;  
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error in authMiddleware" });
  }
};

module.exports = { authMiddleware };
