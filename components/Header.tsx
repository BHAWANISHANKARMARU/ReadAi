'use client';

import { useSearch } from '@/app/context/SearchContext';
import { Bell, User, Search } from 'lucide-react';

const Header = ({ title }: { title: string }) => {
  const { setSearchQuery } = useSearch();

  return (
    <header className="p-3 d-flex justify-content-between align-items-center border-bottom border-app">
      <h1 className="display-5 fw-bold text-primary-app m-0">{title}</h1>
      <div className="d-flex align-items-center gap-3">
        <div className="position-relative">
          <Search className="position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="form-control input-app ps-5"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Bell className="text-app" />
        <img src="/user-avatar.png" alt="User Avatar" className="rounded-circle" style={{ width: 32, height: 32 }} />
      </div>
    </header>
  );
};

export default Header;
