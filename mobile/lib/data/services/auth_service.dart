import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import 'api_service.dart';

class AuthService {
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await ApiService.post('/auth/login', {
        'username': email,
        'password': password,
      }, auth: false);

      // Save Token & User Data
      if (response['access_token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, response['access_token']);
      }
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Register
  Future<Map<String, dynamic>> register(String name, String email, String password, String role) async {
    try {
      final response = await ApiService.post('/auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }, auth: false);
      
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }
  
  // Check if logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(AppConstants.tokenKey);
  }
}
