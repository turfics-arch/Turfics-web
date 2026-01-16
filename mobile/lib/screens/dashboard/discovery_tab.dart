import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants.dart';
import '../../providers/turf_provider.dart';
import '../../widgets/turf_card.dart';

class DiscoveryTab extends StatefulWidget {
  const DiscoveryTab({super.key});

  @override
  State<DiscoveryTab> createState() => _DiscoveryTabState();
}

class _DiscoveryTabState extends State<DiscoveryTab> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Fetch turfs when the tab is first loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TurfProvider>(context, listen: false).fetchTurfs();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final turfProvider = Provider.of<TurfProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // --- HEADER ---
            Padding(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Column(
                children: [
                  // Search Bar
                  TextField(
                    controller: _searchController,
                    onChanged: (val) => turfProvider.setSearchQuery(val),
                    decoration: InputDecoration(
                      hintText: 'Search turfs, areas...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty 
                        ? IconButton(
                            icon: const Icon(Icons.clear), 
                            onPressed: () {
                              _searchController.clear();
                              turfProvider.setSearchQuery('');
                            },
                          )
                        : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Sport Filters (Horizontal Scroll)
                  SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: ['All', 'Football', 'Cricket', 'Tennis', 'Badminton'].map((sport) {
                        // TODO: Bind to Provider state for active check 
                        // (Simplified for now, assuming "All" is active or matched)
                        // Ideally: final isActive = turfProvider.selectedSport == sport;
                         
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(sport),
                            onSelected: (selected) {
                               turfProvider.setSportFilter(sport);
                            },
                            backgroundColor: AppColors.surface,
                            selectedColor: AppColors.primary.withOpacity(0.2), // Active color
                            checkmarkColor: AppColors.primary,
                            side: BorderSide.none,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),

            // --- CONTENT ---
            Expanded(
              child: turfProvider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : turfProvider.turfs.isEmpty
                      ? const Center(
                          child: Text(
                            'No turfs found.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () => turfProvider.fetchTurfs(),
                          color: AppColors.primary,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppConstants.defaultPadding, 
                              vertical: 8
                            ),
                            itemCount: turfProvider.turfs.length,
                            itemBuilder: (context, index) {
                              final turf = turfProvider.turfs[index];
                              return TurfCard(
                                turf: turf,
                                onTap: () {
                                  context.push('/turf', extra: turf);
                                },
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
