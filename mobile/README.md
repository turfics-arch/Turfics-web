# Turfics Mobile App

## Prerequisites
- **Flutter SDK**: Installed and configured.
- **Python-Flask**: For the backend.
- **Android Studio / VS Code**: With Flutter extensions.
- **Emulator or Device**: To run the app.

## Setup & Running

### 1. Start the Backend
The mobile app needs the backend to login and fetch data.

1. Open a terminal.
2. Navigate to `backend/`.
3. Run the Flask app:
   ```bash
   python app.py
   ```
   *Ensure it says `Running on http://127.0.0.1:5000`*

### 2. Run the Mobile App

1. Open a new terminal.
2. Navigate to `mobile/`.
3. Get dependencies:
   ```bash
   flutter pub get
   ```
4. Run the app:
   - **For Android Emulator**:
     ```bash
     flutter run
     ```
     *(The app is configured to use `10.0.2.2` to talk to localhost)*
   
   - **For Windows Desktop**:
     ```bash
     flutter run -d windows
     ```

## Troubleshooting
- **Connection Error**: 
  - Ensure backend is running.
  - If using a **real Android device**, update `lib/core/constants.dart` with your PC's LAN IP (e.g., `192.168.1.5`) instead of `10.0.2.2`.
