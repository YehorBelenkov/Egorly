import Head from 'next/head';
import Layout from '../../app/components/Layout';
import './privacy.css';

const PrivacyPolicy = () => {
  return (
    <Layout>
      {() => (
        <>
          <Head>
            <title>Privacy Policy - Egorly</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
          </Head>

          <div className='privacy-page-bg'>
            {/* Animated Background Circles */}
            <div className="area">
              <ul className="circles">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
              </ul>
            </div>
          </div>

          <div className='privacy_page_container'>
            <div className='privacy_content_wrapper'>
              <div className='company-branding'>
                <p className='brand-text'>
                  <span className='animated-brand'>Egorly</span>
                </p>
              </div>

              {/* Header */}
              <div className='privacy_header'>
                <div className='privacy_icon'>🔒</div>
                <h1 className='privacy_h1'>Privacy Policy</h1>
                <p className='privacy_date'>Last Updated: December 3, 2025</p>
              </div>

              {/* Introduction */}
              <div className='privacy_section'>
                <p className='privacy_intro'>
                  At Egorly, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                  protect, and share your personal information when you use our website, participate in our TikTok streams, 
                  enter giveaways, or make purchases. By using our services, you agree to the collection and use of information 
                  in accordance with this policy.
                </p>
              </div>

              {/* Sections */}
              <div className='privacy_sections'>
                {/* Information We Collect */}
                <div className='policy_section'>
                  <h2 className='policy_title'>1. Information We Collect</h2>
                  
                  <h3 className='policy_subtitle'>Personal Information</h3>
                  <p className='policy_text'>
                    When you register, make a purchase, participate in giveaways, or contact us, we may collect:
                  </p>
                  <ul className='policy_list'>
                    <li>Name and email address</li>
                    <li>TikTok username and profile information (for giveaway eligibility)</li>
                    <li>Shipping and billing addresses</li>
                    <li>Payment information (processed securely through Square)</li>
                    <li>Account credentials (encrypted passwords)</li>
                    <li>Stream engagement data and activity</li>
                  </ul>

                  <h3 className='policy_subtitle'>Automatically Collected Information</h3>
                  <ul className='policy_list'>
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Cookies and usage data</li>
                    <li>Pages visited and time spent on our site</li>
                  </ul>
                </div>

                {/* How We Use Your Information */}
                <div className='policy_section'>
                  <h2 className='policy_title'>2. How We Use Your Information</h2>
                  <p className='policy_text'>We use your information to:</p>
                  <ul className='policy_list'>
                    <li><strong>Process Orders:</strong> Complete purchases and arrange shipping</li>
                    <li><strong>Manage Giveaways:</strong> Track engagement, select winners, and distribute prizes</li>
                    <li><strong>Communicate:</strong> Send order confirmations, shipping updates, winner notifications, and respond to inquiries</li>
                    <li><strong>Improve Services:</strong> Analyze usage patterns and stream engagement to enhance user experience</li>
                    <li><strong>Security:</strong> Prevent fraud, ensure fair giveaways, and protect our users</li>
                    <li><strong>Marketing:</strong> Send promotional emails about streams and products (with your consent, you can opt-out anytime)</li>
                    <li><strong>Legal Compliance:</strong> Meet legal obligations and resolve disputes</li>
                  </ul>
                </div>

                {/* Data Storage and Security */}
                <div className='policy_section'>
                  <h2 className='policy_title'>3. Data Storage and Security</h2>
                  <p className='policy_text'>
                    Your data is stored securely using industry-standard practices:
                  </p>
                  <ul className='policy_list'>
                    <li><strong>Firebase/Firestore:</strong> User accounts, orders, and cart data</li>
                    <li><strong>Encryption:</strong> All sensitive data is encrypted at rest and in transit</li>
                    <li><strong>Password Security:</strong> Passwords are hashed using bcrypt</li>
                    <li><strong>SSL/TLS:</strong> All connections use secure HTTPS protocol</li>
                    <li><strong>Payment Security:</strong> Payment processing handled by Square (PCI DSS compliant)</li>
                    <li><strong>Access Control:</strong> Limited employee access to personal data</li>
                  </ul>
                </div>

                {/* How We Share Your Information */}
                <div className='policy_section'>
                  <h2 className='policy_title'>4. How We Share Your Information</h2>
                  <p className='policy_text'>
                    We do not sell your personal information. We may share data with:
                  </p>
                  <ul className='policy_list'>
                    <li><strong>Service Providers:</strong> Square (payments), Easyship (shipping), email services</li>
                    <li><strong>Shipping Carriers:</strong> To deliver your orders</li>
                    <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
                  </ul>
                </div>

                {/* Your Rights */}
                <div className='policy_section'>
                  <h2 className='policy_title'>5. Your Rights and Choices</h2>
                  <p className='policy_text'>You have the right to:</p>
                  <ul className='policy_list'>
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                    <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
                    <li><strong>Withdraw Consent:</strong> Revoke consent for data processing</li>
                  </ul>
                  <p className='policy_text'>
                    To exercise these rights, contact us at <a href="mailto:contact@barigasnacks.com">contact@barigasnacks.com</a>
                  </p>
                </div>

                {/* Cookies */}
                <div className='policy_section'>
                  <h2 className='policy_title'>6. Cookies and Tracking</h2>
                  <p className='policy_text'>
                    We use cookies to improve your experience and analyze site usage. Types of cookies we use:
                  </p>
                  <ul className='policy_list'>
                    <li><strong>Essential Cookies:</strong> Required for site functionality</li>
                    <li><strong>Authentication:</strong> Keep you logged in</li>
                    <li><strong>Analytics:</strong> Understand how visitors use our site</li>
                    <li><strong>Preferences:</strong> Remember your settings and choices</li>
                  </ul>
                  <p className='policy_text'>
                    You can control cookies through your browser settings, though this may affect site functionality.
                  </p>
                </div>

                {/* Third-Party Services */}
                <div className='policy_section'>
                  <h2 className='policy_title'>7. Third-Party Services</h2>
                  <p className='policy_text'>
                    We use the following third-party services, each with their own privacy policies:
                  </p>
                  <ul className='policy_list'>
                    <li><strong>Firebase/Google:</strong> Authentication and database hosting</li>
                    <li><strong>Square:</strong> Payment processing</li>
                    <li><strong>Easyship:</strong> Shipping rate calculations</li>
                    <li><strong>Google Maps:</strong> Address autocomplete</li>
                    <li><strong>Telegram:</strong> Order notifications (internal use only)</li>
                  </ul>
                </div>

                {/* Children's Privacy */}
                <div className='policy_section'>
                  <h2 className='policy_title'>8. Children's Privacy</h2>
                  <p className='policy_text'>
                    Our services are not intended for children under 13. We do not knowingly collect personal 
                    information from children. If you believe we have collected data from a child, please contact 
                    us immediately.
                  </p>
                </div>

                {/* Data Retention */}
                <div className='policy_section'>
                  <h2 className='policy_title'>9. Data Retention</h2>
                  <p className='policy_text'>
                    We retain your personal information for as long as necessary to:
                  </p>
                  <ul className='policy_list'>
                    <li>Provide our services and maintain your account</li>
                    <li>Comply with legal obligations (tax records, receipts)</li>
                    <li>Resolve disputes and enforce agreements</li>
                    <li>Prevent fraud and abuse</li>
                  </ul>
                  <p className='policy_text'>
                    After account deletion, we may retain certain data for legal compliance purposes.
                  </p>
                </div>

                {/* Changes to Privacy Policy */}
                <div className='policy_section'>
                  <h2 className='policy_title'>10. Changes to This Policy</h2>
                  <p className='policy_text'>
                    We may update this Privacy Policy from time to time. Changes will be posted on this page with 
                    an updated "Last Updated" date. We encourage you to review this policy periodically. Continued 
                    use of our services after changes constitutes acceptance of the updated policy.
                  </p>
                </div>

                {/* Contact Information */}
                <div className='policy_section contact_section'>
                  <h2 className='policy_title'>11. Contact Us</h2>
                  <p className='policy_text'>
                    If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className='contact_details'>
                    <div className='contact_item'>
                      <strong>Email:</strong> <a href="mailto:contact@barigasnacks.com">contact@barigasnacks.com</a>
                    </div>
                    <div className='contact_item'>
                      <strong>Phone:</strong> <a href="tel:+17738922843">+1 773-892-2843</a>
                    </div>
                    <div className='contact_item'>
                      <strong>Telegram:</strong> <a href="https://t.me/BarigaSnacks" target="_blank" rel="noopener noreferrer">@BarigaSnacks</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Navigation */}
              <div className='privacy_footer'>
                <a href='/about' className='footer_link'>About Us</a>
                <span className='footer_divider'>•</span>
                <a href='/contact' className='footer_link'>Contact</a>
                <span className='footer_divider'>•</span>
                <a href='/' className='footer_link'>Shop</a>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default PrivacyPolicy;
