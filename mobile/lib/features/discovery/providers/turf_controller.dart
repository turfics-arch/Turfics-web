import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../data/services/api_service.dart';
import '../../../data/models/models.dart';

part 'turf_controller.g.dart';

@riverpod
class TurfController extends _$TurfController {
  
  List<Turf> _allTurfs = []; // Cache all fetched turfs

  @override
  Future<List<Turf>> build() async {
    return _fetchTurfs();
  }

  Future<List<Turf>> _fetchTurfs() async {
    try {
      final response = await ApiService.get('/turfs', auth: false);
      if (response is List) {
        _allTurfs = response.map((json) => Turf.fromJson(json)).toList();
        return _allTurfs;
      }
      return [];
    } catch (e) {
      // Return empty or rethrow?
      // print('Error fetching turfs: $e'); 
      rethrow;
    }
  }

  // Filter Actions - Instead of mutating internal state, we can use a separate provider for filters 
  // OR verify simple filtering here by parameterized family if complex, or just method.
  // BUT `build` returns the List<Turf>. If we want to filter, we should ideally have the state be the filtered list?
  // Or better: Have a `turfFilterProvider` and this provider just holds the data.
  // For simplicity matching the legacy provider pattern:
  
  // Actually, let's keep it simple: State is the list of VISIBLE turfs.
  // But we need to keep _allTurfs cached.
  
  void filter(String query, String sport) {
      if (_allTurfs.isEmpty) return; // Wait for load

      final filtered = _allTurfs.where((turf) {
        final matchesSearch = turf.name.toLowerCase().contains(query.toLowerCase()) || 
                              turf.location.toLowerCase().contains(query.toLowerCase());
        
        final matchesSport = sport == 'All' || 
                             turf.sports.any((s) => s.toLowerCase() == sport.toLowerCase());

        return matchesSearch && matchesSport;
      }).toList();
      
      state = AsyncValue.data(filtered);
  }
  
  Future<void> refresh() async {
      state = const AsyncValue.loading();
      state = await AsyncValue.guard(() => _fetchTurfs());
  }
}

// Simple provider for filter state if we want UI to drive it
@riverpod
class TurfFilter extends _$TurfFilter {
  @override
  Map<String, String> build() => {'query': '', 'sport': 'All'};

  void setQuery(String q) => state = {...state, 'query': q};
  void setSport(String s) => state = {...state, 'sport': s};
}
