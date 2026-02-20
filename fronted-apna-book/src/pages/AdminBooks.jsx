import { useCallback, useMemo, useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminBooks.css';

const approvalStyles = {
  Pending: 'bg-[#fef3c7] text-[#b45309]',
  Approved: 'bg-[#d1fae5] text-[#107a4b]',
  Rejected: 'bg-[#fee2e2] text-[#b91c1c]'
};


export default function AdminBooks() {
  const { token } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUploads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('approvalStatus', filter);
      if (search.trim()) params.set('q', search.trim());
      const query = params.toString();
      const data = await api.get(`/api/admin/uploads${query ? `?${query}` : ''}`, { token });
      setUploads(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const filteredUploads = useMemo(() => uploads, [uploads]);

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === filteredUploads.length) return new Set();
      return new Set(filteredUploads.map((item) => item.id));
    });
  };

  const updateApproval = async (id, status) => {
    setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, approvalStatus: status } : item)));
    try {
      const endpoint = status === 'Approved' ? 'approve' : 'reject';
      const updated = await api.patch(`/api/admin/uploads/${id}/${endpoint}`, {}, { token });
      setUploads((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (requestError) {
      setError(requestError.message || 'Failed to update approval');
      loadUploads();
    }
  };

  const deleteUpload = async (id) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
    try {
      await api.delete(`/api/admin/uploads/${id}`, { token });
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete upload');
      loadUploads();
    }
  };

  const bulkUpdate = async (status) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setUploads((prev) => prev.map((item) => (selected.has(item.id) ? { ...item, approvalStatus: status } : item)));
    setSelected(new Set());

    try {
      const endpoint = status === 'Approved' ? 'approve' : 'reject';
      await Promise.all(ids.map((id) => api.patch(`/api/admin/uploads/${id}/${endpoint}`, {}, { token })));
      loadUploads();
    } catch (requestError) {
      setError(requestError.message || 'Failed to update uploads');
      loadUploads();
    }
  };

  return (
    <div className="admin-shell admin-books-page min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Uploads</p>
              <h1 className="text-3xl font-semibold">Manage Marketplace Items</h1>
              <p className="text-sm text-[#6f6861]">{uploads.length} total listings</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
                type="button"
                onClick={loadUploads}
              >
                Refresh
              </button>
              <button
                className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={() => bulkUpdate('Approved')}
              >
                Bulk Approve
              </button>
              <button
                className="rounded-full border border-[#fef3c7] px-5 py-2 text-sm font-semibold text-[#b45309]"
                type="button"
                onClick={() => bulkUpdate('Rejected')}
              >
                Bulk Reject
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Pending & Approved Items</h2>
              <div className="flex flex-wrap items-center gap-2">
                {['Pending', 'Approved', 'Rejected'].map((status) => (
                  <span
                    key={status}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${approvalStyles[status]}`}
                  >
                    {status} {uploads.filter((item) => (item.approvalStatus ?? 'Pending') === status).length}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#eee4dc] bg-white px-4 py-2 shadow-sm">
                <span className="text-sm text-[#a88874]">🔎</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, creator, category, or seller"
                  className="w-full bg-transparent text-sm text-[#1d1b19] placeholder:text-[#a79d95] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#eee4dc] bg-white px-4 py-2 shadow-sm">
                <span className="text-sm text-[#a88874]">Approval</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="bg-transparent text-sm font-semibold text-[#1d1b19] focus:outline-none"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="mb-4 rounded-2xl border border-[#efe5dc] bg-[#fffaf6] px-4 py-3 text-sm text-[#6f6861]">
                Loading uploads...
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-2xl border border-[#f4b4ad] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#a53f30]">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="admin-table w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#7a726b]">
                  <tr className="border-b border-[#efe5dc]">
                    <th className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredUploads.length && filteredUploads.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Seller</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Approval</th>
                    <th className="py-3 pr-4">Sales</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#3c3631]">
                  {filteredUploads.map((item) => (
                    <tr key={item.id} className="border-b border-[#f3e8de] last:border-b-0">
                      <td className="py-4 pr-4">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </td>
                      <td className="py-4 pr-4 font-semibold">{item.title}</td>
                      <td className="py-4 pr-4 text-[#6f6861]">{item.type}</td>
                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[#6f6861]">{item.seller?.name || item.seller?.email || '-'}</td>
                      <td className="py-4 pr-4 font-semibold">${Number(item.price || 0).toFixed(2)}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            approvalStyles[item.approvalStatus ?? 'Pending']
                          }`}
                        >
                          {item.approvalStatus ?? 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        {Number(item.salesCount || 0)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                            type="button"
                            onClick={() => updateApproval(item.id, 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-full border border-[#fef3c7] px-3 py-1 text-xs font-semibold text-[#b45309]"
                            type="button"
                            onClick={() => updateApproval(item.id, 'Rejected')}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                            type="button"
                            onClick={() => deleteUpload(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
