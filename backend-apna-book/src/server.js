const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userPortalRoutes = require('./routes/userPortalRoutes');
const productRoutes = require('./routes/productRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminCategoryRoutes = require('./routes/adminCategoryRoutes');
const adminUploadRoutes = require('./routes/adminUploadRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('ApnaBook Backend Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userPortalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/uploads', adminUploadRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/cart', cartRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(({ db }) => {
    app.locals.db = db;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed', error.message);
    process.exit(1);
  });
