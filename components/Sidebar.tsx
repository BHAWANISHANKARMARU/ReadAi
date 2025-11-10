'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { File, Globe, Window, Chart, Settings, User } from './icons';

const Sidebar = () => {
  const pathname = usePathname();

  const linkClasses = (path: string) => {
    const isActive = pathname === path;
    return `nav-link d-flex align-items-center rounded-3 ${isActive ? 'active bg-warning text-dark' : 'text-light'}`;
  };

  return (
    <div className="d-flex flex-column justify-content-between sidebar p-4" style={{ width: 260 }}>
      <div>
        <div className="d-flex align-items-center mb-4 mt-2">
          <Globe className="text-primary-app" />
          <h1 className="fs-3 fw-bold ms-3 m-0">Read.ai</h1>
        </div>
        <nav>
          <ul className="nav nav-pills flex-column mb-3 gap-2">
            <li className="nav-item">
              <Link href="/dashboard" className={linkClasses('/dashboard')}>
                <Window className="me-3" />
                <span className="fw-medium">Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/meetings" className={linkClasses('/meetings')}>
                <Globe className="me-3" />
                <span className="fw-medium">Meetings</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/notes" className={linkClasses('/notes')}>
                <File className="me-3" />
                <span className="fw-medium">Notes</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/reports" className={linkClasses('/reports')}>
                <Chart className="me-3" />
                <span className="fw-medium">Reports</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/integrations" className={linkClasses('/integrations')}>
                <Window className="me-3" />
                <span className="fw-medium">Integrations</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="pt-3 border-top divider">
        <Link href="/settings" className={linkClasses('/settings')}>
          <Settings className="me-3" />
          <span className="fw-medium">Settings</span>
        </Link>
        <div className="d-flex align-items-center mt-3 p-3 rounded card-app">
          <User className="text-app" />
          <div className="ms-3">
            <p className="mb-0 small fw-semibold">Bhawani</p>
            <p className="mb-0 small text-secondary">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
