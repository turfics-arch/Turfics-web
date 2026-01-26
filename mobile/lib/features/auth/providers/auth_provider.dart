import 'package:flutter/material.dart';
import '../../../data/services/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/constants.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  
  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  String? _role;
  String? get role => _role;

  // Initialize (Check if token exists on app start)
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey(AppConstants.tokenKey)) {
      _isAuthenticated = true;
      _role = prefs.getString('user_role'); // Load role
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _authService.login(email, password);
      _isAuthenticated = true;
      _role = response['role'];
      
      // Persist role
      final prefs = await SharedPreferences.getInstance();
      if (_role != null) {
        await prefs.setString('user_role', _role!);
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> register(String name, String email, String password, String role) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _authService.register(name, email, password, role);
      // Auto-login logic if backend returns token on register, effectively same as login outcome
      // But usually we might require login again or the API returns token.
      // Assuming backend returns same structure or we just redirect to login logic.
      // For now, let's assume we just register and user logs in manually, or we handle auto-login if token is present.
      if (response['access_token'] != null) {
          _isAuthenticated = true;
          _role = role; // Trust the requested role or response role
           final prefs = await SharedPreferences.getInstance();
           await prefs.setString(AppConstants.tokenKey, response['access_token']);
           await prefs.setString('user_role', role);
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    await _authService.logout();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_role');
    _isAuthenticated = false;
    _role = null;
    notifyListeners();
  }
}
