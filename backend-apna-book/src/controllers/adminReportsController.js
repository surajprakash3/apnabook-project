const { ObjectId } = require('mongodb');

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

const mapReport = (report) => ({
  id: String(report._id),
  name: report.name,
  owner: report.owner,
  createdAt: report.createdAt,
  dataset: report.dataset
});

const listReports = async (req, res) => {
  const db = req.app.locals.db;
  const reports = await db.collection('reports').find({}).sort({ createdAt: -1 }).toArray();
  return res.json(reports.map(mapReport));
};

const generateReport = async (req, res) => {
  const db = req.app.locals.db;
  const dataset = String(req.body?.dataset || 'orders').toLowerCase();
  const name = String(req.body?.name || '').trim() || `${dataset}-report-${Date.now()}`;

  const allowed = new Set(['orders', 'users', 'products', 'categories']);
  if (!allowed.has(dataset)) {
    return res.status(400).json({ message: 'Unsupported dataset' });
  }

  let owner = { id: req.user?.id || null, name: 'Admin', email: '' };
  if (req.user?.id) {
    const adminUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
    if (adminUser) {
      owner = {
        id: req.user.id,
        name: adminUser.name || adminUser.fullName || 'Admin',
        email: adminUser.email || ''
      };
    }
  }

  const payload = {
    name,
    dataset,
    owner,
    createdAt: new Date()
  };
  const result = await db.collection('reports').insertOne(payload);
  return res.status(201).json(mapReport({ ...payload, _id: result.insertedId }));
};

const buildCsv = (rows, columns) => {
  const escape = (value) => {
    const text = String(value ?? '').replace(/\r?\n/g, ' ');
    if (text.includes(',') || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const header = columns.map((col) => col.label).join(',');
  const body = rows
    .map((row) => columns.map((col) => escape(col.value(row))).join(','))
    .join('\n');
  return `${header}\n${body}`;
};

const downloadReport = async (req, res) => {
  const db = req.app.locals.db;
  const report = await db.collection('reports').findOne({ _id: new ObjectId(req.params.id) });
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  let rows = [];
  let columns = [];

  if (report.dataset === 'orders') {
    rows = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
    columns = [
      { label: 'Order ID', value: (row) => row._id },
      { label: 'Total', value: (row) => row.total },
      { label: 'Status', value: (row) => row.status },
      { label: 'Created At', value: (row) => row.createdAt }
    ];
  }

  if (report.dataset === 'users') {
    rows = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    columns = [
      { label: 'Name', value: (row) => row.name || row.fullName },
      { label: 'Email', value: (row) => row.email },
      { label: 'Role', value: (row) => row.role },
      { label: 'Status', value: (row) => row.status },
      { label: 'Joined', value: (row) => row.createdAt }
    ];
  }

  if (report.dataset === 'products') {
    rows = await db.collection('products').find({}).toArray();
    columns = [
      { label: 'Title', value: (row) => row.title },
      { label: 'Category', value: (row) => row.category },
      { label: 'Price', value: (row) => row.price },
      { label: 'Approval', value: (row) => row.approvalStatus },
      { label: 'Sales', value: (row) => row.totalSales }
    ];
  }

  if (report.dataset === 'categories') {
    rows = await db.collection('categories').find({}).toArray();
    columns = [
      { label: 'Name', value: (row) => row.name },
      { label: 'Status', value: (row) => row.status },
      { label: 'Created', value: (row) => row.createdAt }
    ];
  }

  const csv = buildCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
  return res.send(csv);
};

module.exports = {
  getSalesReport,
  listReports,
  generateReport,
  downloadReport
};
