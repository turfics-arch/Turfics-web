import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../data/services/api_service.dart';
import '../../../data/models/models.dart';

part 'booking_controller.g.dart';

// State for Booking
class BookingState {
    final bool isLoading;
    final List<Map<String, dynamic>> slots;
    final Turf? fullTurf;
    final String? error;

    BookingState({
        this.isLoading = false,
        this.slots = const [],
        this.fullTurf,
        this.error,
    });
    
    BookingState copyWith({
        bool? isLoading,
        List<Map<String, dynamic>>? slots,
        Turf? fullTurf,
        String? error,
    }) {
        return BookingState(
            isLoading: isLoading ?? this.isLoading,
            slots: slots ?? this.slots,
            fullTurf: fullTurf ?? this.fullTurf,
            error: error,
        );
    }
}

@riverpod
class BookingController extends _$BookingController {
  
  @override
  BookingState build() {
    return BookingState();
  }

  // Fetch Full Turf
  Future<Turf?> fetchFullTurfDetails(String turfId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiService.get('/turfs/$turfId/full');
      final turf = Turf.fromJson(response);
      state = state.copyWith(isLoading: false, fullTurf: turf);
      return turf;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // Fetch Slots
  Future<void> fetchSlots(String unitId, String date) async {
    state = state.copyWith(isLoading: true, slots: [], error: null);
    try {
      final response = await ApiService.get('/units/$unitId/slots?date=$date');
      if (response is List) {
         final slots = List<Map<String, dynamic>>.from(response);
         state = state.copyWith(isLoading: false, slots: slots);
      } else {
         state = state.copyWith(isLoading: false, slots: []);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  // Hold Slot
  Future<Map<String, dynamic>> holdSlot({
    required String unitId,
    required String startTime,
    required String endTime,
    required double price,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiService.post('/bookings', {
        'turf_unit_id': unitId,
        'start_time': startTime,
        'end_time': endTime,
        'total_price': price,
      });
      state = state.copyWith(isLoading: false);
      return response;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }
}
