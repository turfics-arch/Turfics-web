import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Users, UserPlus, Trash2, Shield, Mail, Key, User, CheckCircle, XCircle, Info, Lock } from 'lucide-react';
import { showError, showSuccess, showConfirm } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './OwnerStaff.css';

const OwnerStaff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [turfs, setTurfs] = useState([]);
    const [selectedTurfId, setSelectedTurfId] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        username: '',
        password: '',
        role: 'manager'
    });

    useEffect(() => {
        fetchTurfs();
    }, []);

    useEffect(() => {
        if (selectedTurfId) {
            fetchStaff();
        }
    }, [selectedTurfId]);

    const fetchTurfs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTurfs(data);
            if (data.length > 0) setSelectedTurfId(data[0].id);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/${selectedTurfId}/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStaffList(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/${selectedTurfId}/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(inviteForm)
            });

            if (res.ok) {
                showSuccess('Success', 'Staff member added successfully.');
                setShowInviteModal(false);
                setInviteForm({ email: '', username: '', password: '', role: 'manager' });
                fetchStaff();
            } else {
                const data = await res.json();
                showError('Failed', data.message || 'Could not add staff');
            }
        } catch (e) {
            showError('Error', 'Network error');
        }
    };

    const handleToggleStatus = async (staffId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/staff/${staffId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchStaff();
            }
        } catch (e) {
            showError('Error', 'Failed to update status');
        }
    };

    const handleRemove = async (staffId) => {
        const confirm = await showConfirm('Remove Staff?', 'Are you sure you want to revoke access?');
        if (!confirm) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/staff/${staffId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchStaff();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="staff-management-page">
            <Navbar />
            <div className="staff-management">
                <header className="staff-header">
                    <div>
                        <h1>Staff Management</h1>
                        <p>Manage access, roles, and status for your venue team</p>
                    </div>

                    <div className="staff-header-actions">
                        {turfs.length > 0 && (
                            <select
                                value={selectedTurfId || ''}
                                onChange={(e) => setSelectedTurfId(e.target.value)}
                                className="turf-selector-premium"
                            >
                                {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}

                        <button className="add-staff-btn" onClick={() => setShowInviteModal(true)}>
                            <UserPlus size={18} /> Add New Staff
                        </button>
                    </div>
                </header>

                <div className="staff-grid">
                    {loading ? <p>Loading team...</p> : staffList.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Users size={40} color="#64748b" />
                            </div>
                            <h3>No Team Members</h3>
                            <p>Invite or create accounts for your venue managers and staff</p>
                            <button className="add-staff-btn" style={{ margin: '0 auto' }} onClick={() => setShowInviteModal(true)}>
                                <UserPlus size={18} /> Add Your First Staff
                            </button>
                        </div>
                    ) : (
                        staffList.map(staff => (
                            <div key={staff.id} className="staff-card">
                                <div className="staff-card-header">
                                    <div className="staff-avatar">
                                        {staff.username[0].toUpperCase()}
                                    </div>
                                    <span className={`role-tag ${staff.role === 'admin' ? 'role-admin' : 'role-manager'}`}>
                                        {staff.role}
                                    </span>
                                </div>

                                <div className="staff-details">
                                    <h3>{staff.username}</h3>
                                    <div className="staff-info-row">
                                        <Mail size={14} /> {staff.email}
                                    </div>
                                    <div className="staff-info-row">
                                        <Shield size={14} /> Joined: {new Date(staff.joined_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="staff-card-footer">
                                    <div
                                        className={`status-toggle ${staff.status === 'active' ? 'status-active' : 'status-inactive'}`}
                                        onClick={() => handleToggleStatus(staff.id, staff.status)}
                                    >
                                        {staff.status === 'active' ? (
                                            <><CheckCircle size={16} /> Active</>
                                        ) : (
                                            <><XCircle size={16} /> Inactive</>
                                        )}
                                    </div>

                                    <button className="delete-staff-btn" onClick={() => handleRemove(staff.id)} title="Remove Access">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showInviteModal && (
                    <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                            <header className="modal-header">
                                <h2>Onboard New Staff</h2>
                                <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                                    <XCircle size={24} />
                                </button>
                            </header>

                            <form onSubmit={handleAddStaff} className="turf-form">
                                <div className="form-section-title"><User size={14} /> Account Identity</div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="premium-input"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        placeholder="staff@example.com"
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            required
                                            className="premium-input"
                                            value={inviteForm.username}
                                            onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                                            placeholder="johndoe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="premium-input"
                                            value={inviteForm.password}
                                            onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <p className="password-note"><Info size={12} /> This will be the staff's login credential.</p>

                                <div className="form-section-title" style={{ marginTop: '2rem' }}><Shield size={14} /> Permissions</div>
                                <div className="form-group">
                                    <label>Management Role</label>
                                    <select
                                        value={inviteForm.role}
                                        className="premium-input"
                                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    >
                                        <option value="manager">Manager (Bookings & Ops)</option>
                                        <option value="admin">Admin (Full Control)</option>
                                    </select>
                                </div>

                                <div className="modal-footer" style={{ marginTop: '2rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                    <button type="submit" className="add-staff-btn">Register Staff</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerStaff;

