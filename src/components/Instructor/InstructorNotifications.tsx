import React, { useState } from 'react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
];

const mockNotifications = [
  {
    id: 1,
    title: 'Assignment Reminder',
    message: 'Please submit your assignment by Friday.',
    recipients: 'All learners in React 101',
    date: '2024-07-12',
    status: 'Sent',
    type: 'sent',
  },
  {
    id: 2,
    title: 'Welcome!',
    message: 'Welcome to the course!',
    recipients: 'All learners in UI/UX Design',
    date: '2024-07-10',
    status: 'Read',
    type: 'received',
  },
];

export default function InstructorNotifications() {
  const [activeTab, setActiveTab] = useState('all');

  // Filter notifications by tab
  const filtered =
    activeTab === 'all'
      ? mockNotifications
      : mockNotifications.filter((n) => n.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition text-base">
            + Send Notification
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium border-b-2 transition-all duration-150 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Notification List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-gray-400 text-center py-12">No notifications found.</div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{n.title}</h2>
                  <p className="text-gray-700 mb-2">{n.message}</p>
                  <div className="text-xs text-gray-500 mb-1">Recipients: {n.recipients}</div>
                  <div className="text-xs text-gray-400">{n.date}</div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${n.status === 'Read' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{n.status}</span>
                  <div className="flex gap-2 mt-2">
                    <button className="text-blue-600 hover:underline text-sm">View</button>
                    {n.type === 'sent' && <button className="text-red-600 hover:underline text-sm">Delete</button>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 