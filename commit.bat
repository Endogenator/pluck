@echo off
cd /d K:\pluck
echo.
echo Staging all changes...
git add .
echo.
set /p msg="Commit message: "
git commit -m "%msg%"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done. Vercel will deploy automatically.
pause