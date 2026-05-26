const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.hash = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.compare = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

exports.token = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET || "segredo",
    { expiresIn: "1d" }
  );
};