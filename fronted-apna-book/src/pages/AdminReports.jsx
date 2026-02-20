import { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

export default function AdminReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [dataset, setDataset] = useState('orders');

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/admin/reports', { token });
      setReports(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
    const refreshId = setInterval(loadReports, 30000);
    return () => clearInterval(refreshId);
  }, [loadReports]);

  const generateReport = async (event) => {
    event.preventDefault();
    try {
      const created = await api.post(
        '/api/admin/reports/generate',
        { name: name.trim(), dataset },
        { token }
      );
      setReports((prev) => [created, ...prev]);
      setName('');
      setDataset('orders');
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError.message || 'Failed to generate report');
    }
  };

  const downloadReport = async (reportId, reportName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName || 'report'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || 'Failed to download report');
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Reports</p>
              <h1 className="text-3xl font-semibold">Analytics Reports</h1>
              <p className="text-sm text-[#6f6861]">{reports.length} active reports</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
                type="button"
                onClick={loadReports}
              >
                Refresh
              </button>
              <button
                className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={() => setIsOpen(true)}
              >
                New Report
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Recent Reports</h2>
              <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">Q1 2026</span>
            </div>

            {loading && (
              <div className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] px-5 py-4 text-sm text-[#6f6861]">
                Loading reports...
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-[#f4b4ad] bg-[#fff1ef] px-5 py-4 text-sm font-semibold text-[#a53f30]">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a88874]">
                        {report.dataset}
                      </p>
                      <h3 className="text-lg font-semibold">{report.name}</h3>
                      <p className="text-sm text-[#6f6861]">Owner: {report.owner?.name || 'Admin'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.15em] text-[#a88874]">Updated</p>
                      <p className="text-sm font-semibold">{formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                      type="button"
                    >
                      View
                    </button>
                    <button
                      className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                      type="button"
                      onClick={() => downloadReport(report.id, report.name)}
                    >
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {isOpen && (
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="admin-books-modal w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88874]">Generate Report</p>
                <h2 className="text-2xl font-semibold">Create analytics report</h2>
              </div>
              <button className="text-xl" type="button" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={generateReport}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Report Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Optional name"
                  className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Dataset</label>
                <select
                  value={dataset}
                  onChange={(event) => setDataset(event.target.value)}
                  className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                >
                  <option value="orders">Orders</option>
                  <option value="users">Users</option>
                  <option value="products">Uploads</option>
                  <option value="categories">Categories</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-[#d9cfc6] px-5 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1d1b19] px-6 py-2 text-sm font-semibold text-white"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
