import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function Breadcrumb({ showHome = false, showHereAlso = false }) {
  const location = useLocation();
  const parts = (location.pathname || '/').split('/').filter(Boolean);

  // map segment -> display label
  const label = (seg) => {
    if (!seg) return 'Home';
    return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // build cumulative paths — skip explicit role segments (admin/owner/user)
  const items = [];
  const skipSegs = new Set(['admin', 'owner', 'user']);
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    // skip explicit role path segments so breadcrumb stays concise
    if (seg !== 'dashboard' && skipSegs.has(seg.toLowerCase())) continue;

    // special-case the top-level 'dashboard' segment: map to the current user's dashboard route
    let to = '/' + parts.slice(0, i + 1).join('/');
    if (seg === 'dashboard') {
      const user = authService.getCurrentUser();
      const role = (user?.role || 'user').toString().toLowerCase();
      // map role to expected path segment (owner/admin/user)
      const roleSegment = role.includes('owner') ? 'owner' : role.includes('admin') ? 'admin' : 'user';
      // For regular users we keep the canonical '/dashboard' route.
      to = roleSegment === 'user' ? '/dashboard' : `/dashboard/${roleSegment}`;
    }
    items.push({ seg, to, active: i === parts.length - 1 });
  }

  if (!showHome && items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex items-center text-sm sm:text-base text-gray-500 gap-2">
        {showHome && (
          <React.Fragment key="home">
            <li>
              <Link to="/" className="hover:underline text-sm sm:text-base">Home</Link>
            </li>
            {items.length > 0 && <li className="text-gray-300">/</li>}
          </React.Fragment>
        )}

        {items.map((it, idx) => (
          <React.Fragment key={`${it.to}-${idx}`}>
            {idx > 0 && <li className="text-gray-300">/</li>}
            <li>
              {it.active ? (
                <span className="text-gray-700 font-semibold text-sm sm:text-base">{label(it.seg)}</span>
              ) : (
                <Link to={it.to} className="hover:underline text-sm sm:text-base">{label(it.seg)}</Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
      {showHereAlso && (
        <div className="ml-3 text-sm text-blue-600">
          <Link to={`${location.pathname}${location.search}`} className="hover:underline">Here also</Link>
        </div>
      )}
    </nav>
  );
}
