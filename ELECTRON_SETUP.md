# NelDrive Desktop App Setup

This project is configured to run as an Electron desktop application with full offline support.

## Prerequisites

- Node.js 18+ installed
- Git installed

## Setup Steps

### 1. Clone the Project

First, export your project to GitHub from Lovable, then clone it:

```bash
git clone <your-github-repo-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Electron Scripts to package.json

After cloning, manually add these scripts to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

### 4. Development Mode

Run the app in development mode (hot reload enabled):

```bash
npm run electron:dev
```

### 5. Build for Production

Build installers for different platforms:

```bash
# Build for current platform
npm run electron:build

# Build for Windows
npm run electron:build:win

# Build for macOS
npm run electron:build:mac

# Build for Linux
npm run electron:build:linux
```

The built installers will be in the `electron-dist` folder.

## Offline Features

The app works fully offline with:
- **IndexedDB storage** for caching files locally
- **Upload queue** for files uploaded while offline (synced when online)
- **Automatic sync** when internet connection is restored

## Platform-Specific Notes

### Windows
- Generates `.exe` installer and portable version
- No additional setup needed

### macOS
- Generates `.dmg` and `.zip` files
- May require notarization for distribution

### Linux
- Generates `.AppImage` and `.deb` packages
- AppImage works on most distributions

## Troubleshooting

### App won't start
- Ensure all dependencies are installed: `npm install`
- Check if port 5173 is available for dev mode

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure electron-builder has correct permissions

### Offline mode issues
- Clear browser/app cache and restart
- Check IndexedDB storage in DevTools
