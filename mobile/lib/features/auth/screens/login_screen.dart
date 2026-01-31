import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:provider/provider.dart' as legacy_provider;
import '../../../core/constants/constants.dart';
import '../providers/auth_controller.dart';
import '../providers/auth_provider.dart'; // Keep for now if mixed usage, but target is removal
import '../../../widgets/glass_container.dart';
import '../../../widgets/custom_button.dart';
import 'dart:math' as math;

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  bool _isLogin = true;
  String _loginMethod = 'credentials'; // 'credentials' or 'phone'
  bool _otpSent = false;
  
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  String _selectedRole = 'user';

  // Animation controller for blobs
  late AnimationController _blobController;

  @override
  void initState() {
    super.initState();
    _blobController = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 10),
  )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _blobController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    // Riverpod Controller
    // final auth = Provider.of<AuthProvider>(context, listen: false); 
    // Replaced by ref.read(authControllerProvider.notifier)
    
    try {
      if (_loginMethod == 'phone') {
        // Implement Phone Login Logic (Mock or Real)
         if (!_otpSent) {
           // Simulate Sending OTP
           await Future.delayed(const Duration(seconds: 1));
           setState(() => _otpSent = true);
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OTP Sent: 123456')));
         } else {
           // Verify OTP
           // For now, let's just assume success or call a verify method
           if (_otpController.text == '123456') {
             // Mock login success
             context.go('/'); 
           } else {
             throw Exception('Invalid OTP');
           }
         }
      } else {
        if (_isLogin) {
          await ref.read(authControllerProvider.notifier).login(_usernameController.text, _passwordController.text);
          // Sync legacy provider for routing
          // In real migration, we kill legacy provider. For now, we assume main.dart router listens to legacy.
          // Force legacy provider update IF main.dart not updated to listen to riverpod yet.
          // Safe bet: Update legacy provider manually to trigger router.
          if (mounted) legacy_provider.Provider.of<AuthProvider>(context, listen: false).login(_usernameController.text, _passwordController.text); 
          
          if (mounted) context.go('/');
        } else {
          await ref.read(authControllerProvider.notifier).register(
            _usernameController.text, // Name
            _emailController.text,
            _passwordController.text,
            _selectedRole,
          );
          if (mounted) legacy_provider.Provider.of<AuthProvider>(context, listen: false).register(_usernameController.text, _emailController.text, _passwordController.text, _selectedRole); // Sync
           if (mounted) {
             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration Successful! Please login.')));
             setState(() => _isLogin = true);
           }
        }
      }
    } catch (e) {
      if (mounted) {
         // Custom Error Dialog (SweetAlert Style)
         showDialog(
           context: context,
           builder: (context) => Dialog(
             backgroundColor: Colors.transparent,
             child: GlassContainer(
               padding: const EdgeInsets.all(24),
               child: Column(
                 mainAxisSize: MainAxisSize.min,
                 children: [
                   Container(
                     padding: const EdgeInsets.all(16),
                     decoration: BoxDecoration(color: AppColors.error.withOpacity(0.1), shape: BoxShape.circle),
                     child: const Icon(Icons.error_outline, color: AppColors.error, size: 40),
                   ),
                   const SizedBox(height: 16),
                   const Text("Login Failed", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                   const SizedBox(height: 8),
                   Text(
                     e.toString().replaceAll('Exception: ', ''),
                     textAlign: TextAlign.center,
                     style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
                   ),
                   const SizedBox(height: 24),
                   SizedBox(
                     width: double.infinity,
                     child: ElevatedButton(
                       style: ElevatedButton.styleFrom(
                         backgroundColor: AppColors.error,
                         foregroundColor: Colors.white,
                         padding: const EdgeInsets.symmetric(vertical: 12),
                         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                       ),
                       onPressed: () => Navigator.pop(context),
                       child: const Text("Try Again"),
                     ),
                   )
                 ],
               ),
             ),
           ),
         );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // 1. Mesh Gradient Background (Blobs)
          _buildBlob(
            color: AppColors.primary,
            top: -100,
            left: -100,
            animation: Tween<Offset>(begin: Offset.zero, end: const Offset(50, 100)).animate(_blobController),
          ),
          _buildBlob(
            color: const Color(0xFF00BFA5), // Teal
            bottom: -100,
            right: -100,
            animation: Tween<Offset>(begin: Offset.zero, end: const Offset(-50, -100)).animate(_blobController),
          ),
          
          // Blur Filter
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100), 
              child: Container(color: Colors.transparent),
            ),
          ),

          // 2. Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Image.asset(
                    'assets/images/turfics_logo.png',
                    height: 100,
                  ).animate(onPlay: (c) => c.repeat(period: 2500.ms)) // Repeat every 2.5s
                   .shimmer(duration: 1500.ms, color: Colors.white, angle: 0.8) // Bright White Shine
                   .animate() // Entrance
                   .fadeIn(duration: 800.ms)
                   .slideY(begin: -0.2, end: 0),

                  const SizedBox(height: 40),

                  // Glass Card
                  GlassContainer(
                    padding: const EdgeInsets.all(32),
                    color: Colors.white.withOpacity(0.03), // Exact Web Match
                    blurAmount: 20,
                    child: Column(
                      children: [
                        // Header
                        Text(
                          _isLogin ? 'Welcome Back' : 'Create Account',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isLogin ? 'Choose your preferred login method' : 'Join the elite community',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                        const SizedBox(height: 24),

                        // Method Toggle
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white10),
                          ),
                          child: Row(
                            children: [
                              _buildToggleBtn('Email / User', 'credentials'),
                              _buildToggleBtn('Phone', 'phone'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Form Fields
                        if (_loginMethod == 'credentials') ...[
                          _buildInput(_usernameController, 'Username', Icons.person_outline),
                          const SizedBox(height: 16),
                          if (!_isLogin) ...[
                            _buildInput(_emailController, 'Email Address', Icons.mail_outline),
                            const SizedBox(height: 16),
                          ],
                          _buildInput(_passwordController, 'Password', Icons.lock_outline, isPassword: true),
                        ] else ...[
                          _buildInput(_phoneController, 'Mobile Number', Icons.phone_android, enabled: !_otpSent),
                          if (_otpSent) ...[
                             const SizedBox(height: 16),
                            _buildInput(_otpController, '6-Digit OTP', Icons.check_circle_outline),
                           ],
                        ],

                        if (!_isLogin) ...[
                          const SizedBox(height: 16),
                          _buildRoleDropdown(),
                        ],

                        const SizedBox(height: 24),

                        // Action Button
                        Consumer(
                          builder: (context, ref, _) {
                             final authState = ref.watch(authControllerProvider);
                            return CustomButton(
                              text: _loginMethod == 'phone' 
                                  ? (_otpSent ? 'Login' : 'Send OTP')
                                  : (_isLogin ? 'Sign In' : 'Get Started'),
                              onPressed: _handleSubmit,
                              isLoading: authState.isLoading, 
                              icon: Icons.arrow_forward,
                            );
                          },
                        ),

                        const SizedBox(height: 24),
                        const Text('OR CONTINUE WITH', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        
                        // Social Buttons (Mock)
                        Row(
                          children: [
                            Expanded(child: _buildSocialBtn('Google', Icons.g_mobiledata)), // Simplification
                            const SizedBox(width: 12),
                            Expanded(child: _buildSocialBtn('GitHub', Icons.code)),
                          ],
                        ),

                        const SizedBox(height: 24),
                        
                        // Footer Toggle
                         Row(
                           mainAxisAlignment: MainAxisAlignment.center,
                           children: [
                             Text(_isLogin ? "New to Turfics? " : "Already member? ", style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                             GestureDetector(
                               onTap: () => setState(() {
                                 _isLogin = !_isLogin;
                                 _otpSent = false;
                               }),
                               child: Text(
                                 _isLogin ? 'Join Now' : 'Sign In',
                                 style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                               ),
                             ),
                           ],
                         ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.95, 0.95)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlob({required Color color, double? top, double? bottom, double? left, double? right, required Animation<Offset> animation}) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: AnimatedBuilder(
        animation: animation,
        builder: (context, child) {
          return Transform.translate(
            offset: animation.value,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [color.withOpacity(0.5), Colors.transparent],
                  stops: const [0, 0.7],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildToggleBtn(String text, String method) {
    final isActive = _loginMethod == method;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _loginMethod = method;
          _otpSent = false;
        }),
        child: AnimatedContainer(
          duration: 200.ms,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? Colors.white.withOpacity(0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isActive ? [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(0, 2))] : null,
          ),
          alignment: Alignment.center,
          child: Text(
            text,
            style: TextStyle(
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput(TextEditingController controller, String hint, IconData icon, {bool isPassword = false, bool enabled = true}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        enabled: enabled,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white38),
          prefixIcon: Icon(icon, color: Colors.white38, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildRoleDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedRole,
          isExpanded: true,
          dropdownColor: AppColors.surface,
          icon: const Icon(Icons.people_outline, color: Colors.white38),
          style: const TextStyle(color: Colors.white),
          items: const [
            DropdownMenuItem(value: 'user', child: Text('Player')),
            DropdownMenuItem(value: 'owner', child: Text('Turf Owner')),
            DropdownMenuItem(value: 'coach', child: Text('Coach')),
            DropdownMenuItem(value: 'academy', child: Text('Academy Admin')),
          ],
          onChanged: (val) => setState(() => _selectedRole = val!),
        ),
      ),
    );
  }

  Widget _buildSocialBtn(String text, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}

// End of file
