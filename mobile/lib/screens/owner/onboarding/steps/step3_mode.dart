import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:turfics/core/constants/constants.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';
import '../onboarding_state.dart';

class Step3Mode extends StatefulWidget {
  const Step3Mode({super.key});

  @override
  State<Step3Mode> createState() => _Step3ModeState();
}

class _Step3ModeState extends State<Step3Mode> {
  String _selectedMode = 'slot'; // slot, walkin, both

  void _submit() {
    context.read<OnboardingState>().updateMode(_selectedMode);
    context.go('/owner/onboarding/step4');
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "How do you accept bookings? 📲",
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ).animate().fadeIn().slideX(),
          
          const SizedBox(height: 32),

          _buildModeOption(
            id: 'slot',
            title: "Slot-based (Recommended)",
            desc: "Players book specific time slots online.",
            icon: Icons.schedule,
          ),
          const SizedBox(height: 16),
           _buildModeOption(
            id: 'both',
            title: "Both (Hybrid)",
            desc: "Online slots + manual walk-ins.",
            icon: Icons.sync_alt,
          ),
          const SizedBox(height: 16),
          _buildModeOption(
            id: 'walkin',
            title: "Walk-in Only",
            desc: "You manage everything manually.",
            icon: Icons.storefront,
          ),

          const SizedBox(height: 48),

          CustomButton(
            text: "Continue",
            onPressed: _submit,
            icon: Icons.arrow_forward,
          ),
        ],
      ),
    );
  }

  Widget _buildModeOption({required String id, required String title, required String desc, required IconData icon}) {
    final isSelected = _selectedMode == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedMode = id),
      child: AnimatedContainer(
        duration: 200.ms,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.2) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.white10,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Colors.white10,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}

