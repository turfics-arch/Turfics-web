import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/constants.dart';
import '../../widgets/glass_container.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../providers/owner_provider.dart';

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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Dashboard'), 
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () {
               Provider.of<AuthProvider>(context, listen: false).logout();
               context.go('/login');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const GlassContainer(
              padding: EdgeInsets.all(20),
              width: double.infinity,
              child: Column(
                children: [
                   Icon(Icons.business, size: 48, color: AppColors.primary),
                   SizedBox(height: 16),
                   Text("Welcome, Turf Owner!", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                   SizedBox(height: 8),
                   Text("Manage your revenue, bookings, and slots here.", style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text("Quick Actions", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.1,
              children: [
                _buildActionCard(context, "Bookings", Icons.calendar_month, "/owner/bookings", Colors.blue),
                _buildActionCard(context, "Walk-in / Block", Icons.bolt, "/owner/walk-in", Colors.orange),
                _buildActionCard(context, "Analytics", Icons.analytics, "/owner/analytics", Colors.green),
                _buildActionCard(context, "Staff", Icons.people, "/owner/staff", Colors.purple),
                _buildActionCard(context, "Organizer Hub", Icons.emoji_events, "/owner/organizer-hub", Colors.amber),
                _buildActionCard(context, "Maintenance", Icons.build, "/owner/maintenance", Colors.red),
                _buildActionCard(context, "Venues", Icons.map, "/turfs", Colors.cyan),
              ],
            ),
            const SizedBox(height: 24),
            const Text("Your Venues", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Consumer<OwnerProvider>(
              builder: (context, owner, child) {
                if (owner.isLoading && owner.myTurfs.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (owner.myTurfs.isEmpty) {
                  return const Text("No venues found", style: TextStyle(color: AppColors.textSecondary));
                }
                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: owner.myTurfs.length,
                  itemBuilder: (context, index) {
                    final turf = owner.myTurfs[index];
                    return GestureDetector(
                      onTap: () => context.push('/owner/game-management/${turf.id}'),
                      child: GlassContainer(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Container(
                              width: 60, height: 60,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                image: DecorationImage(
                                  image: NetworkImage(turf.imageUrl),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(turf.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Text("${turf.sports.length} Sports Configured", style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                ],
                              ),
                            ),
                            const Icon(Icons.settings, color: AppColors.textSecondary),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, String label, IconData icon, String route, Color color) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
