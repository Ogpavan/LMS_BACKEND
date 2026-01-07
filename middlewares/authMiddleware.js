const jwtLib = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers["authorization"]; // Bearer token
  const token = header?.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwtLib.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};
