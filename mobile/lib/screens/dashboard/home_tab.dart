import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/constants.dart';
import '../../features/auth/providers/auth_controller.dart';
import '../../features/discovery/providers/turf_controller.dart';
import '../../data/models/models.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/animated_turf_card.dart';
import '../../widgets/live_grid_card.dart';

class HomeTab extends ConsumerStatefulWidget {
  const HomeTab({super.key});

  @override
  ConsumerState<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<HomeTab> {
  @override
  void initState() {
    super.initState();
    // ref.read(turfControllerProvider);
  }

  @override
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    String displayName = 'Player'; 
    if (authState.role != null) {
      displayName = authState.role!.toUpperCase();
    }

    // final turfProvider = Provider.of<TurfProvider>(context); // Removed

    return Scaffold(
      backgroundColor: Colors.transparent, // Let gradient show if parent has it, else black
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Top Bar & Integrated Search
              _buildModernHeader(displayName),
              const SizedBox(height: 24),

              // 2. Featured Ad/Hero Section
              _buildHeroSection(context),
              const SizedBox(height: 32),

              // 4. Recent Activity
              _buildRecentActivity(),
              const SizedBox(height: 32),
              
              // 5. Featured Section
              _buildFeaturedSection(ref),
              
              const SizedBox(height: 80), 
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernHeader(String name) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good Morning,',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 26,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            GestureDetector(
              onTap: () => context.push('/profile'),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primary, AppColors.secondary]),
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 24,
                  backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=33'),
                  backgroundColor: Colors.grey[800],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        // Integrated Search Bar
        GestureDetector(
          onTap: () => context.push('/turfs'),
          child: GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            borderRadius: 16,
            color: Colors.white.withOpacity(0.05),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, color: AppColors.primary, size: 22),
                const SizedBox(width: 12),
                Text(
                  'Search for turfs, coaches, areas...',
                  style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 14),
                ),
              ],
            ),
          ),
        ),
      ],
    ).animate().fadeIn().slideY(begin: -0.1, end: 0);
  }

  Widget _buildTopBar(String name) { // Legacy placeholder just in case, or keep it clean
    return const SizedBox.shrink();
  }

  Widget _buildHeroSection(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 180,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        image: const DecorationImage(
          image: NetworkImage('https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'),
          fit: BoxFit.cover,
        ),
      ),
      child: Stack(
        children: [
          // Gradient Overlay
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Book Your Game Now',
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Get 20% off on your first booking!',
                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {}, // Navigate to Discovery?
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  ),
                  child: const Text('Book Now'),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).shimmer(duration: 2.seconds, delay: 1.seconds);
  }

  Widget _buildQuickAccessGrid(BuildContext context) {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Column: 1 Large + 1 Small
            Expanded(
              flex: 3,
              child: Column(
                children: [
                  LiveGridCard(
                    icon: Icons.sports_soccer_rounded,
                    label: 'Turfs',
                    onTap: () => context.push('/turfs'),
                    height: 200,
                    iconSize: 42,
                    badgeText: 'HOT',
                    badgeColor: AppColors.accent,
                    color: AppColors.primary.withOpacity(0.1),
                  ),
                  const SizedBox(height: 16),
                  LiveGridCard(
                    icon: Icons.sports_rounded,
                    label: 'Coaches',
                    onTap: () => context.push('/coaches'),
                    height: 110,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            // Right Column: 1 Small + 1 Medium (Live)
            Expanded(
              flex: 2,
              child: Column(
                children: [
                  LiveGridCard(
                    icon: Icons.calendar_today_rounded,
                    label: 'Bookings',
                    onTap: () => context.push('/bookings'),
                    height: 140,
                    badgeText: '2 Active',
                    badgeColor: AppColors.secondary,
                  ),
                  const SizedBox(height: 16),
                  LiveGridCard(
                    icon: Icons.emoji_events_rounded,
                    label: 'Tournaments',
                    onTap: () => context.push('/tournaments'),
                    isLive: true,
                    badgeText: 'LIVE',
                    badgeColor: AppColors.error,
                    height: 170,
                    color: AppColors.error.withOpacity(0.05),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Bottom Row: 1 Long Card
        Row(
          children: [
            Expanded(
              child: LiveGridCard(
                icon: Icons.groups_rounded,
                label: 'Play With Others (Community)',
                onTap: () => context.push('/play'),
                height: 100,
                isLive: true,
                badgeText: '128 Active Players',
                badgeColor: AppColors.success,
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Activity',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 16),
        GlassContainer(
          padding: const EdgeInsets.all(16),
          color: Colors.white.withOpacity(0.03),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.blue.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.notifications_active, color: Colors.blue),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Booking Confirmed', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Your slot at Green Valley was confirmed.', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              const Text('2m ago', style: TextStyle(color: AppColors.textSecondary, fontSize: 10)),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(delay: 400.ms);
  }

  Widget _buildFeaturedSection(WidgetRef ref) {
     final turfState = ref.watch(turfControllerProvider);
     
     return Column(
       crossAxisAlignment: CrossAxisAlignment.start,
       children: [
         const Text(
            'Featured Turfs',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 16),
          turfState.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
            data: (turfs) => turfs.isEmpty 
                  ? const Center(child: Text("No turfs found", style: TextStyle(color: Colors.white)))
                  : ListView.builder(
                      shrinkWrap: true, // Important inside SingleScrollView
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: turfs.length > 3 ? 3 : turfs.length, // Limit to 3
                      itemBuilder: (context, index) {
                        return AnimatedTurfCard(
                          turf: turfs[index],
                          index: index,
                        );
                      },
                    ),
          ),
       ],
     );
  }
}
