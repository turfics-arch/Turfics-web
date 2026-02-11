import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:turfics/screens/owner/onboarding/onboarding_state.dart';
import 'package:turfics/core/constants/constants.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/custom_button.dart';
import 'package:turfics/widgets/glass_container.dart';
import 'package:latlong2/latlong.dart'; // For LatLng
import 'package:turfics/screens/owner/onboarding/location_picker_screen.dart';

class Step1Identity extends StatefulWidget {
  const Step1Identity({super.key});

  @override
  State<Step1Identity> createState() => _Step1IdentityState();
}

class _Step1IdentityState extends State<Step1Identity> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();
  double? _latitude;
  double? _longitude;
  
  // Sports Selection
  final List<String> _availableSports = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Swimming'];
  final Set<String> _selectedSports = {};

  // Amenities Selection
  final List<String> _availableAmenities = ['Parking', 'Water', 'Restroom', 'Change Room', 'Floodlights', 'CCTV'];
  final Set<String> _selectedAmenities = {};

  void _toggleSport(String sport) {
    setState(() {
      if (_selectedSports.contains(sport)) {
        _selectedSports.remove(sport);
      } else {
        _selectedSports.add(sport);
      }
    });
  }

  void _toggleAmenity(String amenity) {
    setState(() {
      if (_selectedAmenities.contains(amenity)) {
        _selectedAmenities.remove(amenity);
      } else {
        _selectedAmenities.add(amenity);
      }
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_selectedSports.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select at least one sport')),
        );
        return;
      }
      
      // Save data to Provider
      context.read<OnboardingState>().updateIdentity(
        _nameController.text, 
        _locationController.text, 
        _descriptionController.text,
        _selectedSports.toList(),
        _selectedAmenities.toList(),
        lat: _latitude,
        lng: _longitude
      );
      
      context.go('/owner/onboarding/step2');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            const Text(
              "Let's name your turf 🏟️",
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
            ).animate().fadeIn().slideX(),
            const SizedBox(height: 8),
            const Text(
              "This is what players will see when booking.",
              style: TextStyle(fontSize: 16, color: Colors.white70),
            ).animate().fadeIn(delay: 200.ms),
            
            const SizedBox(height: 32),

            // Name Input
            _buildInputLabel("Turf Name"),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _nameController, 
              hint: "e.g. Green Valley Arena", 
              icon: Icons.stadium_outlined,
              validator: (v) => v!.isEmpty ? 'Name is required' : null,
            ),

            const SizedBox(height: 24),

            // Location Input
            _buildInputLabel("Location (City/Area)"),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _locationController, 
              hint: "e.g. Indiranagar, Bangalore", 
              icon: Icons.location_on_outlined,
              validator: (v) => v!.isEmpty ? 'Location is required' : null,
              suffixIcon: IconButton(
                icon: const Icon(Icons.map, color: AppColors.primary),
                tooltip: "Pick on Map",
                onPressed: _openMapPicker,
              )
            ),

            const SizedBox(height: 24),

            // Description Input
            _buildInputLabel("Description (Optional)"),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _descriptionController,
              hint: "Tell us about your venue...",
              icon: Icons.description_outlined,
              maxLines: 3,
            ),

            const SizedBox(height: 24),

            // Sports Multi-Select
            _buildInputLabel("Sports Available"),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _availableSports.map((sport) {
                final isSelected = _selectedSports.contains(sport);
                return _buildChip(sport, isSelected, () => _toggleSport(sport));
              }).toList(),
            ),

            const SizedBox(height: 24),

            // Amenities Multi-Select
            _buildInputLabel("Amenities"),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _availableAmenities.map((amenity) {
                final isSelected = _selectedAmenities.contains(amenity);
                return _buildChip(amenity, isSelected, () => _toggleAmenity(amenity));
              }).toList(),
            ),

            const SizedBox(height: 48),

            // Continue Button
            CustomButton(
              text: "Continue",
              onPressed: _submit,
              icon: Icons.arrow_forward,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputLabel(String label) {
    return Text(
      label,
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
    );
  }

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: 200.ms,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.white24,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              const Icon(Icons.check, size: 16, color: Colors.white),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller, 
    required String hint, 
    required IconData icon,
    String? Function(String?)? validator,
    int maxLines = 1,
    Widget? suffixIcon, // Add support for suffix
  }) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      color: Colors.white.withOpacity(0.05),
      child: TextFormField(
        controller: controller,
        style: const TextStyle(color: Colors.white),
        validator: validator,
        maxLines: maxLines,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white38),
          icon: Icon(icon, color: Colors.white54),
          border: InputBorder.none,
          suffixIcon: suffixIcon
        ),
      ),
    );
  }

  void _openMapPicker() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const LocationPickerScreen())
    );

    if (result != null && result is Map) {
      if (mounted) {
        setState(() {
          _locationController.text = result['address'];
          _latitude = result['lat'];
          _longitude = result['lng'];
        });
      }
    }
  }
}

