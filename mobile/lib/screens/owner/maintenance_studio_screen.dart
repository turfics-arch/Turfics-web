import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class MaintenanceStudioScreen extends StatefulWidget {
  const MaintenanceStudioScreen({super.key});

  @override
  State<MaintenanceStudioScreen> createState() => _MaintenanceStudioScreenState();
}

class _MaintenanceStudioScreenState extends State<MaintenanceStudioScreen> {
  String? _selectedTurfId;

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
    if (owner.myTurfs.isNotEmpty) {
      setState(() => _selectedTurfId = owner.myTurfs.first.id);
      owner.fetchMaintenanceData(_selectedTurfId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance Studio'),
      ),
      body: Consumer<OwnerProvider>(
        builder: (context, owner, child) {
          if (owner.isLoading && owner.maintenanceTasks.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (owner.myTurfs.isNotEmpty)
                  _buildTurfSelector(owner),
                const SizedBox(height: 24),
                _buildSectionHeader(Icons.build_outlined, 'Equipment Fleet'),
                const SizedBox(height: 12),
                _buildAssetList(owner),
                const SizedBox(height: 32),
                _buildSectionHeader(Icons.assignment_outlined, 'Upcoming Tasks'),
                const SizedBox(height: 12),
                _buildTaskList(owner),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTurfSelector(OwnerProvider owner) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedTurfId,
          isExpanded: true,
          dropdownColor: AppColors.background,
          items: owner.myTurfs.map((turf) {
            return DropdownMenuItem(value: turf.id, child: Text(turf.name));
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              setState(() => _selectedTurfId = value);
              owner.fetchMaintenanceData(value);
            }
          },
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        Icon(Icons.add_circle_outline, color: Colors.white.withOpacity(0.5), size: 20),
      ],
    );
  }

  Widget _buildAssetList(OwnerProvider owner) {
    if (owner.maintenanceAssets.isEmpty) {
      return const Text('No assets registered', style: TextStyle(color: AppColors.textSecondary, fontSize: 13));
    }

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: owner.maintenanceAssets.length,
        itemBuilder: (context, index) {
          final asset = owner.maintenanceAssets[index];
          return GlassContainer(
            width: 140,
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(
                        color: asset.status == 'active' ? Colors.green : Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const Icon(Icons.settings, size: 14, color: AppColors.textSecondary),
                  ],
                ),
                const SizedBox(height: 8),
                Text(asset.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('${asset.currentHours} hrs used', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTaskList(OwnerProvider owner) {
    if (owner.maintenanceTasks.isEmpty) {
      return const Text('No upcoming tasks', style: TextStyle(color: AppColors.textSecondary, fontSize: 13));
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: owner.maintenanceTasks.length,
      itemBuilder: (context, index) {
        final task = owner.maintenanceTasks[index];
        return GlassContainer(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _getPriorityColor(task.priority).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.build_circle_outlined, color: _getPriorityColor(task.priority)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(task.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text('Scheduled: ${task.scheduledDate}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              Checkbox(value: task.status == 'completed', onChanged: (v) {}),
            ],
          ),
        );
      },
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'critical': return Colors.red;
      case 'high': return Colors.orange;
      case 'medium': return Colors.blue;
      default: return Colors.green;
    }
  }
}
