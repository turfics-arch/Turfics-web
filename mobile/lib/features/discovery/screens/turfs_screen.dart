import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/models.dart';
import '../providers/turf_controller.dart';
// import '../providers/turf_provider.dart'; // Removing legacy
import '../../../widgets/animated_turf_card.dart';
import '../../../widgets/glass_container.dart';

class TurfsScreen extends ConsumerStatefulWidget {
  const TurfsScreen({super.key});

  @override
  ConsumerState<TurfsScreen> createState() => _TurfsScreenState();
}

class _TurfsScreenState extends ConsumerState<TurfsScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> _sports = [
    {'name': 'All', 'icon': Icons.grid_view_rounded},
    {'name': 'Football', 'icon': Icons.sports_soccer_rounded},
    {'name': 'Cricket', 'icon': Icons.sports_cricket_rounded},
    {'name': 'Tennis', 'icon': Icons.sports_tennis_rounded},
    {'name': 'Badminton', 'icon': Icons.badge_outlined},
  ];

  @override
  void initState() {
    super.initState();
    // Riverpod auto-fetches via build method of async provider, 
    // but if we want to ensure fresh data or prefetch:
    // ref.read(turfControllerProvider);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final turfState = ref.watch(turfControllerProvider);
    final filters = ref.watch(turfFilterProvider);
    
    // Manual filtering locally for now, assuming controller returns all
    // Or call ref.read(turfControllerProvider.notifier).filter if logic inside controller
    // For now let's apply filter locally in UI or assume state is filtered? 
    // In current controller implementation, I made .filter method update state.
    // Ideally, we start listener.
    
    ref.listen(turfFilterProvider, (prev, next) {
      ref.read(turfControllerProvider.notifier).filter(next['query']!, next['sport']!);
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Glows
          _buildBackglow(),

          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Premium Header
                _buildHeader(),

                // 2. Search & Filter Bar
                _buildSearchSection(filters, ref),

                // 3. Categories
                _buildCategories(filters, ref),

                // 4. Results List
                Expanded(
                  child: _buildResultsList(turfState, ref),
                ),
              ],
            ),
          ),
          
          // Floating Map Button
          _buildMapFab(),
        ],
      ),
    );
  }

  Widget _buildBackglow() {
    return Positioned(
      top: -100,
      right: -100,
      child: Container(
        width: 300,
        height: 300,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [AppColors.primary.withOpacity(0.15), Colors.transparent],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
           Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Explore Turfs',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ).animate().fadeIn().slideX(begin: -0.1, end: 0),
              Text(
                'Find the perfect ground for your game',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ).animate().fadeIn(delay: 200.ms),
            ],
          ),
          // Notification or Filter Icon
           IconButton(
            icon: const Icon(Icons.tune_rounded, color: Colors.white),
            onPressed: () => _showFilterSheet(context),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.05),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchSection(Map<String, String> filters, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        borderRadius: 16,
        color: Colors.white.withOpacity(0.05),
        child: TextField(
          controller: _searchController,
          onChanged: (val) {
             ref.read(turfFilterProvider.notifier).setQuery(val);
          },
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Search by name or area...',
            hintStyle: const TextStyle(color: Colors.white38),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty 
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, color: Colors.white38), 
                  onPressed: () {
                    _searchController.clear();
                    ref.read(turfFilterProvider.notifier).setQuery('');
                  },
                )
              : null,
          ),
        ),
      ).animate().fadeIn(delay: 300.ms).scale(begin: const Offset(0.95, 0.95)),
    );
  }

  Widget _buildCategories(Map<String, String> filters, WidgetRef ref) {
    return Container(
      height: 90,
      margin: const EdgeInsets.only(top: 16),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        scrollDirection: Axis.horizontal,
        itemCount: _sports.length,
        itemBuilder: (context, index) {
          final sport = _sports[index];
          bool isSelected = filters['sport'] == sport['name'];

          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: InkWell(
              onTap: () => ref.read(turfFilterProvider.notifier).setSport(sport['name']),
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: 300.ms,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.03),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : Colors.white10,
                      ),
                    ),
                    child: Icon(
                      sport['icon'], 
                      color: isSelected ? Colors.black : Colors.white70,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    sport['name'],
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.white38,
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(delay: (400 + index * 50).ms).slideY(begin: 0.1, end: 0);
        },
      ),
    );
  }

  Widget _buildResultsList(AsyncValue<List<Turf>> turfState, WidgetRef ref) {
    return turfState.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      data: (turfs) {
        if (turfs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.search_off_rounded, size: 64, color: Colors.white10),
                const SizedBox(height: 16),
                const Text(
                  'No Turfs Found',
                  style: TextStyle(color: Colors.white38, fontSize: 16),
                ),
              ],
            ).animate().fadeIn(),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(turfControllerProvider),
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          child: ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: turfs.length,
            itemBuilder: (context, index) {
              return AnimatedTurfCard(
                turf: turfs[index],
                index: index,
              ).animate().fadeIn(delay: (200 + index * 50).ms).slideY(begin: 0.1, end: 0);
            },
          ),
        );
      },
    );
  }

  Widget _buildMapFab() {
     return Positioned(
       bottom: 24,
       left: 0,
       right: 0,
       child: Center(
         child: Container(
           padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
           decoration: BoxDecoration(
             color: Colors.black,
             borderRadius: BorderRadius.circular(30),
             border: Border.all(color: Colors.white10),
             boxShadow: [
               BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10, spreadRadius: 2),
             ],
           ),
           child: const Row(
             mainAxisSize: MainAxisSize.min,
             children: [
               Icon(Icons.map_rounded, color: AppColors.primary, size: 20),
               SizedBox(width: 8),
               Text('Map View', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
             ],
           ),
         ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.5, end: 0),
       ),
     );
  }

  void _showFilterSheet(BuildContext context) {
     showModalBottomSheet(
       context: context,
       backgroundColor: AppColors.surface,
       shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
       builder: (context) => Container(
         padding: const EdgeInsets.all(24),
         height: 300,
         child: const Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
             Text('Advanced Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
             SizedBox(height: 24),
             Text('Price Range', style: TextStyle(color: Colors.white70)),
             // Slider placeholder
             Slider(value: 0.5, onChanged: null),
             SizedBox(height: 16),
             Text('Distance', style: TextStyle(color: Colors.white70)),
             // Chips placeholder
             Row(children: [Chip(label: Text('< 5km'))]),
           ],
         ),
       ),
     );
  }
}
