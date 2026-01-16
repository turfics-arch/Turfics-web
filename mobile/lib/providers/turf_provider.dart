import 'package:flutter/material.dart';
import '../data/services/api_service.dart';
import '../data/models/models.dart';

class TurfProvider with ChangeNotifier {
  List<Turf> _turfs = [];
  List<Turf> _filteredTurfs = [];
  bool _isLoading = true;

  List<Turf> get turfs => _filteredTurfs;
  bool get isLoading => _isLoading;

  String _selectedSport = 'All';
  String _searchQuery = '';

  Future<void> fetchTurfs() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Assuming GET /turfs returns a list
      final response = await ApiService.get('/turfs', auth: false);
      
      if (response is List) {
        _turfs = response.map((json) => Turf.fromJson(json)).toList();
        _applyFilters();
      }
    } catch (e) {
      print('Error fetching turfs: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  void setSportFilter(String sport) {
    _selectedSport = sport;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    _filteredTurfs = _turfs.where((turf) {
      final matchesSearch = turf.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                            turf.location.toLowerCase().contains(_searchQuery.toLowerCase());
      
      final matchesSport = _selectedSport == 'All' || 
                           turf.sports.any((s) => s.toLowerCase() == _selectedSport.toLowerCase());

      return matchesSearch && matchesSport;
    }).toList();
  }
}
