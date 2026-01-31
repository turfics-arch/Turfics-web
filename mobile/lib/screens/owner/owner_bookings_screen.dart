import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/constants.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/skeleton_container.dart';
import '../../data/models/models.dart';
import '../../providers/owner_provider.dart';

class OwnerBookingsScreen extends StatefulWidget {
  const OwnerBookingsScreen({super.key});

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> {
  DateTime _selectedDate = DateTime.now();
  String? _selectedGameId;
  String? _selectedUnitId;
  
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OwnerProvider>(context, listen: false).fetchBookings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final ownerProvider = Provider.of<OwnerProvider>(context);
    final selectedTurf = ownerProvider.selectedTurf;

    // Handle initial selection for filters if turf changes
    if (selectedTurf != null) {
      if (_selectedGameId == null && selectedTurf.games.isNotEmpty) {
        _selectedGameId = selectedTurf.games.first.id;
        if (selectedTurf.games.first.units.isNotEmpty) {
           _selectedUnitId = selectedTurf.games.first.units.first.id;
        }
      }
    }

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, selectedTurf),
            if (selectedTurf != null) ...[
               _buildFilters(context, selectedTurf),
               const SizedBox(height: 8),
               _buildDateStrip(),
               Expanded(
                 child: ownerProvider.isLoading 
                    ? _buildTimelineSkeleton() 
                    : _buildTimeline(context, ownerProvider),
               ),
            ] else 
               const Expanded(child: Center(child: Text("Please select a Turf from Home"))),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/owner/walk-in'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text("Walk-in"),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Turf? selectedTurf) {
    return Padding(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text("Bookings", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          if (selectedTurf != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withOpacity(0.3))
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(selectedTurf.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ],
              ),
            )
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context, Turf turf) {
    if (turf.games.isEmpty) return const SizedBox.shrink();

    // Sport Chips
    return SizedBox(
      height: 90,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Games (Sports)
          SizedBox(
            height: 40,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: turf.games.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final game = turf.games[index];
                final isSelected = game.id == _selectedGameId;
                return ChoiceChip(
                  label: Text(game.sportType),
                  selected: isSelected,
                  onSelected: (bool selected) {
                    if (selected) {
                      setState(() {
                        _selectedGameId = game.id;
                        // Auto-select first unit
                        if (game.units.isNotEmpty) _selectedUnitId = game.units.first.id;
                      });
                    }
                  },
                  selectedColor: AppColors.primary.withOpacity(0.2),
                  labelStyle: TextStyle(color: isSelected ? AppColors.primary : AppColors.textSecondary),
                  backgroundColor: Theme.of(context).cardColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent)),
                  showCheckmark: false,
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // 2. Units (Pitches) - Only if game selected
          if (_selectedGameId != null)
             Builder(builder: (context) {
                final game = turf.games.firstWhere((g) => g.id == _selectedGameId!);
                return SizedBox(
                  height: 35,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: game.units.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final unit = game.units[index];
                      final isSelected = unit.id == _selectedUnitId;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedUnitId = unit.id),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.glassBorderDark)
                          ),
                          child: Text(unit.name, style: TextStyle(
                            fontSize: 12, 
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : AppColors.textSecondary
                          )),
                        ),
                      );
                    },
                  ),
                );
             })
        ],
      ),
    );
  }

  Widget _buildDateStrip() {
    final now = DateTime.now();
    return Container(
      height: 85,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: 14,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final date = now.add(Duration(days: index));
          final isSelected = isSameDay(date, _selectedDate);
          
          return GestureDetector(
            onTap: () => setState(() => _selectedDate = date),
            child: Container(
              width: 55,
              margin: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: isSelected ? null : Border.all(color: AppColors.glassBorderDark),
                boxShadow: isSelected ? [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 8)] : []
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    DateFormat('E').format(date).toUpperCase(), 
                    style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : AppColors.textSecondary)
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('d').format(date), 
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : AppColors.textMainDark)
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimelineSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: 10,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
               const SkeletonContainer(width: 50, height: 16),
               const SizedBox(width: 12),
               Expanded(child: SkeletonContainer(width: double.infinity, height: 50, borderRadius: 8)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTimeline(BuildContext context, OwnerProvider provider) {
    if (_selectedUnitId == null) {
      return const Center(child: Text("Select a Pitch to view schedule", style: TextStyle(color: AppColors.textSecondary)));
    }

    // Filter bookings for this unit and date
    // Note: In real app, date comparison should be robust
    final relevantBookings = provider.bookings.where((b) {
      // Unit name might not be ID in the booking model, but let's assume filtering logic holds
      // Ideally backend returns unit_id
      // For now, let's just mock filter or check if 'unitName' matches selected unit name
      // This is weak, but we rely on available model data.
      return true; // Simplify for UI demo
    }).toList();

    // 30-min slots from 6 AM to 12 AM
    final startHour = 6;
    final endHour = 24;
    final totalSlots = (endHour - startHour) * 2; // 2 slots per hour

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      controller: _scrollController,
      itemCount: totalSlots,
      itemBuilder: (context, index) {
        final totalMinutes = (startHour * 60) + (index * 30);
        final slotHour = totalMinutes ~/ 60;
        final slotMinute = totalMinutes % 60;
        
        final timeStr = "${slotHour > 12 ? slotHour - 12 : slotHour}:${slotMinute.toString().padLeft(2, '0')} ${slotHour >= 12 ? 'PM' : 'AM'}";
        
        // Mock Status Logic
        // In real app, check intersection with relevantBookings
        // Mock: 9:00 - 10:00 Booked
        bool isBooked = (slotHour == 9 || slotHour == 20) && (slotMinute == 0 || slotMinute == 30);
        bool isBlocked = (slotHour == 14); // 2 PM Blocked

        return _buildSlotRow(context, timeStr, isBooked, isBlocked, slotHour, slotMinute);
      },
    );
  }

  Widget _buildSlotRow(BuildContext context, String timeStr, bool isBooked, bool isBlocked, int hour, int minute) {
    Color slotColor = Theme.of(context).cardColor;
    Color borderColor = AppColors.glassBorderDark;
    String statusText = "Available";
    Color textColor = AppColors.textSecondary;

    if (isBooked) {
      slotColor = AppColors.error.withOpacity(0.1); // Reddish for booked
      borderColor = AppColors.error.withOpacity(0.3);
      statusText = "Booked";
      textColor = AppColors.error;
    } else if (isBlocked) {
      slotColor = Colors.grey.withOpacity(0.1);
      borderColor = Colors.grey.withOpacity(0.3);
      statusText = "Blocked";
      textColor = Colors.grey;
    } else {
       // Available
       slotColor = AppColors.success.withOpacity(0.1); // Greenish tint for available
       borderColor = AppColors.success.withOpacity(0.3);
       statusText = "Available";
       textColor = AppColors.success;
    }

    return GestureDetector(
      onTap: () {
        if (isBooked) {
          // Open Detailed Invoice View
          // In a real app, 'relevantBookings' would contain the booking object for this slot.
          // For now, we mock passing a booking or use the first one available.
           final bookings = Provider.of<OwnerProvider>(context, listen: false).bookings;
           final mockBooking = bookings.isNotEmpty ? bookings.first : Booking(
             id: "MOCK-123456", 
             turfName: "Premier Arena",
             unitName: "Pitch A",
             gameType: "Football",
             startTime: DateTime.now().toIso8601String(), 
             endTime: DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
             totalPrice: 1200, 
             status: "confirmed",
             guestName: "Ramesh",
             bookingSource: "walk-in"
           );
           
           context.push('/owner/booking-details', extra: mockBooking);
        } else {
           _roundOffAndBook(context, hour, minute);
        }
      },
      child: Container(
        height: 50,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: slotColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 70, 
              child: Text(timeStr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))
            ),
            Container(width: 1, height: 30, color: borderColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isBooked ? "Ramesh (Football)" : statusText,
                style: TextStyle(color: textColor, fontWeight: FontWeight.w500),
              ),
            ),
            if (!isBooked)
              Icon(Icons.add, size: 16, color: textColor)
          ],
        ),
      ),
    );
  }

  void _roundOffAndBook(BuildContext context, int hour, int minute) {
    // Logic to assume Standard 1 Hour booking
    // If user tapped 9:30, we propose 9:30 - 10:30
    final startStr = "${hour > 12 ? hour - 12 : hour}:${minute.toString().padLeft(2, '0')}";
    
    showModalBottomSheet(
      context: context,
      builder: (_) => Container(
        height: 200,
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text("New Walk-in Booking", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text("Slot: $startStr (1 Hour)"),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                   context.pop();
                   context.go('/owner/walk-in');
                   // Pass slot data via extra or params if possible
                }, 
                child: const Text("Confirm & Add Details")
              ),
            )
          ],
        ),
      )
    );
  }

  bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
