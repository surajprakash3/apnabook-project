import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';

const categoryOptions = ['Book', 'Notes', 'Template', 'Data', 'Project'];
const typeOptions = ['Physical Books', 'Digital Notes', 'Website ZIP files', 'Datasets', 'Design Templates'];

const emptyForm = {
  title: '',
  creator: '',
  price: '',
  category: 'Book',
  type: 'Physical Books',
  description: '',
  previewEnabled: true,
  fileName: '',
  fileType: '',
  previewUrl: ''
};

export default function UserSell() {
  const { user } = useAuth();
  const { addListing } = useMarketplace();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('Ready to upload');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, fileName: file.name, fileType: file.type || 'file' }));
  };

  const handlePreviewImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, previewUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const listing = {
      id: Date.now(),
      title: form.title.trim(),
      creator: form.creator.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      category: form.category,
      type: form.type,
      fileType: form.fileType || 'file',
      previewUrl: form.previewUrl,
      previewEnabled: form.previewEnabled,
      seller: user?.email || 'guest@pustakly.com',
      status: 'Active',
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    try {
      await addListing(listing);
      setForm(emptyForm);
      setStatus('Listing published to marketplace');
    } catch (error) {
      setStatus('Upload failed. Please try again.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Upload a Listing</h3>
            <p className="text-sm text-[#7a726b]">Sell books, notes, datasets, and templates.</p>
          </div>
          <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
            {status}
          </span>
        </div>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
              required
            />
            <input
              name="creator"
              value={form.creator}
              onChange={handleChange}
              placeholder="Creator / Author"
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              type="number"
              min="0"
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
              required
            />
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              name="fileName"
              value={form.fileName}
              onChange={handleChange}
              placeholder="File name (auto-filled on upload)"
              className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            rows="4"
            className="user-portal-input w-full rounded-xl border border-[#e8dcd3] px-3 py-2 text-sm"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-[#e8dcd3] px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">File upload</p>
              <input type="file" onChange={handleFile} className="mt-2 w-full text-xs" />
            </div>
            <div className="rounded-xl border border-dashed border-[#e8dcd3] px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Image upload</p>
              <input type="file" accept="image/*" onChange={handlePreviewImage} className="mt-2 w-full text-xs" />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-[#6f6861]">
            <input
              type="checkbox"
              name="previewEnabled"
              checked={form.previewEnabled}
              onChange={handleChange}
            />
            Enable preview card for buyers
          </label>
          <button className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white" type="submit">
            Upload Listing
          </button>
        </form>
      </section>

      <section className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-semibold">Preview</h3>
        <p className="text-sm text-[#7a726b]">This is how your listing appears to buyers.</p>
        <div className="mt-4 rounded-2xl border border-[#efe5dc] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                {form.type}
              </span>
              <h4 className="mt-3 text-base font-semibold">{form.title || 'Listing title'}</h4>
              <p className="text-sm text-[#7a726b]">by {form.creator || 'Creator name'}</p>
            </div>
            <span className="rounded-full bg-[#e0e7ff] px-2 py-1 text-[10px] font-semibold text-[#4338ca]">
              Seller
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-[#f3ece6] p-4">
            {form.previewUrl && form.previewEnabled ? (
              <img src={form.previewUrl} alt="Preview" className="h-40 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center text-4xl">📦</div>
            )}
          </div>
          <p className="mt-3 text-xs text-[#6f6861]">{form.description || 'Add a description to help buyers.'}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">${Number(form.price || 0).toFixed(2)}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#a88874]">{form.category}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
