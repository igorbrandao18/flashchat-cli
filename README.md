# 🌟 FlashChat - Modern Mobile Messaging

A sleek and powerful real-time chat application built with Expo (React Native) and Supabase, featuring a WhatsApp-inspired design. Perfect for learning modern mobile development practices.

## 🚀 Features

- 👤 User Authentication (Email)
- 💬 Real-time Individual Chat
- 🌓 Dark/Light Mode Support
- 🎨 WhatsApp-inspired UI/UX
- 🔄 Real-time Message Sync
- 📱 Responsive Design
- 🔒 Secure Authentication
- 💾 Persistent Data Storage
- 👥 Online/Offline Status
- 📱 Multi-device Support

## 🛠 Tech Stack

- **Frontend**:
  - Expo SDK 50
  - React Native
  - React Navigation 6
  - Expo Router
  - TypeScript
  - React Native Elements
  - Expo Vector Icons

- **Backend** (100% Supabase):
  - Authentication
  - Real-time Database
  - Row Level Security (RLS)
  - PostgreSQL
  - Real-time Subscriptions
  - Edge Functions

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- Git
- Xcode (for iOS development)
- iOS Simulator
- Expo CLI (`npm install -g expo-cli`)
- Supabase Account

## 🚀 Installation & Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/igorbrandao18/flashchat-cli.git
cd flashchat-cli

# Install dependencies
npm install
# or
yarn install
```

### 2. Supabase Setup

1. Create a new project at [Supabase Dashboard](https://app.supabase.com)
2. Get your project credentials:
   - Project URL
   - Anon Public Key

3. Set up environment variables:
   ```bash
   # Create .env file
   cp .env.example .env

   # Edit .env with your Supabase credentials
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. iOS Setup

1. Install Xcode from the Mac App Store

2. Install iOS Simulator:
   - Open Xcode
   - Go to Preferences > Components
   - Download a simulator (preferably iOS 17.0 or newer)

3. Install Cocoapods (if not installed):
   ```bash
   sudo gem install cocoapods
   ```

4. Install iOS dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

## 🏃‍♂️ Running the App

### iOS Simulator

1. Start Expo development server:
   ```bash
   npx expo start
   ```

2. Press `i` to open in iOS Simulator
   - This will build the app and launch it in your default iOS Simulator
   - First build might take a few minutes

3. Alternative method (if you prefer Xcode):
   ```bash
   # Open the project in Xcode
   open ios/FlashChat.xcworkspace

   # Then press Play ▶️ in Xcode
   ```

### Troubleshooting iOS

If you encounter issues:

1. Clear Metro bundler cache:
   ```bash
   npx expo start --clear
   ```

2. Reset iOS Simulator:
   - Hardware > Erase All Content and Settings

3. Rebuild iOS:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   npx expo run:ios
   ```

## 🎨 App Features

### Authentication
- Email/Password Sign Up
- Secure Login
- Password Reset
- Session Management

### Chat Features
- Real-time Messaging
- Online/Offline Status
- Multi-device Support
- Message Status (Sent/Delivered/Read)
- Typing Indicators

### UI/UX
- WhatsApp-inspired Design
- Dark/Light Mode
- Smooth Animations
- Native iOS Gestures
- Pull to Refresh
- Swipe Actions

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run tests
npm test

# Type checking
npm run typescript

# Lint code
npm run lint
```

### Project Structure

```
src/
├── app/              # Expo Router screens
├── components/       # Reusable components
├── config/          # Configuration files
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── services/        # API services
└── utils/           # Utility functions
```

## 👥 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Igor Brandão
- GitHub: [@igorbrandao18](https://github.com/igorbrandao18)
- LinkedIn: [Igor Brandão](https://www.linkedin.com/in/igor-brandao/)

## 🙏 Acknowledgments

- [Expo Team](https://expo.dev)
- [Supabase Team](https://supabase.com)
- [React Native Community](https://reactnative.dev)