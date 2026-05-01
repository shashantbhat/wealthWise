# Firebase Setup Guide for WealthWise

## What's Been Set Up

I've created a complete Firebase authentication system for your app with the following files:

### New Files Created:

1. **`app/utils/firebaseConfig.ts`** - Firebase initialization
2. **`context/auth-context.tsx`** - Authentication context with login/signup/logout functionality
3. **`app/signup.tsx`** - Complete signup screen with email/password validation
4. **`.env.local`** - Environment variables template
5. **Updated `app/_layout.tsx`** - Added AuthProvider and signup route

## Step-by-Step Setup

### 1. **Get Firebase Credentials**

- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Click ⚙️ (Settings) → Project Settings
- Go to "Your apps" section
- If you don't see a web app, click "Add app" and select Web
- Copy your Firebase config values

### 2. **Setup Environment Variables**

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and replace the placeholder values with your actual Firebase credentials:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=yourproject
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**⚠️ Important:** `.env.local` is in `.gitignore` and should NEVER be committed to git. Each developer must create their own `.env.local` file locally.

### 3. **Enable Email/Password Authentication in Firebase**

- Go to Firebase Console → Authentication
- Click "Sign-in method"
- Enable "Email/Password" provider
- Save

### 4. **Test the Signup Flow**

#### Current Navigation Flow:

```
Landing Screen → Signup → Onboarding Questionnaire → Main App (Tabs)
```

The landing screen now has a "Continue" button that will take users to:

1. **Sign up page** - Create account with email/password
2. **Onboarding questionnaire** - Answer financial questions
3. **Main app** - Access the dashboard

## How to Integrate the Signup Page

To navigate to the signup page from your landing screen or anywhere else:

```typescript
import { useRouter } from "expo-router";

const router = useRouter();
router.push("/signup");
```

## Using Auth Context in Components

To check if user is logged in or access user data in any component:

```typescript
import { useAuth } from '@/context/auth-context';

export default function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Welcome, {user?.email}</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Available Auth Functions

```typescript
const {
  user, // Current logged-in user or null
  loading, // True while checking auth state
  signup, // (email, password) => Promise
  login, // (email, password) => Promise
  logout, // () => Promise
  error, // Error message if any
} = useAuth();
```

## Next Steps

1. ✅ Add your Firebase credentials to `.env.local`
2. ✅ Enable Email/Password auth in Firebase Console
3. ✅ Test the signup flow with `npm start`
4. (Optional) Modify where the signup screen appears in the onboarding flow
5. (Optional) Add features like email verification, password reset, etc.

## Troubleshooting

**Firebase not initializing?**

- Check that `.env.local` has all 6 required variables
- Ensure variables start with `EXPO_PUBLIC_`
- Restart your dev server: `npm start -- --clear`

**Auth state not persisting?**

- The app uses AsyncStorage for persistence on native platforms
- Web uses browser localStorage automatically

**Signup failing?**

- Check Firebase console authentication settings
- Ensure Email/Password is enabled in Sign-in methods
- Check console logs for specific Firebase errors
