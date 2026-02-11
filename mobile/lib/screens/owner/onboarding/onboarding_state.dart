import 'package:flutter/material.dart';
import 'package:turfics/data/models/models.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';
import 'package:turfics/data/services/api_service.dart';

class SportConfig {
  final String sportName;
  double price;
  int duration; // minutes
  int unitCount; // e.g., 2 Pitches
  
  SportConfig({
    required this.sportName, 
    this.price = 1000.0, 
    this.duration = 60,
    this.unitCount = 1
  });
}

class OnboardingState with ChangeNotifier {
  // Step 1 Data
  String turfName = '';
  String location = '';
  double? latitude; // NEW
  double? longitude; // NEW
  String description = '';
  List<String> amenities = [];
  // Removed simple 'sports' list, now using sportConfigs
  List<SportConfig> sportConfigs = [];

  // Step 2 Data
  TimeOfDay openTime = const TimeOfDay(hour: 6, minute: 0);
  TimeOfDay closeTime = const TimeOfDay(hour: 23, minute: 0);
  
  // Step 3 Data
  String bookingMode = 'slot'; 

  bool _isSubmitting = false;
  bool get isSubmitting => _isSubmitting;

  void updateIdentity(String name, String loc, String desc, List<String> selectedSports, List<String> selectedAmenities, {double? lat, double? lng}) {
    turfName = name;
    location = loc;
    description = desc;
    amenities = selectedAmenities;
    latitude = lat;
    longitude = lng;
    
    // Initialize configs for selected sports if not exists
    sportConfigs = selectedSports.map((sport) {
      // Preserve existing config if re-visiting
      final existing = sportConfigs.where((c) => c.sportName == sport).firstOrNull;
      return existing ?? SportConfig(sportName: sport);
    }).toList();
    
    notifyListeners();
  }

  void updateHours(TimeOfDay open, TimeOfDay close) {
    openTime = open;
    closeTime = close;
    notifyListeners();
  }

  void updateMode(String mode) {
    bookingMode = mode;
    notifyListeners();
  }

  void updateSportConfig(int index, {double? price, int? duration, int? count}) {
    if (index >= 0 && index < sportConfigs.length) {
      final old = sportConfigs[index];
      sportConfigs[index] = SportConfig(
        sportName: old.sportName,
        price: price ?? old.price,
        duration: duration ?? old.duration,
        unitCount: count ?? old.unitCount
      );
      notifyListeners();
    }
  }

  Future<void> completeSetup() async {
    _isSubmitting = true;
    notifyListeners();

    try {
      // 1. Create Turf (Base)
      final turfResponse = await ApiService.post('/api/turfs/create', {
        'name': turfName,
        'location': location,
        'description': description,
        'opening_time': '${openTime.hour}:${openTime.minute.toString().padLeft(2, '0')}',
        'closing_time': '${closeTime.hour}:${closeTime.minute.toString().padLeft(2, '0')}',
        'amenities': amenities.join(', '), 
        'facilities': amenities.join(', '), 
        'latitude': latitude, // Send to backend
        'longitude': longitude, // Send to backend
      });
      
      final turfId = turfResponse['turf_id'];
      print('Created Turf ID: $turfId');

      // 2. Create Games & Units for each Sport
      for (final config in sportConfigs) {
        
        // A. Create Game (Sport Configuration)
        final gameResponse = await ApiService.post('/api/turfs/$turfId/games', {
          'sport_type': config.sportName,
          'game_category': 'team', // Default
          'default_price': config.price,
          'slot_duration': config.duration,
          'is_active': true
        });
        
        final gameId = gameResponse['game_id'];
        print('Created Game ID: $gameId for ${config.sportName}');

        // B. Create Units (Pitches/Courts)
        for (int i = 1; i <= config.unitCount; i++) {
           await ApiService.post('/api/games/$gameId/units', {
             'name': '${config.sportName} Pitch $i',
             'unit_type': 'PITCH', // or COURT based on sport logic
             'capacity': 10,
             'price_override': null // Use game default
           });
        }
      }

    } catch (e) {
      rethrow;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}

extension ListExtensions<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
