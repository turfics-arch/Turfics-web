import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/constants/constants.dart';
import 'glass_container.dart';

class LiveGridCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? badgeText;
  final Color? badgeColor;
  final VoidCallback onTap;
  final bool isLive;
  final double? width;
  final double? height;
  final Color? color;
  final double iconSize;

  const LiveGridCard({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.badgeText,
    this.badgeColor,
    this.isLive = false,
    this.width,
    this.height,
    this.color,
    this.iconSize = 28,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Main Card
          GlassContainer(
            width: width,
            height: height,
            color: color ?? Colors.white.withOpacity(0.05),
            borderColor: isLive ? AppColors.accent.withOpacity(0.5) : null,
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon Container
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isLive ? AppColors.accent.withOpacity(0.2) : AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                    boxShadow: isLive 
                        ? [BoxShadow(color: AppColors.accent.withOpacity(0.3), blurRadius: 10, spreadRadius: 2)]
                        : null,
                  ),
                  child: Icon(
                    icon, 
                    color: isLive ? AppColors.accent : AppColors.primary, 
                    size: iconSize
                  ).animate(onPlay: (c) => isLive ? c.repeat() : null).shimmer(duration: 2.seconds, delay: 3.seconds),
                ),
                const SizedBox(height: 12),
                // Label
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white, 
                    fontSize: 12, 
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),

          // "Live" or Notification Badge
          if (badgeText != null)
            Positioned(
              top: -6,
              right: -6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor ?? AppColors.error,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(color: (badgeColor ?? AppColors.error).withOpacity(0.4), blurRadius: 6, offset: const Offset(0, 2))
                  ],
                ),
                child: Text(
                  badgeText!,
                  style: const TextStyle(
                    color: Colors.white, 
                    fontSize: 10, 
                    fontWeight: FontWeight.bold
                  ),
                ),
              ).animate(onPlay: (c) => isLive ? c.repeat(reverse: true) : null)
               .scale(begin: const Offset(1,1), end: const Offset(1.1, 1.1), duration: 800.ms),
            ),
        ],
      ),
    );
  }
}
