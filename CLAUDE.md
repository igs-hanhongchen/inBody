# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

inBody is a React-based body metrics tracking application that stores data in Google Sheets. Users authenticate via Google OAuth, input their body composition measurements (weight, BMI, body fat, muscle mass, etc.), and visualize trends over time using interactive charts.

## Development Commands

```bash
npm run dev      # Start development server on port 5173
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Frontend**: React 19.2 + Vite (using rolldown-vite variant)
- **Styling**: Tailwind CSS 4.x with PostCSS
- **Charts**: Recharts for data visualization
- **Icons**: lucide-react
- **Data Storage**: Google Sheets API
- **Authentication**: Google Identity Services (GIS) for OAuth

## Architecture

### Single-Page Application Structure
- [src/main.jsx](src/main.jsx) - Application entry point
- [src/App.jsx](src/App.jsx) - Main component containing all UI and state logic
- [src/services/googleSheets.js](src/services/googleSheets.js) - Google Sheets API integration layer

### Authentication & Data Flow
1. **Token Management**: OAuth tokens are stored in `localStorage` with 55-minute expiry
2. **Auto-Refresh**: Tokens automatically refresh silently before expiration
3. **Persistent Login**: Users remain logged in across browser sessions via localStorage
4. **API Calls**: All Google Sheets operations (read/write) check token validity first

### Google Sheets Integration
- Environment variables in [.env](.env) configure:
  - `VITE_GOOGLE_CLIENT_ID` - OAuth 2.0 client ID
  - `VITE_SPREADSHEET_ID` - Target Google Sheets document ID
  - `VITE_SHEETS_RANGE` - Sheet name and column range (e.g., "2026!A:I")

- Data columns (in order): Date, Weight, BMI, Body Fat %, Muscle Mass, Bone Mass, Visceral Fat, Basal Metabolism, Body Age

### Key Features Implementation
- **Form Auto-fill**: Last recorded values pre-populate the form (except date)
- **Data Visualization**: 8 separate line charts for each metric
- **Recent History**: Table displays last 14 records in reverse chronological order
- **Error Handling**: User-facing error messages for auth and API failures

## Important Notes

### Google OAuth Setup
Reference [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for detailed Google Cloud Console configuration. Key requirements:
- Enable Google Sheets API in Google Cloud Console
- Configure OAuth consent screen with test users
- Add `http://localhost:5173` (and 5174, 5175) to authorized JavaScript origins
- Scope required: `https://www.googleapis.com/auth/spreadsheets`

### Token Management Details
The [googleSheets.js](src/services/googleSheets.js) service handles:
- Token storage in `localStorage` with expiry timestamps
- Silent token refresh using `prompt: ''` parameter
- Automatic token revocation on logout
- Auth error detection (401/403) triggers token clearing

### Vite Configuration
This project uses `rolldown-vite` (Vite 7.2.5 with Rolldown bundler) instead of standard Vite. The [vite.config.js](vite.config.js) enforces strict port 5173 to match OAuth configuration.

### ESLint Configuration
The [eslint.config.js](eslint.config.js) uses flat config format with:
- React Hooks linting rules
- React Refresh for HMR
- Ignores unused variables matching pattern `^[A-Z_]` (constants)

## Common Development Tasks

### Adding New Body Metrics
1. Update `metrics` array in [App.jsx](src/App.jsx:35-44) with new metric definition
2. Add corresponding field to `formData` state initialization
3. Update Google Sheets column mapping in `readSheetData()` and `appendSheetData()` functions
4. Update `VITE_SHEETS_RANGE` in [.env](.env) if column count changes

### Modifying Chart Appearance
Chart configuration is in the `ChartSection` component ([App.jsx](src/App.jsx:166-223)). Each metric has:
- Custom icon from lucide-react
- Color code for chart line and icon background
- Recharts `LineChart` component with responsive container

### Debugging Authentication Issues
1. Check browser console for detailed error messages from `googleSheets.js`
2. Verify `.env` values match Google Cloud Console credentials
3. Ensure test users are added in OAuth consent screen (required for testing mode)
4. Clear localStorage and retry: `localStorage.clear()`
5. Check browser allows third-party cookies (required for Google Identity Services)

## File References

- Environment config: [.env](.env)
- OAuth setup guide: [GOOGLE_SETUP.md](GOOGLE_SETUP.md)
- Main application: [src/App.jsx](src/App.jsx)
- Google API service: [src/services/googleSheets.js](src/services/googleSheets.js)
- Build config: [vite.config.js](vite.config.js)
- Linter config: [eslint.config.js](eslint.config.js)
