# Data Storage & Retrieval Audit

This document lists **EVERY** piece of data being stored, retrieved, displayed, or used throughout the application. This will be used to ensure consistent data retrieval and storage patterns.

---

## 📦 **App.js (Root Component)**

### **State Variables:**
- `isGuest` (boolean) - Whether user is in guest mode
- `userProgress` (object) - Complete user progress data structure
- `currentPath` (string) - Current route path
- `sidebarOpen` (boolean) - Sidebar visibility state

### **localStorage:**
- **READ:** `quranProgress` - Loaded on mount, contains all user progress
- **WRITE:** `quranProgress` - Saved whenever `userProgress` changes

### **Props Passed to Children:**
- `isGuest` → Dashboard, Profile
- `userProgress` → Dashboard, SurahList, SurahDetail, Profile
- `setUserProgress` → Dashboard, SurahList, SurahDetail
- `setCurrentPath` → All page components
- `sidebarOpen` / `setSidebarOpen` → All page components

### **Data Structure - userProgress:**
```javascript
{
  [surahId]: {
    name: string,           // Surah name (e.g., "Al-Fatihah")
    verses: {
      [verseNumber]: {
        memorized: boolean,  // Whether verse is memorized
        lastReviewed: string // ISO timestamp of last review
      }
    }
  }
}
```

---

## 🏠 **LandingPage.js**

### **State Variables:**
- None (stateless component)

### **localStorage:**
- None

### **Context:**
- `theme` (string) - Current theme ('light' or 'dark')
- `isDark` (boolean) - Derived from theme
- `toggleTheme` (function) - Function to toggle theme

### **Props:**
- `onGuestMode` (function) - Callback for guest mode
- `onSignUp` (function) - Callback for sign up
- `setCurrentPath` (function) - Sets current path to '/'

### **Displayed Data:**
- Static verse text (hardcoded)
- Static translation (hardcoded)
- Static verse reference (hardcoded)

---

## 📊 **Dashboard.js**

### **State Variables:**
- `activityView` (string) - 'weekly' | 'monthly' | 'yearly'
- `selectedMonth` (number) - 0-11 (for monthly view)
- `selectedYear` (number) - Year (for monthly/yearly view)

### **localStorage:**
- None (reads from props only)

### **Context:**
- `theme` (string) - From ThemeContext
- `isDark` (boolean) - From ThemeContext
- `toggleTheme` (function) - From ThemeContext

### **Props:**
- `isGuest` (boolean)
- `userProgress` (object) - Complete progress data
- `setUserProgress` (function) - Not used in Dashboard
- `setCurrentPath` (function)
- `sidebarOpen` / `setSidebarOpen` (boolean, function)

### **Calculated/Derived Data:**
- `progress.completedSurahs` (number) - Count of fully memorized surahs
- `progress.totalSurahs` (number) - Always 114
- `progress.memorizedVerses` (number) - Total memorized verses across all surahs
- `progress.totalVerses` (number) - Always 6236
- `progress.surahPercentage` (number) - Percentage of surahs completed
- `progress.versePercentage` (number) - Percentage of verses memorized
- `realData.currentStreak` (number) - Current streak in days
- `realData.weeklyAverage` (number) - Average verses per week
- `realData.lastActivity` (string) - Formatted last activity timestamp
- `realData.currentSurah` (object) - Most recently worked on surah {id, name}
- `realData.currentVerse` (number) - Most recently worked on verse number
- `activityData` (array) - Activity data for selected view (weekly/monthly/yearly)
- `achievements` (array) - List of achievements with unlock status

### **Achievement Data Structure:**
```javascript
{
  id: number,
  name: string,
  description: string,
  unlocked: boolean,
  icon: JSX.Element,
  color: string
}
```

---

## 📖 **SurahList.js**

### **State Variables:**
- `searchTerm` (string) - Search input value
- `statusFilter` (string) - 'All' | 'Not Started' | 'In Progress' | 'Completed'
- `juzFilter` (string) - 'All' | '1' | '2' | ... | '30'
- `showFilters` (boolean) - Filter panel visibility
- `showSearch` (boolean) - Search bar visibility
- `showJuzDropdown` (boolean) - Juz dropdown visibility
- `surahs` (array) - Filtered list of surahs to display
- `loading` (boolean) - Loading state
- `error` (string | null) - Error message
- `allSurahs` (array) - Complete list of all surahs (for filtering)

### **localStorage:**
- None

