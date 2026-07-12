'use client';
import { useState } from 'react';

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header>
      <div className="nav">
        <div className="brand">
          <div className="brand-mark">
            <svg width="26" height="26" viewBox="0 0 100 100"><circle cx="50" cy="40" r="18" fill="#F5B400"/><polygon points="10,58 90,58 50,92" fill="#fff"/></svg>
          </div>
          <div className="brand-name">RISE AND SHINE<span>Nursery &amp; Primary School</span></div>
        </div>
        <nav className={open ? 'nav-links open' : 'nav-links'}>
          <ul>
            <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
            <li><a href="#branches" onClick={() => setOpen(false)}>Our Branches</a></li>
            <li><a href="#academics" onClick={() => setOpen(false)}>Academics</a></li>
            <li><a href="#admissions" onClick={() => setOpen(false)}>Admissions</a></li>
            <li><a href="#gallery" onClick={() => setOpen(false)}>Gallery</a></li>
            <li><a href="#contact" onClick={() => setOpen(false)}>Contact</a></li>
            <li className="mobile-only"><a href="/portal/login">Staff &amp; Proprietor Portal</a></li>
          </ul>
        </nav>
        <div className="nav-actions">
          <a className="portal-link" href="/portal/login">Staff &amp; Proprietor Portal</a>
          <button className="menu-toggle" aria-label="Menu" onClick={() => setOpen((v) => !v)}>&#9776;</button>
        </div>
      </div>
    </header>
  );
}
