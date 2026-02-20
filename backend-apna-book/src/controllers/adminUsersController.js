const { ObjectId } = require('mongodb');

const mapUser = (user) => ({
  id: String(user._id),
  name: user.name || user.fullName || 'Unnamed',
  email: user.email,
  role: user.role || 'user',
  status: user.status || 'Active',
  joined: user.createdAt || null
});

const listAdminUsers = async (req, res) => {
  const db = req.app.locals.db;
  const users = await db
    .collection('users')
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(users.map(mapUser));
};

const updateUserRole = async (req, res) => {
  const db = req.app.locals.db;
  const role = String(req.body?.role || '').toLowerCase();
  const allowed = new Set(['admin', 'user', 'seller']);

  if (!allowed.has(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { role, updatedAt: new Date() } });

  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(mapUser(user));
};

const updateUserStatus = async (req, res, status) => {
  const db = req.app.locals.db;
  const nextStatus = status || String(req.body?.status || '').trim();

  if (!nextStatus) {
    return res.status(400).json({ message: 'Status is required' });
  }

  await db
    .collection('users')
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: nextStatus, updatedAt: new Date() } }
    );

  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(mapUser(user));
};

const blockUser = async (req, res) => updateUserStatus(req, res, 'Blocked');
const unblockUser = async (req, res) => updateUserStatus(req, res, 'Active');

const deleteAdminUser = async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ message: 'User deleted' });
};

module.exports = {
  listAdminUsers,
  updateUserRole,
  blockUser,
  unblockUser,
  deleteAdminUser
};
