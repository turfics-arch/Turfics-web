import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/constants.dart';
import '../../../data/models/models.dart';
import '../../../widgets/custom_button.dart';
import '../../../widgets/glass_container.dart';
import '../../booking/providers/booking_controller.dart';
// import '../../booking/providers/booking_provider.dart'; // Removing legacy

class TurfDetailsScreen extends ConsumerStatefulWidget {
  final Turf turf;

  const TurfDetailsScreen({super.key, required this.turf});

  @override
  ConsumerState<TurfDetailsScreen> createState() => _TurfDetailsScreenState();
}

class _TurfDetailsScreenState extends ConsumerState<TurfDetailsScreen> {
  late Turf _turf;
  TurfGame? _selectedGame;
  TurfUnit? _selectedUnit;
  DateTime _selectedDate = DateTime.now();
  final List<Map<String, dynamic>> _selectedSlots = [];
  bool _isInitialLoading = true;
  int _activeImgIndex = 0;

  @override
  void initState() {
    super.initState();
    _turf = widget.turf;
    _loadFullDetails();
  }

  Future<void> _loadFullDetails() async {
    setState(() => _isInitialLoading = true);
    // Use ref.read
    try {
      final fullTurf = await ref.read(bookingControllerProvider.notifier).fetchFullTurfDetails(widget.turf.id.toString());
      if (mounted) {
        setState(() {
          if (fullTurf != null) {
            _turf = fullTurf;
            if (_turf.games.isNotEmpty) {
              _selectedGame = _turf.games.first;
              if (_selectedGame!.units.isNotEmpty) {
                _selectedUnit = _selectedGame!.units.first;
              }
            }
          }
          _isInitialLoading = false;
        });
        if (_selectedUnit != null) {
          _fetchSlots();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isInitialLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading details: $e')));
      }
    }
  }

  Future<void> _fetchSlots() async {
    if (_selectedUnit == null) return;
    
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    
    try {
      await ref.read(bookingControllerProvider.notifier).fetchSlots(_selectedUnit!.id.toString(), dateStr);
      setState(() => _selectedSlots.clear());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _toggleSlot(Map<String, dynamic> slot) {
    if (slot['status'] == 'booked') return;

    setState(() {
      final index = _selectedSlots.indexWhere((s) => s['id'] == slot['id']);
      if (index >= 0) {
        _selectedSlots.removeAt(index);
      } else {
        _selectedSlots.add(slot);
      }
      _selectedSlots.sort((a, b) => DateTime.parse(a['start_iso']).compareTo(DateTime.parse(b['start_iso'])));
    });
  }

  Future<void> _bookNow() async {
    if (_selectedSlots.isEmpty || _selectedUnit == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select at least one slot')));
      return;
    }

    // Contiguous check (similar to web)
    bool hasShortBlock = false;
    if (_selectedSlots.length > 1) {
      // In mobile, we might not strictly enforce 1h, but let's follow web's logic if possible
      // For now, let's keep it simple and just book what's selected
    }

    try {
      // ... logic
      
      final startTime = _selectedSlots.first['start_iso'];
      final endTime = _selectedSlots.last['end_iso'];
      final totalPrice = _selectedSlots.fold<double>(0, (sum, s) => sum + (s['price'] as num).toDouble());

      final response = await ref.read(bookingControllerProvider.notifier).holdSlot(
        unitId: _selectedUnit!.id.toString(),
        startTime: startTime,
        endTime: endTime,
        price: totalPrice,
      );

      _showSuccessDialog(response['assigned_unit'] ?? _selectedUnit!.name);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Booking Failed: $e')));
      }
    }
  }

  void _showSuccessDialog(String unitName) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: GlassContainer(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 60)
                  .animate().scale(curve: Curves.elasticOut, duration: 800.ms),
              const SizedBox(height: 16),
              const Text(
                'Slot Reserved!',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Reserved unit: $unitName\nPlease complete payment in 8 mins.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              CustomButton(
                text: 'DONE',
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  context.go('/'); // Go home
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitialLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSelectors(),
                  const SizedBox(height: 24),
                  _buildGallery(),
                  const SizedBox(height: 24),
                  _buildPriceRatingRow(),
                  const SizedBox(height: 24),
                  _buildAboutSection(),
                  const SizedBox(height: 24),
                  _buildAmenities(),
                  const SizedBox(height: 32),
                  _buildDateSelection(),
                  const SizedBox(height: 32),
                  _buildSlotsSection(),
                  const SizedBox(height: 140),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: _buildBookingBar(),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 300,
      pinned: true,
      leading: IconButton(
        icon: const GlassContainer(
          padding: EdgeInsets.all(8),
          borderRadius: 12,
          child: Icon(Icons.arrow_back, color: Colors.white, size: 20),
        ),
        onPressed: () => context.pop(),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              _turf.imageUrl,
              fit: BoxFit.cover,
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.background.withOpacity(0.5),
                    AppColors.background,
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _turf.name,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.textSecondary, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _turf.location,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectors() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_turf.games.length > 1) ...[
          const Text('Select Sport', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          SizedBox(
            height: 45,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _turf.games.length,
              itemBuilder: (context, index) {
                final game = _turf.games[index];
                final isSelected = _selectedGame?.id == game.id;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedGame = game;
                      if (game.units.isNotEmpty) {
                        _selectedUnit = game.units.first;
                        _fetchSlots();
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: 200.ms,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isSelected ? AppColors.primary : AppColors.surfaceLight),
                    ),
                    child: Center(
                      child: Text(
                        game.sportType,
                        style: TextStyle(
                          color: isSelected ? Colors.black : Colors.white70,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
        ],
        if (_selectedGame != null && _selectedGame!.units.length > 1) ...[
          const Text('Select Court/Pitch', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _selectedGame!.units.map((unit) {
              final isSelected = _selectedUnit?.id == unit.id;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedUnit = unit;
                    _fetchSlots();
                    _activeImgIndex = 0;
                  });
                },
                child: AnimatedContainer(
                  duration: 200.ms,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isSelected ? AppColors.primary : AppColors.surfaceLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        unit.name,
                        style: TextStyle(
                          color: isSelected ? AppColors.primary : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${unit.unitType} • ${unit.capacity} Players',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ] else if (_selectedUnit != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.surfaceLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.sports_soccer, color: AppColors.primary),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_selectedUnit!.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('${_selectedUnit!.unitType} • ${_selectedUnit!.capacity} Players', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildGallery() {
    if (_selectedUnit == null || _selectedUnit!.images.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${_selectedUnit!.name} Gallery', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        AspectRatio(
          aspectRatio: 16 / 9,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                PageView.builder(
                  itemCount: _selectedUnit!.images.length,
                  onPageChanged: (i) => setState(() => _activeImgIndex = i),
                  itemBuilder: (context, index) {
                    return Image.network(_selectedUnit!.images[index].url, fit: BoxFit.cover);
                  },
                ),
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_activeImgIndex + 1}/${_selectedUnit!.images.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceRatingRow() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surfaceLight),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Price per hour', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              Text(
                '₹${(_selectedUnit?.price ?? _turf.pricePerHour).toInt()}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.star, color: AppColors.warning, size: 20),
                const SizedBox(width: 4),
                Text(
                  '${_turf.rating}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection() {
    if (_turf.description.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('About Venue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text(
          _turf.description,
          style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
        ),
      ],
    );
  }

  Widget _buildAmenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Amenities', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _turf.amenities.map((amenity) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(amenity.trim(), style: const TextStyle(fontSize: 13, color: AppColors.textMain)),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDateSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Date', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        SizedBox(
          height: 70,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 14,
            itemBuilder: (context, index) {
              final date = DateTime.now().add(Duration(days: index));
              final isSelected = date.day == _selectedDate.day && date.month == _selectedDate.month;

              return GestureDetector(
                onTap: () {
                  setState(() => _selectedDate = date);
                  _fetchSlots();
                },
                child: AnimatedContainer(
                  duration: 200.ms,
                  width: 60,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        DateFormat('E').format(date).toUpperCase(),
                        style: TextStyle(
                          color: isSelected ? Colors.black : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        date.day.toString(),
                        style: TextStyle(
                          color: isSelected ? Colors.black : Colors.white,
                          fontSize: 18,
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
      ],
    );
  }

  Widget _buildSlotsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Available Slots', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Consumer(
          builder: (context, ref, child) {
            final bookingState = ref.watch(bookingControllerProvider);
            
            if (bookingState.isLoading) {
              return const Center(
                  child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: AppColors.primary)));
            }

            if (bookingState.slots.isEmpty) {
              return const Center(
                  child: Text("No slots available", style: TextStyle(color: Colors.white60)));
            }

            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: bookingState.slots.map((slot) {
                final isAvailable = slot['status'] == 'available';
                final isSelected = _selectedSlots.any((s) => s['id'] == slot['id']);

                return GestureDetector(
                  onTap: isAvailable ? () => _toggleSlot(slot) : null,
                  child: AnimatedContainer(
                    duration: 200.ms,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primary
                          : isAvailable
                              ? AppColors.surface
                              : AppColors.surface.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : (isAvailable ? AppColors.surfaceLight : Colors.transparent),
                      ),
                    ),
                    child: Text(
                      slot['time'],
                      style: TextStyle(
                        color: isSelected
                            ? Colors.black
                            : isAvailable
                                ? Colors.white
                                : AppColors.textSecondary.withOpacity(0.5),
                        fontWeight: FontWeight.bold,
                        decoration: !isAvailable ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildBookingBar() {
    if (_selectedSlots.isEmpty) return const SizedBox.shrink();

    final totalPrice = _selectedSlots.fold<double>(0, (sum, s) => sum + (s['price'] as num).toDouble());
    final totalHours = _selectedSlots.length * (_selectedGame?.slotDuration ?? 60.0) / 60.0;

    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${totalHours.toStringAsFixed(1)} Hours Total',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  Text(
                    '₹${totalPrice.toInt()}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: CustomButton(
                text: 'BOOK NOW',
                onPressed: _bookNow,
              ),
            ),
          ],
        ),
      ),
    ).animate().slideY(begin: 1, end: 0);
  }
}
