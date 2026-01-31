import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/owner_provider.dart';
import '../../../widgets/glass_container.dart';
import '../../../data/models/models.dart';

class OwnerProfileScreen extends StatefulWidget {
  const OwnerProfileScreen({super.key});

  @override
  State<OwnerProfileScreen> createState() => _OwnerProfileScreenState();
}

class _OwnerProfileScreenState extends State<OwnerProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _locationController;
  late TextEditingController _amenitiesController;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<OwnerProvider>(context, listen: false);
    final turf = provider.selectedTurf;
    
    _nameController = TextEditingController(text: turf?.name ?? "");
    _locationController = TextEditingController(text: turf?.location ?? "");
    _amenitiesController = TextEditingController(text: (turf?.amenities ?? []).join(", "));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _amenitiesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ownerProvider = Provider.of<OwnerProvider>(context);
    final turf = ownerProvider.selectedTurf;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Turf Profile"),
        actions: [
          TextButton(
            onPressed: () {
               // Save logic here (In real app, call API)
               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Profile Updated")));
               context.pop();
            }, 
            child: const Text("Save", style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photos Section
              Center(
                child: Stack(
                  children: [
                    Container(
                      width: double.infinity,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.grey[800],
                        borderRadius: BorderRadius.circular(16),
                        image: turf?.imageUrl != null 
                             ? DecorationImage(image: NetworkImage(turf!.imageUrl), fit: BoxFit.cover)
                             : null,
                      ),
                      child: turf?.imageUrl == null 
                          ? const Icon(Icons.add_a_photo, color: Colors.white70, size: 40)
                          : null,
                    ),
                    Positioned(
                      bottom: 8, right: 8,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        child: IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white),
                          onPressed: () {},
                        ),
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text("Business Identity", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              
              _buildTextField("Turf Name", _nameController, Icons.store),
              const SizedBox(height: 16),
              _buildTextField("Location / Address", _locationController, Icons.location_on),
              const SizedBox(height: 16),
              _buildTextField("Amenities (comma separated)", _amenitiesController, Icons.wifi),

              const SizedBox(height: 32),

              const Text("Sports Offered", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: (turf?.sports ?? []).map((sport) => Chip(
                  label: Text(sport),
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  labelStyle: const TextStyle(color: AppColors.primary),
                )).toList(),
              ),
              
              const SizedBox(height: 32),

              // Read-only info
              const Text("System Info (Read-only)", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildReadOnlyRow("Turf ID", turf?.id ?? "N/A"),
                    const Divider(color: AppColors.glassBorderDark),
                    _buildReadOnlyRow("Verification Status", "Verified", color: AppColors.success),
                    const Divider(color: AppColors.glassBorderDark),
                    _buildReadOnlyRow("Rating", "${turf?.rating ?? 0.0} / 5.0", color: AppColors.warning),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.textSecondary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Theme.of(context).cardColor,
      ),
    );
  }

  Widget _buildReadOnlyRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
