@echo off
echo 🚀 Research Fund Tracker - Deployment Preparation
echo =================================================

rem Check if git is initialized
if not exist ".git" (
    echo 📝 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - Research Fund Tracker ready for deployment"
    echo ✅ Git repository initialized
) else (
    echo 📝 Git repository already exists
    echo 💾 Adding all changes...
    git add .
    git commit -m "Update for deployment - %date% %time%"
    echo ✅ Changes committed
)

rem Test build
echo 🔨 Testing production build...
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful! Ready for deployment
    echo.
    echo 🌐 Next steps for Vercel deployment:
    echo 1. Push to GitHub: git remote add origin YOUR_REPO_URL ^&^& git push -u origin main
    echo 2. Go to vercel.com and import your repository
    echo 3. Set environment variables (see DEPLOYMENT_GUIDE.md^)
    echo 4. Deploy! 🚀
    echo.
    echo 📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md
) else (
    echo ❌ Build failed! Please check errors above
    pause
    exit /b 1
)

pause
