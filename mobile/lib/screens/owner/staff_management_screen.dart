import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/owner_provider.dart';
import '../../widgets/glass_container.dart';
import '../../core/constants/constants.dart';
import '../../data/models/models.dart';

class StaffManagementScreen extends StatefulWidget {
  const StaffManagementScreen({super.key});

  @override
  State<StaffManagementScreen> createState() => _StaffManagementScreenState();
}

class _StaffManagementScreenState extends State<StaffManagementScreen> {
  String? _selectedTurfId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final ownerProvider = Provider.of<OwnerProvider>(context, listen: false);
    await ownerProvider.fetchMyTurfs();
    if (ownerProvider.myTurfs.isNotEmpty) {
      setState(() {
        _selectedTurfId = ownerProvider.myTurfs.first.id;
      });
      await ownerProvider.fetchStaff(_selectedTurfId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Management'),
      ),
      body: Consumer<OwnerProvider>(
        builder: (context, owner, child) {
          if (owner.isLoading && owner.myTurfs.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (owner.myTurfs.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedTurfId,
                        isExpanded: true,
                        dropdownColor: AppColors.background,
                        items: owner.myTurfs.map((turf) {
                          return DropdownMenuItem(
                            value: turf.id,
                            child: Text(turf.name),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setState(() => _selectedTurfId = value);
                            owner.fetchStaff(value);
                          }
                        },
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Team Members',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showInviteModal(context),
                      icon: const Icon(Icons.add),
                      label: const Text('Add Staff'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: owner.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : owner.staff.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              itemCount: owner.staff.length,
                              itemBuilder: (context, index) {
                                final staff = owner.staff[index];
                                return _buildStaffCard(staff);
                              },
                            ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: Colors.white.withOpacity(0.2)),
          const SizedBox(height: 16),
          const Text('No team members found', style: TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildStaffCard(StaffMember staff) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.2),
            child: Text(staff.username[0].toUpperCase(), style: const TextStyle(color: AppColors.primary)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(staff.username, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(staff.email, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: staff.role == 'admin' ? Colors.purple.withOpacity(0.2) : Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    staff.role.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: staff.role == 'admin' ? Colors.purple : Colors.blue,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              Switch(
                value: staff.status == 'active',
                onChanged: (val) {
                  Provider.of<OwnerProvider>(context, listen: false).updateStaffStatus(
                    staff.id,
                    val ? 'active' : 'inactive',
                    _selectedTurfId!,
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                onPressed: () => _confirmRemove(staff),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _confirmRemove(StaffMember staff) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Staff'),
        content: Text('Are you sure you want to remove ${staff.username}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      Provider.of<OwnerProvider>(context, listen: false).removeStaff(staff.id, _selectedTurfId!);
    }
  }

  void _showInviteModal(BuildContext context) {
    if (_selectedTurfId == null) return;
    
    final emailController = TextEditingController();
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();
    String role = 'manager';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20, left: 20, right: 20,
          ),
          decoration: const BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add New Staff', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                TextField(
                  controller: emailController,
                  decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: usernameController,
                  decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock)),
                ),
                const SizedBox(height: 12),
                const Text('Role', style: TextStyle(color: AppColors.textSecondary)),
                Row(
                  children: [
                    Radio<String>(
                      value: 'manager',
                      groupValue: role,
                      onChanged: (v) => setModalState(() => role = v!),
                    ),
                    const Text('Manager'),
                    Radio<String>(
                      value: 'admin',
                      groupValue: role,
                      onChanged: (v) => setModalState(() => role = v!),
                    ),
                    const Text('Admin'),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      try {
                        await Provider.of<OwnerProvider>(context, listen: false).addStaff(
                          _selectedTurfId!,
                          {
                            'email': emailController.text,
                            'username': usernameController.text,
                            'password': passwordController.text,
                            'role': role,
                          },
                        );
                        Navigator.pop(context);
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    },
                    child: const Text('Invite Staff'),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
