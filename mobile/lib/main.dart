import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/turf_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/turf/turf_details_screen.dart';
import 'data/models/models.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final authProvider = AuthProvider();
  await authProvider.init();

  runApp(TurficsApp(authProvider: authProvider));
}

class TurficsApp extends StatelessWidget {
  final AuthProvider authProvider;
  
  const TurficsApp({super.key, required this.authProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => TurfProvider()), // Added TurfProvider
      ],
      child: Consumer<AuthProvider>(
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
          builder: (context, state) => const DashboardScreen(), // Use actual Dashboard
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
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
