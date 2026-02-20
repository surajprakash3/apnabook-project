const { ObjectId } = require('mongodb');

const getUsers = async (req, res) => {
  const db = req.app.locals.db;
  const users = await db
    .collection('users')
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  return res.json(users);
};

const getUser = async (req, res) => {
  const db = req.app.locals.db;
  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json(user);
};

const updateUserStatus = async (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status, updatedAt: new Date() } });
  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json(user);
};

const deleteUser = async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ message: 'User deleted' });
};

module.exports = { getUsers, getUser, updateUserStatus, deleteUser };
