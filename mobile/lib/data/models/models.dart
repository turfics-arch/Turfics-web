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

class UnitImage {
  final String id;
  final String url;
  final String caption;

  UnitImage({required this.id, required this.url, required this.caption});

  factory UnitImage.fromJson(Map<String, dynamic> json) {
    return UnitImage(
      id: json['id']?.toString() ?? '',
      url: json['url'] ?? '',
      caption: json['caption'] ?? '',
    );
  }
}

class TurfUnit {
  final String id;
  final String name;
  final String unitType;
  final int capacity;
  final String size;
  final double price;
  final bool indoor;
  final bool hasLighting;
  final List<UnitImage> images;

  TurfUnit({
    required this.id,
    required this.name,
    required this.unitType,
    required this.capacity,
    required this.size,
    required this.price,
    required this.indoor,
    required this.hasLighting,
    required this.images,
  });

  factory TurfUnit.fromJson(Map<String, dynamic> json) {
    return TurfUnit(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      unitType: json['unit_type'] ?? '',
      capacity: json['capacity'] ?? 0,
      size: json['size'] ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      indoor: json['indoor'] ?? false,
      hasLighting: json['has_lighting'] ?? true,
      images: (json['images'] as List? ?? []).map((i) => UnitImage.fromJson(i)).toList(),
    );
  }
}

class TurfGame {
  final String id;
  final String sportType;
  final String gameCategory;
  final double defaultPrice;
  final int slotDuration;
  final List<TurfUnit> units;

  TurfGame({
    required this.id,
    required this.sportType,
    required this.gameCategory,
    required this.defaultPrice,
    required this.slotDuration,
    required this.units,
  });

  factory TurfGame.fromJson(Map<String, dynamic> json) {
    return TurfGame(
      id: json['id']?.toString() ?? '',
      sportType: json['sport_type'] ?? '',
      gameCategory: json['game_category'] ?? '',
      defaultPrice: double.tryParse(json['default_price']?.toString() ?? '0') ?? 0.0,
      slotDuration: json['slot_duration'] ?? 60,
      units: (json['units'] as List? ?? []).map((u) => TurfUnit.fromJson(u)).toList(),
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
  final String description;
  final List<TurfGame> games;

  double get price => pricePerHour;

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
    this.description = '',
    this.games = const [],
  });

  factory Turf.fromJson(Map<String, dynamic> json) {
    List<String> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data.map((e) => e.toString()).toList();
      if (data is String) return data.split(',').map((e) => e.trim()).toList();
      return [];
    }

    // Handle nested format if coming from /full endpoint
    final turfJson = json['turf'] ?? json;
    final gamesJson = json['games'] as List? ?? [];

    return Turf(
      id: turfJson['id']?.toString() ?? '',
      name: turfJson['name'] ?? 'Unknown Turf',
      location: turfJson['location'] ?? 'Unknown Location',
      pricePerHour: double.tryParse(turfJson['min_price']?.toString() ?? '0') ?? 
                   double.tryParse(turfJson['price_per_hour']?.toString() ?? '0') ?? 0.0,
      rating: double.tryParse(turfJson['rating']?.toString() ?? '0') ?? 0.0,
      imageUrl: turfJson['image_url'] ?? 
               (turfJson['images'] != null && (turfJson['images'] as List).isNotEmpty 
                   ? turfJson['images'][0] 
                   : 'https://via.placeholder.com/150'),
      sports: parseList(turfJson['sports']),
      amenities: parseList(turfJson['amenities'] ?? turfJson['facilities']),
      openingTime: turfJson['opening_time'] ?? '06:00',
      closingTime: turfJson['closing_time'] ?? '23:00',
      lat: double.tryParse(turfJson['latitude']?.toString() ?? '0') ?? 0.0,
      lng: double.tryParse(turfJson['longitude']?.toString() ?? '0') ?? 0.0,
      description: turfJson['description'] ?? '',
      games: gamesJson.map((g) => TurfGame.fromJson(g)).toList(),
    );
  }
}

