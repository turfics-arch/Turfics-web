import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/constants.dart';
import '../providers/match_controller.dart';
// import '../providers/match_provider.dart'; // Removing legacy
import '../../../widgets/glass_container.dart';
import '../../../data/models/models.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  String _activeTab = 'matches'; // 'matches' or 'my_activity'

  @override
  void initState() {
    super.initState();
    // ref.read(matchControllerProvider);
    // ref.read(matchActivityControllerProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          _buildTabs(),
          _buildContent(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      backgroundColor: AppColors.background,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.orange.withOpacity(0.3),
                    AppColors.background,
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.orange.withOpacity(0.5)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.flash_on, color: Colors.orange, size: 16),
                            const SizedBox(width: 4),
                            Text('LIVE MATCHES', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 10)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Find Your Squad.',
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: -1.5,
                      height: 1,
                    ),
                  ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.2),
                  Text(
                    'Own the Turf.',
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                      letterSpacing: -1.5,
                      height: 1.2,
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 600.ms).slideX(begin: -0.2),
                   const SizedBox(height: 8),
                  Text(
                    'Join trending pick-up games or host your own.',
                    style: TextStyle(color: Colors.white54, fontSize: 14),
                  ).animate().fadeIn(delay: 400.ms),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            _buildTabButton('Discover Games', 'matches'),
            const SizedBox(width: 12),
            _buildTabButton('My Matches', 'my_activity'),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, String tab) {
    bool isSelected = _activeTab == tab;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = tab),
        child: AnimatedContainer(
          duration: 300.ms,
          padding: const EdgeInsets.symmetric(vertical: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.surfaceLight,
              width: 1,
            ),
            boxShadow: isSelected
                ? [BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8))]
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.black : Colors.white70,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_activeTab == 'matches') {
       final matchesState = ref.watch(matchControllerProvider);
       return matchesState.when(
          loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary))),
          error: (err, stack) => SliverFillRemaining(child: Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red)))),
          data: (matches) {
            if (matches.isEmpty) {
                 return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.sports_soccer, color: Colors.white12, size: 80),
                          const SizedBox(height: 24),
                          Text('No live matches found', style: TextStyle(color: Colors.white30, fontSize: 18, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 12),
                          Text('Be the first to host one!', style: TextStyle(color: Colors.white12, fontSize: 14)),
                        ],
                      ),
                    ),
                  );
            }
            return SliverPadding(
               padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
               sliver: SliverList(
                 delegate: SliverChildBuilderDelegate(
                   (context, index) => _buildMatchCard(matches[index], index),
                   childCount: matches.length,
                 ),
               ),
            );
          }
       );
    } else {
       final activityState = ref.watch(matchActivityControllerProvider);
       return activityState.when(
          loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primary))),
          error: (err, stack) => SliverFillRemaining(child: Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red)))),
          data: (activity) {
            final items = [...activity['hosted']!, ...activity['joined']!];
            if (items.isEmpty) {
                 return const SliverFillRemaining(child: Center(child: Text('No activity yet', style: TextStyle(color: Colors.white30))));
            }
            return SliverPadding(
               padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
               sliver: SliverList(
                 delegate: SliverChildBuilderDelegate(
                   (context, index) => _buildActivityCard(items[index], index),
                   childCount: items.length,
                 ),
               ),
            );
          }
       );
    }
  }

  Widget _buildMatchCard(MatchRequest match, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: GlassContainer(
        padding: const EdgeInsets.all(0),
        child: Column(
          children: [
            Container(
              height: 130,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                image: DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop'),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black87],
                  ),
                ),
                padding: const EdgeInsets.all(16),
                alignment: Alignment.bottomLeft,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        match.sport.toUpperCase(),
                        style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                    ),
                    Text(
                      'By ${match.creatorName}',
                      style: TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(match.turfName, style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: -0.5)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on, color: AppColors.textSecondary, size: 14),
                      const SizedBox(width: 4),
                      Text(match.location, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildMetaItem('TIME', match.time, Icons.access_time),
                      _buildMetaItem('NEEDS', '${match.playersNeeded} PLY', Icons.group),
                      _buildMetaItem('ENTRY', '₹${match.costPerPlayer.toInt()}', Icons.payments),
                    ],
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _handleJoinMatch(match),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Request to Join', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 50.ms * (index % 5)).slideY(begin: 0.1, duration: 400.ms);
  }

  Widget _buildMetaItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 12),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: Colors.white30, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 6),
        Text(value, style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildActivityCard(dynamic item, int index) {
    final isHosting = item.containsKey('hosted') || item.containsKey('requests');
    final String status = item['status'] ?? 'Pending';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isHosting ? AppColors.primary.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                isHosting ? Icons.campaign_rounded : Icons.sports_soccer_rounded,
                color: isHosting ? AppColors.primary : Colors.blue,
                size: 26,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['sport'] ?? 'Match',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'at ${item['turf_name']}',
                    style: TextStyle(color: Colors.white38, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _getStatusColor(status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _getStatusColor(status).withOpacity(0.3)),
              ),
              child: Text(
                status.toUpperCase(),
                style: TextStyle(color: _getStatusColor(status), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
      case 'approved':
      case 'active':
      case 'paid':
        return AppColors.success;
      case 'pending':
        return Colors.orange;
      case 'full':
      case 'rejected':
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.white70;
    }
  }

  void _handleJoinMatch(MatchRequest match) async {
    try {
      await ref.read(matchControllerProvider.notifier).joinMatch(match.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('Join request sent!'),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to join: $e'), 
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }
}
