import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/constants.dart';
import '../../widgets/glass_container.dart';
import '../../features/auth/providers/auth_provider.dart';

class OwnerDashboard extends StatelessWidget {
  const OwnerDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Dashboard'), 
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () {
               Provider.of<AuthProvider>(context, listen: false).logout();
               context.go('/login');
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          children: [
            const GlassContainer(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                   Icon(Icons.business, size: 48, color: AppColors.primary),
                   SizedBox(height: 16),
                   Text("Welcome, Turf Owner!", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                   SizedBox(height: 8),
                   Text("Manage your revenue, bookings, and slots here.", style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                ],
              ),
            ),
            // TODO: Add Owner specific metrics and management buttons
          ],
        ),
      ),
    );
  }
}
