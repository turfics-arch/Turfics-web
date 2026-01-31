import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/glass_container.dart';
import '../../data/models/models.dart';
import 'package:intl/intl.dart';

class BookingDetailsScreen extends StatelessWidget {
  final Booking booking;

  const BookingDetailsScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    // Mock Data if missing
    final createdDate = DateTime.tryParse(booking.startTime) ?? DateTime.now();
    final dateStr = DateFormat('dd MMM yyyy').format(createdDate);
    final timeStr = "${booking.startTime} - ${booking.endTime}";
    final amount = "\$${booking.totalPrice}"; 

    return Scaffold(
      appBar: AppBar(
        title: const Text("Booking Details"),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
               // Share invoice logic
            },
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined),
            onPressed: () {
               // Download invoice logic
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          children: [
            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: booking.status == 'confirmed' ? AppColors.success.withOpacity(0.1) : AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: booking.status == 'confirmed' ? AppColors.success : AppColors.warning),
              ),
              child: Text(
                booking.status.toUpperCase(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: booking.status == 'confirmed' ? AppColors.success : AppColors.warning
                ),
              ),
            ),
            const SizedBox(height: 24),

            // INVOICE TICKET
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 5))
                ]
              ),
              child: Column(
                children: [
                   // Header
                   Container(
                     padding: const EdgeInsets.all(24),
                     decoration: const BoxDecoration(
                       border: Border(bottom: BorderSide(color: AppColors.glassBorderDark, width: 1, style: BorderStyle.solid)),
                     ),
                     child: Column(
                       children: [
                         Text("INVOICE #${booking.id.substring(0, 8).toUpperCase()}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
                         const SizedBox(height: 8),
                         Text(dateStr, style: const TextStyle(color: AppColors.textSecondary)),
                       ],
                     ),
                   ),

                   // Body
                   Padding(
                     padding: const EdgeInsets.all(24.0),
                     child: Column(
                       children: [
                         _buildRow("Customer", "John Doe"), // Booking model needs user relation
                         _buildRow("Sport", "Football (5v5)"),
                         _buildRow("Pitch", "Turf A"),
                         const Divider(height: 32),
                         _buildRow("Date", dateStr),
                         _buildRow("Time", timeStr),
                         const Divider(height: 32),
                         _buildRow("Amount Paid", amount, isBold: true, color: AppColors.primary),
                         _buildRow("Payment Method", "UPI / Online"),
                       ],
                     ),
                   ),
                   
                   // Dotted Line (Visual separator)
                   Row(
                     children: List.generate(30 ~/ 2, (index) => Expanded(
                       child: Container(
                         color: index % 2 == 0 ? Colors.transparent : Colors.grey.withOpacity(0.5),
                         height: 2,
                       ),
                     )),
                   ),

                   // QR Code Section
                   Padding(
                     padding: const EdgeInsets.all(24.0),
                     child: Column(
                       children: [
                         QrImageView(
                           data: "turfics://booking/${booking.id}",
                           version: QrVersions.auto,
                           size: 150.0,
                           backgroundColor: Colors.white,
                           padding: const EdgeInsets.all(16),
                         ),
                         const SizedBox(height: 16),
                         const Text("Scan at venue entry", style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                       ],
                     ),
                   ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),

            // Actions
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error.withOpacity(0.1),
                  foregroundColor: AppColors.error,
                  elevation: 0,
                  side: const BorderSide(color: AppColors.error),
                ),
                icon: const Icon(Icons.cancel_outlined),
                onPressed: () {
                   // Cancel Logic
                },
                label: const Text("Cancel Booking"),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: color ?? (isBold ? Colors.white : Colors.white70),
            fontSize: isBold ? 16 : 14
          )),
        ],
      ),
    );
  }
}
