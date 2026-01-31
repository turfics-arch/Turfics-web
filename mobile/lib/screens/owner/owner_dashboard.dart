import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_provider.dart'; // Import ThemeProvider
import '../../widgets/glass_container.dart';
import '../../features/auth/providers/auth_provider.dart';
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OwnerProvider>(context, listen: false).fetchMyTurfs();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final ownerProvider = Provider.of<OwnerProvider>(context);
    
    // Mock Data for "Command Center" feel
    final String greeting = "Good Morning, Owner"; // TODO: Get from User Profile
    
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
                _buildStatsRow(context),

              const SizedBox(height: 24),

              // 3. Promote Widget (Moved from Nav)
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
                _buildTimeline(context),
              
              const SizedBox(height: 80), // Bottom padding for Nav Bar
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
                DropdownButtonHideUnderline(
                  child: DropdownButton<Turf>(
                    value: ownerProvider.selectedTurf,
                    icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                      fontSize: 14,
                      fontWeight: FontWeight.w600
                    ),
                    items: ownerProvider.myTurfs.map((Turf turf) {
                      return DropdownMenuItem<Turf>(
                        value: turf,
                        child: Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(turf.name, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (Turf? newValue) {
                      ownerProvider.selectTurf(newValue);
                    },
                  ),
                ),
            ],
          ),
        ),
        Row(
          children: [
             // THEME TOGGLE
             IconButton(
               icon: Icon(themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode),
               onPressed: () => themeProvider.toggleTheme(!themeProvider.isDarkMode),
             ),

          ],
        )
      ],
    ).animate().fadeIn().slideY(begin: -0.2);
  }

  Widget _buildStatsRow(BuildContext context) {
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
            colors: [Color(0xFF2962FF), Color(0xFF448AFF)], // Blue Thunder Gradient
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
              child: const Icon(Icons.bolt, color: Colors.white, size: 28), // Thunder Icon
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
     .shimmer(duration: 1200.ms, color: Colors.white.withOpacity(0.8), angle: 0.8) // Thunder Shine
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

  Widget _buildTimeline(BuildContext context) {
    final schedule = [
      {"time": "09:00 AM", "status": "Booked", "guest": "Vikram Singh", "sport": "Cricket"},
      {"time": "10:00 AM", "status": "Available", "guest": "", "sport": ""},
      {"time": "11:00 AM", "status": "Booked", "guest": "Tech Corp Tourny", "sport": "Football (5v5)"},
      {"time": "12:00 PM", "status": "Available", "guest": "", "sport": ""},
    ];

    return Column(
      children: schedule.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        final isBooked = item['status'] == 'Booked';

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              SizedBox(
                width: 70,
                child: Text(item['time']!, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
              ),
              Column(
                children: [
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(
                      color: isBooked ? AppColors.primary : AppColors.textSecondary.withOpacity(0.3),
                      shape: BoxShape.circle,
                      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2),
                    ),
                  ),
                  if (index != schedule.length - 1)
                  Container(width: 2, height: 40, color: AppColors.textSecondary.withOpacity(0.1)),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isBooked ? item['guest']! : "Available Slot", 
                            style: TextStyle(
                              fontWeight: FontWeight.bold, 
                              color: isBooked ? null : AppColors.success
                            )
                          ),
                          if (isBooked)
                          Text(item['sport']!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                      const Spacer(),
                      if (!isBooked)
                         ElevatedButton(
                           onPressed: () {},
                           style: ElevatedButton.styleFrom(
                             padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                             minimumSize: const Size(0, 32),
                             backgroundColor: AppColors.primary.withOpacity(0.1),
                             foregroundColor: AppColors.primary,
                             elevation: 0,
                           ),
                           child: const Text("Promote", style: TextStyle(fontSize: 12)),
                         )
                    ],
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: (300 + (index * 50)).ms).slideX(begin: 0.1),
        );
      }).toList(),
    );
  }
}
