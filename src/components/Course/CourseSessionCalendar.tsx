import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Mock session data
const mockSessions = [
  {
    id: 1,
    title: 'React Basics Live',
    start: new Date(2024, 6, 10, 10, 0),
    end: new Date(2024, 6, 10, 11, 0),
    platform: 'Zoom',
    instructor: 'Sarah Johnson',
    description: 'Intro to React and Q&A',
    joinLink: '#',
  },
  {
    id: 2,
    title: 'UI/UX Q&A',
    start: new Date(2024, 6, 12, 14, 0),
    end: new Date(2024, 6, 12, 15, 0),
    platform: 'Google Meet',
    instructor: 'Mike Chen',
    description: 'Live Q&A on UI/UX',
    joinLink: '#',
  },
];

interface CourseSessionCalendarProps {
  events?: any[];
}

function isValidMeetingLink(link: string) {
  if (!link) return false;
  // Basic Zoom/Google Meet URL patterns
  const zoomPattern = /^https?:\/\/(www\.)?zoom\.us\//i;
  const meetPattern = /^https?:\/\/(meet|www)\.google\.com\//i;
  return zoomPattern.test(link) || meetPattern.test(link);
}

export default function CourseSessionCalendar({ events }: CourseSessionCalendarProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const calendarEvents = events || mockSessions;

  return (
    <>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '70vh', width: '100%' }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.WEEK}
        onSelectEvent={(event: any) => setSelectedSession(event)}
        popup
      />

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 animate-scaleIn relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setSelectedSession(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-2xl font-extrabold mb-4 text-blue-700 flex items-center gap-2 animate-fadeInUp">
              <span className="inline-block bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-semibold mr-2">Live</span>
              {selectedSession.title}
            </h3>
            <div className="space-y-2 animate-fadeInUp">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Instructor:</span>
                <span className="text-gray-900">{selectedSession.instructor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Platform:</span>
                <span className="text-gray-900 capitalize flex items-center gap-2">
                  {selectedSession.platform}
                  {selectedSession.platform?.toLowerCase().includes('google') && (
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C34.89 32.042 30.045 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.993 0 5.73 1.07 7.872 2.824l6.011-6.011C34.58 5.07 29.617 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20c11.045 0 19.545-7.955 19.545-19 0-1.27-.138-2.507-.389-3.707z"/><path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 16.104 19.01 13 24 13c2.993 0 5.73 1.07 7.872 2.824l6.011-6.011C34.58 5.07 29.617 3 24 3c-7.732 0-14.41 4.41-17.694 10.691z"/><path fill="#FBBC05" d="M24 43c5.795 0 10.654-1.917 14.205-5.205l-6.567-5.383C29.617 34.93 27.01 36 24 36c-6.045 0-10.89-3.958-11.303-9H6.306C8.59 38.59 15.268 43 24 43z"/><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-1.13 3.042-4.045 5.042-7.303 5.042-3.255 0-6.045-2.125-7.303-5.042H6.306C8.59 38.59 15.268 43 24 43c5.795 0 10.654-1.917 14.205-5.205l-6.567-5.383C29.617 34.93 27.01 36 24 36c-6.045 0-10.89-3.958-11.303-9H6.306C8.59 38.59 15.268 43 24 43z"/></g></svg>
                  )}
                  {selectedSession.platform?.toLowerCase().includes('zoom') && (
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><g><rect width="48" height="48" rx="10" fill="#fff"/><path fill="#2196F3" d="M36.5 16.5v15c0 1.1-.9 2-2 2h-21c-1.1 0-2-.9-2-2v-15c0-1.1.9-2 2-2h21c1.1 0 2 .9 2 2zm-13.5 7.5l7.5 4.5v-9l-7.5 4.5z"/></g></svg>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Time:</span>
                <span className="text-gray-900">{format(selectedSession.start, 'PPpp')} - {format(selectedSession.end, 'PPpp')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-700 mt-1">Description:</span>
                <div className="text-gray-800 whitespace-pre-line">{selectedSession.description}</div>
              </div>
              {selectedSession.joinLink && isValidMeetingLink(selectedSession.joinLink) && (
                <div className="mt-4 animate-fadeInUp">
                  <a
                    href={selectedSession.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:scale-105 hover:animate-bounce transition-transform duration-200 animate-pulse-slow"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    Join Session
                  </a>
                </div>
              )}
              {!selectedSession.joinLink || !isValidMeetingLink(selectedSession.joinLink) ? (
                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded animate-fadeInUp">
                  {selectedSession.joinLink ? 'The join link does not appear to be a valid Zoom or Google Meet URL. Please check with the instructor.' : 'No join link provided for this session.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/* TODO: Integrate with real session data and join links */}
    </>
  );
}

// Add a module declaration for 'react-big-calendar' if needed
// declare module 'react-big-calendar'; 

// At the very end of the file, add:

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.3s ease; }
    .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.4,0,0.2,1); }
    .animate-fadeInUp { animation: fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1); }
    .animate-pulse { animation: pulse 1.5s infinite; }
    .animate-pulse-slow { animation: pulse 2.5s infinite; }
    .hover\:animate-bounce:hover { animation: bounce 0.6s; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  `;
  if (!document.head.querySelector('style[data-calendar-animations]')) {
    style.setAttribute('data-calendar-animations', 'true');
    document.head.appendChild(style);
  }
} 