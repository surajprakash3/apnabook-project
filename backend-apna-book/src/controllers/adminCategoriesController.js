const { ObjectId } = require('mongodb');

const normalizeName = (value) => String(value || '').trim();

const mapCategory = (category, count = 0) => ({
  id: String(category._id),
  name: category.name,
  status: category.status || 'Active',
  totalProducts: Number(count || 0)
});

const ensureDefaultCategory = async (db) => {
  const existing = await db.collection('categories').findOne({ name: 'Uncategorized' });
  if (existing) return existing;
  const payload = {
    name: 'Uncategorized',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('categories').insertOne(payload);
  return { ...payload, _id: result.insertedId };
};

const listAdminCategories = async (req, res) => {
  const db = req.app.locals.db;
  const categories = await db.collection('categories').find({}).sort({ name: 1 }).toArray();

  const counts = await db
    .collection('products')
    .aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    .toArray();

  const countMap = new Map(counts.map((row) => [row._id, row.count]));

  return res.json(categories.map((category) => mapCategory(category, countMap.get(category.name))));
};

const createAdminCategory = async (req, res) => {
  const db = req.app.locals.db;
  const name = normalizeName(req.body?.name);
  const status = req.body?.status || 'Active';

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const existing = await db.collection('categories').findOne({ name });
  if (existing) {
    return res.status(409).json({ message: 'Category already exists' });
  }

  const payload = {
    name,
    status,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('categories').insertOne(payload);

  return res.status(201).json(mapCategory({ ...payload, _id: result.insertedId }, 0));
};

const updateAdminCategory = async (req, res) => {
  const db = req.app.locals.db;
  const categoryId = new ObjectId(req.params.id);
  const existing = await db.collection('categories').findOne({ _id: categoryId });

  if (!existing) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const nextName = normalizeName(req.body?.name || existing.name);
  const nextStatus = req.body?.status || existing.status || 'Active';

  if (!nextName) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  if (nextName !== existing.name) {
    const nameConflict = await db.collection('categories').findOne({ name: nextName });
    if (nameConflict) {
      return res.status(409).json({ message: 'Category name already exists' });
    }
  }

  await db
    .collection('categories')
    .updateOne({ _id: categoryId }, { $set: { name: nextName, status: nextStatus, updatedAt: new Date() } });

  if (nextName !== existing.name) {
    await db
      .collection('products')
      .updateMany({ category: existing.name }, { $set: { category: nextName, updatedAt: new Date() } });
  }

  const counts = await db
    .collection('products')
    .aggregate([
      { $match: { category: nextName } },
      { $count: 'count' }
    ])
    .toArray();

  return res.json(mapCategory({ ...existing, name: nextName, status: nextStatus }, counts?.[0]?.count || 0));
};

const deleteAdminCategory = async (req, res) => {
  const db = req.app.locals.db;
  const categoryId = new ObjectId(req.params.id);
  const existing = await db.collection('categories').findOne({ _id: categoryId });

  if (!existing) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const fallback = await ensureDefaultCategory(db);
  await db
    .collection('products')
    .updateMany({ category: existing.name }, { $set: { category: fallback.name, updatedAt: new Date() } });

  const result = await db.collection('categories').deleteOne({ _id: categoryId });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Category not found' });
  }

  return res.json({ message: 'Category deleted', fallback: fallback.name });
};

module.exports = {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory
};
