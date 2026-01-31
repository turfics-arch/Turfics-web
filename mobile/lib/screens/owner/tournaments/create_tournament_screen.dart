import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../widgets/glass_container.dart';

class CreateTournamentScreen extends StatefulWidget {
  const CreateTournamentScreen({super.key});

  @override
  State<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends State<CreateTournamentScreen> {
  int _currentStep = 1;
  final int _totalSteps = 3;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Host Tournament"),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          _buildProgressBar(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: AnimatedSwitcher(
                duration: 300.ms,
                child: _buildCurrentStep(),
              ),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Step $_currentStep of $_totalSteps", style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(_stepTitle(_currentStep), style: const TextStyle(color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: _currentStep / _totalSteps,
            backgroundColor: AppColors.surfaceLight,
            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }

  String _stepTitle(int step) {
    switch (step) {
      case 1: return "Basics";
      case 2: return "Format";
      case 3: return "Visibility";
      default: return "";
    }
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 1: return _buildStep1();
      case 2: return _buildStep2();
      case 3: return _buildStep3();
      default: return Container();
    }
  }

  // --- STEPS ---

  Widget _buildStep1() {
    return Column(
      key: const ValueKey(1),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel("Tournament Name"),
        _buildTextField("e.g. Winter Weekend Cup"),
        const SizedBox(height: 16),
        _buildLabel("Sport"),
        _buildDropdown(["Cricket (Box)", "Football (5v5)", "Badminton"], "Cricket (Box)"),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel("Date"),
                _buildTextField("DD/MM/YYYY", icon: Icons.calendar_today),
              ],
            )),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel("Entry Fee (₹)"),
                _buildTextField("1500", icon: Icons.currency_rupee),
              ],
            )),
          ],
        ),
      ],
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildStep2() {
    return Column(
      key: const ValueKey(2),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel("Team Size"),
        Row(
           mainAxisAlignment: MainAxisAlignment.spaceBetween,
           children: ["4", "8", "16", "Custom"].map((e) => 
             Container(
               padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
               decoration: BoxDecoration(
                 color: e == "8" ? AppColors.primary : AppColors.surfaceLight,
                 borderRadius: BorderRadius.circular(8),
               ),
               child: Text(e, style: const TextStyle(fontWeight: FontWeight.bold)),
             )
           ).toList(),
        ),
        const SizedBox(height: 24),
        _buildLabel("Winning Prize (₹)"),
        _buildTextField("5000", icon: Icons.emoji_events),
        const SizedBox(height: 16),
        _buildLabel("Match Duration"),
        _buildDropdown(["30 Mins", "45 Mins", "60 Mins"], "45 Mins"),
      ],
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildStep3() {
    return Column(
      key: const ValueKey(3),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassContainer(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                child: const Icon(Icons.auto_awesome, color: Colors.black),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("AI Poster Generated!", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text("We created a poster for your tournament.", style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          height: 200, 
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.black26, 
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.glassBorderDark)
          ),
          child: const Center(child: Text("POSTER PREVIEW", style: TextStyle(color: Colors.white24, fontWeight: FontWeight.bold, letterSpacing: 2))),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Switch(value: true, onChanged: (_) {}, activeColor: AppColors.success),
            const SizedBox(width: 8),
            const Text("Make Public (Visible to all players)", style: TextStyle(fontWeight: FontWeight.w600)),
          ],
        )
      ],
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  // --- UI HELPERS ---

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
    );
  }

  Widget _buildTextField(String hint, {IconData? icon}) {
    return TextField(
      decoration: InputDecoration(
        hintText: hint,
        suffixIcon: icon != null ? Icon(icon, color: AppColors.textSecondary) : null,
      ),
    );
  }

  Widget _buildDropdown(List<String> items, String selected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight, // Use proper theme color
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: selected,
          isExpanded: true,
          dropdownColor: AppColors.surface,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (_) {},
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.glassBorderDark)),
      ),
      child: Row(
        children: [
          if (_currentStep > 1)
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() => _currentStep--),
              child: const Text("Back"),
            ),
          ),
          if (_currentStep > 1) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () {
                if (_currentStep < _totalSteps) {
                  setState(() => _currentStep++);
                } else {
                  // Finish
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Tournament Created! 🎉")));
                   context.pop();
                }
              },
              child: Text(_currentStep == _totalSteps ? "Publish Tournament" : "Next"),
            ),
          ),
        ],
      ),
    );
  }
}
