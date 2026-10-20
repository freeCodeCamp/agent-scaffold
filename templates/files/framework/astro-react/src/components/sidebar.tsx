import './sidebar.css';
import { useSidebarOpen } from '../hooks/use-sidebar-open';
import type { ReactNode } from 'react';

type SidebarProps = {
  children: ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  const open = useSidebarOpen();

  return (
    <div className={open ? 'sidebar' : 'sidebar closed'}>
      <div className="sidebar-inner">{children}</div>
    </div>
  );
}
