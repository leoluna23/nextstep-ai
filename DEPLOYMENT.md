# Deploying NextStep AI to DigitalOcean

This guide covers deploying your Next.js application to DigitalOcean App Platform.

## Prerequisites

1. A DigitalOcean account ([sign up here](https://www.digitalocean.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. MongoDB database (can use MongoDB Atlas or DigitalOcean Managed MongoDB)
4. API keys:
   - `GEMINI_API_KEY` - Google Gemini API key
   - `ELEVENLABS_API_KEY` - ElevenLabs API key (optional, for audio features)
   - MongoDB connection string

## Option 1: DigitalOcean App Platform (Recommended)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create a `.env.example` file** (for reference):
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   MONGODB_URI=mongodb://localhost:27017/nextstep-ai
   NODE_ENV=production
   ```

### Step 2: Set Up MongoDB Database

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Whitelist DigitalOcean IPs (or use 0.0.0.0/0 for App Platform)

**Option B: DigitalOcean Managed MongoDB**
1. In DigitalOcean dashboard, go to Databases
2. Create a MongoDB database
3. Note the connection string

### Step 3: Deploy via DigitalOcean App Platform

1. **Log in to DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Sign in or create an account

2. **Create a New App**
   - Click "Create" → "Apps"
   - Connect your GitHub/GitLab/Bitbucket repository
   - Select your `nextstep-ai` repository
   - Choose the branch (usually `main` or `master`)

3. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Environment**: `Node.js`
   - **Node Version**: `20.x` or `18.x`

4. **Add Environment Variables**
   Click "Edit" next to Environment Variables and add:
   ```
   GEMINI_API_KEY=your_actual_gemini_key
   GEMINI_MODEL=gemini-2.5-flash
   ELEVENLABS_API_KEY=your_actual_elevenlabs_key
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=production
   ```

5. **Configure Database Connection**
   - If using DigitalOcean Managed MongoDB, you can link it directly
   - Otherwise, use the `MONGODB_URI` environment variable

6. **Review and Launch**
   - Review your settings
   - Choose a plan (Basic plan starts at $5/month)
   - Click "Create Resources"

### Step 4: Post-Deployment

1. **Wait for Build**
   - The app will build and deploy automatically
   - This usually takes 5-10 minutes

2. **Test Your App**
   - Visit the provided URL (e.g., `https://your-app-name.ondigitalocean.app`)
   - Test login/signup
   - Test plan generation

3. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## Option 2: DigitalOcean Droplet (More Control)

### Step 1: Create a Droplet

1. In DigitalOcean, click "Create" → "Droplets"
2. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month minimum)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password

### Step 2: Set Up the Server

SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

Install Node.js and dependencies:
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install MongoDB (or use MongoDB Atlas)
# For local MongoDB:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

### Step 3: Deploy Your App

```bash
# Clone your repository
cd /var/www
git clone https://github.com/yourusername/nextstep-ai.git
cd nextstep-ai

# Install dependencies
npm install

# Create .env file
nano .env
# Add all your environment variables here

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "nextstep-ai" -- start
pm2 save
pm2 startup
```

### Step 4: Set Up Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/nextstep-ai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/nextstep-ai /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: Set Up SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

## Environment Variables Checklist

Make sure these are set in your deployment:

- ✅ `GEMINI_API_KEY` - Required for plan generation
- ✅ `GEMINI_MODEL` - Optional (defaults to gemini-2.5-flash)
- ✅ `ELEVENLABS_API_KEY` - Required for audio features
- ✅ `ELEVENLABS_VOICE_ID` - Optional (defaults to Rachel voice)
- ✅ `MONGODB_URI` - Required for database
- ✅ `NODE_ENV=production` - Set automatically on App Platform

## Troubleshooting

### Build Fails
- Check build logs in DigitalOcean dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB allows connections from DigitalOcean IPs
- For MongoDB Atlas, whitelist `0.0.0.0/0` or specific IPs
- **SSL/TLS Errors**: If you see `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`:
  - **Most Common Fix**: Ensure your MongoDB Atlas connection string uses `mongodb+srv://` format (not `mongodb://`)
  - Verify your MongoDB Atlas cluster is running and accessible
  - Check that your IP whitelist includes DigitalOcean's IP ranges (or use `0.0.0.0/0` for testing)
  - Ensure your MongoDB Atlas cluster has valid SSL certificates
  - Try regenerating your connection string from MongoDB Atlas dashboard
  - **Node.js Version**: DigitalOcean App Platform uses Node.js 22.x by default. If issues persist, try specifying Node.js 20.x in `package.json`:
    ```json
    "engines": {
      "node": "20.x"
    }
    ```
  - **Connection String Format**: Should look like:
    ```
    mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
    ```
  - **Verify Environment Variable**: In DigitalOcean dashboard, ensure `MONGODB_URI` is set correctly and doesn't have extra quotes or spaces

### API Errors
- Verify API keys are set correctly
- Check API quotas/limits
- Review error logs in DigitalOcean dashboard

## Cost Estimate

**App Platform (Recommended):**
- Basic Plan: $5/month
- MongoDB Atlas (Free tier available): $0/month
- Total: ~$5/month

**Droplet:**
- Basic Droplet: $6/month
- MongoDB (self-hosted or Atlas): $0-10/month
- Total: ~$6-16/month

## Next Steps

1. Set up monitoring and alerts
2. Configure backups for MongoDB
3. Set up CI/CD for automatic deployments
4. Add custom domain
5. Enable analytics

