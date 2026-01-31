import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class OwnerBookingsScreen extends StatefulWidget {
  const OwnerBookingsScreen({super.key});

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OwnerProvider>(context, listen: false).fetchBookings();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings Management'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Pending'),
            Tab(text: 'History'),
          ],
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
        ),
      ),
      body: Consumer<OwnerProvider>(
        builder: (context, owner, child) {
          if (owner.isLoading && owner.bookings.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final now = DateTime.now();
          final upcoming = owner.bookings.where((b) => 
            b.status == 'confirmed' && DateTime.parse(b.startTime).isAfter(now)).toList();
          final pending = owner.bookings.where((b) => b.status == 'pending').toList();
          final history = owner.bookings.where((b) => 
            b.status == 'completed' || b.status == 'cancelled' || 
            (b.status == 'confirmed' && DateTime.parse(b.endTime).isBefore(now))).toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildBookingList(upcoming, 'No upcoming bookings'),
              _buildBookingList(pending, 'No pending requests', isPending: true),
              _buildBookingList(history, 'No booking history'),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/owner/walk-in'),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBookingList(List<Booking> bookings, String emptyMsg, {bool isPending = false}) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_today_outlined, size: 64, color: Colors.white.withOpacity(0.1)),
            const SizedBox(height: 16),
            Text(emptyMsg, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => Provider.of<OwnerProvider>(context, listen: false).fetchBookings(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          final booking = bookings[index];
          return _buildBookingCard(booking, isPending);
        },
      ),
    );
  }

  Widget _buildBookingCard(Booking b, bool isPending) {
    final start = DateTime.parse(b.startTime);
    final dateStr = DateFormat('EEE, MMM d').format(start);
    final timeStr = '${DateFormat('h:mm a').format(start)} - ${DateFormat('h:mm a').format(DateTime.parse(b.endTime))}';

    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(b.turfName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('${b.gameType} • ${b.unitName}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(b.status).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  b.status.toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _getStatusColor(b.status)),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Colors.white10),
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(dateStr, style: const TextStyle(fontSize: 13)),
              const SizedBox(width: 20),
              Icon(Icons.access_time, size: 14, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(timeStr, style: const TextStyle(fontSize: 13)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.person_outline, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 8),
              Text(b.guestName, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
              const Spacer(),
              Text('₹${b.totalPrice.toInt()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green)),
            ],
          ),
          if (isPending) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleCancel(b.id),
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleConfirm(b.id),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    child: const Text('Approve'),
                  ),
                ),
              ],
            ),
          ]
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed': return Colors.green;
      case 'pending': return Colors.orange;
      case 'cancelled': return Colors.red;
      case 'completed': return Colors.blue;
      case 'blocked': return Colors.grey;
      default: return Colors.white;
    }
  }

  void _handleConfirm(String id) async {
    try {
      await Provider.of<OwnerProvider>(context, listen: false).confirmBooking(id);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking approved successfully')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _handleCancel(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Decline Booking'),
        content: const Text('Are you sure you want to decline this booking request?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Decline', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await Provider.of<OwnerProvider>(context, listen: false).cancelBooking(id);
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }
}
