import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dns from "dns/promises";
import { sendVerificationEmail } from "../utils/email.js";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const createEmailToken = () => crypto.randomBytes(32).toString("hex");

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:3001";

async function hasValidEmailDomain(email) {
  const domain = String(email).split("@")[1];
  if (!domain || !domain.includes(".")) return false;

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length) return true;
  } catch {
    // Some valid small domains do not publish MX but can accept on A/AAAA.
  }

  try {
    const addresses = await dns.resolve(domain);
    return addresses.length > 0;
  } catch {
    return false;
  }
}

function userPayload(user, extra = {}) {
  return {
    _id: user._id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    ...extra,
  };
}

// Register user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  if (!(await hasValidEmailDomain(email))) {
    return res.status(400).json({ message: "Use a real email address with a valid mail domain." });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const [firstName = "", ...rest] = (name || "").trim().split(" ");
  const user = await User.create({
    name,
    firstName,
    lastName: rest.join(" "),
    email,
    password,
    isEmailVerified: true,
    // Email verification is disabled for now. Re-enable these fields when the feature returns.
    // emailVerificationToken: createEmailToken(),
    // emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  if (user) {
    // Email verification is disabled for now. Keep this block for the later SMTP rollout.
    // const verifyUrl = `${getClientUrl()}/verify-email?token=${user.emailVerificationToken}`;
    // const emailResult = await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

    res.status(201).json({
      ...userPayload(user),
      token: generateToken(user._id),
      message: "Account created.",
      // verificationEmailSent: emailResult.sent,
      // devVerificationUrl: emailResult.sent ? undefined : emailResult.verifyUrl,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Email verification is disabled for now. Re-enable this block when verification returns.
    // if (!user.isEmailVerified) {
    //   return res.status(403).json({
    //     message: "Please verify your email before signing in.",
    //     needsVerification: true,
    //     email: user.email,
    //   });
    // }

    res.json({
      ...userPayload(user),
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

export const updateMe = async (req, res) => {
  const allowed = ["name", "firstName", "lastName", "dateOfBirth", "mobile", "email"];
  const updates = {};
  const emailChanged = req.body.email && req.body.email !== req.user.email;

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (emailChanged) {
    if (!(await hasValidEmailDomain(req.body.email))) {
      return res.status(400).json({ message: "Use a real email address with a valid mail domain." });
    }

    const emailOwner = await User.findOne({ email: req.body.email });
    if (emailOwner && String(emailOwner._id) !== String(req.user._id)) {
      return res.status(400).json({ message: "That email is already in use." });
    }

    updates.isEmailVerified = true;
    // Email verification is disabled for now. Re-enable these fields when the feature returns.
    // updates.emailVerificationToken = createEmailToken();
    // updates.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  }

  if (!updates.name && (updates.firstName || updates.lastName)) {
    updates.name = `${updates.firstName || req.user.firstName || ""} ${updates.lastName || req.user.lastName || ""}`.trim();
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  // Email verification is disabled for now. Keep this shape for later SMTP rollout.
  // if (emailChanged) {
  //   const verifyUrl = `${getClientUrl()}/verify-email?token=${user.emailVerificationToken}`;
  //   const emailResult = await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
  //
  //   return res.json({
  //     ...user.toObject(),
  //     message: "Email changed. Check your inbox to verify the new address before your next sign-in.",
  //     verificationEmailSent: emailResult.sent,
  //     devVerificationUrl: emailResult.sent ? undefined : emailResult.verifyUrl,
  //   });
  // }

  res.json(user);
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: "Verification token is required." });

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) return res.status(400).json({ message: "Verification link is invalid or expired." });

  user.isEmailVerified = true;
  user.emailVerificationToken = "";
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    ...userPayload(user),
    token: generateToken(user._id),
    message: "Email verified. You are signed in.",
  });
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "No account found for that email." });
  if (user.isEmailVerified) return res.json({ message: "This email is already verified." });

  user.emailVerificationToken = createEmailToken();
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const verifyUrl = `${getClientUrl()}/verify-email?token=${user.emailVerificationToken}`;
  const emailResult = await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

  res.json({
    message: "Verification email sent.",
    verificationEmailSent: emailResult.sent,
    devVerificationUrl: emailResult.sent ? undefined : emailResult.verifyUrl,
  });
};
