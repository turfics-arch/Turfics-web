import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:math';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';

class Step5Success extends StatelessWidget {
  const Step5Success({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Confetti (Simulated with random animated dots for now)
        ...List.generate(20, (index) => _buildConfetti(index)),

        Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle, color: Colors.greenAccent, size: 80)
                    .animate().scale(duration: 600.ms, curve: Curves.elasticOut),
                
                const SizedBox(height: 24),
                
                const Text(
                  "You are LIVE! 🚀",
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0),
                
                const SizedBox(height: 16),
                
                const Text(
                  "Your turf is now ready to accept bookings. Check your dashboard for next steps.",
                  style: TextStyle(fontSize: 16, color: Colors.white70),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 500.ms),

                const SizedBox(height: 48),

                CustomButton(
                  text: "Go to Dashboard",
                  onPressed: () => context.go('/owner'), 
                  icon: Icons.dashboard,
                ).animate().fadeIn(delay: 800.ms),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConfetti(int index) {
    final random = Random();
    final left = random.nextDouble() * 400; // rough screen width
    final color = [Colors.red, Colors.blue, Colors.green, Colors.yellow, Colors.purple][random.nextInt(5)];
    
    return Positioned(
      left: left,
      top: -20,
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ).animate(onPlay: (c) => c.repeat())
       .moveY(begin: -20, end: 800, duration: (2000 + random.nextInt(2000)).ms)
       .fadeIn()
       .fadeOut(delay: 1500.ms),
    );
  }
}
