import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import marketplaceSeed from '../data/marketplaceSeed.js';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const MarketplaceContext = createContext({
  listings: [],
  addListing: () => {},
  updateListing: () => {},
  removeListing: () => {}
});

const STORAGE_KEY = 'apnabook_marketplace';

const normalizeListing = (listing) => {
  const sellerEmail = listing?.seller?.email || listing?.sellerEmail || listing?.seller || 'unknown';
  return {
    id: listing._id || listing.id,
    status: listing.status ?? 'Active',
    approvalStatus: listing.approvalStatus ?? 'Approved',
    price: Number(listing.price || 0),
    seller: sellerEmail,
    sellerName: listing?.seller?.name || listing?.sellerName || undefined,
    ...listing
  };
};

const loadListings = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return marketplaceSeed;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeListing) : marketplaceSeed;
  } catch {
    return marketplaceSeed;
  }
};

export function MarketplaceProvider({ children }) {
  const [listings, setListings] = useState([]);
  const { token, user } = useAuth();

  useEffect(() => {
    let ignore = false;

    const loadFromApi = async () => {
      try {
        const data = await api.get('/api/products');
        if (!ignore) {
          setListings(data.map(normalizeListing));
        }
      } catch (error) {
        if (!ignore) {
          setListings(loadListings().map(normalizeListing));
        }
      }
    };

    loadFromApi();

    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  }, [listings]);

  const addListing = async (listing) => {
    if (!token) {
      setListings((prev) => [normalizeListing(listing), ...prev]);
      return;
    }

    const payload = {
      title: listing.title,
      creator: listing.creator,
      description: listing.description,
      price: Number(listing.price || 0),
      category: listing.category,
      type: listing.type,
      fileType: listing.fileType,
      previewUrl: listing.previewUrl,
      previewEnabled: listing.previewEnabled,
      status: listing.status ?? 'Active',
      approvalStatus: listing.approvalStatus ?? 'Approved'
    };

    try {
      const created = await api.post('/api/products', payload, { token });
      setListings((prev) => [normalizeListing(created), ...prev]);
    } catch (error) {
      setListings((prev) => [normalizeListing(listing), ...prev]);
    }
  };

  const updateListing = async (id, updates) => {
    if (!token) {
      setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      return;
    }

    const shouldUpdateApproval =
      Object.prototype.hasOwnProperty.call(updates, 'approvalStatus') && user?.role === 'admin';
    const endpoint = shouldUpdateApproval ? `/api/products/${id}/approval` : `/api/products/${id}`;
    const payload = shouldUpdateApproval
      ? { approvalStatus: updates.approvalStatus }
      : updates;

    try {
      let updated = await api.patch(endpoint, payload, { token });

      if (!updated?.seller?.email) {
        try {
          updated = await api.get(`/api/products/${id}`);
        } catch {
          // Keep the original response if the detail lookup fails.
        }
      }

      setListings((prev) =>
        prev.map((item) => (item.id === id ? normalizeListing({ ...item, ...updated }) : item))
      );
    } catch (error) {
      setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    }
  };

  const removeListing = async (id) => {
    if (token) {
      try {
        await api.delete(`/api/products/${id}`, { token });
      } catch (error) {
        return;
      }
    }
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({ listings, addListing, updateListing, removeListing }),
    [listings]
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export const useMarketplace = () => useContext(MarketplaceContext);
