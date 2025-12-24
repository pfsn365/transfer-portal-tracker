# 📤 Push to GitHub Instructions

## Quick Guide

Run these commands from the project directory:

```bash
# 1. Navigate to the project
cd /Users/frago/Desktop/CFB\ Portal\ Tracker/transfer-portal-tracker

# 2. Add all files to git
git add .

# 3. Create initial commit
git commit -m "Initial commit: CFB Transfer Portal Tracker with live API integration

- Auto-updating filters (Status, School, Class, Position, Conference)
- Live data from PFN Google Sheets API (hourly refresh)
- Official team logos and colors for 130+ FBS teams
- Responsive design (desktop table + mobile cards)
- Professional loading and error states
- TypeScript with full type safety
- Ready for production deployment"

# 4. Push to GitHub
git push origin main
```

## Detailed Step-by-Step

### Step 1: Check Your Current Status
```bash
cd /Users/frago/Desktop/CFB\ Portal\ Tracker/transfer-portal-tracker
git status
```

You should see all your untracked files listed.

### Step 2: Add All Files
```bash
git add .
```

This stages all files for commit.

### Step 3: Verify What Will Be Committed
```bash
git status
```

You should see files in green under "Changes to be committed".

### Step 4: Create the Commit
```bash
git commit -m "Initial commit: CFB Transfer Portal Tracker with live API integration"
```

Or use the detailed commit message above for more context.

### Step 5: Push to GitHub
```bash
git push origin main
```

If this is the first push, you might need to set the upstream:
```bash
git push -u origin main
```

## What Gets Pushed

All project files including:
- ✅ Source code (`/app`, `/components`, `/utils`, `/types`)
- ✅ Configuration files (`next.config.ts`, `tsconfig.json`, etc.)
- ✅ Documentation (`README.md`, `API_INTEGRATION.md`, etc.)
- ✅ Package files (`package.json`, `package-lock.json`)
- ❌ `node_modules/` (excluded via `.gitignore`)
- ❌ `.next/` build folder (excluded via `.gitignore`)
- ❌ `.env` files (excluded via `.gitignore`)

## Verify on GitHub

After pushing, visit:
```
https://github.com/James7599/transfer-portal-tracker
```

You should see all your files and folders!

## Troubleshooting

### If you get "Permission denied"
Make sure you're logged into GitHub on your machine:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### If you get "Repository not found"
Check the remote URL:
```bash
git remote -v
```

Should show:
```
origin  https://github.com/James7599/transfer-portal-tracker.git (fetch)
origin  https://github.com/James7599/transfer-portal-tracker.git (push)
```

### If you need to set the remote
```bash
git remote add origin https://github.com/James7599/transfer-portal-tracker.git
```

## Future Updates

When making changes, use:
```bash
git add .
git commit -m "Your descriptive message"
git push origin main
```

## Branches (Optional)

For feature development:
```bash
# Create a new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Merge via Pull Request on GitHub
```

---

**Ready to push!** 🚀
