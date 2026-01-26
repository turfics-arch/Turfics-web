import 'package:flutter/material.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

class CoachProvider with ChangeNotifier {
  List<Coach> _coaches = [];
  List<Academy> _academies = [];
  bool _isLoading = false;
  String? _error;

  List<Coach> get coaches => _coaches;
  List<Academy> get academies => _academies;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchCoaches() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/coaches');
      if (response is List) {
        _coaches = response.map((c) => Coach.fromJson(c)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAcademies() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/academies');
      if (response is List) {
        _academies = response.map((a) => Academy.fromJson(a)).toList();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
