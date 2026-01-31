import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';
import '../../../core/constants/constants.dart';
import '../../../widgets/glass_container.dart';
import '../../../widgets/custom_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  // Role Selection
  String _selectedRole = 'user'; // Default
  
  final Map<String, String> _roles = {
    'Player': 'user',
    'Turf Owner': 'owner',
    'Coach': 'coach',
    'Academy': 'academy',
  };

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      await authProvider.register(
        _usernameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text.trim(),
        _selectedRole,
      );
      
      if (!mounted) return;
      context.go('/'); 

    } catch (e) {
      if (!mounted) return;
      if (!mounted) return;
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
                const Text("Registration Failed", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
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
                    child: const Text("Fix Issues"),
                  ),
                )
              ],
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
      ),
      body: Stack(
        children: [
          // Background Gradient
           Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  Color(0xFF2C5364),
                  Color(0xFF203A43),
                  Color(0xFF0F2027),
                ],
              ),
            ),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.largePadding),
              child: Column(
                children: [
                  const Text(
                    'Create Account',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ).animate().fadeIn().slideY(begin: -0.2, end: 0),
                  const SizedBox(height: 32),

                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                           TextFormField(
                            controller: _usernameController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Username',
                              prefixIcon: Icon(Icons.person_outline, color: AppColors.primary),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Please enter a username';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _emailController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Email',
                              prefixIcon: Icon(Icons.email_outlined, color: AppColors.primary),
                            ),
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Please enter your email';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _passwordController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              prefixIcon: Icon(Icons.lock_outline, color: AppColors.primary),
                            ),
                            obscureText: true,
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Please enter a password';
                              if (value.length < 6) return 'Password must be at least 6 characters';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          
                          // Role Dropdown
                          const Text(
                              'I am a:',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.surfaceLight),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedRole,
                                dropdownColor: AppColors.surface,
                                isExpanded: true,
                                style: const TextStyle(color: Colors.white),
                                icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
                                items: _roles.entries.map((entry) {
                                  return DropdownMenuItem<String>(
                                    value: entry.value,
                                    child: Text(entry.key),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() => _selectedRole = value);
                                  }
                                },
                              ),
                            ),
                          ),

                          const SizedBox(height: 32),
                          
                          Consumer<AuthProvider>(
                            builder: (context, auth, _) {
                              return CustomButton(
                                text: 'SIGN UP',
                                onPressed: _submit,
                                isLoading: auth.isLoading,
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
