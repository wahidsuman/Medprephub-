
# AI Website Manager Setup

## Required Environment Variables

Add these to your Vercel project settings or Replit Secrets:

### Telegram Integration
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_telegram_user_id
```

### GitHub Integration (for UI changes)
```
GITHUB_TOKEN=ghp_your_classic_personal_access_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO=your_repository_name
```

### OpenAI Integration
```
OPENAI_API_KEY=sk-your_openai_api_key
```

### Google APIs Integration
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
GA4_PROPERTY_ID=123456789
SITE_URL=https://your-domain.com
```

## GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and add it as `GITHUB_TOKEN`

## Telegram Bot Setup

1. Message @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Get your chat ID by messaging @userinfobot
5. Add both to environment variables

## Google APIs Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Search Console API
   - Google Analytics Data API

### 2. Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Create new service account
3. Download JSON key file
4. Copy entire JSON content to `GOOGLE_SERVICE_ACCOUNT_KEY` env var

### 3. Grant Access
1. **Search Console**: Add service account email to your Search Console property
2. **Analytics**: Add service account email to your GA4 property with Viewer role
3. Get your GA4 property ID from Analytics admin

### 4. Environment Variables
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GA4_PROPERTY_ID=123456789
SITE_URL=https://your-domain.com
```

## Features

### UI Changes
- Say "change ui" or "make it more attractive" in Telegram
- AI generates actual code changes
- Creates GitHub PR automatically
- Reply "YES [PR_NUMBER]" to approve and merge
- Reply "NO [PR_NUMBER]" to decline

### Content Generation
- Say "create post about [topic]" 
- AI generates SEO-optimized medical content
- Creates GitHub PR for review
- Content appears on site after merge

### Daily Automation
- Runs every day at 9 AM UTC
- Analyzes competitors and SEO data
- Sends proposals via Telegram
- Approve with simple YES/NO replies

## Commands

- `/ping` - Health check
- `/propose [topic]` - Generate content
- `change ui` - UI improvements  
- `create post about X` - Content generation
- `improve seo` - SEO optimization
- `YES [number]` - Approve PR
- `NO [number]` - Decline PR
