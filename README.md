# CrazyStore — Android Apps Showcase & Reviews Website

A modern, responsive Next.js 15 application designed to showcase custom native Android apps built with Kotlin & Jetpack Compose. Users can browse app details, view screenshots, download APKs, and submit star ratings and reviews stored in Supabase with rate-limiting protection.

---

## 🚀 Features

- **Home Page (`/`)**: Hero section, tech stack badges, category filtering, and app showcase grid featuring **VideoHub** (ad-free Kotlin/Compose YouTube client).
- **App Detail Page (`/apps/[slug]`)**: Deep dive into app specs, interactive screenshot previews, Google Drive APK download link, star rating summaries, review form, and real-time review list.
- **Supabase Integration**: Persists user reviews, star ratings, and review timestamps.
- **Server-Side API Route (`/api/reviews`)**:
  - `GET /api/reviews?appSlug=videohub`: Fetches reviews ordered by creation date and calculates average star ratings.
  - `POST /api/reviews`: Validates ratings (1-5 stars) and review text (min 10 chars) on the server before writing to Supabase.
  - **Rate Limiting**: Enforces max 1 review per client IP per app per 24 hours.
- **Theme Support**: Default dark mode with an instant toggle for light mode.
- **UI Feedback**: Skeleton loading states and toast notifications on review submission.

---

## 🛠️ Setup Instructions

### 1. How to Create a Supabase Project

1. Go to the [Supabase Console](https://console.supabase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `android-app-showcase`) and click **Continue**.
4. Disable or enable Google Analytics according to your preference, then click **Create project**.
5. Once created, navigate to **Build > Supabase Database** in the left sidebar.
6. Click **Create database**, select your database location, and start in **Test mode** (or Production mode with security rules).

---

### 2. How to Get Supabase Config Values & Set `.env.local`

1. In your Supabase Console project settings (**Project Overview > Project Settings** ⚙️), scroll down to **Your apps**.
2. Click the **Web icon (`</>`)** to register a web application.
3. Name the app (e.g., `CrazyStore Web`) and click **Register app**.
4. Supabase will display a configuration object similar to this:

```javascript
const supabaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "your-project.supabaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.supabasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};
```

5. In the root of your Next.js project, create a `.env.local` file and paste your credentials:

```env
```

---

### 3. How to Deploy to Vercel (Free)

1. Push your repository code to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import your GitHub repository.
5. Click **Deploy**. Vercel will automatically build and publish your Next.js App Router application on a free `.vercel.app` domain.

---

### 4. How to Add More Android Apps

To add a new Android app to your showcase:

1. Open `lib/appsData.ts`.
2. Append a new `AndroidApp` object to the `ANDROID_APPS` array:

```typescript
{
  slug: 'my-new-app',
  name: 'My New App',
  tagline: 'Short tagline describing your Android app',
  category: 'Tools & Utilities',
  version: 'v1.0.0',
  updatedAt: 'August 2026',
  size: '12.5 MB',
  minAndroid: 'Android 8.0 (API 26)+',
  iconBg: 'from-emerald-600 to-teal-600',
  iconSymbol: 'smartphone',
  badge: 'Kotlin + Compose',
  techStack: ['Kotlin', 'Jetpack Compose', 'Room Database'],
  downloadUrl: 'https://drive.google.com/file/d/YOUR_GOOGLE_DRIVE_FILE_ID/view?usp=sharing',
  shortDescription: 'Short description for the home page card grid.',
  fullDescription: [
    'Detailed paragraph 1 about your app functionality and architecture.',
    'Detailed paragraph 2 highlighting key features.'
  ],
  features: [
    'Feature line 1',
    'Feature line 2',
    'Feature line 3'
  ],
  screenshots: [
    {
      id: '1',
      title: 'Main Dashboard',
      subtitle: 'Compose UI preview',
      accentColor: 'from-emerald-900/40 to-teal-900/20',
      type: 'feed'
    }
  ],
  initialRating: 5.0,
  initialReviewCount: 1
}
```

3. Save the file. The new app card will automatically appear on the home page grid (`/`) and its dedicated page will be generated at `/apps/my-new-app`.
