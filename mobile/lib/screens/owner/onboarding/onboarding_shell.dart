import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:turfics/core/constants/constants.dart';
import 'package:turfics/widgets/glass_container.dart';

class OnboardingShell extends StatelessWidget {
  final Widget child;

  const OnboardingShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // 1. Background (Subtle Gradient)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0F2027), // Darker
                  Color(0xFF203A43),
                  Color(0xFF2C5364),
                ],
              ),
            ),
          ),
          
          // 2. Animated Blobs (reused concept for consistency)
          // Simplified for focus
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.15),
                    blurRadius: 100,
                    spreadRadius: 50,
                  ),
                ],
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(duration: 5.seconds, begin: const Offset(1, 1), end: const Offset(1.2, 1.2)),
          ),

          // 3. Child Content
          SafeArea(
            child: Column(
              children: [
                // Minimal Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    children: [
                      // Logo or simplified Back
                      Image.asset('assets/images/turfics_logo.png', height: 24),
                      const Spacer(),
                      // Progress Text
                      /* 
                      // We can implement a progress bar here if needed.
                      const Text(
                        "Setup Progress",
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ), 
                      */
                    ],
                  ),
                ),

                // Main Content
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

