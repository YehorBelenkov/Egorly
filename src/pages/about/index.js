import Head from 'next/head';
import Layout from '../../app/components/Layout';
import './index.css';

const About = () => {
  return (
    <Layout>
      {() => (
        <>
          <Head>
            <title>About Us - Egorly</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
          </Head>

          <div className='about-page-bg'>
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

          <div className='about_page_container'>
            <div className='about_content_wrapper'>
              <div className='company-branding'>
                <p className='brand-text'>
                  <span className='animated-brand'>Egorly</span>
                </p>
              </div>

              {/* Hero Section */}
              <div className='about_hero'>
                <h1 className='about_h1'>Our Story</h1>
                <p className='about_tagline'>Stream. Engage. Win. Shop.</p>
              </div>

              {/* Main Content */}
              <div className='about_sections'>
                {/* Who We Are */}
                <div className='about_section'>
                  <div className='section_icon'>🎮</div>
                  <h2 className='section_title'>Who We Are</h2>
                  <p className='section_text'>
                    Egorly is your entertainment destination where streaming meets rewards! I'm a passionate TikTok streamer who loves 
                    connecting with my community through gaming, fun challenges, and engaging content. But here's what makes us special – 
                    being part of our community means more than just watching streams. Our most active followers get rewarded with amazing 
                    prizes and exclusive products!
                  </p>
                </div>

                {/* How It Works */}
                <div className='about_section'>
                  <div className='section_icon'>🎁</div>
                  <h2 className='section_title'>How It Works</h2>
                  <p className='section_text'>
                    Join me on TikTok for live streams where we play games, have fun, and build an amazing community together. When I hit 
                    stream goals, I select the most active and engaged viewers to win exciting prizes! Plus, our shop offers exclusive 
                    products that anyone can purchase. Whether you're here for the entertainment, the giveaways, or the products – there's 
                    something for everyone at Egorly.
                  </p>
                </div>

                {/* Our Commitment */}
                <div className='about_section'>
                  <div className='section_icon'>✨</div>
                  <h2 className='section_title'>Our Commitment</h2>
                  <p className='section_text'>
                    Quality entertainment and genuine engagement are at the heart of everything we do. I believe in rewarding loyalty and 
                    creating a fun, inclusive community where everyone feels valued. Every giveaway is fair, every product is carefully 
                    selected, and every stream is an opportunity to connect and have a great time together.
                  </p>
                </div>

                {/* What Makes Us Different */}
                <div className='about_section'>
                  <div className='section_icon'>🎯</div>
                  <h2 className='section_title'>What Makes Us Different</h2>
                  <div className='features_grid'>
                    <div className='feature_item'>
                      <div className='feature_icon'>�</div>
                      <h4>Live Entertainment</h4>
                      <p>Engaging TikTok streams with games and fun content</p>
                    </div>
                    <div className='feature_item'>
                      <div className='feature_icon'>🏆</div>
                      <h4>Exciting Giveaways</h4>
                      <p>Active viewers win amazing prizes when we hit goals</p>
                    </div>
                    <div className='feature_item'>
                      <div className='feature_icon'>🛍️</div>
                      <h4>Exclusive Shop</h4>
                      <p>Quality products available for everyone</p>
                    </div>
                    <div className='feature_item'>
                      <div className='feature_icon'>💬</div>
                      <h4>Real Community</h4>
                      <p>Genuine connections and engaged followers</p>
                    </div>
                  </div>
                </div>

                {/* Our Values */}
                <div className='about_section'>
                  <div className='section_icon'>💚</div>
                  <h2 className='section_title'>Our Values</h2>
                  <div className='values_list'>
                    <div className='value_item'>
                      <span className='value_bullet'>•</span>
                      <div>
                        <strong>Authentic Engagement:</strong> Real connections with our community, no bots or fake followers
                      </div>
                    </div>
                    <div className='value_item'>
                      <span className='value_bullet'>•</span>
                      <div>
                        <strong>Fair Giveaways:</strong> Transparent selection process for active and engaged viewers
                      </div>
                    </div>
                    <div className='value_item'>
                      <span className='value_bullet'>•</span>
                      <div>
                        <strong>Quality Products:</strong> We only offer products we believe in and stand behind
                      </div>
                    </div>
                    <div className='value_item'>
                      <span className='value_bullet'>•</span>
                      <div>
                        <strong>Fun First:</strong> Entertainment and enjoyment are always our top priority
                      </div>
                    </div>
                  </div>
                </div>

                {/* Join Us */}
                <div className='about_section cta_section'>
                  <h2 className='section_title'>Join the Egorly Community</h2>
                  <p className='section_text'>
                    Whether you're here to catch the latest streams, participate in giveaways, or shop our exclusive products, 
                    we're excited to have you! Follow us on TikTok, engage with our content, and become part of our growing family.
                  </p>
                  <div className='cta_buttons'>
                    <a href='/' className='cta_button primary'>Shop Now</a>
                    <a href='/contact' className='cta_button secondary'>Contact Us</a>
                  </div>
                </div>
              </div>

              {/* Privacy Policy Link */}
              <div className='privacy_link_section'>
                <a href='/privacy-policy' className='privacy_link'>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default About;
