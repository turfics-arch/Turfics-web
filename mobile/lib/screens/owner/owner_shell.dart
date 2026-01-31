import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/constants.dart';

class OwnerShell extends StatelessWidget {
  final Widget child;

  const OwnerShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: _buildBottomNav(context),
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    // Determine the current index based on the route
    final String location = GoRouterState.of(context).uri.toString();
    
    int currentIndex = 0;
    if (location.startsWith('/owner/bookings')) {
      currentIndex = 1;
    } else if (location.startsWith('/owner/tournaments')) {
      currentIndex = 2; // Restore Tournaments index
    } else if (location.startsWith('/owner/more')) {
      currentIndex = 3;
    } else if (location == '/owner' || location == '/owner/') {
      currentIndex = 0;
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.glassBorderDark : AppColors.glassBorderLight, 
            width: 1
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => _onItemTapped(index, context),
        backgroundColor: Colors.transparent, // Handled by Container
        indicatorColor: AppColors.primary.withOpacity(0.15),
        height: 70,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppColors.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month, color: AppColors.primary),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events, color: AppColors.primary),
            label: 'Tournaments',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view),
            selectedIcon: Icon(Icons.grid_view_rounded, color: AppColors.primary),
            label: 'More',
          ),
        ],
      ),
    );
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/owner');
        break;
      case 1:
        context.go('/owner/bookings');
        break;
      case 2:
        context.go('/owner/tournaments');
        break;
      case 3:
        context.go('/owner/more');
        break;
    }
  }
}
