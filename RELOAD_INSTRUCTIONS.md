# Unnanu Extension - Reload Instructions

## 🔄 How to Force Reload the Extension

Chrome has cached the old `background.js` file. Follow these steps:

### Method 1: Remove and Reload (Recommended)
1. Go to `chrome://extensions/`
2. Find **Unnanu LinkedIn Extension**
3. Click **"Remove"** button
4. Click **"Load unpacked"** button
5. Select this folder again
6. ✅ Extension should load without errors

### Method 2: Hard Refresh Service Worker
1. Go to `chrome://extensions/`
2. Find **Unnanu LinkedIn Extension**
3. Click on **"service worker"** link (under "Inspect views")
4. In the DevTools window that opens, press **Ctrl+Shift+R** (hard refresh)
5. Close DevTools
6. Click **"Reload"** button on the extension
7. ✅ Should work now

### Method 3: Clear Extension Cache
1. Go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right)
3. Click **"Clear all"** under "Service worker" section
4. Click **"Reload"** on Unnanu extension
5. ✅ Fresh start

## ✅ Verification
After reloading, the background.js should show:
- ✅ No `importScripts` call
- ✅ Inline DataSend object
- ✅ No import errors

## 🎯 What Changed
The old file had:
```javascript
importScripts('datasend.js'); // ❌ This was removed
```

The new file has:
```javascript
const DataSend = { ... }; // ✅ Inline code
```

## 💡 Why This Happened
Chrome aggressively caches service worker files for performance. When you update the code, Chrome sometimes still uses the cached version. A full remove/reload forces Chrome to reload everything fresh.
