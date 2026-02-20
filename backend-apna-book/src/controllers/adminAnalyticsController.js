const { ObjectId } = require('mongodb');

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

const percentChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
};

const sumRevenue = async (db, match) => {
  const payments = await db.collection('payments').countDocuments(match);
  if (payments > 0) {
    const [row] = await db
      .collection('payments')
      .aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
      .toArray();
    return Number(row?.total || 0);
  }

  const [row] = await db
    .collection('orders')
    .aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' } } }])
    .toArray();
  return Number(row?.total || 0);
};

const getSummary = async (req, res) => {
  const db = req.app.locals.db;
  const now = new Date();
  const currentRange = getMonthRange(now);
  const prevRange = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    currentUsers,
    prevUsers,
    currentOrders,
    prevOrders,
    currentRevenue,
    prevRevenue
  ] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('orders').countDocuments(),
    sumRevenue(db, {}),
    db.collection('users').countDocuments({
      createdAt: { $gte: currentRange.start, $lt: currentRange.end }
    }),
    db.collection('users').countDocuments({
      createdAt: { $gte: prevRange.start, $lt: prevRange.end }
    }),
    db.collection('orders').countDocuments({
      createdAt: { $gte: currentRange.start, $lt: currentRange.end }
    }),
    db.collection('orders').countDocuments({
      createdAt: { $gte: prevRange.start, $lt: prevRange.end }
    }),
    sumRevenue(db, { createdAt: { $gte: currentRange.start, $lt: currentRange.end } }),
    sumRevenue(db, { createdAt: { $gte: prevRange.start, $lt: prevRange.end } })
  ]);

  const repeatCustomerAgg = await db
    .collection('orders')
    .aggregate([
      { $group: { _id: '$buyer', orders: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          repeaters: { $sum: { $cond: [{ $gte: ['$orders', 2] }, 1, 0] } },
          totalBuyers: { $sum: 1 }
        }
      }
    ])
    .toArray();

  const repeatCustomers = repeatCustomerAgg?.[0]?.repeaters || 0;
  const totalBuyers = repeatCustomerAgg?.[0]?.totalBuyers || 0;
  const repeatRate = totalBuyers ? (repeatCustomers / totalBuyers) * 100 : 0;

  const fulfillmentAgg = await db
    .collection('orders')
    .aggregate([
      { $match: { status: { $in: ['Completed', 'Delivered'] } } },
      {
        $project: {
          durationMs: { $subtract: ['$updatedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgDurationMs: { $avg: '$durationMs' }
        }
      }
    ])
    .toArray();

  const avgFulfillmentDays = (fulfillmentAgg?.[0]?.avgDurationMs || 0) / (1000 * 60 * 60 * 24);

  return res.json({
    totalRevenue,
    totalOrders,
    totalUsers,
    revenueGrowth: Number(percentChange(currentRevenue, prevRevenue).toFixed(1)),
    ordersGrowth: Number(percentChange(currentOrders, prevOrders).toFixed(1)),
    usersGrowth: Number(percentChange(currentUsers, prevUsers).toFixed(1)),
    monthlySummary: {
      netRevenue: currentRevenue,
      repeatCustomers: Number(repeatRate.toFixed(1)),
      fulfillmentDays: Number(avgFulfillmentDays.toFixed(1))
    }
  });
};

const getMonthlySales = async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db
    .collection('orders')
    .aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
    .toArray();

  const data = rows.map((row) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
    revenue: Number(row.revenue || 0)
  }));

  return res.json(data);
};

const getMonthlyOrders = async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db
    .collection('orders')
    .aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
    .toArray();

  const data = rows.map((row) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
    orders: Number(row.orders || 0)
  }));

  return res.json(data);
};

module.exports = {
  getSummary,
  getMonthlySales,
  getMonthlyOrders
};
