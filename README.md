# Tahfidh - Quran Memorization Tracker

A focused digital companion that helps Muslims track their Quran memorization progress verse by verse. Built with React and designed with a beautiful, modern interface featuring creamy light themes and pink/purple accents.

## 🌟 Features

### Core Functionality
- **Verse-by-verse tracking** across all 114 surahs
- **Multiple Arabic fonts**: Uthmani and IndoPak scripts from Quran.com API
- **Progress visualization** with circular charts and progress bars
- **Guest mode** with local storage for immediate use
- **Light/Dark theme** switching
- **Responsive design** for mobile and desktop

### User Experience
- **Beautiful landing page** with Quran calligraphy
- **Modern dashboard** with progress summary and quick actions
- **Card-based surah list** (no traditional tables)
- **Detailed surah view** with verse-by-verse memorization
- **Bulk operations** for marking multiple verses
- **Achievement system** to motivate users

### Data Management
- **Local storage** for guest users
- **Export/Import** functionality for progress data
- **Progress persistence** across sessions
- **Guest-to-user migration** path

## 🎨 Design System

### Color Scheme
- **Light Theme**: Creamy ivory (#FCF7F4), Soft beige (#F8F0E5), Dusty rose (#E2B6B3), Lavender (#9A86A4)
- **Dark Theme**: Deep plum (#1E152A), Dark eggplant (#2A1E3A), Blush pink (#FF9AA2), Lilac (#B19CD9)

### Typography
- **Arabic Text**: Uthmani and IndoPak fonts from Quran.com API
- **UI Text**: Inter font family for modern, readable interface

## 🚀 Getting Started

> **Quick Start?** See [QUICKSTART.md](QUICKSTART.md) for a streamlined setup guide with automated scripts!

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Quran.com API credentials (Client ID and Client Secret)

### Font Setup (IMPORTANT for authentic Uthmani/IndoPak display)

To display the authentic Uthmani and IndoPak scripts, you need to download the actual font files:

1. **Create fonts directory:**
```bash
mkdir -p public/fonts
```

2. **Download Uthmani font:**
   - Go to: https://github.com/mustafa0x/quran-fonts/tree/master/fonts
   - Download: `UthmanicHafs1Ver18.woff2` or `UthmanicHafs1Ver18.ttf`
   - Rename to: `Uthmani.woff2` or `Uthmani.ttf`
   - Place in: `public/fonts/`

3. **Download IndoPak font:**
   - Go to: https://github.com/mustafa0x/quran-fonts/tree/master/fonts
   - Download: `IndoPak.woff2` or `IndoPak.ttf`
   - Place in: `public/fonts/`

4. **Alternative sources:**
   - Quran.com fonts: https://fonts.quran.com/
   - KFGQPC fonts: https://fonts.quran.com/KFGQPCUthmanTaha.woff2

**Note:** The Quran.com API only provides text data, not font files. You must download the fonts separately to see the authentic visual appearance.

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
Create a `.env` file in the backend directory with your Quran.com API credentials:
```env
QURAN_CLIENT_ID=YOUR_CLIENT_ID_HERE
QURAN_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
NODE_ENV=development
PORT=5000
```

4. **Start the backend server:**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000` and act as a proxy between your React app and the Quran.com API.

### Frontend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm start
```

3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Building for Production
```bash
npm run build
```

## 📱 Usage

### Guest Mode
1. Visit the landing page
2. Click "Continue as Guest"
3. Start tracking your memorization progress
4. Your data is saved locally on your device

### Account Mode
1. Click "Sign Up / Sign In" on the landing page
2. Create an account for permanent storage
3. Sync your progress across devices

### Tracking Progress
1. Navigate to "Surahs" to see all available surahs
2. Click on a surah to view its verses
3. Mark verses as memorized using the toggle buttons
4. Use bulk mode to mark multiple verses at once
5. View your progress on the dashboard

## 🏗️ Project Structure

```
memorize/
├── backend/                 # Node.js/Express backend
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables
├── src/
│   ├── components/         # React components
│   │   ├── LandingPage.js  # Landing page with auth options
│   │   ├── Dashboard.js    # Main dashboard with progress
│   │   ├── SurahList.js    # List of all surahs
│   │   ├── SurahDetail.js  # Individual surah view
│   │   ├── Profile.js      # User profile and settings
│   │   └── Navigation.js   # Navigation component
│   ├── services/           # API services
│   │   └── quranApi.js     # Quran API service
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.js # Theme management
│   ├── App.js             # Main app component
│   ├── index.js           # Entry point
│   └── index.css          # Global styles
├── package.json            # Frontend dependencies
└── README.md              # This file
```

## 🔧 Technical Details

### Technologies Used
- **Frontend**: React 18 with functional components and hooks
- **Backend**: Node.js/Express with rate limiting and CORS
- **API**: Quran.com API (OAuth2 authentication)
- **Routing**: React Router for navigation
- **Styling**: CSS Variables for theming
- **Icons**: Lucide React for modern icons
- **Data**: Local Storage for persistence

### API Integration
- **Quran.com API**: Authenticated access to Quran text, translations, and transliterations
- **Backend Proxy**: Express server handles authentication and API calls
- **Font Support**: Uthmani and IndoPak scripts
- **Translation**: Dr. Mustafa Khattab's The Clear Quran

### Key Components
- **Theme System**: CSS variables with smooth transitions
- **Progress Tracking**: Local storage with JSON serialization
- **Font Management**: Dynamic font switching for Arabic text
- **Responsive Design**: Mobile-first approach with desktop enhancements

## 📋 API Endpoints

### Backend API Routes
- `GET /api/surahs` - Get all surahs/chapters
- `GET /api/surah/:id` - Get specific surah with verses
- `GET /api/surah/:id/verses/:font` - Get verses in specific font
- `GET /api/surah/:id/translation` - Get translation
- `GET /api/health` - Health check

### Quran.com API Features
- **Authentication**: OAuth2 Client Credentials flow
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Font Support**: Uthmani and IndoPak scripts
- **Translations**: Multiple language support
- **Transliterations**: Arabic text in Latin script

## ⚠️ Important Disclaimers

### Verification Disclaimer
> **Always confirm memorization with a physical Quran. Digital text may contain errors.**

### Purpose Statement
> **Tahfidh is a progress tracker only. Always verify memorization with a physical Quran.**

### Guest Mode Warning
> **Progress saved locally - Sign up to protect against data loss**

### API Usage
> **Respect Quran.com API rate limits and terms of service**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Quran.com API for providing authentic Quran text and translations
- Dr. Mustafa Khattab for The Clear Quran translation
- Islamic design principles and calligraphy
- Muslim community feedback and suggestions

## 📞 Support

For questions, suggestions, or support, please open an issue on GitHub or contact the development team.

---

**May Allah bless your Quran memorization journey. 🌙✨**