### **Context:**
- `theme` (string) - From ThemeContext
- `isDark` (boolean) - From ThemeContext
- `toggleTheme` (function) - From ThemeContext

### **Props:**
- `userProgress` (object) - Complete progress data
- `setUserProgress` (function) - Updates progress when marking surah as done
- `setCurrentPath` (function)
- `sidebarOpen` / `setSidebarOpen` (boolean, function)

### **API Data (from quranApi.getSurahs()):**
- `surah.id` (number) - Surah number (1-114)
- `surah.name_simple` (string) - English name
- `surah.name_arabic` (string) - Arabic name
- `surah.name_complex` (string) - Complex Arabic name
- `surah.verses_count` (number) - Total verses in surah
- `surah.revelation_place` (string) - 'makkah' | 'medinan'
- `surah.revelation_order` (number) - Revelation order
- `surah.juz` (object) - Juz information

### **Calculated/Derived Data:**
- `getSurahProgress(surahId)` returns:
  - `status` (string) - 'Not Started' | 'In Progress' | 'Completed'
  - `percentage` (number) - 0-100 (rounded)
  - `memorizedVerses` (number) - Count of memorized verses
  - `lastMemorizedVerse` (number) - Highest verse number that is memorized (for Resume button)

---

## 📝 **SurahDetail.js**

### **State Variables:**
- `bulkMode` (boolean) - Bulk selection mode
- `selectedVerses` (Set) - Set of selected verse numbers for bulk operations
- `currentVerse` (number) - Verse number for "Go to verse" input
- `surah` (object) - Complete surah data from API
- `loading` (boolean) - Loading state
- `error` (string | null) - Error message
- `showFontDropdown` (boolean) - Font dropdown visibility
- `showSettings` (boolean) - Settings popup visibility
- `showBulkActions` (boolean) - Bulk actions popup visibility
- `isScrolled` (boolean) - Whether page is scrolled (for sticky header)

### **localStorage:**
- **READ/WRITE:** `quranProgress` - Updated when verses are marked/unmarked

### **Context:**
- `theme` (string) - From ThemeContext
- `isDark` (boolean) - From ThemeContext
- `toggleTheme` (function) - From ThemeContext
- `quranFont` (string) - From SettingsContext ('uthmani' | 'indopak')
- `setQuranFont` (function) - From SettingsContext
- `showTranslation` (boolean) - From SettingsContext
- `setShowTranslation` (function) - From SettingsContext
- `showTransliteration` (boolean) - From SettingsContext
- `setShowTransliteration` (function) - From SettingsContext
- `autoScroll` (boolean) - From SettingsContext
- `setAutoScroll` (function) - From SettingsContext
- `arabicFontSize` (number) - From SettingsContext
- `setArabicFontSize` (function) - From SettingsContext
- `translationFontSize` (number) - From SettingsContext
- `setTranslationFontSize` (function) - From SettingsContext
- `transliterationFontSize` (number) - From SettingsContext
- `setTransliterationFontSize` (function) - From SettingsContext
- `resetFontSizes` (function) - From SettingsContext

### **Props:**
- `userProgress` (object) - Complete progress data
- `setUserProgress` (function) - Updates progress
- `setCurrentPath` (function)
- `sidebarOpen` / `setSidebarOpen` (boolean, function)

### **URL Params:**
- `id` (string) - Surah ID from route `/surah/:id`
- `verse` (string, optional) - Verse number from query param `?verse=X` (for scroll to verse)

### **API Data (from quranApi.getSurah(id, font)):**
- `surah.id` (number)
- `surah.name_simple` (string)
- `surah.name_arabic` (string)
- `surah.verses_count` (number)
- `surah.revelation_place` (string)
- `surah.revelation_order` (number)
- `surah.juz.juz_number` (number)
- `surah.bismillah_pre` (boolean) - Whether surah has bismillah
- `surah.verses` (array) - Array of verse objects:
  - `verse.verse_key` (string) - Format: "surah:verse" (e.g., "1:1")
  - `verse.text_uthmani` (string) - Uthmani font text
  - `verse.text_indopak` (string) - IndoPak font text
- `surah.translation` (array) - Array of translation objects:
  - `translation.verse_key` (string)
  - `translation.text` (string)
- `surah.transliteration` (array) - Array of transliteration objects:
  - `transliteration.verse_key` (string)
  - `transliteration.text` (string)

