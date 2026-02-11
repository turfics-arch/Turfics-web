import 'package:flutter/material.dart';
import '../data/models/models.dart';
import '../data/services/api_service.dart';
import '../features/auth/providers/auth_provider.dart';

class OwnerProvider with ChangeNotifier {
  AuthProvider? _authProvider;
  
  void setAuthProvider(AuthProvider auth) {
    _authProvider = auth;
  }

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Turf> _myTurfs = [];
  List<Turf> get myTurfs => _myTurfs;
  
  Turf? _selectedTurf;
  Turf? get selectedTurf => _selectedTurf;

  void selectTurf(Turf? turf) {
    _selectedTurf = turf;
    notifyListeners();
  }

  List<StaffMember> _staff = [];
  List<StaffMember> get staff => _staff;

  List<Customer> _customers = [];
  List<Customer> get customers => _customers;

  List<Booking> _bookings = [];
  List<Booking> get bookings => _bookings;

  List<Tournament> _organizerTournaments = [];
  List<Tournament> get organizerTournaments => _organizerTournaments;

  Map<String, dynamic> _stats = {};
  Map<String, dynamic> get stats => _stats;

  Map<String, dynamic> _analytics = {};
  Map<String, dynamic> get analytics => _analytics;

  // Onboarding Helpers
  bool get isNewUser => _stats['onboarding'] != null ? (_stats['onboarding']['is_new_user'] ?? false) : false;
  int get setupProgress => _stats['onboarding'] != null ? (_stats['onboarding']['setup_progress'] ?? 0) : 0;
  List<String> get blockingSteps => _stats['onboarding'] != null 
    ? List<String>.from(_stats['onboarding']['blocking_steps'] ?? []) 
    : [];

  List<MaintenanceTask> _maintenanceTasks = [];
  List<MaintenanceTask> get maintenanceTasks => _maintenanceTasks;

  List<MaintenanceAsset> _maintenanceAssets = [];
  List<MaintenanceAsset> get maintenanceAssets => _maintenanceAssets;

