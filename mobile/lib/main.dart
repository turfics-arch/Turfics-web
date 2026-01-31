import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart' as provider;
import 'package:provider/provider.dart' as provider;
import 'core/theme/theme_provider.dart';
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
import 'screens/owner/owner_shell.dart';
import 'screens/owner/owner_dashboard.dart';
import 'screens/owner/staff_management_screen.dart';
import 'screens/owner/organizer_hub_screen.dart';
import 'screens/owner/owner_bookings_screen.dart';
import 'screens/owner/owner_customers_screen.dart';
import 'screens/owner/owner_analytics_screen.dart';
import 'screens/owner/maintenance_studio_screen.dart';
import 'screens/owner/walk_in_booking_screen.dart';
import 'screens/owner/game_management_screen.dart';
import 'screens/owner/tournaments/owner_tournaments_screen.dart';
import 'screens/owner/tournaments/create_tournament_screen.dart';
import 'screens/owner/promote/promote_screen.dart';
import 'screens/owner/more/more_screen.dart';
import 'screens/owner/more/owner_profile_screen.dart';
import 'screens/owner/booking_history_screen.dart';
import 'screens/owner/todays_summary_screen.dart';
import 'screens/owner/booking_details_screen.dart';
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

  static final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return provider.MultiProvider(
      providers: [
        provider.ChangeNotifierProvider(create: (_) => ThemeProvider()),
        provider.ChangeNotifierProvider.value(value: authProvider),
        provider.ChangeNotifierProvider(create: (_) => TurfProvider()), 
        provider.ChangeNotifierProvider(create: (_) => BookingProvider()),
        provider.ChangeNotifierProvider(create: (_) => CoachProvider()),
        provider.ChangeNotifierProvider(create: (_) => MatchProvider()),
        provider.ChangeNotifierProvider(create: (_) => TournamentProvider()),
        provider.ChangeNotifierProvider(create: (_) => OwnerProvider()),
      ],
      child: provider.Consumer2<AuthProvider, ThemeProvider>(
        builder: (context, auth, themeProvider, _) {
          return MaterialApp.router(
            title: 'Turfics',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            routerConfig: _buildRouter(auth),
          );
        },
      ),
    );
  }

  GoRouter _buildRouter(AuthProvider auth) {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final isAuthenticated = auth.isAuthenticated;
        final isLoginRoute = state.uri.toString() == '/login';

        if (!isAuthenticated) {
          return '/login';
        }

        if (isAuthenticated && isLoginRoute) {
          if (auth.role == 'owner') return '/owner';
          return '/';
        }
        
        // Ensure root '/' redirects to role-specific dashboard for Owner
        if (isAuthenticated && state.uri.toString() == '/') {
          if (auth.role == 'owner') return '/owner';
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
        // Owner Shell Route
        ShellRoute(
          builder: (context, state, child) {
             // Only wrap in shell if we are authenticated as owner? 
             // Ideally we trust the auth route guard, but let's be safe or just standard
             return OwnerShell(child: child);
          },
          routes: [
             GoRoute(
              path: '/owner',
              builder: (context, state) => const OwnerDashboard(),
              routes: [
                // Sub-pages (Hidden from bottom nav but maintain shell)
                GoRoute(path: 'staff', builder: (context, state) => const StaffManagementScreen()),
                GoRoute(path: 'organizer-hub', builder: (context, state) => const OrganizerHubScreen()),
                GoRoute(path: 'customers', builder: (context, state) => const OwnerCustomersScreen()),
                GoRoute(path: 'analytics', builder: (context, state) => const OwnerAnalyticsScreen()),
                GoRoute(path: 'maintenance', builder: (context, state) => const MaintenanceStudioScreen()),
                GoRoute(path: 'profile', builder: (context, state) => const OwnerProfileScreen()),
                GoRoute(path: 'history', builder: (context, state) => const BookingHistoryScreen()),
                GoRoute(path: 'todays-summary', builder: (context, state) => const TodaysSummaryScreen()), // Added this route
                GoRoute(
                  path: 'booking-details',
                  builder: (context, state) {
                     final booking = state.extra as Booking;
                     return BookingDetailsScreen(booking: booking);
                  },
                ),
                GoRoute(path: 'walk-in', builder: (context, state) => const WalkInBookingScreen()),
                GoRoute(
                  path: 'game-management/:turfId',
                  builder: (context, state) => GameManagementScreen(turfId: state.pathParameters['turfId']!),
                ),
                
                // Tab Routes (Nested under /owner so specific paths work)
                GoRoute(path: 'bookings', builder: (context, state) => const OwnerBookingsScreen()),
                GoRoute(path: 'tournaments', builder: (context, state) => const OwnerTournamentsScreen()),
                GoRoute(
                  path: 'tournaments/create',
                  parentNavigatorKey: _rootNavigatorKey, // Use root navigator to cover bottom nav (optional but cleaner)
                  builder: (context, state) => const CreateTournamentScreen(),
                ),
                GoRoute(path: 'promote', builder: (context, state) => const PromoteScreen()),
                GoRoute(path: 'more', builder: (context, state) => const MoreScreen()),
              ],
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