### **Calculated/Derived Data:**
- `progress.memorizedVerses` (number) - Count of memorized verses in current surah
- `progress.percentage` (number) - Percentage of verses memorized (0-100)
- `totalVerses` (number) - Total verses in surah (from `surah.verses_count`)
- Verse memorization status per verse (from `userProgress[id].verses[verseNumber].memorized`)
- `selectedFont` (string) - Alias for `quranFont` from SettingsContext

---

## 👤 **Profile.js**

### **State Variables:**
- `showConfirmDialog` (boolean) - Clear data confirmation dialog visibility
- `showSuccessDialog` (boolean) - Success dialog visibility after clearing data
- `userName` (string) - User's name (persisted in localStorage)
- `isEditingName` (boolean) - Whether name is being edited
- `editedName` (string) - Temporary name value during editing

### **localStorage:**
- **READ/WRITE:** `userName` - User's name (can be empty string)
- **READ:** `quranProgress` - For calculating stats and exporting
- **WRITE:** `quranProgress` - When importing progress
- **REMOVE:** `quranProgress` - When clearing local data

### **Context:**
- `theme` (string) - From ThemeContext
- `isDark` (boolean) - From ThemeContext
- `toggleTheme` (function) - From ThemeContext
- `quranFont` (string) - From SettingsContext ('uthmani' | 'indopak')
- `setQuranFont` (function) - From SettingsContext
- `showTranslation` (boolean) - From SettingsContext
- `setShowTranslation` (function) - From SettingsContext
- `showTransliteration` (boolean) - From SettingsContext
- `setShowTransliteration` (function) - From SettingsContext
- `autoScroll` (boolean) - From SettingsContext
- `setAutoScroll` (function) - From SettingsContext
- `arabicFontSize` (number) - From SettingsContext
- `setArabicFontSize` (function) - From SettingsContext
- `translationFontSize` (number) - From SettingsContext
- `setTranslationFontSize` (function) - From SettingsContext
- `transliterationFontSize` (number) - From SettingsContext
- `setTransliterationFontSize` (function) - From SettingsContext
- `resetFontSizes` (function) - From SettingsContext

### **Props:**
- `isGuest` (boolean)
- `userProgress` (object) - Complete progress data
- `setCurrentPath` (function)
- `sidebarOpen` / `setSidebarOpen` (boolean, function)

### **Calculated/Derived Data:**
- `stats.completedSurahs` (number) - Count of fully memorized surahs
- `stats.totalSurahs` (number) - Always 114
- `stats.memorizedVerses` (number) - Total memorized verses
- `stats.totalVerses` (number) - Always 6236
- `stats.overallPercentage` (number) - Overall completion percentage
- `stats.weeklyStreak` (number) - Weekly streak (calculated)
- `juzHeatmap` (array) - Array of {juz, progress} objects for 30 juzs
- `achievements` (array) - List of achievements with unlock status

### **Achievement Data Structure:**
```javascript
{
  id: number,
  name: string,
  description: string,
  unlocked: boolean,
  icon: JSX.Element (Lucide React icon),
  color: string,
  date: string | null (ISO date string)
}
```

### **Export/Import:**
- **Export:** Downloads `userProgress` as JSON file
- **Import:** Reads JSON file and saves to `localStorage.quranProgress`

---

## 🎨 **ThemeContext.js**

### **State Variables:**
- `theme` (string) - 'light' | 'dark'

### **localStorage:**
- **READ:** `theme` - Loaded on initialization (defaults to 'light' if not found)
- **WRITE:** `theme` - Saved whenever theme changes

### **Context Value:**
- `theme` (string) - 'light' | 'dark'
- `toggleTheme` (function) - Toggles between 'light' and 'dark'
- `isDark` (boolean) - Derived from theme === 'dark'

### **Used In:**
- All page components (LandingPage, Dashboard, SurahList, SurahDetail, Profile)

---

## ⚙️ **SettingsContext.js**

### **State Variables:**
- `quranFont` (string) - 'uthmani' | 'indopak'
- `showTranslation` (boolean) - Show/hide translation
- `showTransliteration` (boolean) - Show/hide transliteration
- `autoScroll` (boolean) - Auto-scroll to next verse after marking
- `arabicFontSize` (number) - Arabic text font size in rem
- `translationFontSize` (number) - Translation text font size in rem
- `transliterationFontSize` (number) - Transliteration text font size in rem

