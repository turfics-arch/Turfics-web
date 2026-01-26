import 'package:flutter/material.dart';

class BookingsTab extends StatelessWidget {
  const BookingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings'), automaticallyImplyLeading: false),
      body: const Center(child: Text('Bookings coming soon...', style: TextStyle(color: Colors.white))),
    );
  }
}
