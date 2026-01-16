import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

// --- HOME TAB ---
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Fetch real stats for Owner
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          children: [
            // Welcome Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primaryDark, AppColors.primary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back!',
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Find and book your next game.',
                    style: TextStyle(color: Colors.black87),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- BOOKINGS TAB ---
class BookingsTab extends StatelessWidget {
  const BookingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings'), automaticallyImplyLeading: false),
      body: const Center(child: Text('Bookings coming soon...')),
    );
  }
}

// --- PROFILE TAB ---
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile'), automaticallyImplyLeading: false),
      body: Center(
        child: ElevatedButton.icon(
          onPressed: () {
             Provider.of<AuthProvider>(context, listen: false).logout();
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
