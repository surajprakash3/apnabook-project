const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d'
  });

const OTP_TTL_MS = 5 * 60 * 1000;

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!host || !user || !pass) {
    if (gmailUser && gmailPass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass }
      });
    }
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendOtpEmail = async ({ email, otp, purpose }) => {
  const transporter = buildTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
  const subject = purpose === 'login' ? 'Your login OTP' : 'Verify your email';
  const text = `Your OTP is ${otp}. It expires in 5 minutes.`;

  await transporter.sendMail({ from, to: email, subject, text });
};

const createOtpRecord = async ({ db, email, type }) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await db.collection('otp_codes').updateMany(
    { email, type, usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const record = {
    email,
    type,
    otpHash,
    usedAt: null,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    createdAt: new Date()
  };

  await db.collection('otp_codes').insertOne(record);
  return otp;
};

const verifyOtpRecord = async ({ db, email, type, otp }) => {
  const record = await db
    .collection('otp_codes')
    .findOne({ email, type, usedAt: null }, { sort: { createdAt: -1 } });

  if (!record) {
    return { ok: false, message: 'OTP not found' };
  }

  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'OTP expired' };
  }

  const matches = await bcrypt.compare(otp, record.otpHash);
  if (!matches) {
    return { ok: false, message: 'Invalid OTP' };
  }

  await db.collection('otp_codes').updateOne(
    { _id: record._id },
    { $set: { usedAt: new Date() } }
  );

  return { ok: true };
};

const register = async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password } = req.body;
  const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (existing) {
    if (!existing.isVerified) {
      const otp = await createOtpRecord({ db, email: existing.email, type: 'verify' });
      await sendOtpEmail({ email: existing.email, otp, purpose: 'verify' });
      return res.status(200).json({ message: 'OTP sent to your email' });
    }
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const payload = {
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'user',
    status: 'Pending',
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('users').insertOne(payload);
  const user = { ...payload, _id: result.insertedId };
  const otp = await createOtpRecord({ db, email: user.email, type: 'verify' });
  await sendOtpEmail({ email: user.email, otp, purpose: 'verify' });

  return res.status(201).json({
    message: 'OTP sent to your email'
  });
};

const login = async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.isVerified) {
    return res.status(403).json({ message: 'Email not verified' });
  }
  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

const verifyEmailOtp = async (req, res) => {
  const db = req.app.locals.db;
  const { email, otp } = req.body;

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const result = await verifyOtpRecord({ db, email: user.email, type: 'verify', otp });
  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { isVerified: true, status: 'Active', updatedAt: new Date() } }
  );

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

const requestLoginOtp = async (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!user.isVerified) {
    const otp = await createOtpRecord({ db, email: user.email, type: 'verify' });
    await sendOtpEmail({ email: user.email, otp, purpose: 'verify' });
    return res.status(403).json({ message: 'Email not verified. OTP sent for verification.' });
  }

  const otp = await createOtpRecord({ db, email: user.email, type: 'login' });
  await sendOtpEmail({ email: user.email, otp, purpose: 'login' });
  return res.json({ message: 'OTP sent to your email' });
};

const verifyLoginOtp = async (req, res) => {
  const db = req.app.locals.db;
  const { email, otp } = req.body;

  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!user.isVerified) {
    return res.status(403).json({ message: 'Email not verified' });
  }

  const result = await verifyOtpRecord({ db, email: user.email, type: 'login', otp });
  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

const me = async (req, res) => {
  const db = req.app.locals.db;
  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json(user);
};

module.exports = {
  register,
  login,
  me,
  verifyEmailOtp,
  requestLoginOtp,
  verifyLoginOtp
};
