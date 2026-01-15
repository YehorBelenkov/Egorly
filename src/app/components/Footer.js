import Link from "next/link";
import './footer.css';

const Footer = () => {
  return (
    <>
    <div className="footer_container">
        <div className="footer_content">
            {/* Company Info Section */}
            <div className="footer_section">
                <h3 className="footer_section_title">Egorly</h3>
                <p className="footer_description">Your ultimate destination for entertainment and rewards! Join our TikTok streams, win amazing prizes, and shop exclusive products.</p>
                <div className="social_links">
                    <a href="https://www.tiktok.com/@egorly" target="_blank" rel="noopener noreferrer" className="social_link" title="TikTok">
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '24px', height: '24px'}}>
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </a>
                </div>
            </div>

            {/* Quick Links Section */}
            <div className="footer_section">
                <h3 className="footer_section_title">Quick Links</h3>
                <ul className="footer_links">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/#products">Products</Link></li>
                    <li><Link href="/about">About Us</Link></li>
                    <li><Link href="/contact">Contact Us</Link></li>
                    <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                </ul>
            </div>

            {/* Contact Section */}
            <div className="footer_section">
                <h3 className="footer_section_title">Get In Touch</h3>
                <div className="footer_contact_list">
                    <a href="mailto:yehorbelenkov@gmail.com" className="footer_contact_item">
                        <img className="contact_icon" src="/images/emailred.png" alt="Email"/>
                        <span>yehorbelenkov@gmail.com</span>
                    </a>
                    <a href="https://t.me/RegorBelenkov" target="_blank" rel="noopener noreferrer" className="footer_contact_item">
                        <img className="contact_icon" src="/images/telegramred.png" alt="Telegram"/>
                        <span>@RegorBelenkov</span>
                    </a>
                </div>
            </div>

            {/* Payment Methods Section */}
            <div className="footer_section">
                <h3 className="footer_section_title">We Accept</h3>
                <div className="payment_methods">
                    <div className="payment_icon" title="Credit/Debit Cards">
                        <svg viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>Card</span>
                    </div>
                    <div className="payment_icon" title="Google Pay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        <span>Google Pay</span>
                    </div>
                    <div className="payment_icon" title="Apple Pay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <span>Apple Pay</span>
                    </div>
                </div>
                <p className="payment_note">Secure payments powered by Square</p>
            </div>
        </div>
    </div>
    <div className="copyright_container">
        <div className="copyright_content">
            <p className="copy_rights_text">© 2024 Egorly. All rights reserved</p>
            <div className="footer_legal_links">
                <Link href="/privacy-policy">Privacy Policy</Link>
                <span>•</span>
                <Link href="/contact">Contact</Link>
            </div>
        </div>
    </div>
    </>
  );
};

export default Footer;