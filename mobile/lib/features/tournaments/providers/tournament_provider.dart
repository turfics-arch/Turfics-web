import 'package:flutter/material.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

class TournamentProvider with ChangeNotifier {
  List<Tournament> _tournaments = [];
  bool _isLoading = false;
  String? _error;

  List<Tournament> get tournaments => _tournaments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchTournaments({String? sport}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final queryParam = sport != null && sport != 'All' ? '?sport=$sport' : '';
      final response = await ApiService.get('/tournaments$queryParam');
      if (response is List) {
        _tournaments = response.map((t) => Tournament.fromJson(t)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
