import 'package:flutter/material.dart';

class MyBookingsScreen extends StatelessWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')), // automaticallyImplyLeading (back button) is true by default
      body: const Center(child: Text('Bookings coming soon...', style: TextStyle(color: Colors.white))),
    );
  }
}
