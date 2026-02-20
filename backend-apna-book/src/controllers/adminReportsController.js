const getSalesReport = async (req, res) => {
  const db = req.app.locals.db;
  const { from, to } = req.query;
  const match = {};

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const [summary] = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ])
    .toArray();

  const statusBreakdown = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  const topProducts = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          title: { $first: '$items.title' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ])
    .toArray();

  const dailyRevenue = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
    .toArray();

  const topSellers = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: '$seller',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
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
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ])
    .toArray();

  const categoryBreakdown = await db
    .collection('orders')
    .aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ])
    .toArray();

  return res.json({
    summary: summary || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
    statusBreakdown,
    topProducts,
    dailyRevenue,
    topSellers,
    categoryBreakdown
  });
};

module.exports = { getSalesReport };
