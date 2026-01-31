import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/constants.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/owner_provider.dart';
import '../../data/models/models.dart';

class BookingHistoryScreen extends StatelessWidget {
  const BookingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<OwnerProvider>(context);

    // Mock sorting (Recent first)
    // Assuming API returns sorted or sort here
    final bookings = List.of(provider.bookings)..sort((a, b) => b.startTime.compareTo(a.startTime));

    return Scaffold(
      appBar: AppBar(title: const Text("Today's Volume / History")),
      body: bookings.isEmpty
          ? const Center(child: Text("No bookings yet", style: TextStyle(color: AppColors.textSecondary)))
          : ListView.builder(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];
                return _buildBookingCard(context, booking);
              },
            ),
    );
  }

  Widget _buildBookingCard(BuildContext context, Booking booking) {
    final date = DateTime.tryParse(booking.startTime) ?? DateTime.now();
    final dateStr = DateFormat('MMM dd, yyyy').format(date);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.glassBorderDark),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        onTap: () {
           // Pass booking object. Since GoRouter params are strings, we might pass ID and fetch, but passing object in 'extra' is supported
           context.push('/owner/booking-details', extra: booking);
        },
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: booking.status == 'confirmed' ? AppColors.success.withOpacity(0.1) : AppColors.warning.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            booking.status == 'confirmed' ? Icons.check_circle : Icons.schedule,
            color: booking.status == 'confirmed' ? AppColors.success : AppColors.warning,
          ),
        ),
        title: Text(
          "Booking #${booking.id.substring(0, 5)}", 
          style: const TextStyle(fontWeight: FontWeight.bold)
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text("$dateStr • ${booking.startTime}", style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            const SizedBox(height: 2),
            Text("Amount: \$${booking.totalPrice}", style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
      ),
    );
  }
}
