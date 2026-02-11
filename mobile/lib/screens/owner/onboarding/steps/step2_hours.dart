import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';
import '../onboarding_state.dart';

class Step2Hours extends StatefulWidget {
  const Step2Hours({super.key});

  @override
  State<Step2Hours> createState() => _Step2HoursState();
}

class _Step2HoursState extends State<Step2Hours> {
  TimeOfDay _openTime = const TimeOfDay(hour: 6, minute: 0);
  TimeOfDay _closeTime = const TimeOfDay(hour: 23, minute: 0);

  Future<void> _pickTime(bool isOpen) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isOpen ? _openTime : _closeTime,
    );
    if (picked != null) {
      setState(() {
        if (isOpen) _openTime = picked;
        else _closeTime = picked;
      });
    }
  }

  void _submit() {
    context.read<OnboardingState>().updateHours(_openTime, _closeTime);
    context.go('/owner/onboarding/step3');
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "When are you open? 🕒",
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ).animate().fadeIn().slideX(),
          
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(child: _buildTimeCard("Opening Time", _openTime, () => _pickTime(true))),
              const SizedBox(width: 16),
              Expanded(child: _buildTimeCard("Closing Time", _closeTime, () => _pickTime(false))),
            ],
          ),

          const SizedBox(height: 24),
          
          GlassContainer(
            padding: const EdgeInsets.all(16),
            color: Colors.white.withOpacity(0.05),
            child: Row(
              children: [
                Icon(Icons.calendar_today, color: Colors.white70),
                const SizedBox(width: 12),
                const Text("Open all days (Mon-Sun)", style: TextStyle(color: Colors.white)),
                const Spacer(),
                Switch(value: true, onChanged: (v) {}, activeColor: Colors.green),
              ],
            ),
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

  Widget _buildTimeCard(String label, TimeOfDay time, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        color: Colors.white.withOpacity(0.1),
        child: Column(
          children: [
            Text(label, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 8),
            Text(
              time.format(context),
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

