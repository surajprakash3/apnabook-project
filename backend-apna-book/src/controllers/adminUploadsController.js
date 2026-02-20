const { ObjectId } = require('mongodb');

const mapUpload = (item) => ({
  id: String(item._id),
  title: item.title,
  type: item.type || 'Unknown',
  category: item.category || 'Uncategorized',
  seller: item.sellerInfo
    ? {
        id: item.sellerInfo._id,
        name: item.sellerInfo.name,
        email: item.sellerInfo.email
      }
    : null,
  price: Number(item.price || 0),
  approvalStatus: item.approvalStatus || 'Pending',
  salesCount: Number(item.totalSales || 0)
});

const listAdminUploads = async (req, res) => {
  const db = req.app.locals.db;
  const approvalStatus = req.query.approvalStatus;
  const q = String(req.query.q || '').trim();

  const match = {};
  if (approvalStatus) {
    match.approvalStatus = approvalStatus;
  }
  if (q) {
    match.$or = [
      { title: new RegExp(q, 'i') },
      { creator: new RegExp(q, 'i') },
      { category: new RegExp(q, 'i') },
      { type: new RegExp(q, 'i') }
    ];
  }

  const uploads = await db
    .collection('products')
    .aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } }
    ])
    .toArray();

  return res.json(uploads.map(mapUpload));
};

const setApproval = async (req, res, approvalStatus) => {
  const db = req.app.locals.db;
  const productId = new ObjectId(req.params.id);
  await db
    .collection('products')
    .updateOne({ _id: productId }, { $set: { approvalStatus, updatedAt: new Date() } });

  const product = await db
    .collection('products')
    .findOne({ _id: productId });
  if (!product) {
    return res.status(404).json({ message: 'Upload not found' });
  }

  const [row] = await db
    .collection('products')
    .aggregate([
      { $match: { _id: productId } },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } }
    ])
    .toArray();

  return res.json(mapUpload(row));
};

const approveUpload = async (req, res) => setApproval(req, res, 'Approved');
const rejectUpload = async (req, res) => setApproval(req, res, 'Rejected');

const deleteUpload = async (req, res) => {
  const db = req.app.locals.db;
  const productId = new ObjectId(req.params.id);
  const result = await db.collection('products').deleteOne({ _id: productId });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Upload not found' });
  }
  return res.json({ message: 'Upload deleted' });
};

module.exports = {
  listAdminUploads,
  approveUpload,
  rejectUpload,
  deleteUpload
};
