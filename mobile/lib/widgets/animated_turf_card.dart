import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../data/models/models.dart';
import '../core/constants/constants.dart';
import 'glass_container.dart';

class AnimatedTurfCard extends StatelessWidget {
  final Turf turf;
  final int index;

  const AnimatedTurfCard({
    super.key,
    required this.turf,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.push('/turf', extra: turf);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 24.0),
        height: 240,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
             BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // 1. Background Image with Hero
              Hero(
                tag: 'turf-image-${turf.id}',
                child: Image.network(
                  turf.imageUrl,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: AppColors.surface,
                    child: const Icon(Icons.sports_soccer, size: 50, color: Colors.grey),
                  ),
                ),
              ),

              // 2. Multi-Gradients for Readability
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.3),
                        Colors.transparent,
                        Colors.black.withOpacity(0.9),
                      ],
                      stops: const [0.0, 0.4, 1.0],
                    ),
                  ),
                ),
              ),

              // 3. Status Tag (Top Left) - e.g. Open Now
              Positioned(
                top: 16,
                left: 16,
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  borderRadius: 8,
                  color: Colors.black.withOpacity(0.5),
                  child: const Row(
                    children: [
                      CircleAvatar(radius: 4, backgroundColor: AppColors.primary),
                      SizedBox(width: 6),
                      Text('AVAILABLE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    ],
                  ),
                ),
              ),

              // 4. Price Tag (Top Right)
              Positioned(
                top: 16,
                right: 16,
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  borderRadius: 12,
                  color: AppColors.primary.withOpacity(0.9),
                  child: Text(
                    '₹${turf.pricePerHour}/hr',
                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),

              // 5. Bottom Info Content
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  turf.name,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 0.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, color: AppColors.primary, size: 14),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        turf.location,
                                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Rating
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: AppColors.warning, size: 20),
                                  const SizedBox(width: 4),
                                  Text(
                                    turf.rating.toString(),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ],
                              ),
                              const Text('24 reviews', style: TextStyle(color: Colors.white38, fontSize: 10)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Amenities Icons or Sports Icons
                      Row(
                        children: [
                           _buildSmallIconChip(Icons.sports_soccer_rounded),
                           const SizedBox(width: 8),
                           _buildSmallIconChip(Icons.sports_cricket_rounded),
                           const SizedBox(width: 8),
                           _buildSmallIconChip(Icons.wifi_rounded),
                           const Spacer(),
                           const Text(
                             'View Details',
                             style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                           ),
                           const Icon(Icons.chevron_right_rounded, color: AppColors.primary, size: 16),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ).animate().fadeIn(delay: (100 * index).ms).slideY(begin: 0.05, end: 0),
    );
  }

  Widget _buildSmallIconChip(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Icon(icon, color: Colors.white70, size: 16),
    );
  }
}
