import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { User, Calendar, Check, X, Edit, DollarSign, MapPin, Clock } from 'lucide-react';
import Loader from '../components/Loader';
import { showSuccess, showError, showConfirm, showToast } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './CoachDashboard.css';

const CoachDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'profile'
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Profile Form State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // Batches State
    const [batches, setBatches] = useState([]);
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [newBatch, setNewBatch] = useState({});
    const [selectedBatch, setSelectedBatch] = useState(null); // For Classroom View
    const [batchStudents, setBatchStudents] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            // Fetch Profile
            const pRes = await fetch(`${API_URL}/api/coach/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (pRes.ok) {
                const pData = await pRes.json();
                setProfile(pData);
                setFormData(pData);
            } else if (pRes.status === 404) {
                // No profile yet, let them create one
                setProfile(null);
                setIsEditing(true);
            }

            // Fetch Bookings
            const bRes = await fetch(`${API_URL}/api/coach/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (bRes.ok) setBookings(await bRes.json());

            // Fetch Batches
            const batchRes = await fetch(`${API_URL}/api/coach/batches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (batchRes.ok) setBatches(await batchRes.json());

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/coach/batches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBatch)
            });
            if (res.ok) {
                alert('Batch Created!');
                setShowBatchForm(false);
                fetchData(); // Reload
            }
        } catch (err) { console.error(err); }
    };

    const fetchBatchStudents = async (batchId) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/coach/batches/${batchId}/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setBatchStudents(await res.json());
    };

    const openClassroom = (batch) => {
        setSelectedBatch(batch);
        fetchBatchStudents(batch.id);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/coach/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Profile Updated!');
                setIsEditing(false);
                fetchData(); // Reload
            } else {
                alert('Failed to update profile');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleBookingAction = async (id, action) => {
        const token = localStorage.getItem('token');

        const result = await showConfirm(
            action === 'confirm' ? 'Confirm Booking?' : 'Reject Booking?',
            `Are you sure you want to <b>${action}</b> this session?`,
            action === 'confirm' ? 'Yes, Confirm' : 'Yes, Reject'
        );

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`${API_URL}/api/coach/bookings/${id}/action`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                // Optimistic update
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: action === 'confirm' ? 'confirmed' : 'rejected' } : b));
                showToast(`Session ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully!`);
            } else {
                showError('Action Failed', 'Could not update booking status');
            }
        } catch (err) {
            console.error(err);
            showError('Error', 'An error occurred while updating booking');
        }
    };

    if (loading) return <Loader text="Analyzing Plays..." />;

    return (
        <div className="coach-dashboard">
            <Navbar />

            <div className="dashboard-container">
                <header className="dash-header">
                    <h1>Coach Dashboard</h1>
                    <div className="dash-tabs">
                        <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                            Requests & Schedule
                        </button>
                        <button className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => setActiveTab('batches')}>
                            My Batches
                        </button>
                        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            My Profile
                        </button>
                    </div>
                </header>

                <main className="dash-content">
                    {activeTab === 'batches' && (
                        <div className="batches-section">
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2>Your Training Batches</h2>
                                <button className="save-btn" onClick={() => setShowBatchForm(true)}>+ Create Batch</button>
                            </div>

                            {showBatchForm && (
                                <form className="profile-form glass-panel mb-4" onSubmit={handleCreateBatch}>
                                    <h3>New Batch Details</h3>
                                    <div className="form-row">
                                        <div className="form-group"><label>Batch Name</label><input onChange={e => setNewBatch({ ...newBatch, name: e.target.value })} required placeholder="e.g. U-15 Elites" /></div>
                                        <div className="form-group"><label>Sport</label><input onChange={e => setNewBatch({ ...newBatch, sport: e.target.value })} required placeholder="e.g. Football" /></div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Description</label>
                                        <textarea
                                            rows="2"
                                            onChange={e => setNewBatch({ ...newBatch, description: e.target.value })}
                                            placeholder="What will students learn? (e.g. Advanced technical drills)"
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: 'white', borderRadius: '4px', padding: '0.5rem' }}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Days</label><input onChange={e => setNewBatch({ ...newBatch, days: e.target.value })} placeholder="Mon, Wed, Fri" /></div>
                                        <div className="form-group"><label>Timings</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input type="time" onChange={e => setNewBatch({ ...newBatch, start_time: e.target.value })} />
                                                <input type="time" onChange={e => setNewBatch({ ...newBatch, end_time: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Price/Month</label><input type="number" onChange={e => setNewBatch({ ...newBatch, price_per_month: e.target.value })} /></div>
                                        <div className="form-group"><label>Capacity</label><input type="number" onChange={e => setNewBatch({ ...newBatch, capacity: e.target.value })} /></div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setShowBatchForm(false)}>Cancel</button>
                                        <button type="submit" className="save-btn">Create</button>
                                    </div>
                                </form>
                            )}

                            <div className="requests-grid">
                                {batches.map(batch => (
                                    <div key={batch.id} className="request-card" style={{ borderColor: 'var(--primary)' }}>
                                        <div className="rc-header">
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{batch.sport}</span>
                                            <span className="status-badge status-confirmed">{batch.student_count} Students</span>
                                        </div>
                                        <h3>{batch.name}</h3>
                                        <div className="pc-details" style={{ gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {batch.days}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} /> {batch.start_time} - {batch.end_time}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={14} /> ₹{batch.price_per_month}/mo</div>
                                        </div>
                                        <button className="confirm-btn" style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px' }} onClick={() => openClassroom(batch)}>
                                            View Classroom
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Classroom Modal */}
                    {selectedBatch && (
                        <div className="modal-overlay" onClick={() => setSelectedBatch(null)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                                <div className="modal-header">
                                    <h2>{selectedBatch.name} - Classroom</h2>
                                    <button className="modal-close-btn" onClick={() => setSelectedBatch(null)}><X /></button>
                                </div>
                                <div className="classroom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    {batchStudents.length === 0 ? <p>No students enrolled yet.</p> : batchStudents.map(student => (
                                        <div key={student.id} className="student-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                            <div className="student-avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#444', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <h4 style={{ margin: '0.5rem 0' }}>{student.name}</h4>
                                            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>{student.email}</p>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                                                Joined: {student.joined_date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-section">
                            {!isEditing ? (
                                <div className="profile-card">
                                    <div className="pc-header">
                                        <div className="pc-avatar placeholder-avatar">
                                            {profile?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h2>{profile?.name || 'New Coach'}</h2>
                                            <span className="specialization-badge">{profile?.specialization || 'General'}</span>
                                        </div>
                                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                            <Edit size={16} /> Edit Profile
                                        </button>
                                    </div>
                                    <div className="pc-details">
                                        <div className="detail-item"><MapPin size={18} /> {profile?.location || 'No location set'}</div>
                                        <div className="detail-item"><DollarSign size={18} /> ₹{profile?.price_per_session || 0} / session</div>
                                        <div className="detail-item"><Calendar size={18} /> {profile?.experience || 0} Years Experience</div>
                                        <div className="detail-item bio-box">
                                            <h4>About Me</h4>
                                            <p>{profile?.bio || 'No bio added yet.'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form className="profile-form glass-panel" onSubmit={handleProfileUpdate}>
                                    <h2>Edit Your Coach Profile</h2>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Specialization (Sport)</label>
                                        <input type="text" value={formData.specialization || ''} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Cricket Batting" />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Experience (Years)</label>
                                            <input type="number" value={formData.experience || ''} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Price per Session (₹)</label>
                                            <input type="number" value={formData.price_per_session || ''} onChange={e => setFormData({ ...formData, price_per_session: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Location (City/Area)</label>
                                        <input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Bio / Description</label>
                                        <textarea rows="4" value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell students about your coaching style..."></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>Availability (Text Summary)</label>
                                        <input type="text" value={formData.availability || ''} onChange={e => setFormData({ ...formData, availability: e.target.value })} placeholder="e.g. Weekends 9AM - 2PM" />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button type="submit" className="save-btn">Save Profile</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bookings-section">
                            <h2>Training Requests</h2>
                            {bookings.length === 0 ? (
                                <p className="empty-state">No booking requests yet. Update your profile to attract students!</p>
                            ) : (
                                <div className="requests-grid">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className={`request-card status-${booking.status}`}>
                                            <div className="rc-header">
                                                <span className="rc-time">
                                                    <Calendar size={14} /> {new Date(booking.booking_time).toDateString()} • {new Date(booking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                                            </div>
                                            <h3>{booking.player_name}</h3>
                                            <p className="rc-notes">"{booking.notes || 'No notes'}"</p>
                                            <div className="rc-footer">
                                                <span className="rc-price">₹{booking.price}</span>
                                                {booking.status === 'pending' && (
                                                    <div className="rc-actions">
                                                        <button className="confirm-btn" onClick={() => handleBookingAction(booking.id, 'confirm')}><Check size={16} /></button>
                                                        <button className="reject-btn" onClick={() => handleBookingAction(booking.id, 'reject')}><X size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CoachDashboard;
