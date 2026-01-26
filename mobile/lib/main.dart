import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart' as provider; // Alias usage if needed, or just import
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart'; // Moved
import 'features/discovery/providers/turf_provider.dart'; // Moved
import 'features/booking/providers/booking_provider.dart'; // Moved
import 'features/training/providers/coach_provider.dart'; // Moved
import 'features/social/providers/match_provider.dart'; // Moved
import 'features/tournaments/providers/tournament_provider.dart'; // Moved
import 'features/auth/screens/login_screen.dart'; // Moved
import 'features/auth/screens/register_screen.dart'; // Moved
import 'features/discovery/screens/turf_details_screen.dart'; // Moved
// Legacy dashboards (Keep paths if not moved, or update if moved)
// Assuming these were in screens/owner etc which were NOT moved in the batch command
// I only moved screens/auth, screens/turf, screens/coaches, screens/community, screens/tournaments
import 'screens/owner/owner_dashboard.dart';
import 'screens/coach/coach_dashboard.dart';
import 'screens/academy/academy_dashboard.dart';
import 'data/models/models.dart';
import 'widgets/scaffold_with_nav_bar.dart';
import 'features/training/screens/coaches_list_screen.dart'; // Moved
import 'features/tournaments/screens/tournaments_list_screen.dart'; // Moved
import 'features/social/screens/community_screen.dart'; // Moved
import 'features/discovery/screens/turfs_screen.dart'; // Moved
import 'screens/dashboard/my_bookings_screen.dart'; // Not moved yet
import 'screens/dashboard/profile_screen.dart'; // Not moved yet
import 'screens/dashboard/home_tab.dart'; // Not moved yet

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final authProvider = AuthProvider();
  await authProvider.init();

  runApp(
    ProviderScope(
      child: TurficsApp(authProvider: authProvider),
    ),
  );
}

class TurficsApp extends StatelessWidget {
  final AuthProvider authProvider;
  
  const TurficsApp({super.key, required this.authProvider});

  @override
  Widget build(BuildContext context) {
    return provider.MultiProvider(
      providers: [
        provider.ChangeNotifierProvider.value(value: authProvider),
        provider.ChangeNotifierProvider(create: (_) => TurfProvider()), 
        provider.ChangeNotifierProvider(create: (_) => BookingProvider()),
        provider.ChangeNotifierProvider(create: (_) => CoachProvider()),
        provider.ChangeNotifierProvider(create: (_) => MatchProvider()),
        provider.ChangeNotifierProvider(create: (_) => TournamentProvider()),
      ],
      child: provider.Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp.router(
            title: 'Turfics',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            routerConfig: _buildRouter(auth),
          );
        },
      ),
    );
  }

  GoRouter _buildRouter(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final isAuthenticated = auth.isAuthenticated;
        final isLoginRoute = state.uri.toString() == '/login';

        if (!isAuthenticated) {
          return '/login';
        }

        if (isAuthenticated && isLoginRoute) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) {
            final role = auth.role;
            if (role == 'owner') return const OwnerDashboard();
            if (role == 'coach') return const CoachDashboard();
            if (role == 'academy') return const AcademyDashboard();
            return const HomeTab(); // Direct Home Access
          },
        ),
        GoRoute(
          path: '/owner',
          builder: (context, state) => const OwnerDashboard(),
        ),
        GoRoute(
          path: '/coach',
          builder: (context, state) => const CoachDashboard(),
        ),
        GoRoute(
          path: '/academy',
          builder: (context, state) => const AcademyDashboard(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        
        // Home Dashboard (Central Hub)
        GoRoute(
          path: '/',
          builder: (context, state) {
            final role = auth.role;
            if (role == 'owner') return const OwnerDashboard();
            if (role == 'coach') return const CoachDashboard();
            if (role == 'academy') return const AcademyDashboard();
            return const HomeTab(); 
          },
        ),

        // Shell Route with Bottom Nav Bar
        // Wraps Turfs, Tournaments, Play, Coaches
        ShellRoute(
          builder: (context, state, child) {
            return ScaffoldWithNavBar(child: child);
          },
          routes: [
            GoRoute(
              path: '/turfs',
              builder: (context, state) => const TurfsScreen(),
            ),
            GoRoute(
              path: '/tournaments',
              builder: (context, state) => const TournamentsListScreen(),
            ),
            GoRoute(
              path: '/play',
              builder: (context, state) => const CommunityScreen(),
            ),
            GoRoute(
              path: '/coaches',
              builder: (context, state) => const CoachesListScreen(),
            ),
            // Community legacy
             GoRoute(
              path: '/community',
              builder: (context, state) => const CommunityScreen(),
            ),
          ],
        ),

        // Standalone Screens (No Bottom Bar)
        GoRoute(
          path: '/bookings',
          builder: (context, state) => const MyBookingsScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/turf',
          builder: (context, state) {
             final turf = state.extra as Turf;
             return TurfDetailsScreen(turf: turf);
          },
        ),
      ],
    );
  }
}
