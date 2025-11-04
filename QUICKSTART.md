# Quick Start Commands

## Start Everything at Once (Windows)
```bash
# Run the batch file
start-all.bat
```

## Start Manually

### Terminal 1 - MongoDB (if running locally)
```bash
mongod
```

### Terminal 2 - Backend
```bash
cd hotelBackend
npm run dev
```

### Terminal 3 - Frontend
```bash
cd hotelFrontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000 (shows API info)

## Test Credentials

After you register, use those credentials to login.

## First Time Setup

1. Make sure MongoDB is running
2. Install all dependencies:
   ```bash
   cd hotelBackend && npm install
   cd ../hotelFrontend && npm install
   ```
3. Start the servers using one of the methods above
4. Open http://localhost:5173 in your browser
