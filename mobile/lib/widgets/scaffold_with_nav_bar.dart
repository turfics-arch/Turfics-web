import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/constants.dart';

class ScaffoldWithNavBar extends StatelessWidget {
  final Widget child;

  const ScaffoldWithNavBar({
    required this.child,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    // Determine current index based on route
    // Note: GoRouter State is accessible, but simple logic:
    final String location = GoRouterState.of(context).uri.toString();
    
    int currentIndex = 0;
    if (location.startsWith('/turfs')) {
      currentIndex = 0;
    } else if (location.startsWith('/tournaments')) {
      currentIndex = 1;
    } else if (location.startsWith('/play')) {
      currentIndex = 2;
    } else if (location.startsWith('/coaches')) {
      currentIndex = 3;
    } else {
      currentIndex = 0; // Default
    }

    return Scaffold(
      // We can have a Global AppBar here if we want consistent Top Bar
      // Or let children handle it. 
      // User asked for "Home icon near profile in top". 
      // Putting it here makes it persistent.
      appBar: AppBar(
        title: Image.asset('assets/images/turfics_logo.png', height: 32),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          // Home Button
          IconButton(
            icon: const Icon(Icons.home_rounded, color: AppColors.primary),
            onPressed: () => context.go('/'),
            tooltip: 'Home',
          ),
          // Profile Avatar
          Padding(
            padding: const EdgeInsets.only(right: 16, left: 8),
            child: GestureDetector(
              onTap: () => context.push('/profile'),
              child: CircleAvatar(
                radius: 16,
                backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=33'),
                backgroundColor: Colors.grey[800],
              ),
            ),
          ),
        ],
      ),
      extendBodyBehindAppBar: true, // For glass effect if needed
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface.withOpacity(0.9),
          border: const Border(top: BorderSide(color: AppColors.surfaceLight)),
           boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (index) => _onTap(context, index),
          backgroundColor: Colors.transparent, // Handled by Container
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textSecondary,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.sports_soccer), label: 'Turfs'),
            BottomNavigationBarItem(icon: Icon(Icons.emoji_events), label: 'Tournaments'),
            BottomNavigationBarItem(icon: Icon(Icons.groups), label: 'Play'),
            BottomNavigationBarItem(icon: Icon(Icons.sports), label: 'Coach'),
          ],
        ),
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/turfs');
        break;
      case 1:
        context.go('/tournaments');
        break;
      case 2:
        context.go('/play');
        break;
      case 3:
        context.go('/coaches');
        break;
    }
  }
}
