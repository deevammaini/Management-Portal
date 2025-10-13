# YellowStone Management System - Frontend

## Deployment to Netlify

### Prerequisites
- Netlify account
- Your backend API deployed and accessible

### Deployment Steps

#### Method 1: Drag and Drop (Easiest)
1. Run `npm run build` to create the production build
2. Go to [netlify.com](https://netlify.com) and log in
3. Drag the `build` folder to the Netlify dashboard
4. Your site will be deployed automatically

#### Method 2: Git Integration (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Deploy

### Environment Variables
Set these in Netlify dashboard under Site Settings > Environment Variables:

```
REACT_APP_API_URL=https://your-backend-domain.com
```

Replace `https://your-backend-domain.com` with your actual backend URL.

### Important Notes
- Make sure your backend supports CORS for your Netlify domain
- Update your Flask backend CORS settings to include your Netlify domain
- The `_redirects` file handles client-side routing
- The `netlify.toml` file provides additional configuration

### Troubleshooting
- If you get CORS errors, update your backend CORS settings
- If routing doesn't work, check that `_redirects` file is in the build folder
- Check Netlify build logs for any errors
