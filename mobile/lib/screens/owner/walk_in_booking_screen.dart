import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class WalkInBookingScreen extends StatefulWidget {
  final Map<String, dynamic>? initialParams; // Accept params from navigation

  const WalkInBookingScreen({super.key, this.initialParams});

  @override
  State<WalkInBookingScreen> createState() => _WalkInBookingScreenState();
}

class _WalkInBookingScreenState extends State<WalkInBookingScreen> {
  String? _selectedTurfId;
  String? _selectedUnitId;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  final _durationController = TextEditingController(text: '60');
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _priceController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isBlocking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final owner = Provider.of<OwnerProvider>(context, listen: false);
    await owner.fetchMyTurfs();
    
    // Apply initial params if present
    if (widget.initialParams != null) {
       final params = widget.initialParams!;
       if (params['turfId'] != null) {
         _selectedTurfId = params['turfId'].toString();
       }
       if (params['unitId'] != null && params['unitId'] != 'all') {
         _selectedUnitId = params['unitId'].toString();
       }
       if (params['startTime'] != null) {
         final dt = DateTime.parse(params['startTime']);
         _selectedDate = dt;
         _selectedTime = TimeOfDay.fromDateTime(dt);
       }
    } else {
        // Default behavior (first turf)
        if (owner.myTurfs.isNotEmpty && _selectedTurfId == null) {
          setState(() => _selectedTurfId = owner.myTurfs.first.id.toString());
        }
    }
    if (!mounted) return;
    setState(() {}); // Refresh UI with params
    
    // Ensure games/units are loaded for the selected turf
    if (_selectedTurfId != null) {
      final turf = owner.myTurfs.firstWhere((t) => t.id.toString() == _selectedTurfId.toString(), orElse: () => owner.myTurfs.first);
      if (turf.games.isEmpty) {
        print("DEBUG: Games empty for turf $_selectedTurfId, fetching...");
        await owner.fetchGames(_selectedTurfId!);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final owner = Provider.of<OwnerProvider>(context);
    // Ensure accurate matching for turf
    final turf = _selectedTurfId != null 
        ? owner.myTurfs.where((t) => t.id.toString() == _selectedTurfId.toString()).firstOrNull 
        : null;
    final allUnits = turf?.games.flatMap((g) => g.units).toList() ?? [];
    
    return Scaffold(
      appBar: AppBar(
        title: Text(_isBlocking ? 'Block Slot' : 'Walk-In Booking'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildModeToggle(),
            const SizedBox(height: 24),
            _buildLabel('Select Venue'),
            _buildTurfSelector(owner),
            const SizedBox(height: 16),
            _buildLabel('Select Pitch / Court'),
            _buildUnitSelector(allUnits),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildDatePicker()),
                const SizedBox(width: 12),
                Expanded(child: _buildTimePicker()),
              ],
            ),
            const SizedBox(height: 16),
            _buildLabel('Duration (minutes)'),
            TextField(
              controller: _durationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'e.g. 60'),
            ),
            const SizedBox(height: 16),
            if (!_isBlocking) ...[
              _buildLabel('Customer Details'),
              TextField(controller: _nameController, decoration: const InputDecoration(hintText: 'Name', prefixIcon: Icon(Icons.person))),
              const SizedBox(height: 12),
              TextField(controller: _phoneController, decoration: const InputDecoration(hintText: 'Phone', prefixIcon: Icon(Icons.phone))),
              const SizedBox(height: 12),
              _buildLabel('Price (₹)'),
              TextField(controller: _priceController, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '0.00')),
            ] else ...[
              _buildLabel('Reason for Blocking'),
              TextField(controller: _reasonController, decoration: const InputDecoration(hintText: 'e.g. Maintenance')),
            ],
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isBlocking ? Colors.orange : AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(_isBlocking ? 'Block Slot' : 'Confirm Booking'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeToggle() {
    return Container(
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isBlocking = false),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !_isBlocking ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Text('Booking')),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isBlocking = true),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _isBlocking ? Colors.orange : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Text('Block Slot')),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4),
      child: Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildTurfSelector(OwnerProvider owner) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedTurfId,
          isExpanded: true,
          dropdownColor: AppColors.background,
          items: owner.myTurfs.map((t) => DropdownMenuItem(value: t.id, child: Text(t.name))).toList(),
          onChanged: (v) => setState(() { _selectedTurfId = v; _selectedUnitId = null; }),
        ),
      ),
    );
  }

  Widget _buildUnitSelector(List<TurfUnit> units) {
    // Ensure selected unit exists in the list given to dropdown
    // If not, reset selection to null or first available to prevent crash
    if (_selectedUnitId != null && !units.any((u) => u.id == _selectedUnitId)) {
        // Defer state update to next frame to avoid build error, or just handle display
        // ideally we should fix state, but for display safely:
        _selectedUnitId = null; 
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedUnitId,
          isExpanded: true,
          hint: const Text('Select Pitch / Court'),
          dropdownColor: AppColors.background,
          items: units.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))).toList(),
          onChanged: (v) => setState(() => _selectedUnitId = v),
        ),
      ),
    );
  }

  Widget _buildDatePicker() {
    return GestureDetector(
      onTap: () async {
        final d = await showDatePicker(context: context, initialDate: _selectedDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 90)));
        if (d != null) setState(() => _selectedDate = d);
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
        child: Row(children: [const Icon(Icons.calendar_today, size: 16), const SizedBox(width: 8), Text(DateFormat('MMM d, yyyy').format(_selectedDate))]),
      ),
    );
  }

  Widget _buildTimePicker() {
    return GestureDetector(
      onTap: () async {
        final t = await showTimePicker(context: context, initialTime: _selectedTime);
        if (t != null) setState(() => _selectedTime = t);
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
        child: Row(children: [const Icon(Icons.access_time, size: 16), const SizedBox(width: 8), Text(_selectedTime.format(context))]),
      ),
    );
  }

  void _handleSubmit() async {
    if (_selectedTurfId == null || _selectedUnitId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select venue and unit')));
      return;
    }

    final startDateTime = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, _selectedTime.hour, _selectedTime.minute);
    
    final data = {
      'turf_id': _selectedTurfId,
      'unit_id': _selectedUnitId,
      'start_time': startDateTime.toIso8601String(),
      'duration_mins': int.parse(_durationController.text),
    };

    try {
      if (_isBlocking) {
        data['reason'] = _nameController.text.isEmpty ? 'Maintenance' : _nameController.text;
        await Provider.of<OwnerProvider>(context, listen: false).blockSlot(data);
      } else {
        data['guest_name'] = _nameController.text;
        data['guest_phone'] = _phoneController.text;
        data['price'] = double.parse(_priceController.text);
        await Provider.of<OwnerProvider>(context, listen: false).createWalkIn(data);
      }
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }
}

extension FlatMap<T> on Iterable<T> {
  Iterable<E> flatMap<E>(Iterable<E> Function(T) f) => expand(f);
}
