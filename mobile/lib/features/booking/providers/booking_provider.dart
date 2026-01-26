import 'package:flutter/material.dart';
import '../../../data/services/api_service.dart';
import '../../../data/models/models.dart';

class BookingProvider with ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Map<String, dynamic>> _slots = [];
  List<Map<String, dynamic>> get slots => _slots;

  Turf? _fullTurf;
  Turf? get fullTurf => _fullTurf;

  // Fetch Full Turf Details (Games, Units, etc.)
  Future<Turf> fetchFullTurfDetails(String turfId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.get('/turfs/$turfId/full');
      _fullTurf = Turf.fromJson(response);
      notifyListeners();
      return _fullTurf!;
    } catch (e) {
      print('Error fetching full turf details: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch Slots for a specific Unit and Date
  Future<void> fetchSlots(String unitId, String date) async {
    _isLoading = true;
    _slots = []; // Clear previous
    notifyListeners();

    try {
      // Endpoint: /api/units/<int:unit_id>/slots?date=YYYY-MM-DD
      final response = await ApiService.get('/units/$unitId/slots?date=$date');
      if (response is List) {
        _slots = List<Map<String, dynamic>>.from(response);
      }
    } catch (e) {
      print('Error fetching slots: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Hold a Slot (Updated to use unit_id and start/end times if needed by backend)
  Future<Map<String, dynamic>> holdSlot({
    required String unitId,
    required String startTime,
    required String endTime,
    required double price,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Matching web app's POST /api/bookings
      final response = await ApiService.post('/bookings', {
        'turf_unit_id': unitId,
        'start_time': startTime,
        'end_time': endTime,
        'total_price': price,
      });
      return response;
    } catch (e) {
      print('Error holding slot: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
