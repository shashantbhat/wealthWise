# User Context Storage Guide

## Overview

All user data in the app flows through a single unified storage system: **`userContextStorage.ts`**

This is the **single source of truth** for all user context across the entire application.

## Architecture

### Single File Storage

- **File**: `app/utils/userContextStorage.ts`
- **Storage Type**: AsyncStorage (persisted to device)
- **Key**: `"wealthwise_user_context"`

### Data Structure

The unified context contains three main sections:

```typescript
UserContext {
  // 1. Questionnaire answers (from onboarding)
  questionnaireAnswers: QuestionnaireAnswers,

  // 2. Structured profile (after questionnaire completion)
  profile: UserProfile,

  // 3. Preferences and settings
  preferences: UserPreferences,

  // Timestamps
  createdAt: number,
  updatedAt: number,
  lastModified: number
}
```

## How to Use

### In React Components Using Context Hook

```typescript
import { useUser } from "@/context/user-context";

export function MyComponent() {
  const { profile, monthlyIncome, userName } = useUser();
  // Use data normally
}
```

### Direct Storage Access (anywhere in the app)

```typescript
import {
  loadUserContext,
  getMonthlyIncome,
  updateUserProfile,
  getQuestionnaireAnswers,
} from "@/app/utils/userContextStorage";

// Load complete context
const context = await loadUserContext();

// Get specific values
const income = await getMonthlyIncome();
const answers = await getQuestionnaireAnswers();

// Update profile
await updateUserProfile({ name: "John", monthlyIncome: 50000 });

// Update preferences
await updateUserPreferences({ theme: "dark" });
```

## Data Flow

### Initial Setup (Onboarding)

```
Questionnaire Component
    ↓
updateQuestionnaireAnswers()
    ↓
userContextStorage.ts (persisted)
    ↓
user-context.tsx (synced on load)
    ↓
useUser() hook (available everywhere)
```

### Profile Update

```
Any Component
    ↓
updateUserProfile()
    ↓
userContextStorage.ts (persisted)
    ↓
user-context.tsx (stays in sync)
    ↓
UI Re-renders with new data
```

### Reading User Data

- **Via Context Hook**: `useUser()` - preferred in React components
- **Direct Function**: Any utility can import and call storage functions
- **Expense Context**: Reads from user context for income
- **Insights Screen**: Reads from user context for budget calculations

## Key Functions

### Questionnaire Management

- `loadUserContext()` - Get complete context
- `updateQuestionnaireAnswers(answers)` - Update from onboarding
- `getQuestionnaireAnswers()` - Get raw answers
- `clearQuestionnaireAnswers()` - Reset onboarding

### Profile Management

- `updateUserProfile(partial)` - Update profile data
- `getUserProfile()` - Get full profile
- `getMonthlyIncome()` - Get income (convenience)
- `updateMonthlyIncome(amount)` - Update income

### Preferences

- `updateUserPreferences(partial)` - Update settings
- `getUserPreferences()` - Get all preferences
- `getPreference(key)` - Get single preference

### Utilities

- `isOnboardingComplete()` - Check if setup is done
- `exportUserContextAsJSON()` - Export data
- `resetUserContext()` - Clear everything (restart app)

## Integration Pattern

### For New Features

When you need user data:

1. **First**, check if data exists in the unified storage
2. **Import** the required function from `userContextStorage.ts`
3. **Use** it in your component or utility
4. **Update** through the storage functions to persist

Example:

```typescript
// Import storage function
import { updateUserProfile } from "@/app/utils/userContextStorage";

// Update data
await updateUserProfile({ persona: "Investor" });

// Any other component sees the change immediately
```

## What's Stored

### Questionnaire Answers

- Name, age group, occupation
- Income, savings rate, goals
- Investment knowledge, risk preference
- Payment methods, saving locations

### Profile

- User name and persona
- Monthly income and salary day
- Risk level and base currency

### Preferences

- Theme (light/dark/auto)
- Notifications settings
- Currency and language
- Reminder preferences

## Benefits

✅ **Single Source of Truth**: All data in one place  
✅ **Automatic Persistence**: AsyncStorage handles it automatically  
✅ **Easy Updates**: Change one thing, visible everywhere  
✅ **Context Integration**: Works seamlessly with React Context  
✅ **Direct Access**: Any utility can read/write  
✅ **Timestamps**: Track when data was created/modified  
✅ **Type-Safe**: Full TypeScript support

## Example: Updating Income from Any Component

```typescript
import { updateMonthlyIncome } from "@/app/utils/userContextStorage";

// Somewhere in settings screen
const handleIncomeChange = async (newIncome: number) => {
  await updateMonthlyIncome(newIncome);
  // This automatically updates:
  // - userContextStorage.ts (persisted)
  // - user-context.tsx (synced)
  // - All useUser() hooks (re-render)
  // - Expense context (reads from user context)
};
```

## Migration Notes

If adding new user data:

1. Add field to appropriate interface (QuestionnaireAnswers, UserProfile, or UserPreferences)
2. Update DEFAULT values in `userContextStorage.ts`
3. Add getter/setter function if needed
4. Update this documentation
