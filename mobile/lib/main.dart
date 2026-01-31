import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart' as provider;
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/discovery/providers/turf_provider.dart';
import 'features/booking/providers/booking_provider.dart';
import 'features/training/providers/coach_provider.dart';
import 'features/social/providers/match_provider.dart';
import 'features/tournaments/providers/tournament_provider.dart';
import 'providers/owner_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/discovery/screens/turf_details_screen.dart';
import 'screens/owner/owner_dashboard.dart';
import 'screens/owner/staff_management_screen.dart';
import 'screens/owner/organizer_hub_screen.dart';
import 'screens/owner/owner_bookings_screen.dart';
import 'screens/owner/owner_customers_screen.dart';
import 'screens/owner/owner_analytics_screen.dart';
import 'screens/owner/maintenance_studio_screen.dart';
import 'screens/owner/walk_in_booking_screen.dart';
import 'screens/owner/game_management_screen.dart';
import 'screens/coach/coach_dashboard.dart';
import 'screens/academy/academy_dashboard.dart';
import 'data/models/models.dart';
import 'widgets/scaffold_with_nav_bar.dart';
import 'features/training/screens/coaches_list_screen.dart';
import 'features/tournaments/screens/tournaments_list_screen.dart';
import 'features/social/screens/community_screen.dart';
import 'features/discovery/screens/turfs_screen.dart';
import 'screens/dashboard/my_bookings_screen.dart';
import 'screens/dashboard/profile_screen.dart';
import 'screens/dashboard/home_tab.dart';

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
        provider.ChangeNotifierProvider(create: (_) => OwnerProvider()),
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
            return const HomeTab();
          },
        ),
        GoRoute(
          path: '/owner',
          builder: (context, state) => const OwnerDashboard(),
          routes: [
            GoRoute(
              path: 'staff',
              builder: (context, state) => const StaffManagementScreen(),
            ),
            GoRoute(
              path: 'organizer-hub',
              builder: (context, state) => const OrganizerHubScreen(),
            ),
            GoRoute(
              path: 'bookings',
              builder: (context, state) => const OwnerBookingsScreen(),
            ),
            GoRoute(
              path: 'customers',
              builder: (context, state) => const OwnerCustomersScreen(),
            ),
            GoRoute(
              path: 'analytics',
              builder: (context, state) => const OwnerAnalyticsScreen(),
            ),
            GoRoute(
              path: 'maintenance',
              builder: (context, state) => const MaintenanceStudioScreen(),
            ),
            GoRoute(
              path: 'walk-in',
              builder: (context, state) => const WalkInBookingScreen(),
            ),
             GoRoute(
              path: 'game-management/:turfId',
              builder: (context, state) => GameManagementScreen(turfId: state.pathParameters['turfId']!),
            ),
          ],
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
             GoRoute(
              path: '/community',
              builder: (context, state) => const CommunityScreen(),
            ),
          ],
        ),

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
