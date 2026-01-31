import 'package:flutter/material.dart';
import '../data/models/models.dart';
import '../data/services/api_service.dart';

class OwnerProvider with ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Turf> _myTurfs = [];
  List<Turf> get myTurfs => _myTurfs;

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

  List<MaintenanceTask> _maintenanceTasks = [];
  List<MaintenanceTask> get maintenanceTasks => _maintenanceTasks;

  List<MaintenanceAsset> _maintenanceAssets = [];
  List<MaintenanceAsset> get maintenanceAssets => _maintenanceAssets;

  // --- Turfs ---
  Future<void> fetchMyTurfs() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/turfs/my-turfs');
      _myTurfs = (res as List).map((t) => Turf.fromJson(t)).toList();
    } catch (e) {
      print('Error fetching turfs: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
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
  Future<void> fetchBookings() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/owner/bookings');
      _bookings = (res as List).map((b) => Booking.fromJson(b)).toList();
      
      final statsRes = await ApiService.get('/api/owner/stats');
      _stats = statsRes as Map<String, dynamic>;
    } catch (e) {
      print('Error fetching bookings: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> confirmBooking(String bookingId) async {
    try {
      await ApiService.post('/api/bookings/confirm', {'booking_id': bookingId});
      await fetchBookings();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> cancelBooking(String bookingId) async {
    try {
      await ApiService.delete('/api/bookings/$bookingId');
      await fetchBookings();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> createWalkIn(Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/owner/bookings/walk-in', data);
      await fetchBookings();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> blockSlot(Map<String, dynamic> data) async {
    try {
      await ApiService.post('/api/owner/bookings/block', data);
      await fetchBookings();
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
      final res = await ApiService.get('/api/owner/analytics/detailed?range=$range');
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
      final tasksRes = await ApiService.get('/api/maintenance/tasks?turf_id=$turfId');
      _maintenanceTasks = (tasksRes as List).map((t) => MaintenanceTask.fromJson(t)).toList();
      
      final assetsRes = await ApiService.get('/api/maintenance/assets?turf_id=$turfId');
      _maintenanceAssets = (assetsRes as List).map((a) => MaintenanceAsset.fromJson(a)).toList();
    } catch (e) {
      print('Error fetching maintenance data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
