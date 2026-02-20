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

const upsertPendingSignup = async ({ db, fullName, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  await db.collection('pending_signups').updateOne(
    { email },
    {
      $set: {
        fullName,
        email,
        passwordHash,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );
};

const createOrActivateUser = async ({ db, fullName, email, passwordHash }) => {
  const existing = await db.collection('users').findOne({ email });

  if (existing?.isVerified) {
    return { conflict: true };
  }

  const now = new Date();

  if (existing) {
    await db.collection('users').updateOne(
      { _id: existing._id },
      {
        $set: {
          fullName,
          name: fullName,
          password: passwordHash,
          role: existing.role || 'user',
          status: 'Active',
          isVerified: true,
          updatedAt: now
        }
      }
    );

    return {
      user: {
        ...existing,
        fullName,
        name: fullName,
        password: passwordHash,
        role: existing.role || 'user',
        status: 'Active',
        isVerified: true,
        updatedAt: now
      }
    };
  }

  const payload = {
    fullName,
    name: fullName,
    email,
    password: passwordHash,
    role: 'user',
    status: 'Active',
    isVerified: true,
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection('users').insertOne(payload);

  return {
    user: { ...payload, _id: result.insertedId }
  };
};

const getLatestActiveOtpRecord = async ({ db, email, type }) =>
  db
    .collection('otp_codes')
    .findOne({ email, type, usedAt: null }, { sort: { createdAt: -1 } });

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

const requestRegisterOtp = async (req, res) => {
  const db = req.app.locals.db;
  const normalizedEmail = req.body.email?.toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const existing = await db.collection('users').findOne({ email: normalizedEmail });
  if (existing?.isVerified) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const activeRecord = await getLatestActiveOtpRecord({
    db,
    email: normalizedEmail,
    type: 'register'
  });

  if (activeRecord?.expiresAt && activeRecord.expiresAt.getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil((activeRecord.expiresAt.getTime() - Date.now()) / 1000);
    return res.status(429).json({
      message: 'OTP already sent. Request a new OTP after 5 minutes.',
      retryAfterSeconds
    });
  }

  const otp = await createOtpRecord({ db, email: normalizedEmail, type: 'register' });
  await sendOtpEmail({ email: normalizedEmail, otp, purpose: 'verify' });

  return res.json({ message: 'OTP sent to your email' });
};

const register = async (req, res) => {
  const db = req.app.locals.db;
  const { name, fullName, email, password, otp } = req.body;
  const normalizedEmail = email?.toLowerCase();
  const normalizedFullName = (fullName || name || '').trim();

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }

  const otpResult = await verifyOtpRecord({
    db,
    email: normalizedEmail,
    type: 'register',
    otp
  });
  if (!otpResult.ok) {
    return res.status(400).json({ message: otpResult.message });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await createOrActivateUser({
    db,
    fullName: normalizedFullName,
    email: normalizedEmail,
    passwordHash
  });

  if (created.conflict) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  await db.collection('pending_signups').deleteOne({ email: normalizedEmail });

  const user = created.user;

  const token = signToken(user);
  return res.status(201).json({
    message: 'Account created successfully',
    token,
    user: { id: user._id, name: user.name, fullName: user.fullName, email: user.email, role: user.role }
  });
};

const requestSignupOtp = async (req, res) => {
  const db = req.app.locals.db;
  const fullName = (req.body.fullName || req.body.name || '').trim();
  const email = req.body.email?.toLowerCase();
  const password = req.body.password;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email and password are required' });
  }

  const existing = await db.collection('users').findOne({ email });
  if (existing?.isVerified) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const activeRecord = await getLatestActiveOtpRecord({ db, email, type: 'register' });
  if (activeRecord?.expiresAt && activeRecord.expiresAt.getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil((activeRecord.expiresAt.getTime() - Date.now()) / 1000);
    return res.status(429).json({
      message: 'OTP already sent. Request a new OTP after 5 minutes.',
      retryAfterSeconds
    });
  }

  await upsertPendingSignup({ db, fullName, email, password });

  const otp = await createOtpRecord({ db, email, type: 'register' });
  await sendOtpEmail({ email, otp, purpose: 'verify' });

  return res.json({ message: 'OTP sent to your email' });
};

const verifySignupOtp = async (req, res) => {
  const db = req.app.locals.db;
  const email = req.body.email?.toLowerCase();
  const otp = req.body.otp;

  if (!email || !otp) {
    return res.status(400).json({ message: 'email and otp are required' });
  }

  const otpResult = await verifyOtpRecord({ db, email, type: 'register', otp });
  if (!otpResult.ok) {
    return res.status(400).json({ message: otpResult.message });
  }

  const pending = await db.collection('pending_signups').findOne({ email });
  if (!pending) {
    return res.status(400).json({ message: 'No signup request found. Please request OTP again.' });
  }

  const created = await createOrActivateUser({
    db,
    fullName: pending.fullName,
    email,
    passwordHash: pending.passwordHash
  });

  if (created.conflict) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  await db.collection('pending_signups').deleteOne({ email });

  const user = created.user;
  const token = signToken(user);

  return res.status(201).json({
    message: 'Account created successfully',
    token,
    user: { id: user._id, name: user.name, fullName: user.fullName, email: user.email, role: user.role }
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

const requestPasswordResetOtp = async (req, res) => {
  const db = req.app.locals.db;
  const email = req.body.email?.toLowerCase();

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const activeRecord = await getLatestActiveOtpRecord({ db, email, type: 'reset' });
  if (activeRecord?.expiresAt && activeRecord.expiresAt.getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil((activeRecord.expiresAt.getTime() - Date.now()) / 1000);
    return res.status(429).json({
      message: 'OTP already sent. Request a new OTP after 5 minutes.',
      retryAfterSeconds
    });
  }

  const otp = await createOtpRecord({ db, email, type: 'reset' });
  await sendOtpEmail({ email, otp, purpose: 'verify' });

  return res.json({ message: 'Password reset OTP sent to your email' });
};

const resetPasswordWithOtp = async (req, res) => {
  const db = req.app.locals.db;
  const email = req.body.email?.toLowerCase();
  const otp = req.body.otp;
  const newPassword = req.body.newPassword;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'email, otp and newPassword are required' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otpResult = await verifyOtpRecord({ db, email, type: 'reset', otp });
  if (!otpResult.ok) {
    return res.status(400).json({ message: otpResult.message });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { password: passwordHash, updatedAt: new Date() } }
  );

  return res.json({ message: 'Password updated successfully. Please log in.' });
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
  requestRegisterOtp,
  requestSignupOtp,
  verifySignupOtp,
  login,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  me,
  verifyEmailOtp,
  requestLoginOtp,
  verifyLoginOtp
};
