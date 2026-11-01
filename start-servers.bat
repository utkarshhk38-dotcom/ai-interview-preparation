@echo off
echo ================================================
echo   AI Interview Coach - Starting Servers
echo ================================================
echo.

REM Start Backend OTP Server in a new window
echo Starting Backend Server...
start "Backend OTP Server" cmd /k "cd /d %~dp0\backend && node server.js"

REM Wait a moment for the server to start
timeout /t 2 /nobreak > nul

REM Start Frontend Vite Dev Server in a new window
echo Starting Frontend Server...
start "Frontend Dev Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ================================================
echo   ✅ Servers Started Successfully!
echo ================================================
echo.
echo Backend API: http://localhost:3001
echo Frontend: Check the Frontend Dev Server window
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause > nul
