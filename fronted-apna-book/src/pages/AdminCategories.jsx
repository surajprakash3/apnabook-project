import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', status: 'Active' };

export default function AdminCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/admin/categories', { token });
      setCategories(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const activeCount = useMemo(
    () => categories.filter((item) => item.status === 'Active').length,
    [categories]
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ name: category.name, status: category.status || 'Active' });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        const updated = await api.patch(
          `/api/admin/categories/${editing.id}`,
          { name: form.name, status: form.status },
          { token }
        );
        setCategories((prev) => prev.map((item) => (item.id === editing.id ? updated : item)));
      } else {
        const created = await api.post('/api/admin/categories', form, { token });
        setCategories((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save category');
    }
  };

  const deleteCategory = async (category) => {
    setCategories((prev) => prev.filter((item) => item.id !== category.id));
    try {
      await api.delete(`/api/admin/categories/${category.id}`, { token });
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete category');
      loadCategories();
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Categories</p>
              <h1 className="text-3xl font-semibold">Manage Categories</h1>
              <p className="text-sm text-[#6f6861]">{categories.length} categories</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
                type="button"
                onClick={loadCategories}
              >
                Refresh
              </button>
              <button
                className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={openNew}
              >
                Add Category
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Category List</h2>
              <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                Active {activeCount}
              </span>
            </div>

            {loading && (
              <div className="mb-4 rounded-2xl border border-[#efe5dc] bg-[#fffaf6] px-4 py-3 text-sm text-[#6f6861]">
                Loading categories...
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
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Books</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#3c3631]">
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-[#f3e8de] last:border-b-0">
                      <td className="py-4 pr-4 font-semibold">{category.name}</td>
                      <td className="py-4 pr-4">{category.totalProducts}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.status === 'Active'
                              ? 'bg-[#d1fae5] text-[#107a4b]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                            type="button"
                            onClick={() => openEdit(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                            type="button"
                            onClick={() => deleteCategory(category)}
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

      {isOpen && (
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="admin-books-modal w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88874]">
                  {editing ? 'Edit Category' : 'New Category'}
                </p>
                <h2 className="text-2xl font-semibold">{editing ? 'Update category' : 'Create category'}</h2>
              </div>
              <button className="text-xl" type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Category name"
                  className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[#d9cfc6] px-5 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1d1b19] px-6 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
