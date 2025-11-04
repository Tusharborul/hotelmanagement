@echo off
echo Starting Hotel Management System...
echo.

echo Starting MongoDB (make sure MongoDB is installed)...
start "MongoDB" cmd /k "mongod"
timeout /t 3

echo Starting Backend Server...
start "Backend Server" cmd /k "cd hotelBackend && npm run dev"
timeout /t 5

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd hotelFrontend && npm run dev"

echo.
echo All servers are starting!
echo - MongoDB: Running
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running)...
pause > nul
