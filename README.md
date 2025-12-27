# Ascend AI Goal Tracker - Mobile (Expo)

This is the mobile version of the Ascend AI Goal Tracker, built with React Native and Expo.

## Features

- **Hierarchical Goals:** Create goals and sub-goals in a tree structure.
- **AI Integration:** Get AI-powered sub-goal suggestions and motivational boosts using Google's Gemini API.
- **Pomodoro Timer:** Focused work mode with a built-in Pomodoro timer.
- **Stats & Visualizations:** Track your progress with detailed stats and progress history.
- **Offline First:** All data is stored locally using `AsyncStorage`.

## Getting Started

1.  **Navigate to the project directory:**
    ```bash
    cd react_native_expo_application
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of this folder and add your Gemini API key:
    ```
    EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Start the development server:**
    ```bash
    npx expo start
    ```

5.  **Run on your device:**
    - Download the **Expo Go** app on your iOS or Android device.
    - Scan the QR code from the terminal to open the app.
    - Alternatively, press `a` for Android or `i` for iOS to run on an emulator/simulator.

## Tech Stack

- **Framework:** Expo (React Native)
- **State Management:** TanStack React Query
- **Navigation:** React Navigation (Bottom Tabs)
- **Icons:** Lucide React Native
- **AI:** Google Gemini API
- **Persistence:** AsyncStorage
