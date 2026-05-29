import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function SidebarLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
