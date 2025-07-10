import React, { useEffect, useState } from 'react';
import { Filter, Flag, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  points_earned: number;
  coins_earned: number;
  created_at: string;
  description?: string;
  metadata?: any;
}

export function GamificationModeration() {
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filtering, setFiltering] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching gamification events...');
    let query = supabase.from('gamification_events').select('*').order('created_at', { ascending: false }).limit(100);
    if (filterUser) query = query.eq('user_id', filterUser);
    if (filterType) query = query.eq('event_type', filterType);
    const { data, error } = await query;
      if (error) {
        console.error('Error fetching events:', error);
        setError(error.message);
      } else {
        console.log('Fetched events:', data);
    setEvents(data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [filterUser, filterType]);

  const handleReverse = async (id: string) => {
    if (!window.confirm('Reverse this event?')) return;
    setFiltering(true);
    try {
      // Since there's no status column, we'll delete the event instead
      const { error } = await supabase.from('gamification_events').delete().eq('id', id);
      if (error) {
        console.error('Error reversing event:', error);
        alert('Failed to reverse event: ' + error.message);
      } else {
    fetchEvents();
      }
    } catch (err) {
      console.error('Error reversing event:', err);
      alert('Failed to reverse event');
    }
    setFiltering(false);
  };

  const handleFlag = async (id: string) => {
    if (!window.confirm('Flag this event for review?')) return;
    setFiltering(true);
    try {
      // Since there's no status column, we'll update the metadata to flag it
      const { error } = await supabase
        .from('gamification_events')
        .update({ metadata: { flagged: true, flagged_at: new Date().toISOString() } })
        .eq('id', id);
      if (error) {
        console.error('Error flagging event:', error);
        alert('Failed to flag event: ' + error.message);
      } else {
    fetchEvents();
      }
    } catch (err) {
      console.error('Error flagging event:', err);
      alert('Failed to flag event');
    }
    setFiltering(false);
  };

  const isEventFlagged = (event: GamificationEvent) => {
    return event.metadata?.flagged === true;
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-500" /> Gamification Moderation
        </h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter by User ID"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by Event Type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow"
            disabled={filtering}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={() => {
              setFilterUser('');
              setFilterType('');
              fetchEvents();
            }}
            className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium shadow"
            disabled={filtering}
          >
            <RotateCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-blue-600">{events.reduce((sum, event) => sum + event.points_earned, 0).toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">P</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Coins</p>
              <p className="text-2xl font-bold text-yellow-600">{events.reduce((sum, event) => sum + event.coins_earned, 0).toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-sm">C</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged Events</p>
              <p className="text-2xl font-bold text-yellow-600">{events.filter(event => isEventFlagged(event)).length}</p>
            </div>
            <Flag className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Coins</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-mono">{event.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{event.event_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-bold">{event.points_earned}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-bold">{event.coins_earned}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{new Date(event.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${isEventFlagged(event) ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {isEventFlagged(event) ? 'Flagged' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleReverse(event.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Reverse this event"
                    >
                      <RotateCcw className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleFlag(event.id)}
                      className={`${isEventFlagged(event) ? 'text-gray-400 cursor-not-allowed' : 'text-yellow-600 hover:text-yellow-900'}`}
                      disabled={isEventFlagged(event)}
                      title={isEventFlagged(event) ? 'Already flagged' : 'Flag this event for review'}
                    >
                      <Flag className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="text-gray-400">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No gamification events found</p>
                      <p className="text-sm">Events will appear here when users earn points or coins through gamification activities.</p>
                      {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">Error: {error}</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 