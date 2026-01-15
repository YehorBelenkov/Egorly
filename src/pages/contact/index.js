import { useState } from 'react';
import Head from 'next/head';
import Layout from '../../app/components/Layout';
import './index.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [hasBusinessName, setHasBusinessName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.message) {
      setToast({ type: 'error', message: 'Please fill in all required fields.' });
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setToast({ type: 'error', message: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-contact-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hasBusinessName
        }),
      });

      const result = await response.json();

      if (result.success) {
        setToast({ type: 'success', message: 'Message sent successfully! We\'ll get back to you soon.' });
        // Reset form
        setFormData({
          fullName: '',
          businessName: '',
          email: '',
          phone: '',
          message: ''
        });
        setHasBusinessName(false);
      } else {
        setToast({ type: 'error', message: 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setToast({ type: 'error', message: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {() => (
        <>
          <Head>
            <title>Contact Us - Egorly</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
          </Head>

          <div className='contact-page-bg'>
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

          <div className='contact_page_container'>
            <div className='contact_form_wrapper'>
              <div className='company-branding'>
                <p className='brand-text'>
                  <span className='animated-brand'>Egorly</span>
                </p>
              </div>

              <div className='contact_header'>
                <h2 className='contact_h2'>Get In Touch</h2>
                <p className='contact_subtitle'>We'd love to hear from you! Whether you have questions about our products, wholesale opportunities, or just want to say hello.</p>
              </div>

              <form onSubmit={handleSubmit} className='contact_form'>
                {/* Business Toggle */}
                <div className='business_toggle_container'>
                  <label className='toggle_label'>
                    <input
                      type="checkbox"
                      checked={hasBusinessName}
                      onChange={(e) => setHasBusinessName(e.target.checked)}
                      className='toggle_checkbox'
                    />
                    <span className='toggle_switch'></span>
                    <span className='toggle_text'>I represent a business</span>
                  </label>
                </div>

                {/* Form Fields */}
                <div className='form_row'>
                  <label className='contact_input_con'>
                    Full Name *
                    <input
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </label>

                  {hasBusinessName && (
                    <label className='contact_input_con'>
                      Business Name
                      <input
                        type="text"
                        name="businessName"
                        placeholder="Your Company LLC"
                        value={formData.businessName}
                        onChange={handleInputChange}
                      />
                    </label>
                  )}
                </div>

                <div className='form_row'>
                  <label className='contact_input_con'>
                    Email Address *
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </label>

                  <label className='contact_input_con'>
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 555 123 4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                <label className='contact_input_con'>
                  Message *
                  <textarea
                    name="message"
                    placeholder="Tell us about your inquiry, wholesale needs, or any questions you have..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                  />
                </label>

                <button 
                  type="submit" 
                  className='contact_submit_btn'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn_spinner"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className='contact_info_section'>
                <div className='contact_info_item'>
                  <div className='info_icon'>📧</div>
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:contact@barigasnacks.com">contact@barigasnacks.com</a>
                  </div>
                </div>

                <div className='contact_info_item'>
                  <div className='info_icon'>💬</div>
                  <div>
                    <h4>Telegram</h4>
                    <a href="https://t.me/BarigaSnacks" target="_blank" rel="noopener noreferrer">@BarigaSnacks</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className={`contact_toast ${toast.type === 'success' ? 'toast_success' : 'toast_error'}`}>
              <div className="toast_icon">
                {toast.type === 'success' ? '✓' : '!'}
              </div>
              <span>{toast.message}</span>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Contact;
