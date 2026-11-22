
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { bad, assertFields } from "../utils/validators.js";

const safeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

function createToken(user) {
  return jwt.sign(
    { id: String(user._id) },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeEmail(email) {
  if (typeof email !== "string") {
    bad("Email must be a string");
  }

  const normalized = email.trim().toLowerCase();

  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    bad("Enter a valid email address");
  }

  return normalized;
}

export async function signup(req, res) {
  assertFields(req.body, ["name", "email", "password"]);

  const { name, password } = req.body;

  if (typeof name !== "string") {
    bad("Name must be a string");
  }

  const cleanName = name.trim();

  if (cleanName.length < 2 || cleanName.length > 100) {
    bad("Name must contain between 2 and 100 characters");
  }

  const email = normalizeEmail(req.body.email);

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    bad("Password must contain between 8 and 72 characters");
  }

  const existingUser = await User.exists({ email });

  if (existingUser) {
    bad("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: cleanName,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    user: safeUser(user),
    token: createToken(user),
  });
}

export async function login(req, res) {
  assertFields(req.body, ["email", "password"]);

  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (typeof password !== "string") {
    bad("Invalid credentials", 401);
  }

  const user = await User.findOne({ email });

  if (!user) {
    bad("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    bad("Invalid credentials", 401);
  }

  res.json({
    user: safeUser(user),
    token: createToken(user),
  });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);

  if (!user) {
    bad("User not found", 404);
  }

  res.json({
    user: safeUser(user),
  });
}

export async function updateProfile(req, res) {
  assertFields(req.body, ["name"]);

  if (typeof req.body.name !== "string") {
    bad("Name must be a string");
  }

  const name = req.body.name.trim();

  if (name.length < 2 || name.length > 100) {
    bad("Name must contain between 2 and 100 characters");
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    bad("User not found", 404);
  }

  res.json({
    user: safeUser(user),
  });
}
