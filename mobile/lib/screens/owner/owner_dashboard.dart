import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/constants.dart';
import '../../core/theme/theme_provider.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/skeleton_container.dart';
import '../../providers/owner_provider.dart';
import '../../data/models/models.dart';

class OwnerDashboard extends StatefulWidget {
  const OwnerDashboard({super.key});

  @override
  State<OwnerDashboard> createState() => _OwnerDashboardState();
}

class _OwnerDashboardState extends State<OwnerDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = Provider.of<OwnerProvider>(context, listen: false);
      // Use cached data by default
      await provider.fetchMyTurfs();
      if (provider.selectedTurf != null) {
        await provider.fetchBookings(provider.selectedTurf!.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ownerProvider = Provider.of<OwnerProvider>(context);
    
    // Mock Data for "Command Center" feel
    final String greeting = "Good Morning, Owner"; 
    
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header & Venue Selector
              _buildHeader(context, greeting, ownerProvider),
              
              const SizedBox(height: 24),

              // 2. Key Stats (Above the Fold)
              if (ownerProvider.isLoading)
                _buildStatsSkeleton()
              else
                _buildStatsRow(context, ownerProvider),

              const SizedBox(height: 24),

              // 3. Promote Widget
              if (ownerProvider.isLoading)
                const SkeletonContainer(width: double.infinity, height: 100, borderRadius: 16)
              else
                _buildPromoteWidget(context),

              const SizedBox(height: 24),

              // 4. Quick Actions
              Text("Quick Actions", style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _buildQuickActions(context),

              const SizedBox(height: 24),

              // 5. Today's Schedule Timeline
              Text("Today's Schedule", style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              if (ownerProvider.isLoading)
                _buildTimelineSkeleton()
              else
                _buildTimeline(context, ownerProvider),
              
              const SizedBox(height: 80), // Bottom padding
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String greeting, OwnerProvider ownerProvider) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(greeting, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              // VENUE SELECTOR
              if (ownerProvider.isLoading)
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              else if (ownerProvider.myTurfs.isEmpty)
                const Text("No Turfs Found", style: TextStyle(color: AppColors.error))
              else
                GestureDetector(
                  onTap: () {
                     showModalBottomSheet(context: context, backgroundColor: AppColors.darkBackground, builder: (c) {
                        return Padding(
                          padding: const EdgeInsets.all(AppConstants.defaultPadding),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("Select Venue", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                              const SizedBox(height: 16),
                              ...ownerProvider.myTurfs.map((t) => ListTile(
                                leading: const Icon(Icons.stadium, color: AppColors.primary),
                                title: Text(t.name, style: const TextStyle(color: Colors.white)),
                                trailing: ownerProvider.selectedTurf?.id == t.id ? const Icon(Icons.check, color: AppColors.accent) : null,
                                onTap: () {
                                  ownerProvider.selectTurf(t);
                                  Navigator.pop(context);
                                },
                              )),
                              const Divider(color: Colors.white24),
                              ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                                  child: const Icon(Icons.add, color: Colors.white, size: 20)
                                ),
                                title: const Text("Add New Venue", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                onTap: () {
                                  Navigator.pop(context);
                                  context.push('/owner/onboarding');
                                },
                              )
                            ],
                          ),
                        );
                     });
                  },
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(
                          ownerProvider.selectedTurf?.name ?? "Add Your Turf",
                          style: const TextStyle(
                            fontSize: 20, 
                            fontWeight: FontWeight.bold, 
                            color: Colors.white
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down, color: Colors.white54)
                    ],
                  ),
                ),
            ],
          ),
        ),
        Row(
          children: [
             IconButton(
               icon: Icon(themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode),
               onPressed: () => themeProvider.toggleTheme(!themeProvider.isDarkMode),
             ),
          ],
        )
      ],
    ).animate().fadeIn().slideY(begin: -0.2);
  }

  Widget _buildStatsRow(BuildContext context, OwnerProvider ownerProvider) {
    if (ownerProvider.myTurfs.isEmpty) {
      return _buildGettingStartedCard(context, ownerProvider);
    }

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(context, "₹12,450", "Today's Revenue", Icons.currency_rupee, Colors.green, onTap: () => context.push('/owner/todays-summary')),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard(context, "24", "Today's Volume", Icons.bar_chart, Colors.blue, onTap: () => context.push('/owner/history')),
        ),
      ],
    ).animate().fadeIn(delay: 100.ms).slideX();
  }

  Widget _buildGettingStartedCard(BuildContext context, OwnerProvider provider) {
    int progress = provider.setupProgress;
    
    return GestureDetector(
      onTap: () => context.push('/owner/onboarding'),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Welcome to Turfics 👋", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text("You’re 3 steps away from your first booking", style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            
            // Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress / 100,
                backgroundColor: Colors.white10,
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.greenAccent),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 8),
            Text("Setup Progress: $progress%", style: const TextStyle(fontSize: 12, color: Colors.greenAccent)),
            
            const SizedBox(height: 20),
            
            // Actions
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                 _buildActionButton(context, "Set Operating Hours", Icons.access_time, isDone: progress >= 60),
                 _buildActionButton(context, "Add First Slot", Icons.calendar_today, isDone: progress >= 90),
                 _buildActionButton(context, "Enable Walk-ins", Icons.storefront, isDone: progress == 100),
              ],
            )
          ],
        )
      ),
    ).animate().fadeIn().slideY();
  }

  Widget _buildActionButton(BuildContext context, String label, IconData icon, {bool isDone = false}) {
     return Opacity(
       opacity: isDone ? 0.5 : 1.0,
       child: Container(
         padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
         decoration: BoxDecoration(
           color: isDone ? Colors.green.withOpacity(0.2) : Colors.white.withOpacity(0.1),
           borderRadius: BorderRadius.circular(8),
           border: Border.all(color: isDone ? Colors.green : Colors.white24)
         ),
         child: Row(
           mainAxisSize: MainAxisSize.min,
           children: [
             Icon(isDone ? Icons.check : icon, color: isDone ? Colors.green : Colors.white, size: 16),
             const SizedBox(width: 8),
             Text(label, style: const TextStyle(fontSize: 12)),
           ],
         ),
       ),
     );
  }

  Widget _buildStatCard(BuildContext context, String value, String label, IconData icon, Color color, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                 Icon(icon, color: color, size: 20),
                 if (label.contains("Revenue")) 
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                     decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                     child: Text("+12%", style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
                   )
              ],
            ),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, fontFamily: 'Rubik')),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoteWidget(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/owner/promote'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2962FF), Color(0xFF448AFF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
             BoxShadow(color: const Color(0xFF2962FF).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))
          ]
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
              child: const Icon(Icons.bolt, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Promote Your Turf", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  Text("Supercharge bookings with ads.", style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 16),
          ],
        ),
      ),
    ).animate(onPlay: (c) => c.repeat(period: 3.seconds))
     .shimmer(duration: 1200.ms, color: Colors.white.withOpacity(0.8), angle: 0.8)
     .fadeIn(duration: 300.ms);
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      {"label": "New Booking", "icon": Icons.add_circle, "route": "/owner/walk-in", "color": AppColors.primary},
      {"label": "Block Slot", "icon": Icons.block, "route": "/owner/bookings?modal=block", "color": AppColors.warning},
      {"label": "Manage Staff", "icon": Icons.people, "route": "/owner/staff", "color": Colors.blueAccent},
      {"label": "Analytics", "icon": Icons.bar_chart, "route": "/owner/analytics", "color": Colors.purple},
    ];

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final action = actions[index];
          return GestureDetector(
            onTap: () {
               if (action['label'] == "Block Slot") {
                 context.go('/owner/bookings');
               } else {
                 context.push(action['route'] as String);
               }
            },
            child: Container(
              width: 90,
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: (Theme.of(context).cardTheme.shape as RoundedRectangleBorder).side.color),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (action['color'] as Color).withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: (action['color'] as Color), width: 1.5),
                    ),
                    child: Icon(action['icon'] as IconData, color: action['color'] as Color, size: 24),
                  ),
                  const SizedBox(height: 8),
                  Text(action['label'] as String, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.center, maxLines: 1),
                ],
              ),
            ),
          ).animate().fadeIn(delay: (200 + (index * 50)).ms).scale();
        },
      ),
    );
  }

  Widget _buildStatsSkeleton() {
    return const Row(
      children: [
        Expanded(child: SkeletonContainer(width: double.infinity, height: 100)),
        SizedBox(width: 12),
        Expanded(child: SkeletonContainer(width: double.infinity, height: 100)),
      ],
    );
  }

  Widget _buildTimelineSkeleton() {
    return Column(
      children: List.generate(4, (index) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            const SkeletonContainer(width: 70, height: 20),
            const SizedBox(width: 12),
            Expanded(child: SkeletonContainer(width: double.infinity, height: 80)),
          ],
        ),
      )),
    );
  }

  Widget _buildTimeline(BuildContext context, OwnerProvider ownerProvider) {
    // Filter bookings for today
    final bookings = ownerProvider.bookings.where((b) {
       final now = DateTime.now();
       try {
         final start = DateTime.parse(b.startTime);
         return start.year == now.year && start.month == now.month && start.day == now.day;
       } catch (e) {
         return false;
       }
    }).toList();
    
    // Sort by time
    bookings.sort((a, b) {
      try {
        return DateTime.parse(a.startTime).compareTo(DateTime.parse(b.startTime));
      } catch (e) {
        return 0;
      }
    });

    if (bookings.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Icon(Icons.event_busy, color: Colors.white.withOpacity(0.2), size: 40),
              const SizedBox(height: 8),
              const Text("No bookings scheduled for today", style: TextStyle(color: Colors.white54)),
            ],
          ),
        ),
      );
    }

    return Column(
      children: bookings.asMap().entries.map((entry) {
        final index = entry.key;
        final booking = entry.value;
        
        DateTime start;
        try {
          start = DateTime.parse(booking.startTime);
        } catch (e) {
          start = DateTime.now();
        }

        // Format time safely
        final timeStr = "${start.hour.toString().padLeft(2,'0')}:${start.minute.toString().padLeft(2,'0')}";

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              SizedBox(
                width: 70,
                child: Text(
                  timeStr, 
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textSecondary)
                ),
              ),
              Column(
                children: [
                   Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                    ),
                  ),
                  if (index != bookings.length - 1)
                  Container(width: 2, height: 40, color: AppColors.textSecondary.withOpacity(0.1)),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              booking.guestName ?? "Guest User", 
                              style: const TextStyle(fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              "${booking.unitName} • ₹${booking.totalPrice}", 
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)
                            ),
                          ],
                        ),
                      ),
                      Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(color: Colors.green.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                         child: Text(booking.status.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.1),
        );
      }).toList(),
    );
  }
}
