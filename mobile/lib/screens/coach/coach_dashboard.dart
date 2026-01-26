import 'package:flutter/material.dart';
import '../../core/constants/constants.dart';
import '../../widgets/glass_container.dart';

class CoachDashboard extends StatelessWidget {
  const CoachDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coach Dashboard'), automaticallyImplyLeading: false),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          children: [
            const GlassContainer(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                   Icon(Icons.sports, size: 48, color: AppColors.accent),
                   SizedBox(height: 16),
                   Text("Welcome, Coach!", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                   SizedBox(height: 8),
                   Text("Manage your training sessions and students here.", style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
