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
  final String status;

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
    this.status = 'active',
  });

  factory Turf.fromJson(Map<String, dynamic> json) {
    List<String> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data.map((e) => e.toString()).toList();
      if (data is String) return data.split(',').map((e) => e.trim()).toList();
      return [];
    }

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
                   : 'https://placehold.co/150x150.png'),
      sports: parseList(turfJson['sports']),
      amenities: parseList(turfJson['amenities'] ?? turfJson['facilities']),
      openingTime: turfJson['opening_time'] ?? '06:00',
      closingTime: turfJson['closing_time'] ?? '23:00',
      lat: double.tryParse(turfJson['latitude']?.toString() ?? '0') ?? 0.0,
      lng: double.tryParse(turfJson['longitude']?.toString() ?? '0') ?? 0.0,
      description: turfJson['description'] ?? '',
      games: gamesJson.map((g) => TurfGame.fromJson(g)).toList(),
      status: turfJson['status'] ?? 'active',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Turf && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class StaffMember {
  final String id;
  final String email;
  final String username;
  final String role;
  final String status;
  final String joinedAt;

  StaffMember({
    required this.id,
    required this.email,
    required this.username,
    required this.role,
    required this.status,
    required this.joinedAt,
  });

  factory StaffMember.fromJson(Map<String, dynamic> json) {
    return StaffMember(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'manager',
      status: json['status'] ?? 'active',
      joinedAt: json['joined_at'] ?? '',
    );
  }
}

class Customer {
  final String id;
  final String name;
  final String email;
  final String phone;
  final int totalBookings;
  final double totalSpend;
  final String? lastVisit;

  Customer({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.totalBookings,
    required this.totalSpend,
    this.lastVisit,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      totalBookings: json['total_bookings'] ?? 0,
      totalSpend: double.tryParse(json['total_spend']?.toString() ?? '0') ?? 0.0,
      lastVisit: json['last_visit'],
    );
  }
}

class Booking {
  final String id;
  final String turfName;
  final String unitName;
  final String gameType;
  final String startTime;
  final String endTime;
  final double totalPrice;
  final String status;
  final String guestName;
  final String? guestPhone;
  final String bookingSource;
  final String? turfUnitId;

  Booking({
    required this.id,
    required this.turfName,
    required this.unitName,
    required this.gameType,
    required this.startTime,
    required this.endTime,
    required this.totalPrice,
    required this.status,
    required this.guestName,
    this.guestPhone,
    required this.bookingSource,
    this.turfUnitId,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['booking_id']?.toString() ?? json['id']?.toString() ?? '',
      turfName: json['turf_name'] ?? '',
      unitName: json['unit_name'] ?? '',
      gameType: json['game_type'] ?? '',
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'] ?? '',
      totalPrice: double.tryParse(json['total_price']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'pending',
      guestName: json['guest_name'] ?? 'Guest',
      guestPhone: json['guest_phone'],
      bookingSource: json['booking_source'] ?? 'online',
      turfUnitId: json['turf_unit_id']?.toString() ?? json['unit_id']?.toString(),
    );
  }
}

class MaintenanceTask {
  final String id;
  final String title;
  final String scheduledDate;
  final String priority;
  final String status;

  MaintenanceTask({
    required this.id,
    required this.title,
    required this.scheduledDate,
    required this.priority,
    required this.status,
  });

  factory MaintenanceTask.fromJson(Map<String, dynamic> json) {
    return MaintenanceTask(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      scheduledDate: json['scheduled_date'] ?? '',
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'pending',
    );
  }
}

class MaintenanceAsset {
  final String id;
  final String name;
  final String status;
  final int currentHours;

  MaintenanceAsset({
    required this.id,
    required this.name,
    required this.status,
    required this.currentHours,
  });

  factory MaintenanceAsset.fromJson(Map<String, dynamic> json) {
    return MaintenanceAsset(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      status: json['status'] ?? 'active',
      currentHours: json['current_hours'] ?? 0,
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
  final double walletBalance;

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
    this.walletBalance = 0,
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
      walletBalance: double.tryParse(json['wallet_balance']?.toString() ?? '0') ?? 0.0,
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
