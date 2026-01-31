import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class GameManagementScreen extends StatefulWidget {
  final String turfId;
  const GameManagementScreen({super.key, required this.turfId});

  @override
  State<GameManagementScreen> createState() => _GameManagementScreenState();
}

class _GameManagementScreenState extends State<GameManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final owner = Provider.of<OwnerProvider>(context, listen: false);
    await owner.fetchMyTurfs();
    // Assuming we need to fetch specific game data if it's not already in the turf model
    // But our Turf model has a 'games' list.
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OwnerProvider>(
      builder: (context, owner, child) {
        final turf = owner.myTurfs.firstWhere((t) => t.id == widget.turfId, 
          orElse: () => Turf(id: '', name: 'Loading...', location: '', pricePerHour: 0, rating: 0, imageUrl: '', sports: [], amenities: [], openingTime: '', closingTime: '', lat: 0, lng: 0));

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(turf.name),
                const Text('Game Configuration', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
              ],
            ),
          ),
          body: owner.isLoading && turf.id.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(AppConstants.defaultPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Sports & Units', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          ElevatedButton.icon(
                            onPressed: () => _showAddSportModal(context),
                            icon: const Icon(Icons.add),
                            label: const Text('Add Sport'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (turf.games.isEmpty)
                        _buildEmptyState()
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: turf.games.length,
                          itemBuilder: (context, index) {
                            final game = turf.games[index];
                            return _buildGameCard(game);
                          },
                        ),
                    ],
                  ),
                ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 40),
          Icon(Icons.sports_soccer, size: 64, color: Colors.white.withOpacity(0.1)),
          const SizedBox(height: 16),
          const Text('No sports configured for this venue', style: TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildGameCard(TurfGame game) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(game.sportType, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('₹${game.defaultPrice.toInt()}/hr • ${game.slotDuration} min slots', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                ],
              ),
              IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () {}),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Units (${game.units.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add_circle_outline, size: 16),
                label: const Text('Add Unit', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...game.units.map((unit) => _buildUnitItem(unit)).toList(),
        ],
      ),
    );
  }

  Widget _buildUnitItem(TurfUnit unit) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(unit.name, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text('${unit.unitType} • Cap: ${unit.capacity}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            ],
          ),
          Row(
            children: [
              if (unit.price > 0)
                Text('₹${unit.price.toInt()}/hr', style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              IconButton(icon: const Icon(Icons.more_vert, size: 18), onPressed: () {}),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddSportModal(BuildContext context) {
    // Implement add sport form
  }
}
