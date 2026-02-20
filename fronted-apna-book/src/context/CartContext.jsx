import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

export const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateItemQuantity: () => {},
  clearCart: () => {}
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { token } = useAuth();
  const GUEST_CART_KEY = 'pustakly_cart';

  const normalizePrice = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parsed = Number.parseFloat(String(value).replace('$', ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const isObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

  const mapCartItems = (cartItems = []) =>
    cartItems.map((item) => ({
      ...item,
      id: item.productId || item.id,
      productId: item.productId || item.id,
      price: normalizePrice(item.price)
    }));

  const loadGuestCart = () => {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? mapCartItems(parsed) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!token) {
      setItems(loadGuestCart());
      return;
    }

    localStorage.removeItem(GUEST_CART_KEY);

    const loadCart = async () => {
      try {
        const cart = await api.get('/api/cart', { token });
        setItems(mapCartItems(cart.items));
      } catch {
        setItems([]);
      }
    };

    loadCart();
  }, [token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  }, [items, token]);

  const addItem = async (item) => {
    const normalized = {
      ...item,
      id: item.id || item.productId,
      productId: item.productId || item.id,
      price: normalizePrice(item.price),
      quantity: item.quantity ?? 1
    };

    const useBackend = token && isObjectId(normalized.productId);

    if (!useBackend) {
      setItems((prev) => {
        const existing = prev.find((entry) => entry.id === normalized.id);

        if (!existing) {
          return [...prev, normalized];
        }

        return prev.map((entry) =>
          entry.id === normalized.id
            ? { ...entry, quantity: (entry.quantity ?? 1) + normalized.quantity }
            : entry
        );
      });
      return;
    }

    try {
      const cart = await api.post(
        '/api/cart/add',
        {
          productId: normalized.productId,
          title: normalized.title,
          price: normalized.price,
          quantity: normalized.quantity
        },
        { token }
      );
      setItems(mapCartItems(cart.items));
    } catch {
      setItems((prev) => {
        const existing = prev.find((entry) => entry.id === normalized.id);

        if (!existing) {
          return [...prev, normalized];
        }

        return prev.map((entry) =>
          entry.id === normalized.id
            ? { ...entry, quantity: (entry.quantity ?? 1) + normalized.quantity }
            : entry
        );
      });
    }
  };

  const removeItem = async (id) => {
    if (token && isObjectId(id)) {
      try {
        const cart = await api.delete('/api/cart/remove', { token, body: { productId: id } });
        setItems(mapCartItems(cart.items));
        return;
      } catch {
        return;
      }
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemQuantity = async (id, quantity) => {
    const nextQuantity = Math.max(1, quantity);

    if (token && isObjectId(id)) {
      try {
        const cart = await api.put('/api/cart/update', { productId: id, quantity: nextQuantity }, { token });
        setItems(mapCartItems(cart.items));
        return;
      } catch {
        return;
      }
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  };

  const clearCart = async () => {
    if (token && items.some((item) => isObjectId(item.id))) {
      try {
        await Promise.all(
          items
            .filter((item) => isObjectId(item.id))
            .map((item) => api.delete('/api/cart/remove', { token, body: { productId: item.id } }))
        );
      } catch {
        return;
      }
    }
    setItems([]);
  };

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateItemQuantity, clearCart }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
