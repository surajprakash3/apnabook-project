import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminOrders.css';

const statusStyles = {
  Processing: 'bg-[#dbeafe] text-[#1d4ed8]',
  Shipped: 'bg-[#d1fae5] text-[#107a4b]',
  Delivered: 'bg-[#fef3c7] text-[#b45309]',
  Cancelled: 'bg-[#fee2e2] text-[#b91c1c]'
};

const statusOptions = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const statusQueryMap = {
  Processing: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled'
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const query = statusFilter !== 'All' ? `?status=${statusQueryMap[statusFilter]}` : '';
      const data = await api.get(`/api/admin/orders${query}`, { token });
      setOrders(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (id, status) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );

    try {
      const updated = await api.patch(`/api/admin/orders/${id}/status`, { status }, { token });
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, ...updated } : order))
      );
    } catch (requestError) {
      setError(requestError.message || 'Failed to update order status');
      loadOrders();
    }
  };

  const recentCount = useMemo(() => orders.length, [orders]);

  return (
    <div className="admin-shell admin-orders-page min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">
              Orders
            </p>
            <h1 className="text-3xl font-semibold">Manage Orders</h1>
            <p className="text-sm text-[#6f6861]">{recentCount} recent orders</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
              type="button"
              onClick={loadOrders}
            >
              Refresh
            </button>
            <select
              className="rounded-full border border-[#d9cfc6] bg-white px-5 py-2 text-sm font-semibold"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((status) => (
                <span
                  key={status}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                >
                  {status}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] p-5 text-sm text-[#6f6861]">
                Loading orders...
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-[#f4b4ad] bg-[#fff1ef] p-5 text-sm font-semibold text-[#a53f30]">
                {error}
              </div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] p-5 text-sm text-[#6f6861]">
                No orders found for this filter.
              </div>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a88874]">
                      Order #{order.orderId}
                    </p>
                    <h3 className="text-lg font-semibold">{order.buyer?.name}</h3>
                    <p className="text-sm text-[#6f6861]">{order.buyer?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.15em] text-[#a88874]">Total</p>
                    <p className="text-lg font-semibold">${Number(order.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-[#6f6861]">{formatDate(order.date)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="text-sm font-semibold">Items</p>
                    <ul className="mt-2 space-y-2 text-sm text-[#3c3631]">
                      {order.items.map((item) => (
                        <li key={item.title} className="flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-xs text-[#6f6861]">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.15em] text-[#a88874]">Seller</p>
                      <p className="text-sm font-semibold">{order.seller?.name}</p>
                      <p className="text-xs text-[#6f6861]">{order.seller?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Status</p>
                      <span
                        className={`mt-2 w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            order.status === status
                              ? 'border-transparent bg-[#1d1b19] text-white'
                              : 'border-[#d9cfc6] text-[#3c3631] hover:bg-[#efe5dc]'
                          }`}
                          onClick={() => updateStatus(order.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
