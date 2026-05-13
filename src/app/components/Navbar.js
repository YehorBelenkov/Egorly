import Link from "next/link";
import { useState } from 'react';
import "./navbar.css";
import "../globals.css";

const Navbar = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* Desktop navbar */}
      <div className="navbar_body_container">
        <div className="navbar_brand">
          <Link href="/">
            <div className="navbar_brand_wrapper">
              <span className="navbar_animated_brand">Egorly</span>
            </div>
          </Link>
        </div>

        <div className="navbar_center">
          <Link className="nav_link" href={"/"}>Home</Link>
          <Link className="nav_link" href={"/"}>Products</Link>
          <Link className="nav_link" href={"/about"}>About</Link>
          <Link className="nav_link" href={"/winners"}>Winners</Link>
          <Link className="nav_link" href={"/contact"}>Contact</Link>
          <Link className="nav_link" href={"/profile"}>Profile</Link>
        </div>

        <div className="navbar_actions">
          <Link className="nav_cart" href="/cart">
            <svg className="cart_icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          
          {user ? (
            <Link className="nav_profile" href="/profile">
              <svg className="profile_icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Link>
          ) : (
            <>
              <Link className="nav_btn_secondary" href="/login">Sign In</Link>
              <Link className="nav_btn_primary" href="/register">Get Started</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile navbar */}
      <div className="mobile_navbar">
        <div className="mobile_brand">
          <Link href="/">
            <img className="mobile_logo" src="/images/bariga_logo.png" alt="Logo" />
          </Link>
        </div>
        <div className="mobile_actions">
          <Link className="mobile_cart" href="/cart">
            <svg className="cart_icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((s) => !s)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {open && <div className="mobile_overlay" onClick={closeMenu}></div>}
      
      <nav className={`mobile_menu ${open ? 'open' : ''}`}>
        <div className="mobile_menu_header">
          <div className="mobile_brand_wrapper">
            <span className="mobile_animated_brand">Egorly</span>
          </div>
        </div>
        
        <div className="mobile_menu_links">
          <Link className="mobile_nav_link" href={"/"} onClick={closeMenu}>
            <span className="link_icon">🏠</span>
            <span>Home</span>
          </Link>
          <Link className="mobile_nav_link" href={"/"} onClick={closeMenu}>
            <span className="link_icon">🛍️</span>
            <span>Products</span>
          </Link>
          <Link className="mobile_nav_link" href={"/about"} onClick={closeMenu}>
            <span className="link_icon">ℹ️</span>
            <span>About Us</span>
          </Link>
          <Link className="mobile_nav_link" href={"/winners"} onClick={closeMenu}>
            <span className="link_icon">🏆</span>
            <span>Winners</span>
          </Link>
          <Link className="mobile_nav_link" href={"/contact"} onClick={closeMenu}>
            <span className="link_icon">✉️</span>
            <span>Contact</span>
          </Link>
          
          {user ? (
            <Link className="mobile_nav_link" href="/profile" onClick={closeMenu}>
              <span className="link_icon">👤</span>
              <span>My Profile</span>
            </Link>
          ) : (
            <div className="mobile_auth_buttons">
              <Link className="mobile_btn_secondary" href="/login" onClick={closeMenu}>Sign In</Link>
              <Link className="mobile_btn_primary" href="/register" onClick={closeMenu}>Get Started</Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;