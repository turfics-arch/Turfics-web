import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants.dart';
import '../../data/models/models.dart';
import '../../data/services/api_service.dart'; // Added Import
import 'package:intl/intl.dart';

class TurfDetailsScreen extends StatefulWidget {
  final Turf turf;

  const TurfDetailsScreen({super.key, required this.turf});

  @override
  State<TurfDetailsScreen> createState() => _TurfDetailsScreenState();
}

class _TurfDetailsScreenState extends State<TurfDetailsScreen> {
  DateTime _selectedDate = DateTime.now();
  int? _selectedSlotHour;
  List<Map<String, dynamic>> _slots = [];
  bool _isLoadingSlots = false;
  bool _isBooking = false;

  @override
  void initState() {
    super.initState();
    _fetchSlots();
  }

  Future<void> _fetchSlots() async {
    setState(() => _isLoadingSlots = true);
    
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final response = await ApiService.get('/turfs/${widget.turf.id}/slots?date=\$dateStr');
      
      if (response is List) {
        setState(() {
          _slots = List<Map<String, dynamic>>.from(response);
          _selectedSlotHour = null; // Reset selection
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading slots: \$e')));
      }
    } finally {
      if (mounted) setState(() => _isLoadingSlots = false);
    }
  }

  Future<void> _bookSlot() async {
    if (_selectedSlotHour == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a time slot')),
      );
      return;
    }

    setState(() => _isBooking = true);

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      
      await ApiService.post('/bookings/hold', {
        'turf_id': widget.turf.id,
        'date': dateStr,
        'hour': _selectedSlotHour,
        'price': widget.turf.pricePerHour,
      });

      if (!mounted) return;
      
      // Success Dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Booking Confirmed!'),
          content: Text('slot at \$_selectedSlotHour:00 has been booked successfully.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                context.go('/'); // Go home
              }, 
              child: const Text('OK'),
            ),
          ],
        ),
      );

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _isBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar Image
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    widget.turf.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        Container(color: AppColors.surfaceLight),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.8),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              title: Text(widget.turf.name),
              centerTitle: false,
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Basic Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.turf.location,
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  color: AppColors.warning, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '${widget.turf.rating} Rating',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Text(
                        '₹${widget.turf.pricePerHour.toInt()}/hr',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32, color: AppColors.surfaceLight),

                  // Amenities
                  const Text('Amenities',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.turf.amenities.map((amenity) {
                      return Chip(
                        label: Text(amenity),
                        backgroundColor: AppColors.surfaceLight,
                        labelStyle: const TextStyle(color: AppColors.textMain),
                        side: BorderSide.none,
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // Date Selection
                  const Text('Select Date',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 60,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: 7,
                      itemBuilder: (context, index) {
                        final date = DateTime.now().add(Duration(days: index));
                        final isSelected =
                            date.day == _selectedDate.day &&
                            date.month == _selectedDate.month;

                        return GestureDetector(
                          onTap: () {
                            setState(() => _selectedDate = date);
                            _fetchSlots(); // Fetch new slots
                          },
                          child: Container(
                            width: 60,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  DateFormat('E').format(date),
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.black
                                        : AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  date.day.toString(),
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.black
                                        : AppColors.textMain,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Slots Section
                  const Text('Available Slots',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  
                  _isLoadingSlots 
                    ? const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
                    : _slots.isEmpty 
                      ? Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              const Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.textSecondary),
                              const SizedBox(height: 12),
                              const Text('No slots available', style: TextStyle(color: AppColors.textMain, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text('Try selecting a different date', style: TextStyle(color: AppColors.textSecondary.withOpacity(0.7))),
                              const SizedBox(height: 16),
                              OutlinedButton(onPressed: _fetchSlots, child: const Text("Retry"))
                            ],
                          ),
                        )
                      : Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: _slots.map((slot) {
                            final hour = slot['hour'] as int;
                            final status = slot['status'];
                            final isAvailable = status == 'available';
                            final isSelected = _selectedSlotHour == hour;

                            return GestureDetector(
                              onTap: isAvailable ? () => setState(() => _selectedSlotHour = hour) : null,
                              child: Container(
                                width: (MediaQuery.of(context).size.width - 48 - 30) / 4, // 4 items per row responsive
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary
                                      : isAvailable ? AppColors.surfaceLight : AppColors.surfaceLight.withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primary : Colors.transparent,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '$hour:00',
                                  style: TextStyle(
                                    color: isSelected 
                                      ? Colors.black 
                                      : isAvailable ? Colors.white : AppColors.textSecondary,
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    decoration: !isAvailable ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                  const SizedBox(height: 100), // Space for FAB
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        color: AppColors.surface,
        padding: const EdgeInsets.all(16),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: _bookSlot,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: _isBooking 
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black)) 
              : const Text(
                  'Book Now',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
          ),
        ),
      ),
    );
  }
}
