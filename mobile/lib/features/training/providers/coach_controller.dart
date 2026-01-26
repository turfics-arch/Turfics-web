import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

part 'coach_controller.g.dart';

@riverpod
class CoachController extends _$CoachController {
  
  @override
  Future<List<Coach>> build() async {
    return _fetchCoaches();
  }

  Future<List<Coach>> _fetchCoaches() async {
    final response = await ApiService.get('/coaches');
    if (response is List) {
      return response.map((c) => Coach.fromJson(c)).toList();
    }
    return [];
  }
}

@riverpod
class AcademyController extends _$AcademyController {
  
  @override
  Future<List<Academy>> build() async {
    return _fetchAcademies();
  }

  Future<List<Academy>> _fetchAcademies() async {
      final response = await ApiService.get('/academies');
      if (response is List) {
        return response.map((a) => Academy.fromJson(a)).toList();
      }
      return [];
  }
}
