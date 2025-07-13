import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';
import { Outlet } from 'react-router-dom';

export default function InstructorLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole="instructor" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userRole="instructor" />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 