  // --- Turfs ---
  Future<void> fetchMyTurfs({bool forceRefresh = false}) async {
    if (_myTurfs.isNotEmpty && !forceRefresh) return;

    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/turfs/my-turfs');
      _myTurfs = (res as List).map((t) => Turf.fromJson(t)).toList();
      
      // Select first turf by default if none selected
      if (_selectedTurf == null && _myTurfs.isNotEmpty) {
        _selectedTurf = _myTurfs.first;
      }
      
      await fetchStats();
      
    } catch (e) {
      print('Error fetching turfs: $e');
      if (e is AuthException) {
        _authProvider?.logout();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --- Stats ---
  Future<void> fetchStats() async {
    try {
      final res = await ApiService.get('/api/owner/stats');
      _stats = res as Map<String, dynamic>;
    } catch (e) {
      print('Error fetching stats: $e');
      if (e is AuthException) {
        _authProvider?.logout();
      }
    }
  }

  // --- Staff ---
  Future<void> fetchStaff(String turfId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/turfs/$turfId/staff');
      _staff = (res as List).map((s) => StaffMember.fromJson(s)).toList();
    } catch (e) {
      print('Error fetching staff: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addStaff(String turfId, Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/turfs/$turfId/staff', data);
      await fetchStaff(turfId);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateStaffStatus(String staffId, String status, String turfId) async {
    try {
      await ApiService.put('/api/staff/$staffId/status', {'status': status});
      await fetchStaff(turfId);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> removeStaff(String staffId, String turfId) async {
    try {
      await ApiService.delete('/api/staff/$staffId');
      await fetchStaff(turfId);
    } catch (e) {
      rethrow;
    }
  }

  // --- Bookings ---
  Future<void> fetchBookings([String? turfId, bool forceRefresh = false]) async {
    if (_bookings.isNotEmpty && !forceRefresh) return;
    
    _isLoading = true;
    notifyListeners();
    try {
      final endpoint = turfId != null && turfId.isNotEmpty 
          ? '/api/owner/bookings?turf_id=$turfId'
          : '/api/owner/bookings';
      
      final res = await ApiService.get(endpoint);
      _bookings = (res as List).map((b) => Booking.fromJson(b)).toList();
      
      // Refresh stats too if needed, but maybe not every time
      final statsRes = await ApiService.get('/api/owner/stats');
      _stats = statsRes as Map<String, dynamic>;
    } catch (e) {
      print('Error fetching bookings: $e');
      if (e is AuthException) {
        _authProvider?.logout();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> confirmBooking(String bookingId) async {
    try {
      await ApiService.post('/api/bookings/confirm', {'booking_id': bookingId});
      await fetchBookings(_selectedTurf?.id.toString(), true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> cancelBooking(String bookingId) async {
    try {
      await ApiService.delete('/api/bookings/$bookingId');
      await fetchBookings(_selectedTurf?.id.toString(), true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> createWalkIn(Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/owner/bookings/walk-in', data);
      await fetchBookings(_selectedTurf?.id.toString(), true);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> blockSlot(Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/owner/bookings/block', data);
      await fetchBookings(_selectedTurf?.id.toString(), true);
    } catch (e) {
      rethrow;
    }
  }

  // --- Customers ---
  Future<void> fetchCustomers() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/owner/customers');
      _customers = (res as List).map((c) => Customer.fromJson(c)).toList();
    } catch (e) {
      print('Error fetching customers: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --- Analytics ---
  Future<void> fetchAnalytics({String range = 'month'}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/owner/analytics/detailed?range=\$range');
      _analytics = res as Map<String, dynamic>;
    } catch (e) {
      print('Error fetching analytics: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --- Organizer Hub ---
  Future<void> fetchOrganizerTournaments() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/organizer/tournaments');
      _organizerTournaments = (res as List).map((t) => Tournament.fromJson(t)).toList();
    } catch (e) {
      print('Error fetching organizer tournaments: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --- Maintenance ---
  Future<void> fetchMaintenanceData(String turfId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final tasksRes = await ApiService.get('/api/maintenance/tasks?turf_id=\$turfId');
      _maintenanceTasks = (tasksRes as List).map((t) => MaintenanceTask.fromJson(t)).toList();
      
      final assetsRes = await ApiService.get('/api/maintenance/assets?turf_id=\$turfId');
      _maintenanceAssets = (assetsRes as List).map((a) => MaintenanceAsset.fromJson(a)).toList();
    } catch (e) {
      print('Error fetching maintenance data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  // --- Turf Management Calls ---
  Future<void> updateTurf(String turfId, Map<String, dynamic> data) async {
    try {
      await ApiService.put('/api/turfs/$turfId', data);
      await fetchMyTurfs(); // Refresh data
    } catch (e) {
      rethrow;
    }
  }

  // --- Game/Sport Management Calls ---
  Future<void> fetchGames(String turfId, {bool forceRefresh = false}) async {
    // Check if we already have games for this turf
    final existingTurf = _myTurfs.where((t) => t.id == turfId).firstOrNull;
    if (existingTurf != null && existingTurf.games.isNotEmpty && !forceRefresh) {
      print("DEBUG: Using cached games for turf $turfId");
      return; 
    }

    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/turfs/$turfId/games');
      final gamesList = (res as List).map((g) => TurfGame.fromJson(g)).toList();
      
      // Update the specific turf in _myTurfs list with these games
      final index = _myTurfs.indexWhere((t) => t.id == turfId);
      if (index != -1) {
        // Create new turf with updated games (assuming Turf is immutable-ish)
        // We need to copy formatting but replace games
        final t = _myTurfs[index];
        _myTurfs[index] = Turf(
          id: t.id,
          name: t.name,
          location: t.location,
          pricePerHour: t.pricePerHour, // Note: Turf model might not fully match my-turfs minimal return, but we preserve what we have
          rating: t.rating,
          imageUrl: t.imageUrl,
          sports: t.sports,
          amenities: t.amenities,
          openingTime: t.openingTime,
          closingTime: t.closingTime,
          lat: t.lat,
          lng: t.lng,
          description: t.description,
          status: t.status,
          games: gamesList, // <--- UPDATED GAMES
        );
        
        // Also update selectedTurf if it's the same
        if (_selectedTurf?.id == turfId) {
          _selectedTurf = _myTurfs[index];
        }
      }
    } catch (e) {
      print('Error fetching games: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createGame(String turfId, Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/turfs/$turfId/games', data);
      await fetchMyTurfs();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateGame(String gameId, Map<String, dynamic> data) async {
    try {
      await ApiService.put('/api/games/$gameId', data);
      await fetchMyTurfs();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteGame(String gameId) async {
    try {
      await ApiService.delete('/api/games/$gameId');
      await fetchMyTurfs();
    } catch (e) {
      rethrow;
    }
  }

  // --- Unit Management Calls ---
  Future<void> createUnit(String gameId, Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/games/$gameId/units', data);
      await fetchMyTurfs();
    } catch (e) {
      rethrow;
    }
  }
}
