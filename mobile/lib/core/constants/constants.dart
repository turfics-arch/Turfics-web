import 'package:flutter/material.dart';
import 'dart:io';

class AppConstants {
  // Networking
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://127.0.0.1:5000'; // Windows, iOS Simulator, Web
  } 
  
  // Padding & Spacing
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  
  // Storage Keys
  static const String tokenKey = 'jwt_token';
  static const String userKey = 'user_data';
}

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFF004D40); // Dark Green
  static const Color primaryLight = Color(0xFF00695C);
  static const Color accent = Color(0xFF00E676); // Neon Green (CTA)
  static const Color accentOrange = Color(0xFFFF6D00); // Secondary CTA

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkSurfaceLight = Color(0xFF2C2C2C);
  
  // Light Mode Colors
  static const Color lightBackground = Color(0xFFF5F5F5); // Off-white
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceDark = Color(0xFFE0E0E0);

  // Text
  static const Color textMainDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFB0B0B0);
  
  static const Color textMainLight = Color(0xFF1A1A1A);
  static const Color textSecondaryLight = Color(0xFF616161);
  
  // Feedback
  static const Color success = Color(0xFF00C853);
  static const Color warning = Color(0xFFFFD600);
  static const Color error = Color(0xFFDD2C00);
  
  // Glassmorphism (Dark)
  static const Color glassDark = Color.fromRGBO(30, 30, 30, 0.7);
  static const Color glassBorderDark = Color.fromRGBO(255, 255, 255, 0.1);

  // Glassmorphism (Light)
  static const Color glassLight = Color.fromRGBO(255, 255, 255, 0.8);
  static const Color glassBorderLight = Color.fromRGBO(0, 0, 0, 0.05);

  // --- COMPATIBILITY LAYER (Fixes Method not found errors) ---
  static const Color background = darkBackground; // Was 0xFF0A0A0A, darkBackground is 0xFF121212 - close enough or revert if needed
  static const Color surface = darkSurface;
  static const Color surfaceLight = darkSurfaceLight;
  static const Color textMain = textMainDark;
  static const Color textSecondary = textSecondaryDark;
  
  static const Color primaryDark = Color(0xFF00B359); // Restored
  static const Color secondary = Color(0xFF2979FF); // Restored
  
  static const Color glass = glassDark;
  static const Color glassBorder = glassBorderDark;
}
