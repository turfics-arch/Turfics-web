import 'package:flutter/material.dart';
import 'dart:io';

class AppConstants {
  // Networking
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://127.0.0.1:5000/api'; // Windows, iOS Simulator, Web
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
  static const Color primary = Color(0xFF00E676); // Green
  static const Color primaryDark = Color(0xFF00B359);
  static const Color secondary = Color(0xFF2979FF); // Blue
  static const Color accent = Color(0xFFFF3D00); // Orange
  
  // Backgrounds
  static const Color background = Color(0xFF0A0A0A); // Near Black
  static const Color surface = Color(0xFF1E1E1E); // Dark Gray
  static const Color surfaceLight = Color(0xFF2C2C2C);
  
  // Text
  static const Color textMain = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0B0B0);
  
  // Feedback
  static const Color success = Color(0xFF00C853);
  static const Color warning = Color(0xFFFFD600);
  static const Color error = Color(0xFFDD2C00);
  
  // Glassmorphism
  static const Color glass = Color.fromRGBO(30, 30, 30, 0.7);
  static const Color glassBorder = Color.fromRGBO(255, 255, 255, 0.1);
}
