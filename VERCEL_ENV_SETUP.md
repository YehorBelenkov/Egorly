# Vercel Environment Variables Setup

## Required Environment Variables for Production

You need to add these environment variables to your Vercel project:

### 1. Go to Vercel Dashboard
- Visit https://vercel.com/dashboard
- Select your Bariga project
- Go to Settings → Environment Variables

### 2. Add These Variables:

**For Square Payment Processing:**
```
SQUARE_ACCESS_TOKEN=EAAAl7iTOnWOK-EbPRQqxilvHfXbUQ5MpQpY2LEsqB9kN4VH9dF3I3EVfwXSVRzm
SQUARE_LOCATION_ID=L7HJEQHCKAM25
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-VeeaYnmIvbl7sdhdB7NJIw
NEXT_PUBLIC_SQUARE_LOCATION_ID=LN9YTFF904XHD
```

**For Google Maps (if needed):**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBoMITSlQUdCKO_s43drBt36TqXtJcWqas
```

**For Firebase Phone Auth Testing (optional):**
```
NEXT_PUBLIC_TEST_PHONE=+15551234567
NEXT_PUBLIC_TEST_CODE=123456
```

### 3. Environment Settings:
- Set each variable for: **Production**, **Preview**, and **Development**
- Make sure to check all three environments when adding each variable

### 4. Redeploy:
After adding the environment variables:
1. Go to Deployments tab
2. Click the three dots (...) on your latest deployment
3. Select "Redeploy"
4. Or push a new commit to trigger automatic deployment

## Important Notes:

- `SQUARE_ACCESS_TOKEN` is the server-side token (never expose this publicly)
- `NEXT_PUBLIC_*` variables are client-side and will be visible in the browser
- After adding variables, you MUST redeploy for changes to take effect

## Testing:
After setup, test the payment flow on your live site to ensure everything works.