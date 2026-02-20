const { ObjectId } = require('mongodb');

const getCart = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const cart = await db.collection('carts').findOne({ userId });
  return res.json(cart || { userId, items: [] });
};

const addToCart = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const { productId, title, price, quantity = 1 } = req.body;

  if (!productId || !title || price === undefined) {
    return res.status(400).json({ message: 'productId, title, and price are required' });
  }

  const cart = await db.collection('carts').findOne({ userId });
  const itemId = new ObjectId(productId);

  if (!cart) {
    const newCart = {
      userId,
      items: [{ productId: itemId, title, price, quantity }],
      updatedAt: new Date()
    };
    await db.collection('carts').insertOne(newCart);
    return res.status(201).json(newCart);
  }

  const existingIndex = cart.items.findIndex((item) => item.productId.equals(itemId));
  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += quantity;
  } else {
    cart.items.push({ productId: itemId, title, price, quantity });
  }

  await db.collection('carts').updateOne(
    { userId },
    { $set: { items: cart.items, updatedAt: new Date() } }
  );

  return res.json({ userId, items: cart.items });
};

const updateCartItem = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ message: 'productId and quantity are required' });
  }

  const cart = await db.collection('carts').findOne({ userId });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const itemId = new ObjectId(productId);
  const nextItems = cart.items.map((item) =>
    item.productId.equals(itemId)
      ? { ...item, quantity: Math.max(1, Number(quantity)) }
      : item
  );

  await db.collection('carts').updateOne(
    { userId },
    { $set: { items: nextItems, updatedAt: new Date() } }
  );

  return res.json({ userId, items: nextItems });
};

const removeFromCart = async (req, res) => {
  const db = req.app.locals.db;
  const userId = new ObjectId(req.user.id);
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  const cart = await db.collection('carts').findOne({ userId });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const itemId = new ObjectId(productId);
  const nextItems = cart.items.filter((item) => !item.productId.equals(itemId));

  await db.collection('carts').updateOne(
    { userId },
    { $set: { items: nextItems, updatedAt: new Date() } }
  );

  return res.json({ userId, items: nextItems });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
