import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:provider/provider.dart' as legacy_provider;
import '../../core/constants/constants.dart';
import '../../features/auth/providers/auth_controller.dart';
import '../../features/auth/providers/auth_provider.dart'; // Keep for sync

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Center(
        child: ElevatedButton.icon(
          onPressed: () {
             ref.read(authControllerProvider.notifier).logout();
             // Sync legacy for routing
             legacy_provider.Provider.of<AuthProvider>(context, listen: false).logout();
          },
          icon: const Icon(Icons.logout),
          label: const Text('Logout'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.surface,
            foregroundColor: AppColors.error,
          ),
        ),
      ),
    );
  }
}
