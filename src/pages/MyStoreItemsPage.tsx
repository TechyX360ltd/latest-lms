import React, { useState, useEffect } from 'react';
import { useGamification } from '../hooks/useGamification';
import { useAuth } from '../context/AuthContext';
import { Gift, Coins } from 'lucide-react';
import { StoreItem, UserPurchase } from '../types/gamification';
import { format } from 'date-fns';
import { GamificationService } from '../lib/gamification';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

const TABS = [
  { key: 'items', label: 'My Items' },
  { key: 'gifting', label: 'Gifting History' },
];

const GIFT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'coins', label: 'Coins' },
  { value: 'item', label: 'Items' },
];

const GIFT_DIRECTION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'received', label: 'Received' },
];

const SORT_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

export default function MyStoreItemsPage() {
  const { user } = useAuth();
  const { userPurchases, storeItems, loadUserPurchases, loadStoreItems } = useGamification();
  const [activeTab, setActiveTab] = useState<'items' | 'gifting'>('items');
  const [giftingHistory, setGiftingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [giftType, setGiftType] = useState('all');
  const [giftDirection, setGiftDirection] = useState<'all' | 'sent' | 'received'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalGifts, setTotalGifts] = useState(0);

  useEffect(() => {
    loadUserPurchases();
    loadStoreItems();
  }, []);

  useEffect(() => {
    if (!user?.id || activeTab !== 'gifting') return;
    setLoading(true);
    GamificationService.getUserGiftingHistory(user.id, {
      type: giftDirection !== 'all' ? giftDirection : undefined,
      sort: sortOrder,
      page,
      pageSize,
    })
      .then(({ data, total }) => {
        let filtered = data;
        if (giftType !== 'all') {
          filtered = filtered.filter((g: any) => g.gift_type === giftType);
        }
        setGiftingHistory(filtered);
        setTotalGifts(total);
      })
      .finally(() => setLoading(false));
  }, [user?.id, activeTab, giftType, giftDirection, sortOrder, page, pageSize]);

  const totalPages = Math.ceil(totalGifts / pageSize) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div>
      <Breadcrumbs />
      <div className="w-full max-w-7xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-bold mb-6 text-center">My Store Items</h1>
        <div className="flex justify-center mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-6 py-2 rounded-t-lg font-semibold text-lg transition-colors border-b-2 ${
                activeTab === tab.key ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 bg-white hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab.key as 'items' | 'gifting')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-b-2xl shadow-lg p-6 min-h-[400px]">
          {activeTab === 'items' && (
            <div>
              {userPurchases.length === 0 ? (
                <div className="text-center text-gray-500 py-16">You haven't purchased any items yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userPurchases.map((purchase: UserPurchase) => {
                    const item = storeItems.find((i: StoreItem) => i.id === purchase.item_id);
                    return (
                      <div key={purchase.id} className="bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 rounded-2xl shadow p-5 flex flex-col items-center">
                        <div className="w-20 h-20 mb-3 flex items-center justify-center bg-white rounded-full border-4 border-yellow-200 shadow">
                          {item?.icon_url ? (
                            <img src={item.icon_url} alt={item.name} className="w-14 h-14 object-contain" />
                          ) : (
                            <Gift className="w-10 h-10 text-pink-400" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-pink-700 mb-1 text-center">{item?.name || 'Store Item'}</h3>
                        <p className="text-gray-600 text-center mb-2">{item?.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <span>Purchased:</span>
                          <span className="font-semibold">{format(new Date(purchase.purchased_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Quantity:</span>
                          <span className="font-semibold">{purchase.quantity}x</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span>{purchase.total_cost} coins</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'gifting' && (
            <div>
              <div className="flex flex-wrap gap-4 mb-6 items-center">
                <select value={giftDirection} onChange={e => { setGiftDirection(e.target.value as any); setPage(1); }} className="px-3 py-2 border rounded-lg">
                  {GIFT_DIRECTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select value={giftType} onChange={e => { setGiftType(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg">
                  {GIFT_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select value={sortOrder} onChange={e => { setSortOrder(e.target.value as any); setPage(1); }} className="px-3 py-2 border rounded-lg">
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {loading ? (
                <div className="text-center text-gray-400 py-16">Loading gifting history...</div>
              ) : giftingHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-16">No gifting history yet.</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {giftingHistory.map((gift, idx) => {
                      const isSent = gift.sender_id === user?.id;
                      const isReceived = gift.recipient_id === user?.id;
                      return (
                        <div key={gift.id || idx} className={`rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow ${isSent ? 'bg-pink-50' : 'bg-blue-50'}`}>
                          <div className="flex-1">
                            <div className="font-semibold text-blue-700">
                              {isSent ? 'You sent' : 'You received'}{' '}
                              {gift.gift_type === 'coins' ? (
                                <span className="inline-flex items-center gap-1"><Coins className="w-4 h-4 text-yellow-500" /> {gift.amount} coins</span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  {gift.item?.icon_url ? <img src={gift.item.icon_url} alt={gift.item.name} className="w-5 h-5 inline-block mr-1" /> : <Gift className="w-4 h-4 text-pink-400" />} {gift.item?.name || 'Store Item'}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {isSent ? 'To' : 'From'}: {isSent ? (gift.recipient?.first_name + ' ' + gift.recipient?.last_name) : (gift.sender?.first_name + ' ' + gift.sender?.last_name)}
                            </div>
                            {gift.message && <div className="text-gray-500 text-sm italic mt-1">"{gift.message}"</div>}
                            <div className="text-xs text-gray-400 mt-1">{format(new Date(gift.sent_at), 'MMM d, yyyy')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                    <span className="ml-4 text-sm text-gray-500">Page {page} of {totalPages}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 