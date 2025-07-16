import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="breadcrumb" style={{ margin: '0 0 2px 0' }}>
      <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0 }}>
        <li>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          return (
            <li key={to} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ margin: '0 8px' }}>/</span>
              {isLast ? (
                <span style={{ color: '#888' }}>{decodeURIComponent(value)}</span>
              ) : (
                <Link to={to} style={{ color: '#2563eb', textDecoration: 'none' }}>{decodeURIComponent(value)}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}; 