class User {
  final String id;
  final String name;
  final String email;
  final String role;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'User',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
    );
  }
}

class Turf {
  final String id;
  final String name;
  final String location;
  final double pricePerHour;
  final double rating;
  final String imageUrl;
  final List<String> sports;
  final List<String> amenities;
  final String openingTime;
  final String closingTime;
  final double lat;
  final double lng;

  Turf({
    required this.id,
    required this.name,
    required this.location,
    required this.pricePerHour,
    required this.rating,
    required this.imageUrl,
    required this.sports,
    required this.amenities,
    required this.openingTime,
    required this.closingTime,
    required this.lat,
    required this.lng,
  });

  factory Turf.fromJson(Map<String, dynamic> json) {
    // Helper to parse strings/lists
    List<String> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data.map((e) => e.toString()).toList();
      if (data is String) return data.split(',').map((e) => e.trim()).toList();
      return [];
    }

    return Turf(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Unknown Turf',
      location: json['location'] ?? 'Unknown Location',
      pricePerHour: double.tryParse(json['min_price']?.toString() ?? '0') ?? 0.0,
      rating: double.tryParse(json['rating']?.toString() ?? '0') ?? 0.0,
      imageUrl: json['images'] != null && (json['images'] as List).isNotEmpty 
          ? json['images'][0] 
          : (json['image_url'] ?? 'https://via.placeholder.com/150'), // Handle both image formats
      sports: parseList(json['sports']),
      amenities: parseList(json['amenities']),
      openingTime: json['opening_time'] ?? '06:00',
      closingTime: json['closing_time'] ?? '23:00',
      lat: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      lng: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
    );
  }
}