### **localStorage:**
- **READ/WRITE:** `quranFontPreference` - Selected font ('uthmani' | 'indopak'), default: 'uthmani'
- **READ/WRITE:** `showTranslationPreference` - Boolean as JSON string, default: true
- **READ/WRITE:** `showTransliterationPreference` - Boolean as JSON string, default: true
- **READ/WRITE:** `autoScrollPreference` - Boolean as JSON string, default: false
- **READ/WRITE:** `arabicFontSize` - Number as string, default: '2.5', range: 1.0 - 4.0
- **READ/WRITE:** `translationFontSize` - Number as string, default: '1.0', range: 0.7 - 2.0
- **READ/WRITE:** `transliterationFontSize` - Number as string, default: '1.0', range: 0.7 - 2.0

### **Context Value:**
- `quranFont` (string) - Current font preference
- `setQuranFont` (function) - Update font preference
- `showTranslation` (boolean) - Current translation visibility
- `setShowTranslation` (function) - Update translation visibility
- `showTransliteration` (boolean) - Current transliteration visibility
- `setShowTransliteration` (function) - Update transliteration visibility
- `autoScroll` (boolean) - Current auto-scroll setting
- `setAutoScroll` (function) - Update auto-scroll setting
- `arabicFontSize` (number) - Current Arabic font size
- `setArabicFontSize` (function) - Update Arabic font size
- `translationFontSize` (number) - Current translation font size
- `setTranslationFontSize` (function) - Update translation font size
- `transliterationFontSize` (number) - Current transliteration font size
- `setTransliterationFontSize` (function) - Update transliteration font size
- `resetFontSizes` (function) - Reset all font sizes to defaults

### **Used In:**
- Profile.js (settings page)
- SurahDetail.js (settings popup and verse display)

---

## 📋 **Summary of All localStorage Keys**

1. **`quranProgress`** (object, JSON stringified)
   - Complete user progress data
   - Used in: App.js, SurahDetail.js, Profile.js
   - Structure: `{ [surahId]: { name, verses: { [verseNumber]: { memorized, lastReviewed } } } }`
   - **READ:** On app mount (App.js)
   - **WRITE:** Whenever `userProgress` state changes (App.js), when verses are marked/unmarked (SurahDetail.js), when importing (Profile.js)
   - **REMOVE:** When clearing local data (Profile.js)

2. **`theme`** (string)
   - Current theme preference
   - Used in: ThemeContext.js
   - Values: 'light' | 'dark'
   - Default: 'light'
   - **READ:** On ThemeContext initialization
   - **WRITE:** Whenever theme changes

3. **`userName`** (string)
   - User's name (can be empty string)
   - Used in: Profile.js
   - Default: '' (empty string)
   - **READ:** On Profile.js mount
   - **WRITE:** When user saves name
   - **REMOVE:** When user clears name (sets to empty string)

4. **`quranFontPreference`** (string)
   - Selected Quran font
   - Used in: SettingsContext.js
   - Values: 'uthmani' | 'indopak'
   - Default: 'uthmani'
   - **READ:** On SettingsContext initialization
   - **WRITE:** Whenever `quranFont` changes

5. **`showTranslationPreference`** (string, JSON boolean)
   - Show/hide translation toggle
   - Used in: SettingsContext.js
   - Values: 'true' | 'false' (JSON stringified boolean)
   - Default: true
   - **READ:** On SettingsContext initialization
   - **WRITE:** Whenever `showTranslation` changes

6. **`showTransliterationPreference`** (string, JSON boolean)
   - Show/hide transliteration toggle
   - Used in: SettingsContext.js
   - Values: 'true' | 'false' (JSON stringified boolean)
   - Default: true
   - **READ:** On SettingsContext initialization
   - **WRITE:** Whenever `showTransliteration` changes

7. **`autoScrollPreference`** (string, JSON boolean)
   - Auto-scroll to next verse after marking as memorized
   - Used in: SettingsContext.js
   - Values: 'true' | 'false' (JSON stringified boolean)
   - Default: false
   - **READ:** On SettingsContext initialization
   - **WRITE:** Whenever `autoScroll` changes

8. **`arabicFontSize`** (string, number)
   - Arabic text font size in rem
   - Used in: SettingsContext.js
   - Default: '2.5'
   - Range: 1.0 - 4.0
   - **READ:** On SettingsContext initialization (parsed to number)
   - **WRITE:** Whenever `arabicFontSize` changes (converted to string)

9. **`translationFontSize`** (string, number)
   - Translation text font size in rem
   - Used in: SettingsContext.js
   - Default: '1.0'
   - Range: 0.7 - 2.0
   - **READ:** On SettingsContext initialization (parsed to number)
   - **WRITE:** Whenever `translationFontSize` changes (converted to string)

