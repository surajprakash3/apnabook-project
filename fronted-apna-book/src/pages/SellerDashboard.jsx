import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function SellerDashboard() {
  const { user } = useAuth();
  const { listings, removeListing, updateListing } = useMarketplace();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: '', price: '' });

  const sellerId = user?.email || 'guest@pustakly.com';
  const myListings = useMemo(
    () => listings.filter((item) => item.seller === sellerId),
    [listings, sellerId]
  );

  const updateStatus = (id, status) => {
    updateListing(id, { status });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({ title: item.title, price: String(item.price ?? '') });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ title: '', price: '' });
  };

  const saveEdit = (id) => {
    updateListing(id, { title: draft.title.trim(), price: Number(draft.price || 0) });
    cancelEdit();
  };

  return (
    <section className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Seller Dashboard</h3>
          <p className="text-sm text-[#7a726b]">Track uploads, manage listings, and update sales status.</p>
        </div>
        <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
          {myListings.length} uploads
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {myListings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e0ddd8] px-4 py-6 text-center text-sm text-[#7a726b]">
            No uploads yet. Add your first listing in the Sell tab.
          </div>
        ) : (
          myListings.map((item) => (
            <div
              key={item.id}
              className="user-portal-row flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efe5dc] px-4 py-3"
            >
              <div>
                {editingId === item.id ? (
                  <div className="grid gap-2">
                    <input
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="rounded-full border border-[#e0ddd8] bg-white px-3 py-1 text-xs font-semibold"
                    />
                    <input
                      value={draft.price}
                      onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))}
                      className="rounded-full border border-[#e0ddd8] bg-white px-3 py-1 text-xs font-semibold"
                      type="number"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[#7a726b]">{item.type} • {item.category}</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                <select
                  value={item.status}
                  onChange={(event) => updateStatus(item.id, event.target.value)}
                  className="rounded-full border border-[#e0ddd8] bg-white px-3 py-1 text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Sold">Sold</option>
                </select>
                {editingId === item.id ? (
                  <>
                    <button
                      type="button"
                      className="rounded-full bg-[#1d1b19] px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => saveEdit(item.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                      onClick={() => removeListing(item.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
