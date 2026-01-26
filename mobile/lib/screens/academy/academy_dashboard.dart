import 'package:flutter/material.dart';
import '../../core/constants/constants.dart';
import '../../widgets/glass_container.dart';

class AcademyDashboard extends StatelessWidget {
  const AcademyDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Academy Dashboard'), automaticallyImplyLeading: false),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          children: [
            const GlassContainer(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                   Icon(Icons.school, size: 48, color: AppColors.secondary),
                   SizedBox(height: 16),
                   Text("Welcome, Academy!", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                   SizedBox(height: 8),
                   Text("Manage batches, students, and enrollments here.", style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