10. **`transliterationFontSize`** (string, number)
    - Transliteration text font size in rem
    - Used in: SettingsContext.js
    - Default: '1.0'
    - Range: 0.7 - 2.0
    - **READ:** On SettingsContext initialization (parsed to number)
    - **WRITE:** Whenever `transliterationFontSize` changes (converted to string)

---

## 🔄 **Data Flow Patterns**

### **Progress Updates:**
1. User marks verse in `SurahDetail.js`
2. `setUserProgress` updates state in `App.js`
3. `App.js` useEffect saves to `localStorage.quranProgress`
4. All components reading `userProgress` prop automatically update

### **Settings Updates (via SettingsContext):**
1. User changes setting in `Profile.js` or `SurahDetail.js` (font, translation, transliteration, auto-scroll, font sizes)
2. SettingsContext state updates immediately
3. `useEffect` in SettingsContext saves to respective localStorage key
4. On page reload, settings are restored from localStorage
5. All components using SettingsContext automatically receive updated values

### **Theme Updates:**
1. User toggles theme anywhere in app
2. `ThemeContext` updates state
3. `useEffect` saves to `localStorage.theme`
4. Theme applied to `document.documentElement` attribute `data-theme`
5. All components using ThemeContext automatically receive updated theme

### **User Name Updates:**
1. User edits name in `Profile.js`
2. `setUserName` updates local state
3. `useEffect` saves to `localStorage.userName`
4. Name persists across page reloads

---

## ✅ **Current Architecture Status**

### **Unified Settings Management:**
- ✅ All settings (font, translation, transliteration, auto-scroll, font sizes) are managed through `SettingsContext`
- ✅ Settings are persisted to localStorage automatically
- ✅ Settings sync between `Profile.js` and `SurahDetail.js`
- ✅ Single source of truth for all user preferences

### **Data Consistency:**
- ✅ Progress data structure is consistent across all components
- ✅ Optional chaining used consistently: `userProgress[surahId]?.verses?.[verseNumber]`
- ✅ Font sizes stored as strings, parsed to numbers when read
- ✅ Boolean preferences stored as JSON strings, parsed when read

### **localStorage Key Naming:**
- ✅ Consistent naming: `quranProgress`, `theme`, `userName`, `*Preference`, `*FontSize`
- ✅ All settings keys use descriptive names

---

## 📝 **Data Structure Reference**

### **userProgress Structure:**
```javascript
{
  [surahId: string]: {
    name: string,                    // Surah name (e.g., "Al-Fatihah")
    verses: {
      [verseNumber: string]: {
        memorized: boolean,          // Whether verse is memorized
        lastReviewed: string         // ISO timestamp (e.g., "2024-01-15T10:30:00.000Z")
      }
    }
  }
}
```

### **Example userProgress:**
```javascript
{
  "1": {
    name: "Al-Fatihah",
    verses: {
      "1": {
        memorized: true,
        lastReviewed: "2024-01-15T10:30:00.000Z"
      },
      "2": {
        memorized: true,
        lastReviewed: "2024-01-15T10:31:00.000Z"
      }
    }
  },
  "2": {
    name: "Al-Baqarah",
    verses: {
      "1": {
        memorized: false,
        lastReviewed: "2024-01-14T09:00:00.000Z"
      }
    }
  }
}
```

---

## 🔍 **Component Data Usage Summary**

### **Components Reading userProgress:**
- **Dashboard.js** - Calculates stats, achievements, activity data
- **SurahList.js** - Calculates progress per surah, determines status
- **SurahDetail.js** - Displays memorization status per verse, calculates surah progress
- **Profile.js** - Calculates stats, exports/imports progress

### **Components Using SettingsContext:**
- **Profile.js** - Displays and allows editing of all settings
- **SurahDetail.js** - Uses settings for display and allows editing in popup

### **Components Using ThemeContext:**
- **LandingPage.js** - Theme toggle
- **Dashboard.js** - Theme toggle
- **SurahList.js** - Theme toggle
- **SurahDetail.js** - Theme toggle
- **Profile.js** - Theme toggle

### **Components Writing to localStorage:**
- **App.js** - Writes `quranProgress`
- **SurahDetail.js** - Writes `quranProgress` (when marking verses)
- **Profile.js** - Writes `userName`, writes/removes `quranProgress` (import/clear)
- **ThemeContext.js** - Writes `theme`
- **SettingsContext.js** - Writes all setting preferences

