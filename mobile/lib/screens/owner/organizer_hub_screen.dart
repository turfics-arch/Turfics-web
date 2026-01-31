import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class OrganizerHubScreen extends StatefulWidget {
  const OrganizerHubScreen({super.key});

  @override
  State<OrganizerHubScreen> createState() => _OrganizerHubScreenState();
}

class _OrganizerHubScreenState extends State<OrganizerHubScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OwnerProvider>(context, listen: false).fetchOrganizerTournaments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizer Hub'),
      ),
      body: Consumer<OwnerProvider>(
        builder: (context, owner, child) {
          if (owner.isLoading && owner.organizerTournaments.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatsGrid(owner),
                const SizedBox(height: 24),
                const Text(
                  'Your Tournaments',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                if (owner.organizerTournaments.isEmpty)
                  _buildEmptyState()
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: owner.organizerTournaments.length,
                    itemBuilder: (context, index) {
                      final tournament = owner.organizerTournaments[index];
                      return _buildTournamentCard(tournament);
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsGrid(OwnerProvider owner) {
    // Basic stat calculation if backend doesn't provide them directly
    int activeCount = owner.organizerTournaments.where((t) => t.status != 'completed').length;
    double totalRevenue = owner.organizerTournaments.fold(0, (sum, t) => sum + t.walletBalance);

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.5,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _buildStatCard('Active', activeCount.toString(), Icons.emoji_events_outlined, Colors.orange),
        _buildStatCard('Revenue', '₹${totalRevenue.toInt()}', Icons.account_balance_wallet_outlined, Colors.green),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 40),
          Icon(Icons.event_note_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
          const SizedBox(height: 16),
          const Text('No tournaments hosted yet', style: TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildTournamentCard(Tournament t) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: NetworkImage(t.imageUrl.isNotEmpty ? t.imageUrl : 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500'),
                fit: BoxFit.cover,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            ),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withOpacity(0.8), Colors.transparent],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      t.status.toUpperCase(),
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMetaInfo(Icons.calendar_today, t.startDate),
                    _buildMetaInfo(Icons.sports_soccer, t.sport),
                    _buildMetaInfo(Icons.people, '${t.registeredTeams}/${t.maxTeams}'),
                  ],
                ),
                const Divider(height: 24, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Wallet Balance', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                        Text('₹${t.walletBalance.toInt()}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        // Implement management deep link or details
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.05),
                        side: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: const Text('Manage'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaInfo(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}
