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
      final provider = Provider.of<OwnerProvider>(context, listen: false);
      // Calls now use cached data by default
      provider.fetchBookings();
      if (provider.selectedTurf != null) {
        provider.fetchGames(provider.selectedTurf!.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ownerProvider = Provider.of<OwnerProvider>(context);
    final selectedTurf = ownerProvider.selectedTurf;

    // Handle initial selection for filters if turf changes
    if (selectedTurf != null) {
      if (_selectedUnitId == null) {
         _selectedUnitId = 'all';
      }
      // REMOVED: Auto-select first game. We want default to be null aka "All Sports".
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
          Row(
            children: [
              // Added Filter Button
              IconButton(
                onPressed: () {
                   // Show filter bottom sheet (placeholder for now)
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Advanced Filters Coming Soon")));
                },
                icon: const Icon(Icons.filter_list),
                tooltip: "Filter",
              ),
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
                ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context, Turf turf) {
    if (turf.games.isEmpty) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            "No sports configured. You can still view all bookings below.",
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontStyle: FontStyle.italic, fontSize: 12)
          ),
        );
    }

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
              itemCount: turf.games.length + 1, // +1 for "All"
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                if (index == 0) {
                   // "All" Chip
                   final isSelected = _selectedGameId == null;
                   return ChoiceChip(
                      label: const Text("All Sports"),
                      selected: isSelected,
                      onSelected: (bool selected) {
                        if (selected) setState(() { 
                           _selectedGameId = null; 
                           _selectedUnitId = 'all'; // Reset unit selection
                        });
                      },
                      selectedColor: AppColors.primary.withOpacity(0.2),
                      labelStyle: TextStyle(color: isSelected ? AppColors.primary : AppColors.textSecondary),
                      backgroundColor: Theme.of(context).cardColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent)),
                      showCheckmark: false,
                   );
                }

                final game = turf.games[index - 1]; // Offset index
                final isSelected = game.id == _selectedGameId;
                return ChoiceChip(
                  label: Text(game.sportType),
                  selected: isSelected,
                  onSelected: (bool selected) {
                    if (selected) {
                      setState(() {
                        _selectedGameId = game.id;
                        // Auto-select first unit or keep 'all'?
                        // User wants grid for all pitches of selected sport usually.
                        // Let's default to 'all' so they see the grid view for this sport.
                        _selectedUnitId = 'all'; 
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
                
                // Add 'All' option
                final allUnits = [
                  TurfUnit(
                    id: 'all', 
                    name: 'All Pitches', 
                    unitType: 'ALL', // Correct field name
                    capacity: 0, 
                    price: 0,
                    size: '', 
                    indoor: false, 
                    hasLighting: false, 
                    images: []
                  ),
                  ...game.units
                ];

                return SizedBox(
                  height: 35,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: allUnits.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final unit = allUnits[index];
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
    // If unit ID is null, we treat it as 'all' by default now
    final effectiveUnitId = _selectedUnitId ?? 'all';

    // "All" View - Aggregated Grid Logic
    if (effectiveUnitId == 'all') {
       // We need to show availability for ALL units in the selected game (or all games if none selected?)
       // The UI structure implies a Game is selected (tabs above), so we show all units for that game.
       // If no game selected (rare), we show nothing or everything.

       // 1. Get List of Units to Show
       // Based on `_selectedGameId`
       List<TurfUnit> relevantUnits = [];
       if (_selectedGameId != null) {
          final game = provider.selectedTurf?.games.where((g) => g.id == _selectedGameId).firstOrNull;
          if (game != null) relevantUnits = game.units;
       } else if (provider.selectedTurf != null) {
          // Flatten all
          relevantUnits = provider.selectedTurf!.games.expand((g) => g.units).toList();
       }

       if (relevantUnits.isEmpty) {
          return Center(child: Text("No Pitches Configured", style: TextStyle(color: Colors.white54)));
       }

       return ListView.builder(
         padding: const EdgeInsets.all(16),
         itemCount: relevantUnits.length,
         itemBuilder: (context, index) {
            final unit = relevantUnits[index];
            
            // Build a Mini Grid for this Unit
            // Reuse logic or create simplified horizontal strip? 
            // User requested "Grid with all booking details".
            // Let's do a Section Header + Mini Height Grid/Horizontal Strip
            
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                 Padding(
                   padding: const EdgeInsets.only(bottom: 8.0, left: 4),
                   child: Text(unit.name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                 ),
                 SizedBox(
                   height: 80, // Height for single row or 2 rows of slots
                   child: ListView.separated(
                     scrollDirection: Axis.horizontal,
                     itemCount: 24 - 6, // 6 AM to 12 PM = 18 hours. Let's show hours for now to fit. 
                     // Or better: Re-use the grid logic but horizontal?
                     // Let's effectively show a horizontal timeline for each Unit.
                     separatorBuilder: (_, __) => SizedBox(width: 8),
                     itemBuilder: (ctx, slotIndex) {
                        // Logic similar to grid
                        final startHour = 6;
                        final hour = startHour + slotIndex;
                        final dt = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, hour, 0);
                        
                        // Check booking for THIS unit + time
                        bool isBooked = false;
                        String guest = "";
                        Booking? bookingRef;

                        for (var b in provider.bookings) {
                           try {
                              // Strict Unit match
                              if (b.turfUnitId != null && b.turfUnitId.toString() != unit.id) continue;
                              // Fallback if ID missing: Name match? (Risk of collision but okay for now)
                              if (b.turfUnitId == null && b.unitName != unit.name) continue;

                              final bStart = DateTime.parse(b.startTime);
                              final bEnd = DateTime.parse(b.endTime);
                              if (dt.isAtSameMomentAs(bStart) || (dt.isAfter(bStart) && dt.isBefore(bEnd))) {
                                 isBooked = true;
                                 guest = b.guestName.isEmpty ? "Booked" : b.guestName;
                                 bookingRef = b;
                                 break;
                              }
                           } catch (e) {}
                        }

                        // Render Small Slot Chip
                        Color bg = isBooked ? AppColors.error.withOpacity(0.2) : AppColors.success.withOpacity(0.1);
                        Color border = isBooked ? AppColors.error.withOpacity(0.5) : AppColors.success.withOpacity(0.3);
                        
                        return GestureDetector(
                          onTap: () {
                             if (isBooked && bookingRef != null) {
                                context.push('/owner/booking-details', extra: bookingRef);
                             } else if (!isBooked) {
                                // Walk in
                                final params = {
                                  'turfId': provider.selectedTurf?.id,
                                  'unitId': unit.id,
                                  'startTime': dt.toIso8601String(),
                                };
                                context.push('/owner/walk-in', extra: params);
                             }
                          },
                          child: Container(
                            width: 70,
                            decoration: BoxDecoration(
                              color: bg,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: border)
                            ),
                            child: Column(
                               mainAxisAlignment: MainAxisAlignment.center,
                               children: [
                                  Text("${hour}:00", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  SizedBox(height: 2),
                                  Text(isBooked ? guest : "Free", 
                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 9, color: isBooked ? AppColors.error : AppColors.success))
                               ]
                            ),
                          ),
                        );
                     },
                   ),
                 ),
                 SizedBox(height: 24),
              ],
            );
         },
       );
    }
    
    // Specific Unit View (Slot Grid)
    
    // Specific Unit View (Slot Grid)
    
    // Define Grid Logic (e.g., 6 AM - 12 AM)
    const int startHour = 6;
    const int endHour = 24; // Midnight
    const int slotsPerHour = 2; // 30 Minute Slots
    const int totalSlots = (endHour - startHour) * slotsPerHour;

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3, // 3 columns
        childAspectRatio: 1.8, // More condensed for 30 min slots
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: totalSlots,
      itemBuilder: (context, index) {
        final hour = startHour + (index ~/ slotsPerHour);
        final minute = (index % slotsPerHour) * 30;
        
        final dt = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day, hour, minute);
        final timeStr = DateFormat('h:mm a').format(dt);
        
        // Check availability
        bool isBooked = false;
        Booking? slotBooking;
        
        for (var b in provider.bookings) {
          try {
            final bStart = DateTime.parse(b.startTime);
            final bEnd = DateTime.parse(b.endTime);
            
            // Strict Unit Matching
            bool sameUnit = true; 
            if (effectiveUnitId != 'all') {
               // Use the newly added field usually, or fallback to name if ID missing (rare)
               if (b.turfUnitId != null) {
                  sameUnit = b.turfUnitId.toString() == effectiveUnitId;
               } 
            }

            if (sameUnit) {
               // Check overlap: Slot Start < Booking End AND Slot End > Booking Start
               // Slot End is +30 mins
               final slotEnd = dt.add(const Duration(minutes: 30));
               
               // Booking covers this slot if:
               // Booking Start is before Slot End AND Booking End is after Slot Start
               if (bStart.isBefore(slotEnd) && bEnd.isAfter(dt)) {
                  isBooked = true;
                  slotBooking = b;
                  break;
               }
            }
          } catch (e) {
            // ignore
          }
        }

        return _buildGridSlot(context, timeStr, isBooked, slotBooking, dt);
      },
    );
  }

  Widget _buildGridSlot(BuildContext context, String timeStr, bool isBooked, Booking? booking, DateTime slotTime) {
    Color bgColor = isBooked 
        ? AppColors.error.withOpacity(0.15) 
        : AppColors.success.withOpacity(0.15);
    Color borderColor = isBooked
        ? AppColors.error.withOpacity(0.3)
        : AppColors.success.withOpacity(0.3);
    Color textColor = isBooked ? AppColors.error : AppColors.success;
    
    if (isBooked) {
       // Check if Blocked vs Booked if status available
       if (booking?.status == 'blocked') {
          bgColor = Colors.grey.withOpacity(0.2);
          borderColor = Colors.grey.withOpacity(0.4);
          textColor = Colors.grey;
       }
    }

    return GestureDetector(
      onTap: () {
        if (isBooked) {
          // Show details
          if (booking != null) {
              context.push('/owner/booking-details', extra: booking);
          }
        } else {
           // Go to Walk-in with pre-selected data
           // Passing params via URL query vars or extra object
           final params = {
             'turfId': Provider.of<OwnerProvider>(context, listen: false).selectedTurf?.id,
             'unitId': _selectedUnitId,
             'startTime': slotTime.toIso8601String(),
           };
           context.push('/owner/walk-in', extra: params);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(timeStr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            Text(
              isBooked 
                ? (booking?.guestName ?? "Booked") 
                : "Available",
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: textColor,
                fontWeight: isBooked ? FontWeight.normal : FontWeight.bold
              ),
            ),
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
