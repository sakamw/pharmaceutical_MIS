# Frontend Deployment Guide for Pharma MIS

## 🚀 Deployment Platforms Supported

This frontend supports deployment on multiple platforms with automatic SPA routing configuration.

### **📁 Deployment Configuration Files**

- **`public/_redirects`**: For Render, Netlify, and other platforms using Apache-style redirects
- **`vercel.json`**: For Vercel deployment with rewrites
- **`.env.production`**: Production environment variables

## 🏗️ Platform-Specific Setup

### **Render Deployment**
✅ **Already Configured**
- Uses `public/_redirects` file
- Build Command: `pnpm install && pnpm run build`
- Publish Directory: `dist`

### **Vercel Deployment**
✅ **Now Configured**
- Uses `vercel.json` rewrites
- Build Command: `pnpm install && pnpm run build`
- Output Directory: `dist`

### **Netlify Deployment**
✅ **Supported**
- Uses `public/_redirects` file
- Build Command: `pnpm install && pnpm run build`
- Publish Directory: `dist`

## 🔧 Manual Deployment Commands

```bash
# 1. Fix lockfile issues
cd client
pnpm install

# 2. Build for production
pnpm run build

# 3. Deploy dist/ folder to your hosting provider
```

## 🌐 Environment Variables

### **Development**
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### **Production**
```bash
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

## 🔄 SPA Routing

Both configuration files ensure that:
- All routes redirect to `index.html`
- React Router handles client-side navigation
- Direct URL access works (bookmarks, refresh, etc.)
- SEO-friendly URLs are maintained

## 🚨 Troubleshooting

### **404 on Routes**
If you still get 404s after deployment:

1. **Check Configuration Files**:
   - Ensure `_redirects` is in `public/` directory
   - Ensure `vercel.json` is in root directory

2. **Verify Build Output**:
   ```bash
   pnpm run build
   ls -la dist/
   # Should show index.html in root of dist/
   ```

3. **Platform-Specific Issues**:
   - **Render**: Check "Redirects" settings in dashboard
   - **Vercel**: Check "Functions" settings
   - **Netlify**: Check "_redirects" file location

### **Missing Assets**
- Ensure `public/` directory is copied to build output
- Check Vite configuration for asset handling
- Verify `dist/` contains all necessary files

## 📱 Testing Deployment

After deployment, test:
1. ✅ Root URL loads (`/`)
2. ✅ Navigation within app works
3. ✅ Direct URL access works (`/reports`, `/stock`, etc.)
4. ✅ Page refresh works on any route
5. ✅ Browser back/forward works

## 🔐 Security Headers

For production deployments, consider adding security headers:
- Content Security Policy (CSP)
- HTTPS redirect
- Frame options
- XSS protection

Your frontend is now configured for deployment on Render, Vercel, Netlify, and other major hosting platforms! 🎉
