import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';

class OwnerAnalyticsScreen extends StatefulWidget {
  const OwnerAnalyticsScreen({super.key});

  @override
  State<OwnerAnalyticsScreen> createState() => _OwnerAnalyticsScreenState();
}

class _OwnerAnalyticsScreenState extends State<OwnerAnalyticsScreen> {
  String _timeRange = 'month';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OwnerProvider>(context, listen: false).fetchAnalytics(range: _timeRange);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detailed Analytics'),
        actions: [
          DropdownButton<String>(
            value: _timeRange,
            dropdownColor: AppColors.background,
            underline: Container(),
            icon: const Icon(Icons.filter_list, color: Colors.white),
            items: const [
              DropdownMenuItem(value: 'day', child: Text('Today')),
              DropdownMenuItem(value: 'week', child: Text('Last 7 Days')),
              DropdownMenuItem(value: 'month', child: Text('This Month')),
              DropdownMenuItem(value: 'year', child: Text('This Year')),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() => _timeRange = val);
                Provider.of<OwnerProvider>(context, listen: false).fetchAnalytics(range: val);
              }
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Consumer<OwnerProvider>(
        builder: (context, owner, child) {
          if (owner.isLoading && owner.analytics.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = owner.analytics;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(Icons.analytics_outlined, 'Operations Health'),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildKpiCard(
                        'Occupancy', 
                        '${data['occupancy_rate'] ?? 0}%', 
                        'vs Capacity', 
                        (data['occupancy_rate'] ?? 0) > 60 ? Colors.green : Colors.orange,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildKpiCard(
                        'Retention', 
                        '${data['retention_rate'] ?? 0}%', 
                        'Returning Users', 
                        AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildSectionHeader(Icons.payments_outlined, 'Financial Overview'),
                const SizedBox(height: 16),
                _buildWideKpiCard(
                  'Advance Revenue', 
                  '₹${(data['advance_collected'] ?? 0).toInt()}', 
                  'Collected online', 
                  Icons.check_circle_outline, 
                  Colors.green,
                ),
                const SizedBox(height: 12),
                _buildWideKpiCard(
                  'Pending Collection', 
                  '₹${(data['pending_collection'] ?? 0).toInt()}', 
                  'Estimated walk-ins', 
                  Icons.hourglass_empty, 
                  Colors.orange,
                ),
                const SizedBox(height: 24),
                _buildSectionHeader(Icons.trending_up, 'Revenue Forecast'),
                const SizedBox(height: 16),
                GlassContainer(
                  height: 200,
                  width: double.infinity,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.show_chart, size: 48, color: Colors.white.withOpacity(0.1)),
                        const SizedBox(height: 8),
                        const Text('Growth Trend Visualization', style: TextStyle(color: AppColors.textSecondary)),
                        Text(
                          'Next 30 Days: ₹${(data['projected_revenue'] ?? 0).toInt()}', 
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildKpiCard(String label, String value, String subLabel, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          Text(subLabel, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildWideKpiCard(String label, String value, String subLabel, IconData icon, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Text(subLabel, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }
}
