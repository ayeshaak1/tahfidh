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
- `theme` (string)
- `isDark` (boolean)
- `toggleTheme` (function)

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
  - `percentage` (number) - 0-100
  - `memorizedVerses` (number) - Count of memorized verses

---

## 📝 **SurahDetail.js**

### **State Variables:**
- `selectedFont` (string) - 'uthmani' | 'indopak' (persisted)
- `showTranslation` (boolean) - Show/hide translation (persisted)
- `showTransliteration` (boolean) - Show/hide transliteration (persisted)
- `arabicFontSize` (number) - Font size in rem, default 2.5 (persisted)
- `translationFontSize` (number) - Font size in rem, default 1.0 (persisted)
- `transliterationFontSize` (number) - Font size in rem, default 1.0 (persisted)
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
- **READ/WRITE:** `quranFontPreference` - Selected font ('uthmani' | 'indopak')
- **READ/WRITE:** `showTranslationPreference` - Boolean as JSON string
- **READ/WRITE:** `showTransliterationPreference` - Boolean as JSON string
- **READ/WRITE:** `arabicFontSize` - Number as string
- **READ/WRITE:** `translationFontSize` - Number as string
- **READ/WRITE:** `transliterationFontSize` - Number as string
- **READ/WRITE:** `quranProgress` - Updated when verses are marked/unmarked

### **Context:**
- `theme` (string)
- `isDark` (boolean)
- `toggleTheme` (function)

### **Props:**
- `userProgress` (object) - Complete progress data
- `setUserProgress` (function) - Updates progress
- `setCurrentPath` (function)
- `sidebarOpen` / `setSidebarOpen` (boolean, function)

### **URL Params:**
- `id` (string) - Surah ID from route `/surah/:id`

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

---

## 👤 **Profile.js**

### **State Variables:**
- `showDeleteConfirm` (boolean) - Delete confirmation dialog visibility
- `defaultFont` (string) - 'uthmani' | 'indopak' (NOT persisted, local state only)
- `showTransliteration` (boolean) - Show transliteration preference (NOT persisted, local state only)
- `autoScroll` (boolean) - Auto-scroll preference (NOT persisted, local state only)

### **localStorage:**
- **READ:** `quranProgress` - For calculating stats and exporting
- **WRITE:** `quranProgress` - When importing progress
- **REMOVE:** `quranProgress` - When clearing local data

### **Context:**
- `theme` (string)
- `isDark` (boolean)
- `toggleTheme` (function)

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
  icon: string (emoji),
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
- **READ:** `theme` - Loaded on initialization
- **WRITE:** `theme` - Saved whenever theme changes

### **Context Value:**
- `theme` (string)
- `toggleTheme` (function)
- `isDark` (boolean) - Derived from theme === 'dark'

---

## 📋 **Summary of All localStorage Keys**

1. **`quranProgress`** (object, JSON stringified)
   - Complete user progress data
   - Used in: App.js, SurahDetail.js, Profile.js
   - Structure: `{ [surahId]: { name, verses: { [verseNumber]: { memorized, lastReviewed } } } }`

2. **`theme`** (string)
   - Current theme preference
   - Used in: ThemeContext.js
   - Values: 'light' | 'dark'

3. **`quranFontPreference`** (string)
   - Selected Quran font
   - Used in: SurahDetail.js
   - Values: 'uthmani' | 'indopak'
   - Default: 'uthmani'

4. **`showTranslationPreference`** (string, JSON boolean)
   - Show/hide translation toggle
   - Used in: SurahDetail.js
   - Values: 'true' | 'false' (JSON stringified boolean)
   - Default: true

5. **`showTransliterationPreference`** (string, JSON boolean)
   - Show/hide transliteration toggle
   - Used in: SurahDetail.js
   - Values: 'true' | 'false' (JSON stringified boolean)
   - Default: true

6. **`arabicFontSize`** (string, number)
   - Arabic text font size in rem
   - Used in: SurahDetail.js
   - Default: '2.5'
   - Range: 1.0 - 4.0

7. **`translationFontSize`** (string, number)
   - Translation text font size in rem
   - Used in: SurahDetail.js
   - Default: '1.0'
   - Range: 0.7 - 2.0

8. **`transliterationFontSize`** (string, number)
   - Transliteration text font size in rem
   - Used in: SurahDetail.js
   - Default: '1.0'
   - Range: 0.7 - 2.0

---

## 🔄 **Data Flow Patterns**

### **Progress Updates:**
1. User marks verse in `SurahDetail.js`
2. `setUserProgress` updates state in `App.js`
3. `App.js` useEffect saves to `localStorage.quranProgress`
4. All components reading `userProgress` prop automatically update

### **Settings Updates:**
1. User changes setting in `SurahDetail.js` (font, translation, transliteration, font sizes)
2. State updates immediately
3. `useEffect` saves to respective localStorage key
4. On page reload, settings are restored from localStorage

### **Theme Updates:**
1. User toggles theme anywhere in app
2. `ThemeContext` updates state
3. `useEffect` saves to `localStorage.theme`
4. Theme applied to `document.documentElement` attribute

---

## ⚠️ **Inconsistencies & Issues Found**

1. **Profile.js Settings NOT Persisted:**
   - `defaultFont`, `showTransliteration`, `autoScroll` in Profile.js are local state only
   - These settings don't sync with `SurahDetail.js` settings
   - Should these be removed or made to sync?

2. **Duplicate Settings:**
   - `SurahDetail.js` has font/translation/transliteration settings (persisted)
   - `Profile.js` has similar settings (NOT persisted)
   - These should be unified

3. **Font Size Storage:**
   - Stored as strings in localStorage but used as numbers
   - Need to ensure consistent parsing

4. **Progress Data Structure:**
   - Some places check `userProgress[surahId].verses[verseNumber]`
   - Some places check `userProgress[surahId]?.verses?.[verseNumber]`
   - Should standardize optional chaining

---

## 📝 **Recommendations for Consistency**

1. **Create a unified settings service/context** for all user preferences
2. **Standardize localStorage key naming** (use consistent prefixes)
3. **Create type definitions** for all data structures
4. **Use a single source of truth** for default values
5. **Implement data validation** when reading from localStorage
6. **Add migration logic** for data structure changes
7. **Consider using a state management library** (Redux, Zustand) for complex state

