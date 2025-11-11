# 🚀 Unnanu LinkedIn Extension v2.0

A powerful Chrome extension with dual modes: **Recruiter Mode** for profile extraction and **Talent Mode** for job seekers.

## ✨ Features

### 🎯 **Recruiter Mode**
Perfect for recruiters and talent acquisition professionals:
- **Smart Profile Extraction**: Extract complete LinkedIn profile data including:
  - Name, headline, location, profile image
  - About section
  - Skills (top 20)
  - Complete work experience with descriptions
  - Full education history
  - Network stats (connections & followers)
- **Session-Based Caching**: Profiles are cached locally during your LinkedIn session
- **Automatic Data Sync**: Automatically sends data to Unnanu API when LinkedIn tabs close
- **Bulk Collection**: Visit multiple profiles and collect them all in one session

### 💼 **Talent Mode** (Coming Soon)
Perfect for job seekers and career professionals:
- Quick Apply Helper
- Application Tracker
- Job Alerts
- Profile Optimizer
- Resume Analysis

### 🔒 Security Features
- Runs **only** on LinkedIn domains
- HTML sanitization to prevent XSS attacks
- Secure host permissions
- No data sent until session ends (Recruiter mode)

## 📦 Installation

1. **Clone or download this repository**
2. **Open Chrome and go to** `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right)
4. **Click "Load unpacked"** and select the extension folder
5. **Click the extension icon** and choose your role (Recruiter or Talent)
6. **Start using LinkedIn!**

## 🎮 Usage

### First Time Setup

1. **Click the Unnanu extension icon** in your Chrome toolbar
2. **Choose your role:**
   - **🎯 Recruiter**: For extracting and managing profiles
   - **💼 Talent**: For job searching and applications (coming soon)
3. **Click Continue** to save your selection
4. **Go to LinkedIn** and start using the extension!

### Recruiter Mode Usage

1. **Navigate to a LinkedIn profile** (linkedin.com/in/username)
2. **Click the floating "U" button** on the right side of the page
3. **View extracted data** in the sidebar
4. **Profile is automatically cached** in your session
5. **When you close all LinkedIn tabs**, data is sent to Unnanu API
6. **Repeat for multiple profiles** - they all get cached together!

**To view your session cache:**
- Click "🗂️ View Session Cache" in the sidebar
- See how many profiles you've collected
- View profile names and capture times

### Changing Your Role

1. Click the extension icon
2. Click "Change Role"
3. Select a new role
4. Your extension will reset with new features

## 🏗️ Architecture

### File Structure

```
Linkedin-Extenstion-Visual-Upgrade-/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tab management, sync)
├── content.js            # Content script (extraction, UI)
├── datasend.js           # Data management module (cache, API)
├── popup.html            # Role selection popup
├── popup.js              # Popup logic
├── images/               # Extension icons
└── README.md
```

### User Flow

```
First Time:
Extension Icon → Role Selection Popup → Choose Role → Save
                                              ↓
                                    Mode Activated

Recruiter Mode:
LinkedIn Profile → Click "U" Icon → Extract Data → Cache Locally
                                              ↓
                Close All LinkedIn Tabs → Send to API → Clear Cache

Talent Mode:
LinkedIn Jobs → Job Helper Features → Track Applications
```

### API Integration (Recruiter Mode)

**Endpoint:** `https://plugin.unnanu.com/api/profiles`

**Payload Structure:**
```json
{
  "sessionId": "session_1699999999999_abc123",
  "sessionStart": "2025-11-10T10:30:00.000Z",
  "sessionEnd": "2025-11-10T12:45:00.000Z",
  "profileCount": 5,
  "profiles": [
    {
      "fullName": "John Doe",
      "headline": "Software Engineer at Google",
      "about": "Passionate about...",
      "skills": ["JavaScript", "Python", "React"],
      "experience": [...],
      "education": [...],
      "url": "https://linkedin.com/in/johndoe",
      "capturedAt": "2025-11-10T11:15:00.000Z"
    }
  ],
  "metadata": {
    "extensionVersion": "2.0",
    "browser": "Mozilla/5.0...",
    "timestamp": "2025-11-10T12:45:00.000Z"
  }
}
```

## 🔧 Configuration

### Changing API Endpoint

Edit `datasend.js`:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api-endpoint.com/profiles',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000
};
```

## 🛠️ Development

1. Make changes to source files
2. Go to `chrome://extensions/` and click reload
3. Reset your role if needed (click extension icon → Change Role)
4. Test on LinkedIn

**Debugging:**
- Content script logs: Open DevTools on LinkedIn page
- Background logs: `chrome://extensions/` → Click "service worker"
- Storage: DevTools → Application → Local Storage

## 📊 Features Roadmap

### Recruiter Mode
- [x] Profile extraction
- [x] Session caching
- [x] Auto-sync to API
- [ ] Export as CSV/Excel
- [ ] Bulk profile refresh
- [ ] Profile comparison
- [ ] Advanced filtering

### Talent Mode
- [ ] Quick apply helper
- [ ] Application tracker
- [ ] Job alerts
- [ ] Profile optimizer
- [ ] Resume analyzer
- [ ] Interview prep

## 🐛 Known Issues

1. **LinkedIn structure changes**: Extension includes multiple selector fallbacks
2. **Dynamic content**: Scroll before opening sidebar for best results
3. **Skills extraction**: Limited to visible skills (top 20)

## 📄 License

MIT License - feel free to use and modify

## ⚠️ Disclaimer

For educational and legitimate business purposes only. Respect LinkedIn's Terms of Service and user privacy.

---

**Made with ❤️ for Unnanu**
