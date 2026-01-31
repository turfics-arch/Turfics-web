import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/constants/constants.dart';
import '../core/theme/app_theme.dart';

class SkeletonContainer extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonContainer({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12,
  });

  const SkeletonContainer.square({
    super.key,
    required double size,
    this.borderRadius = 12,
  }) : width = size, height = size;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04);
    final highlightColor = isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.08);

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    ).animate(onPlay: (controller) => controller.repeat())
    .shimmer(
      duration: 1200.ms,
      color: highlightColor,
    );
  }
}
