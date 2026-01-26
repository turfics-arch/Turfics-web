import 'package:flutter/material.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

class MatchProvider with ChangeNotifier {
  List<MatchRequest> _matches = [];
  List<dynamic> _hostedMatches = [];
  List<dynamic> _joinedMatches = [];
  bool _isLoading = false;
  String? _error;

  List<MatchRequest> get matches => _matches;
  List<dynamic> get hostedMatches => _hostedMatches;
  List<dynamic> get joinedMatches => _joinedMatches;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMatches() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/matches');
      if (response is List) {
        _matches = response.map((m) => MatchRequest.fromJson(m)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMyActivity() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/matches/my');
      _hostedMatches = response['hosted'] ?? [];
      _joinedMatches = response['joined'] ?? [];
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> joinMatch(String matchId) async {
    try {
      await ApiService.post('/matches/$matchId/join', {});
    } catch (e) {
      rethrow;
    }
  }
}
