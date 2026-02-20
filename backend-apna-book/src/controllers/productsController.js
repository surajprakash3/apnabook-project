const { ObjectId } = require('mongodb');

const createProduct = async (req, res) => {
  const db = req.app.locals.db;
  const payload = {
    ...req.body,
    seller: new ObjectId(req.user.id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('products').insertOne(payload);
  return res.status(201).json({ ...payload, _id: result.insertedId });
};

const listProducts = async (req, res) => {
  const db = req.app.locals.db;
  const { approvalStatus, category, type, seller, q } = req.query;
  const query = {};
  if (approvalStatus) query.approvalStatus = approvalStatus;
  if (category) query.category = category;
  if (type) query.type = type;
  if (seller) query.seller = new ObjectId(seller);
  if (q) {
    query.$or = [
      { title: new RegExp(q, 'i') },
      { creator: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') }
    ];
  }

  const products = await db
    .collection('products')
    .aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          seller: {
            id: '$sellerInfo._id',
            name: '$sellerInfo.name',
            email: '$sellerInfo.email'
          }
        }
      },
      { $project: { sellerInfo: 0 } },
      { $sort: { createdAt: -1 } }
    ])
    .toArray();

  return res.json(products);
};

const getProduct = async (req, res) => {
  const db = req.app.locals.db;
  const product = await db
    .collection('products')
    .aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          seller: {
            id: '$sellerInfo._id',
            name: '$sellerInfo.name',
            email: '$sellerInfo.email'
          }
        }
      },
      { $project: { sellerInfo: 0 } }
    ])
    .next();

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
};

const updateProduct = async (req, res) => {
  const db = req.app.locals.db;
  await db
    .collection('products')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { ...req.body, updatedAt: new Date() } });
  const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
};

const updateApproval = async (req, res) => {
  const db = req.app.locals.db;
  const { approvalStatus } = req.body;
  await db
    .collection('products')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { approvalStatus, updatedAt: new Date() } });
  const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
};

const deleteProduct = async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json({ message: 'Product deleted' });
};

const myUploads = async (req, res) => {
  const db = req.app.locals.db;
  const products = await db
    .collection('products')
    .find({ seller: new ObjectId(req.user.id) })
    .sort({ createdAt: -1 })
    .toArray();
  return res.json(products);
};

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  updateApproval,
  deleteProduct,
  myUploads
};
