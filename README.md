# wealthWise

A comprehensive financial wellness app built with React Native and Expo.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd wealthWise
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup Firebase Configuration**

The app uses Firebase for authentication. You need to set up your environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase credentials from [Firebase Console](https://console.firebase.google.com).

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed Firebase setup instructions.

4. **Run the app**

```bash
npm start
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

## Features

### Goals Tab

Plan and track your financial goals with intelligent SIP calculations.

**Key Features:**

- **Goal Creation**: Set financial goals with target amount, time horizon, and existing lumpsum
- **SIP Calculator**: Automatically calculates required monthly SIP amounts based on expected returns
- **Investment Options**: Compare multiple investment options with different risk profiles and expected returns
- **Yearly Tracking**: Update portfolio performance annually and adjust SIP amounts
- **Lumpsum Integration**: Add extra lump sum investments to reduce monthly SIP requirements

**How it works:**

1. Create a goal by entering name, target amount, time horizon, and any existing lumpsum
2. View calculated SIP amounts for various investment options (FD, Mutual Funds, etc.)
3. Each year, update your portfolio value and add any lumpsum investments
4. The app recalculates remaining SIP requirements based on your progress

**Investment Options Available:**

- Fixed Deposit (6.5% expected return, Low risk)
- Balanced Advantage Fund (10% expected return, Medium risk)
- Large Cap Mutual Fund (12% expected return, Medium risk)
- Multi Asset Fund (11% expected return, Medium risk)
- Equity Savings Fund (9% expected return, Low risk)
- Aggressive Hybrid Fund (13% expected return, High risk)
- Mid Cap Fund (14% expected return, High risk)
- Small Cap Fund (16% expected return, High risk)
