import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../data/services/auth_service.dart';
import '../../../core/constants/constants.dart';

part 'auth_controller.g.dart';

// State class to hold the Auth State
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? role;
  final String? error;

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.role,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? role,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      role: role ?? this.role,
      error: error,
    );
  }
}

// Generates a Riverpod Notifier
@riverpod
class AuthController extends _$AuthController {
  final AuthService _authService = AuthService();

  @override
  AuthState build() {
    return AuthState();
  }

  // Init - Check shrd_prefs
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey(AppConstants.tokenKey)) {
      final role = prefs.getString('user_role');
      state = state.copyWith(isAuthenticated: true, role: role);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authService.login(email, password);
      final role = response['role'];
      
      final prefs = await SharedPreferences.getInstance();
      if (role != null) {
        await prefs.setString('user_role', role);
      }

      state = state.copyWith(isLoading: false, isAuthenticated: true, role: role);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }
  
  Future<void> register(String username, String email, String password, String role) async {
      state = state.copyWith(isLoading: true, error: null);
      try {
          final response = await _authService.register(username, email, password, role);
          // Assuming implementation logic similar to existing provider
           if (response['access_token'] != null) {
               final prefs = await SharedPreferences.getInstance();
               await prefs.setString(AppConstants.tokenKey, response['access_token']);
               await prefs.setString('user_role', role);
               state = state.copyWith(isAuthenticated: true, role: role, isLoading: false);
           } else {
               state = state.copyWith(isLoading: false); // Just registered, no auto-login?
           }
      } catch (e) {
          state = state.copyWith(isLoading: false, error: e.toString());
          rethrow;
      }
  }

  Future<void> logout() async {
    await _authService.logout();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_role');
    state = AuthState(); // Reset state
  }
}
