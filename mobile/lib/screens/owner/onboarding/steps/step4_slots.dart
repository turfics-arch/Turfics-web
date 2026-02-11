import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:turfics/screens/owner/onboarding/onboarding_state.dart';
import 'package:turfics/core/constants/constants.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';

class Step4Slots extends StatefulWidget {
  const Step4Slots({super.key});

  @override
  State<Step4Slots> createState() => _Step4SlotsState();
}

class _Step4SlotsState extends State<Step4Slots> {
  void _submit() async {
    final state = context.read<OnboardingState>();
    await state.completeSetup();
    if (mounted) context.go('/owner/onboarding/step5');
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OnboardingState>();
    final configs = state.sportConfigs;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "Setup Your Sports ⚡",
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            "Configure pricing and capacity for each sport.",
            style: TextStyle(color: Colors.white70),
          ),
          
          const SizedBox(height: 24),

          if (configs.isEmpty)
             const Text("No sports selected. Go back to Step 1.", style: TextStyle(color: Colors.redAccent)),

          ...configs.asMap().entries.map((entry) {
            final index = entry.key;
            final config = entry.value;
            return _buildSportCard(context, index, config);
          }),

          const SizedBox(height: 32),

          CustomButton(
            text: state.isSubmitting ? "Setting up..." : "Create Turf & Go Live",
            onPressed: state.isSubmitting ? () {} : _submit,
            isLoading: state.isSubmitting,
            icon: Icons.rocket_launch,
          ),
        ],
      ),
    );
  }

  Widget _buildSportCard(BuildContext context, int index, SportConfig config) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        color: Colors.white.withOpacity(0.05),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.sports_soccer, color: Colors.greenAccent), // Dynamic icon fallback
                const SizedBox(width: 12),
                Text(
                  config.sportName,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
            const Divider(color: Colors.white12, height: 24),
            
            // 1. Unit Count (Pitches)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Number of Pitches/Courts", style: TextStyle(color: Colors.white70)),
                Row(
                  children: [
                    _buildIconButton(Icons.remove, () {
                      if (config.unitCount > 1) {
                         context.read<OnboardingState>().updateSportConfig(index, count: config.unitCount - 1);
                      }
                    }),
                    SizedBox(width: 30, child: Text("${config.unitCount}", textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold))),
                    _buildIconButton(Icons.add, () {
                       context.read<OnboardingState>().updateSportConfig(index, count: config.unitCount + 1);
                    }),
                  ],
                )
              ],
            ),
            
            const SizedBox(height: 16),

            // 2. Price
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Price / Hour", style: TextStyle(color: Colors.white70)),
                SizedBox(
                  width: 100,
                  child: TextFormField(
                    initialValue: config.price.toStringAsFixed(0),
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(
                      prefixText: '₹ ',
                      prefixStyle: TextStyle(color: Colors.greenAccent),
                      isDense: true,
                      border: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    ),
                    onChanged: (val) {
                      final p = double.tryParse(val);
                      if (p != null) {
                        context.read<OnboardingState>().updateSportConfig(index, price: p);
                      }
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 3. Duration
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Slot Duration (mins)", style: TextStyle(color: Colors.white70)),
                DropdownButton<int>(
                  value: config.duration,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: Colors.white),
                  underline: Container(height: 1, color: Colors.white24),
                  items: [30, 45, 60, 90, 120].map((d) => DropdownMenuItem(value: d, child: Text("$d mins"))).toList(),
                  onChanged: (val) {
                    if (val != null) {
                       context.read<OnboardingState>().updateSportConfig(index, duration: val);
                    }
                  },
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton(IconData icon, VoidCallback onPressed) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    );
  }
}

