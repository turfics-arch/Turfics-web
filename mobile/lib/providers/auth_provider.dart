import 'package:flutter/material.dart';
import '../data/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  
  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  // Initialize (Check if token exists on app start)
  Future<void> init() async {
    _isAuthenticated = await _authService.isLoggedIn();
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.login(email, password);
      _isAuthenticated = true;
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
      await _authService.register(name, email, password, role);
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
    _isAuthenticated = false;
    notifyListeners();
  }
}
