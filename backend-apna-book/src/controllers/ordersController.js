const { ObjectId } = require('mongodb');

const createOrder = async (req, res) => {
  const db = req.app.locals.db;
  const payload = {
    buyer: new ObjectId(req.user.id),
    seller: new ObjectId(req.body.seller),
    items: req.body.items || [],
    total: req.body.total || 0,
    status: req.body.status || 'Processing',
    paymentProvider: req.body.paymentProvider || 'stripe',
    paymentId: req.body.paymentId || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('orders').insertOne(payload);
  return res.status(201).json({ ...payload, _id: result.insertedId });
};

const listOrders = async (req, res) => {
  const db = req.app.locals.db;
  const orders = await db
    .collection('orders')
    .aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyerInfo'
        }
      },
      { $unwind: { path: '$buyerInfo', preserveNullAndEmptyArrays: true } },
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
          buyer: {
            id: '$buyerInfo._id',
            name: '$buyerInfo.name',
            email: '$buyerInfo.email'
          },
          seller: {
            id: '$sellerInfo._id',
            name: '$sellerInfo.name',
            email: '$sellerInfo.email'
          }
        }
      },
      { $project: { buyerInfo: 0, sellerInfo: 0 } }
    ])
    .toArray();

  return res.json(orders);
};

const listMyOrders = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const orders = await db
    .collection('orders')
    .aggregate([
      { $match: { buyer: userId } },
      { $sort: { createdAt: -1 } },
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
    .toArray();

  return res.json(orders);
};

const updateOrderStatus = async (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  await db
    .collection('orders')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status, updatedAt: new Date() } });
  const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.json(order);
};

module.exports = { createOrder, listOrders, listMyOrders, updateOrderStatus };
