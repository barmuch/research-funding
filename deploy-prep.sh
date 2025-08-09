#!/bin/bash

# Research Fund Tracker - Quick Deployment Preparation Script
echo "🚀 Research Fund Tracker - Deployment Preparation"
echo "================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Research Fund Tracker ready for deployment"
    echo "✅ Git repository initialized"
else
    echo "📝 Git repository already exists"
    echo "💾 Adding all changes..."
    git add .
    git commit -m "Update for deployment - $(date)"
    echo "✅ Changes committed"
fi

# Test build
echo "🔨 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment"
    echo ""
    echo "🌐 Next steps for Vercel deployment:"
    echo "1. Push to GitHub: git remote add origin YOUR_REPO_URL && git push -u origin main"
    echo "2. Go to vercel.com and import your repository"
    echo "3. Set environment variables (see DEPLOYMENT_GUIDE.md)"
    echo "4. Deploy! 🚀"
    echo ""
    echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
else
    echo "❌ Build failed! Please check errors above"
    exit 1
fi