class Coach {
  final String id;
  final String name;
  final String specialization;
  final double rating;
  final int experience;
  final double pricePerSession;
  final String location;
  final String bio;
  final String imageUrl;
  final String availability;

  Coach({
    required this.id,
    required this.name,
    required this.specialization,
    required this.rating,
    required this.experience,
    required this.pricePerSession,
    required this.location,
    required this.bio,
    required this.imageUrl,
    required this.availability,
  });

  factory Coach.fromJson(Map<String, dynamic> json) {
    return Coach(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      specialization: json['specialization'] ?? '',
      rating: double.tryParse(json['rating']?.toString() ?? '5.0') ?? 5.0,
      experience: int.tryParse(json['experience']?.toString() ?? '0') ?? 0,
      pricePerSession: double.tryParse(json['price_per_session']?.toString() ?? '0') ?? 0.0,
      location: json['location'] ?? '',
      bio: json['bio'] ?? '',
      imageUrl: json['image_url'] ?? '',
      availability: json['availability'] ?? '',
    );
  }
}

class Academy {
  final String id;
  final String name;
  final String location;
  final String sports;
  final String description;
  final double rating;
  final String imageUrl;
  final double pricePerMonth;

  Academy({
    required this.id,
    required this.name,
    required this.location,
    required this.sports,
    required this.description,
    required this.rating,
    required this.imageUrl,
    required this.pricePerMonth,
  });

  factory Academy.fromJson(Map<String, dynamic> json) {
    return Academy(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      location: json['location'] ?? '',
      sports: json['sports'] ?? '',
      description: json['description'] ?? '',
      rating: double.tryParse(json['rating']?.toString() ?? '5.0') ?? 5.0,
      imageUrl: json['image_url'] ?? '',
      pricePerMonth: double.tryParse(json['price_per_month']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class Tournament {
  final String id;
  final String name;
  final String sport;
  final String startDate;
  final String endDate;
  final String location;
  final double entryFee;
  final double prizePool;
  final int maxTeams;
  final int registeredTeams;
  final String imageUrl;
  final String status;

  Tournament({
    required this.id,
    required this.name,
    required this.sport,
    required this.startDate,
    required this.endDate,
    required this.location,
    required this.entryFee,
    required this.prizePool,
    required this.maxTeams,
    required this.registeredTeams,
    required this.imageUrl,
    required this.status,
  });

  factory Tournament.fromJson(Map<String, dynamic> json) {
    return Tournament(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      sport: json['sport'] ?? '',
      startDate: json['start_date'] ?? '',
      endDate: json['end_date'] ?? '',
      location: json['location'] ?? '',
      entryFee: double.tryParse(json['entry_fee']?.toString() ?? '0') ?? 0.0,
      prizePool: double.tryParse(json['prize_pool']?.toString() ?? '0') ?? 0.0,
      maxTeams: int.tryParse(json['max_teams']?.toString() ?? '0') ?? 0,
      registeredTeams: int.tryParse(json['registered_teams']?.toString() ?? '0') ?? 0,
      imageUrl: json['image_url'] ?? '',
      status: json['status'] ?? 'Open',
    );
  }
}

class MatchRequest {
  final String id;
  final String sport;
  final String turfName;
  final String location;
  final String time;
  final int playersNeeded;
  final double costPerPlayer;
  final String creatorName;

  MatchRequest({
    required this.id,
    required this.sport,
    required this.turfName,
    required this.location,
    required this.time,
    required this.playersNeeded,
    required this.costPerPlayer,
    required this.creatorName,
  });

  factory MatchRequest.fromJson(Map<String, dynamic> json) {
    return MatchRequest(
      id: json['id']?.toString() ?? '',
      sport: json['sport'] ?? '',
      turfName: json['turf_name'] ?? '',
      location: json['location'] ?? '',
      time: json['time'] ?? '',
      playersNeeded: int.tryParse(json['players_needed']?.toString() ?? '0') ?? 0,
      costPerPlayer: double.tryParse(json['cost_per_player']?.toString() ?? '0') ?? 0.0,
      creatorName: json['creator_name'] ?? '',
    );
  }
}
