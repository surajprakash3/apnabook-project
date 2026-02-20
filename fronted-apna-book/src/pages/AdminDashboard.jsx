import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const toPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const [summaryRes, salesRes, ordersRes] = await Promise.all([
          api.get('/api/admin/analytics/summary', { token }),
          api.get('/api/admin/analytics/monthly-sales', { token }),
          api.get('/api/admin/analytics/monthly-orders', { token })
        ]);

        if (!active) return;
        setSummary(summaryRes);
        setSales(Array.isArray(salesRes) ? salesRes : []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Failed to load analytics');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAnalytics();
    const refreshId = setInterval(loadAnalytics, 60000);
    return () => {
      active = false;
      clearInterval(refreshId);
    };
  }, [token]);

  const cards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: 'Revenue',
        value: currency.format(summary.totalRevenue || 0),
        trend: toPercent(summary.revenueGrowth || 0),
        icon: '💸'
      },
      {
        label: 'Orders',
        value: summary.totalOrders ?? 0,
        trend: toPercent(summary.ordersGrowth || 0),
        icon: '🧾'
      },
      {
        label: 'Users',
        value: summary.totalUsers ?? 0,
        trend: toPercent(summary.usersGrowth || 0),
        icon: '👥'
      }
    ];
  }, [summary]);

  return (
    <div className="admin-analytics min-h-screen bg-[#f5f2ed] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="flex min-h-screen flex-col">
        <header className="analytics-header sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#f5f2ed]/90 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="analytics-muted text-sm text-[#6f6861]">Track revenue, orders, and users growth.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold" type="button">
              Export
            </button>
            <button className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white" type="button">
              New Report
            </button>
            <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold">{user?.name || 'Admin'}</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1d1b19] text-xs font-semibold text-white">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'AD'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-8 px-6 py-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading && (
              <div className="col-span-full rounded-2xl bg-white p-6 text-sm text-[#6f6861] shadow">
                Loading analytics...
              </div>
            )}
            {error && (
              <div className="col-span-full rounded-2xl bg-[#fff3f0] p-6 text-sm font-semibold text-[#a53f30] shadow">
                {error}
              </div>
            )}
            {!loading && !error && cards.map((card, index) => (
              <article
                key={card.label}
                className={`rounded-2xl p-5 text-white shadow-[0_18px_36px_rgba(0,0,0,0.15)] transition hover:-translate-y-1 ${
                  index === 0
                    ? 'bg-gradient-to-br from-[#f97316] to-[#ef4444]'
                    : index === 1
                    ? 'bg-gradient-to-br from-[#0f766e] to-[#14b8a6]'
                    : 'bg-gradient-to-br from-[#6366f1] to-[#3b82f6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">{card.label}</p>
                    <h2 className="text-2xl font-semibold">{card.value}</h2>
                    <span className="text-xs font-semibold text-white/90">{card.trend}</span>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-xl">
                    {card.icon}
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Sales</h3>
                  <p className="analytics-muted text-xs text-[#7a726b]">Monthly revenue trend</p>
                </div>
                <span className="rounded-full bg-[#ffedd5] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                  {summary ? toPercent(summary.revenueGrowth || 0) : '+0.0%'}
                </span>
              </div>
              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sales}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <div className="flex flex-col gap-6">
              <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Orders</h3>
                    <p className="analytics-muted text-xs text-[#7a726b]">Monthly volume</p>
                  </div>
                  <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {summary ? toPercent(summary.ordersGrowth || 0) : '+0.0%'}
                  </span>
                </div>
                <div className="mt-6 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orders}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Monthly Summary</h3>
                    <p className="analytics-muted text-xs text-[#7a726b]">Current month snapshot</p>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">On track</span>
                </div>
                <ul className="mt-4 space-y-4 text-sm">
                  {[
                    ['Net Revenue', currency.format(summary?.monthlySummary?.netRevenue || 0), 78],
                    ['Repeat Customers', `${summary?.monthlySummary?.repeatCustomers || 0}%`, 62],
                    ['Fulfillment Time', `${summary?.monthlySummary?.fulfillmentDays || 0} days`, 84]
                  ].map(([label, value, percent]) => (
                    <li key={label}>
                      <div className="flex items-center justify-between">
                        <span className="analytics-muted text-[#64748b]">{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-[#e2e8f0]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a]"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
