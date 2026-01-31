import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/owner_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../widgets/glass_container.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ownerProvider = Provider.of<OwnerProvider>(context);
    final selectedTurf = ownerProvider.selectedTurf;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("More", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              
              // Section 1: Business Identity
              _buildIdentitySection(context, selectedTurf),
              
              const SizedBox(height: 32),

              // Section 2: Business Controls
              _buildSectionHeader("Business Controls"),
              _buildSettingsTile(context, "Earnings & Payouts", Icons.attach_money, () {}),
              _buildSettingsTile(context, "Operating Hours", Icons.schedule, () {}),
              _buildSettingsTile(context, "Staff & Access", Icons.people_outline, () => context.push('/owner/staff')),
              _buildSettingsTile(context, "Pricing & Offers", Icons.local_offer_outlined, () {}),

              const SizedBox(height: 24),

              // Section 3: System Utilities
              _buildSectionHeader("System Utilities"),
              _buildSettingsTile(context, "Notification Preferences", Icons.notifications_none, () {}),
              _buildSettingsTile(context, "Security & Login", Icons.lock_outline, () {}),
              _buildSettingsTile(context, "Documents / KYC", Icons.folder_open, () {}),

              const SizedBox(height: 24),

              // Section 4: Support & Legal
              _buildSectionHeader("Support & Legal"),
              _buildSettingsTile(context, "Help & Support", Icons.help_outline, () {}),
              _buildSettingsTile(context, "Terms & Privacy", Icons.description_outlined, () {}),
              
              const SizedBox(height: 12),
              
              // Logout
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.logout, color: AppColors.error, size: 20),
                ),
                title: const Text("Logout", style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
                onTap: () {
                   Provider.of<AuthProvider>(context, listen: false).logout();
                   context.go('/login');
                },
              ),
              
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIdentitySection(BuildContext context, dynamic turf) {
    // Fallback if no turf selected
    final String turfName = turf?.name ?? "No Turf Selected";
    final String location = turf?.location ?? "Add a location";
    final String imageUrl = turf?.imageUrl ?? "https://via.placeholder.com/150";

    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundImage: NetworkImage(imageUrl),
            backgroundColor: AppColors.primary.withOpacity(0.2),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(turfName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(child: Text(location, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13), overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push('/owner/profile'),
            icon: const Icon(Icons.edit, color: AppColors.primary),
          )
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary, letterSpacing: 0.5)),
    );
  }

  Widget _buildSettingsTile(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.glassBorderDark),
        ),
        child: Icon(icon, size: 20, color: Theme.of(context).iconTheme.color),
      ),
      title: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: AppColors.textSecondary),
      onTap: onTap,
    );
  }
}