---

## 📊 **Displayed Data by Page**

### **Dashboard:**
- Overall progress statistics (surahs completed, verses memorized, percentages)
- Current streak
- Weekly average
- Last activity timestamp
- Current surah and verse being worked on
- Activity charts (weekly/monthly/yearly)
- Achievement badges

### **SurahList:**
- List of all 114 surahs with:
  - Arabic and English names
  - Progress status (Not Started / In Progress / Completed)
  - Progress percentage
  - Memorized verses count
  - Juz information
  - Resume button (if in progress)

### **SurahDetail:**
- Surah information (name, verse count, juz)
- Progress bar with percentage
- List of all verses with:
  - Verse number
  - Arabic text (Uthmani or IndoPak font)
  - Transliteration (if enabled)
  - Translation (if enabled)
  - Memorization status (checkbox/icon)
- Settings popup with:
  - Font selection
  - Translation/Transliteration toggles
  - Auto-scroll toggle
  - Font size controls
  - Preview

### **Profile:**
- User name (editable)
- Theme toggle
- Quran Preferences:
  - Default Font (Uthmani/IndoPak)
  - Display Options (Translation/Transliteration toggles)
  - Auto-scroll toggle
- Font Sizes:
  - Arabic Text (1.0 - 4.0 rem)
  - Translation (0.7 - 2.0 rem)
  - Transliteration (0.7 - 2.0 rem)
- Statistics:
  - Completed surahs
  - Total surahs (114)
  - Memorized verses
  - Total verses (6236)
  - Overall percentage
  - Weekly streak
- Juz Heatmap (30 juzs with progress)
- Achievements grid
- Data Management:
  - Export Progress (download JSON)
  - Import Progress (upload JSON)
  - Clear Local Data
- Footer with disclaimer and app version

---

## 🎯 **Data Validation & Defaults**

### **Progress Data:**
- Validated: `userProgress` is an object
- Default: `{}` (empty object)
- Structure validation: Checks for `verses` object and `memorized` boolean

### **Settings Data:**
- **quranFont:** Validated to be 'uthmani' or 'indopak', defaults to 'uthmani'
- **showTranslation:** Parsed from JSON, defaults to `true`
- **showTransliteration:** Parsed from JSON, defaults to `true`
- **autoScroll:** Parsed from JSON, defaults to `false`
- **arabicFontSize:** Parsed to float, defaults to `2.5`, clamped to 1.0-4.0
- **translationFontSize:** Parsed to float, defaults to `1.0`, clamped to 0.7-2.0
- **transliterationFontSize:** Parsed to float, defaults to `1.0`, clamped to 0.7-2.0

### **Theme Data:**
- Validated: Must be 'light' or 'dark'
- Default: 'light'

### **User Name Data:**
- Type: string
- Default: '' (empty string)
- Can be empty (guest mode)

---

## 🔐 **Data Persistence Strategy**

### **Automatic Persistence:**
- ✅ `userProgress` - Saved automatically on every change (App.js useEffect)
- ✅ `theme` - Saved automatically on every change (ThemeContext useEffect)
- ✅ All settings - Saved automatically on every change (SettingsContext useEffect)
- ✅ `userName` - Saved automatically on change (Profile.js useEffect)

### **Manual Persistence:**
- Import/Export - User-initiated via Profile.js buttons
- Clear Data - User-initiated via Profile.js button

### **Data Loss Prevention:**
- All critical data (progress, settings) persists automatically
- Export feature allows users to backup their data
- Import feature allows users to restore from backup

---

## 📱 **Responsive Data Considerations**

### **Mobile vs Desktop:**
- Same data structures used across all screen sizes
- Sidebar state (`sidebarOpen`) affects layout but not data
- All localStorage keys work the same on all devices

### **Browser Compatibility:**
- localStorage is supported in all modern browsers
- JSON.parse/stringify used for complex data
- Fallbacks provided for missing localStorage data (defaults)

---

## 🚀 **Future Considerations**

1. **Data Migration:** If data structure changes, migration logic should be added
2. **Data Validation:** Consider adding runtime validation for localStorage data
3. **Data Compression:** For large progress objects, consider compression
4. **Sync:** If adding cloud sync, consider conflict resolution strategies
5. **Backup:** Consider automatic periodic backups
6. **Analytics:** Consider tracking which features are used most
