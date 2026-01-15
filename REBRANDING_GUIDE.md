# Quick Rebranding Guide - Bariga to EcobyD

## 🎯 Search & Replace Commands

Use VS Code's search and replace feature (Ctrl+Shift+H) to make these changes:

### 1. Brand Name Changes

| Find | Replace With |
|------|--------------|
| `Bariga Snacks` | `EcobyD Store` |
| `Bariga` | `EcobyD` |
| `barigasnacks.com` | `ecobyd.com` (or your domain) |
| `@BarigaSnacks` | `@EcobyD` (or your social handle) |

### 2. Contact Information

| Find | Replace With |
|------|--------------|
| `contact@barigasnacks.com` | `contact@ecobyd.com` |
| `https://t.me/BarigaSnacks` | Your Telegram link |

### 3. Product Descriptions

Search for:
- "dried calamari"
- "seafood snacks"  
- "fish snacks"

Replace with your product types (e.g., "eco-friendly products", "sustainable goods", etc.)

### 4. Color Scheme Updates

Find and replace these color codes in all CSS files:

**Current Bariga Colors:**
- Primary Blue: `#0059AA` → Your primary color
- Secondary Blue: `#003d7a` → Your secondary color
- Accent Red: `#F23353` → Your accent color
- Success Green: `#20C997` → Keep or change
- Text Gray: `#6c757d` → Keep or change

**Where to find colors:**
- `/src/app/components/navbar.css`
- `/src/app/components/footer.css`
- `/src/app/globals.css`
- `/src/pages/index.css`
- `/src/pages/about/index.css`
- `/src/pages/contact/index.css`

### 5. Image Assets to Replace

📁 `/public/images/` - Replace these files:
- `bariga_logo.png` → Your EcobyD logo
- `welcomebackground_img.png` → Your hero background
- Product images
- Social media icons (if custom)

**Keep the file names the same** or update the references in the code.

### 6. Meta Information

Update in relevant pages:
- Page titles: Search for `<title>` tags
- Meta descriptions: Search for `name="description"`
- Open Graph data (for social media sharing)

### 7. Firebase Project

Don't forget to:
- Create a new Firebase project for EcobyD (or use existing)
- Update `/src/lib/firebaseConfig.js` with new credentials
- Update Firestore security rules if needed
- Create new Firebase Storage bucket for products

### 8. Square Payment

- Create Square account for EcobyD (or use existing)
- Update Square credentials in `.env.local`
- Test payment flow thoroughly

## 🚀 Quick VS Code Find & Replace

1. Press `Ctrl+Shift+H` (Windows) or `Cmd+Shift+H` (Mac)
2. Make sure "Match Case" is OFF for better results
3. Click "Replace All" for each search term
4. Review changes before committing

## ⚠️ Important Files to Manually Review

After automated replacements, manually check:

1. **About Page** (`/src/pages/about/index.js`)
   - Update company story
   - Change values and mission

2. **Privacy Policy** (`/src/pages/privacy-policy/index.js`)
   - Update company name
   - Update contact information
   - Review third-party services listed

3. **Footer** (`/src/app/components/Footer.js`)
   - Update company description
   - Update social links
   - Update copyright year if needed

4. **Contact Page** (`/src/pages/contact/index.js`)
   - Update contact form destination
   - Update contact information

5. **Package.json**
   - Update "name" field
   - Update "description"

## 📝 Content Writing Tips

When updating content for EcobyD:
- Keep the tone consistent with your brand
- Update product descriptions to match your offerings
- Revise the "About Us" story completely
- Make sure all contact info is accurate
- Review shipping and return policies
- Update FAQ if present

## 🎨 Design Customization Tips

For a cohesive EcobyD brand:
1. Choose 2-3 primary colors
2. Pick complementary fonts (update in CSS)
3. Maintain consistent spacing/padding
4. Keep animations subtle and professional
5. Ensure mobile responsiveness
6. Test on multiple browsers

## ✅ Testing Checklist After Rebranding

- [ ] All pages load without errors
- [ ] Logo displays correctly
- [ ] Colors are updated throughout
- [ ] Contact forms work
- [ ] Shopping cart functions properly
- [ ] Checkout process completes
- [ ] Payment integration works
- [ ] User authentication works
- [ ] Admin panel is accessible
- [ ] Mobile version looks good
- [ ] All links are updated
- [ ] Email notifications have correct branding

---

💡 **Pro Tip**: Make incremental changes and test frequently to catch issues early!
