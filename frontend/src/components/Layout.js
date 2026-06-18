import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './layout.css';

export default function Layout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAuth = ['/', '/register', '/verify-email'].includes(location.pathname);

  return (
    <div className={isDashboard ? 'appShell dashboardShell' : 'appShell'}>
      {!isDashboard && !isAuth && (
        <header className="topbar">
          <div className="brand">
            <img
              className="brandMark"
              src="/assets/omega-tracker-logo.png"
              alt=""
              aria-hidden="true"
            />
            <span className="brandText">Omega Tracker</span>
          </div>
          <ThemeToggle />
        </header>
      )}

      <main className={isDashboard ? 'main dashboardMain' : 'main'}>
        <Outlet />
      </main>
    </div>
  );
}
