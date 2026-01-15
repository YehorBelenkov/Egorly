# EcobyD Store - Setup Guide

## ✅ What Was Done

All files from your Bariga repository have been successfully copied to this EcobyD project!

## 📋 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual values:
- Firebase credentials
- Square payment credentials  
- Google Maps API key

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at http://localhost:3000

## 🎨 Customizing for EcobyD

Now you can start restyling the website for your new store:

### Brand Changes:
1. **Update Logo**: Replace files in `/public/images/` with your EcobyD logo
2. **Change Brand Name**: Search and replace "Bariga Snacks" with "EcobyD" across the project
3. **Update Colors**: Modify the color scheme in CSS files:
   - Primary color: Currently `#0059AA` (blue)
   - Accent color: Currently `#F23353` (red)
   - Look for these in navbar.css, footer.css, globals.css, and component styles

### Design Updates:
4. **Navbar**: Edit `/src/app/components/Navbar.js` and `navbar.css`
5. **Footer**: Edit `/src/app/components/Footer.js` and `footer.css`
6. **Homepage**: Edit `/src/pages/index.js` and `index.css`
7. **About Page**: Edit `/src/pages/about/index.js` - update company story
8. **Contact Page**: Edit `/src/pages/contact/index.js` - update contact info

### Product Changes:
9. **Product Images**: Add your products to Firebase Storage
10. **Product Categories**: Modify as needed for your product types

## 🔧 Key Files to Customize

- `/src/app/globals.css` - Global styles
- `/src/pages/index.css` - Homepage styles
- `/src/app/components/` - All reusable components
- `/public/images/` - All images and assets

## 📦 Project Structure

```
EcobyD/
├── public/              # Static assets (images, icons)
├── src/
│   ├── app/
│   │   ├── components/  # Navbar, Footer, Layout
│   │   ├── adminComponents/ # Admin panel components
│   │   └── globals.css
│   ├── pages/           # All page routes
│   │   ├── index.js     # Homepage
│   │   ├── about/       # About page
│   │   ├── cart/        # Shopping cart
│   │   ├── checkout/    # Checkout page
│   │   ├── payment/     # Payment page
│   │   ├── profile/     # User profile
│   │   ├── login/       # Login page
│   │   ├── register/    # Registration
│   │   └── api/         # API routes
│   ├── lib/             # Utility functions
│   │   ├── firebaseConfig.js
│   │   └── guestUser.js
│   └── context/         # React context
├── .env.local          # Environment variables (create this)
├── package.json
└── next.config.mjs

```

## 🚀 Features Included

- ✅ Firebase Authentication (Email & Phone)
- ✅ Square Payment Integration
- ✅ Shopping Cart (Guest & Logged-in users)
- ✅ Product Management (Admin Panel)
- ✅ Order Management
- ✅ User Profiles with Order History
- ✅ Responsive Design
- ✅ Guest Checkout with Cart Migration
- ✅ Google Maps Address Autocomplete
- ✅ Shipping Rate Calculation

## 🎯 Quick Customization Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure environment variables
- [ ] Replace logo and brand images
- [ ] Update brand name throughout the site
- [ ] Change color scheme
- [ ] Update About Us content
- [ ] Update Contact information
- [ ] Add your products to Firebase
- [ ] Test the checkout flow
- [ ] Customize email templates (if any)
- [ ] Update privacy policy
- [ ] Configure Square payment for your account

## 📞 Support

If you need help with specific changes, just let me know what design elements you want to modify!

Happy coding! 🎨✨
