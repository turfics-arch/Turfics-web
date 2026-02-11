import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async'; // For Timer

import 'package:turfics/core/constants/constants.dart';
import 'package:turfics/widgets/glass_container.dart';

class LocationPickerScreen extends StatefulWidget {
  final LatLng? initialLocation;
  
  const LocationPickerScreen({super.key, this.initialLocation});

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  late MapController _mapController;
  late LatLng _currentCenter;
  String _address = "Move pin to select location";
  bool _isLoading = false;
  Timer? _debounce;

  // Default to Bangalore if no location provided
  static const LatLng _defaultLocation = LatLng(12.9716, 77.5946);

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _currentCenter = widget.initialLocation ?? _defaultLocation;
    
    // Initial fetch if location provided
    if (widget.initialLocation != null) {
      _fetchAddress(_currentCenter);
    }
  }

  // Fix for flutter_map version compatibility (v6 uses MapCamera, older uses MapPosition)
  // The error suggests MapPosition is expected, so we use dynamic to handle both or specific
  void _onPositionChanged(dynamic position, bool hasGesture) {
    if (position is MapCamera) {
      _currentCenter = position.center;
    } else {
      // Fallback for MapPosition or other types
      _currentCenter = (position as dynamic).center; 
    }
    
    setState(() {
      _address = "Locating...";
    });

    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 800), () {
      _fetchAddress(_currentCenter);
    });
  }

  Future<void> _fetchAddress(LatLng point) async {
    setState(() => _isLoading = true);
    try {
      // Using Nominatim OpenStreetMap API
      // Added timeout and language param
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.latitude}&lon=${point.longitude}&zoom=18&addressdetails=1&accept-language=en'
      );
      
      final response = await http.get(url, headers: {
        'User-Agent': 'TurficsApp/1.0 (turfics@example.com)' 
      }).timeout(const Duration(seconds: 5)); // 5s Timeout

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['address'];
        
        // Construct smart Summary
        // e.g., "Indiranagar, Bangalore"
        String main = "";
        String sub = "";

        if (address != null) {
          // Try to find the most relevant "Area" name
          List<String?> priorities = [
            address['suburb'],
            address['neighbourhood'],
            address['residential'],
            address['village'],
            address['road']
          ];
          
          main = priorities.firstWhere((element) => element != null, orElse: () => "") ?? "";
          
          // City
          sub = address['city'] ?? address['town'] ?? address['state_district'] ?? "";
          
          // Fallback
          if (main.isEmpty) main = sub;
          if (main == sub) sub = address['state'] ?? "";

          if (mounted) {
            setState(() {
              _address = "$main, $sub";
            });
          }
        }
      }
    } catch (e) {
      print("Geocoding Error: $e");
      if (mounted) setState(() => _address = "Location found (Address unavailable)");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _confirmLocation() {
    Navigator.of(context).pop({
      'address': _address,
      'lat': _currentCenter.latitude,
      'lng': _currentCenter.longitude
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: const BoxDecoration(
            color: Colors.black54,
            shape: BoxShape.circle
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentCenter,
              initialZoom: 15.0,
              onPositionChanged: _onPositionChanged,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.turfics.app',
                // Dark mode tiles logic can be added here if needed, 
                // but standard OSM is light. Let's keep it standard for reliability.
              ),
            ],
          ),
          
          // Center Pin
          const Center(
            child: Padding(
              padding: EdgeInsets.only(bottom: 35), // Offset for pin point
              child: Icon(Icons.location_on, color: AppColors.primary, size: 40),
            ),
          ),

          // Bottom Sheet
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.darkBackground,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, -5))
                ]
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text("Set Turf Location", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.my_location, color: AppColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _isLoading 
                            ? const Text("Locating...", style: TextStyle(color: Colors.white, fontSize: 16))
                            : Text(_address, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _confirmLocation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                      ),
                      child: const Text("Confirm Location", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
                    )
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}

