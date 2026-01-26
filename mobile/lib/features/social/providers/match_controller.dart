import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

part 'match_controller.g.dart';

@riverpod
class MatchController extends _$MatchController {
  
  @override
  Future<List<MatchRequest>> build() async {
    return _fetchMatches();
  }

  Future<List<MatchRequest>> _fetchMatches() async {
    final response = await ApiService.get('/matches');
    if (response is List) {
      return response.map((m) => MatchRequest.fromJson(m)).toList();
    }
    return [];
  }
  
  Future<void> joinMatch(String matchId) async {
    await ApiService.post('/matches/$matchId/join', {});
    ref.invalidateSelf(); // Refresh list after join
  }
}

// Controller for User Activity (Hosted/Joined)
@riverpod
class MatchActivityController extends _$MatchActivityController {
    
    @override
    Future<Map<String, List<dynamic>>> build() async {
        final response = await ApiService.get('/matches/my');
        return {
            'hosted': List<dynamic>.from(response['hosted'] ?? []),
            'joined': List<dynamic>.from(response['joined'] ?? [])
        };
    }
}
