import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

part 'tournament_controller.g.dart';

@riverpod
class TournamentController extends _$TournamentController {
  
  @override
  Future<List<Tournament>> build({String? sport}) async {
    final queryParam = sport != null && sport != 'All' ? '?sport=$sport' : '';
    final response = await ApiService.get('/tournaments$queryParam');
    if (response is List) {
      return response.map((t) => Tournament.fromJson(t)).toList();
    }
    return [];
  }
}
