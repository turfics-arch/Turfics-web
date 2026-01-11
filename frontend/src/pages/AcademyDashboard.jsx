import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API_URL from '../config';
import { User, Calendar, Check, X, Edit, MapPin, Clock, Plus, Trash2, Users, Trophy } from 'lucide-react';
import './CoachDashboard.css'; // Reusing existing styles

const AcademyDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ programs: 0, batches: 0, active_students: 0, pending_enrollments: 0 });
    const [programs, setPrograms] = useState([]);
    const [batches, setBatches] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({});

    const [showProgramForm, setShowProgramForm] = useState(false);
    const [newProgram, setNewProgram] = useState({ sport: '', description: '' });

    const [showBatchForm, setShowBatchForm] = useState(false);
    const [newBatch, setNewBatch] = useState({});

    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchStudents, setBatchStudents] = useState([]);
    const [showStudentModal, setShowStudentModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Profile
            const pRes = await fetch(`${API_URL}/api/academy/me`, { headers });
            if (pRes.ok) {
                const data = await pRes.json();
                setProfile(data);
                setProfileForm(data);
            } else if (pRes.status === 404) {
                setProfile(null);
                setIsEditingProfile(true);
            }

            // Stats
            const sRes = await fetch(`${API_URL}/api/academy/stats`, { headers });
            if (sRes.ok) setStats(await sRes.json());

            // Programs
            const prRes = await fetch(`${API_URL}/api/academy/programs`, { headers });
            if (prRes.ok) setPrograms(await prRes.json());

            // Batches
            const bRes = await fetch(`${API_URL}/api/academy/batches`, { headers });
            if (bRes.ok) setBatches(await bRes.json());

            // Enrollments
            const eRes = await fetch(`${API_URL}/api/academy/enrollments`, { headers });
            if (eRes.ok) setEnrollments(await eRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(profileForm)
        });
        if (res.ok) {
            alert('Profile Updated');
            setIsEditingProfile(false);
            fetchData();
        }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/programs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(newProgram)
        });
        if (res.ok) {
            alert('Program Created');
            setShowProgramForm(false);
            setNewProgram({ sport: '', description: '' });
            fetchData();
        }
    };

    const handleDeleteProgram = async (id) => {
        if (!window.confirm('Delete this program? This will also delete all associated batches.')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/programs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchData();
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/batches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(newBatch)
        });
        if (res.ok) {
            alert('Batch Created');
            setShowBatchForm(false);
            setNewBatch({});
            fetchData();
        }
    };

    const handleEnrollmentAction = async (id, action) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/enrollments/${id}/action`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (res.ok) fetchData();
    };

    const viewStudents = async (batch) => {
        setSelectedBatch(batch);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/academy/batches/${batch.id}/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setBatchStudents(await res.json());
            setShowStudentModal(true);
        }
    };

    if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

    return (
        <div className="coach-dashboard">
            <Navbar />
            <div className="dashboard-container">
                {/* Header */}
                <div className="dash-header">
                    <h1>Academy Dashboard</h1>
                    <div className="dash-tabs">
                        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                        <button className={`tab-btn ${activeTab === 'programs' ? 'active' : ''}`} onClick={() => setActiveTab('programs')}>Programs</button>
                        <button className={`tab-btn ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => setActiveTab('batches')}>Batches</button>
                        <button className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => setActiveTab('enrollments')}>Enrollments</button>
                        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="overview-section fade-in">
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                <Trophy size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                                <h3>{stats.programs}</h3>
                                <p style={{ color: '#888' }}>Programs</p>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                <Calendar size={32} color="#2196F3" style={{ marginBottom: '0.5rem' }} />
                                <h3>{stats.batches}</h3>
                                <p style={{ color: '#888' }}>Active Batches</p>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                <Users size={32} color="#00E676" style={{ marginBottom: '0.5rem' }} />
                                <h3>{stats.active_students}</h3>
                                <p style={{ color: '#888' }}>Active Students</p>
                            </div>
                            <div className="stat-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                                <Clock size={32} color="orange" style={{ marginBottom: '0.5rem' }} />
                                <h3>{stats.pending_enrollments}</h3>
                                <p style={{ color: '#888' }}>Pending Requests</p>
                            </div>
                        </div>

                        <div className="recent-activity">
                            <h2>Pending Enrollments</h2>
                            <div className="requests-grid" style={{ marginTop: '1rem' }}>
                                {enrollments.filter(e => e.status === 'pending').length === 0 ? (
                                    <p style={{ color: '#888' }}>No pending enrollments.</p>
                                ) : (
                                    enrollments.filter(e => e.status === 'pending').slice(0, 3).map(req => (
                                        <div key={req.id} className="request-card">
                                            <div className="rc-header">
                                                <span>{req.enrollment_date}</span>
                                                <span className="status-badge status-pending">Pending</span>
                                            </div>
                                            <h3>{req.student_name}</h3>
                                            <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>{req.program_sport} - {req.batch_name}</p>
                                            <div className="rc-actions">
                                                <button className="confirm-btn" onClick={() => handleEnrollmentAction(req.id, 'approve')}><Check size={18} /></button>
                                                <button className="reject-btn" onClick={() => handleEnrollmentAction(req.id, 'reject')}><X size={18} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* PROGRAMS TAB */}
                {activeTab === 'programs' && (
                    <div className="programs-section fade-in">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>Sports Programs</h2>
                            <button className="save-btn" onClick={() => setShowProgramForm(true)}><Plus size={18} style={{ marginRight: 5 }} /> Add Program</button>
                        </div>

                        {showProgramForm && (
                            <form className="profile-form mb-4" onSubmit={handleCreateProgram} style={{ marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label>Sport</label>
                                    <input type="text" value={newProgram.sport} onChange={e => setNewProgram({ ...newProgram, sport: e.target.value })} required placeholder="e.g. Cricket, Football" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={newProgram.description} onChange={e => setNewProgram({ ...newProgram, description: e.target.value })} rows="3"></textarea>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowProgramForm(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Create Program</button>
                                </div>
                            </form>
                        )}

                        <div className="programs-list" style={{ display: 'grid', gap: '1rem' }}>
                            {programs.map(p => (
                                <div key={p.id} className="program-card" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{p.sport}</h3>
                                        <p style={{ color: '#aaa' }}>{p.description}</p>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
                                            {p.batch_count} Active Batches | Created: {p.created_at}
                                        </div>
                                    </div>
                                    <button className="reject-btn" onClick={() => handleDeleteProgram(p.id)}><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BATCHES TAB */}
                {activeTab === 'batches' && (
                    <div className="batches-section fade-in">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>Training Batches</h2>
                            <button className="save-btn" onClick={() => setShowBatchForm(true)}><Plus size={18} style={{ marginRight: 5 }} /> Create Batch</button>
                        </div>

                        {showBatchForm && (
                            <form className="profile-form mb-4" onSubmit={handleCreateBatch} style={{ marginBottom: '2rem' }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Program</label>
                                        <select
                                            value={newBatch.program_id}
                                            onChange={e => setNewBatch({ ...newBatch, program_id: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '8px', color: 'white' }}
                                            required
                                        >
                                            <option value="">Select Program</option>
                                            {programs.map(p => <option key={p.id} value={p.id}>{p.sport}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Batch Name</label>
                                        <input type="text" value={newBatch.name} onChange={e => setNewBatch({ ...newBatch, name: e.target.value })} required placeholder="e.g. Morning U-14" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={newBatch.description} onChange={e => setNewBatch({ ...newBatch, description: e.target.value })} rows="2"></textarea>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Days</label>
                                        <input type="text" value={newBatch.days} onChange={e => setNewBatch({ ...newBatch, days: e.target.value })} placeholder="Mon, Wed, Fri" />
                                    </div>
                                    <div className="form-group">
                                        <label>Age Group</label>
                                        <input type="text" value={newBatch.age_group} onChange={e => setNewBatch({ ...newBatch, age_group: e.target.value })} placeholder="U-14, Open" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time</label>
                                        <input type="time" value={newBatch.start_time} onChange={e => setNewBatch({ ...newBatch, start_time: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time</label>
                                        <input type="time" value={newBatch.end_time} onChange={e => setNewBatch({ ...newBatch, end_time: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price (₹/month)</label>
                                        <input type="number" value={newBatch.price_per_month} onChange={e => setNewBatch({ ...newBatch, price_per_month: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Capacity</label>
                                        <input type="number" value={newBatch.capacity} onChange={e => setNewBatch({ ...newBatch, capacity: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowBatchForm(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Create Batch</button>
                                </div>
                            </form>
                        )}

                        <div className="requests-grid">
                            {batches.map(b => (
                                <div key={b.id} className="request-card" style={{ borderLeft: `4px solid var(--primary)` }}>
                                    <div className="rc-header">
                                        <span>{b.program_sport}</span>
                                        <span className="status-badge status-confirmed">{b.age_group}</span>
                                    </div>
                                    <h3>{b.name}</h3>
                                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem', minHeight: '40px' }}>{b.description}</p>

                                    <div className="batch-details" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#ccc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {b.days}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={14} /> {b.start_time} - {b.end_time}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14} /> {b.student_count} / {b.capacity} Students</div>
                                    </div>

                                    <div className="rc-footer">
                                        <div className="rc-price">₹{b.price_per_month}<small style={{ fontSize: '0.8rem', color: '#888' }}>/mo</small></div>
                                        <button className="confirm-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={() => viewStudents(b)}>View Students</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ENROLLMENTS TAB */}
                {activeTab === 'enrollments' && (
                    <div className="enrollments-section fade-in">
                        <h2>Student Enrollments</h2>
                        <div className="requests-grid" style={{ marginTop: '1.5rem' }}>
                            {enrollments.map(req => (
                                <div key={req.id} className="request-card">
                                    <div className="rc-header">
                                        <span>{req.enrollment_date}</span>
                                        <span className={`status-badge status-${req.status}`}>{req.status}</span>
                                    </div>
                                    <h3>{req.student_name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#primary', marginBottom: '0.2rem' }}>{req.program_sport}</p>
                                    <p style={{ color: '#aaa', marginBottom: '1rem' }}>{req.batch_name}</p>

                                    {req.notes && <p className="rc-notes">"{req.notes}"</p>}

                                    {
                                        req.status === 'pending' && (
                                            <div className="rc-actions" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                                <button className="confirm-btn" style={{ flex: 1 }} onClick={() => handleEnrollmentAction(req.id, 'approve')}>Approve</button>
                                                <button className="reject-btn" style={{ flex: 1 }} onClick={() => handleEnrollmentAction(req.id, 'reject')}>Reject</button>
                                            </div>
                                        )
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="profile-section fade-in">
                        {isEditingProfile ? (
                            <form className="profile-form" onSubmit={handleProfileUpdate}>
                                <h2>Edit Academy Profile</h2>
                                <div className="form-group">
                                    <label>Academy Name</label>
                                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} rows="4"></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Sports (comma separated)</label>
                                    <input type="text" value={profileForm.sports} onChange={e => setProfileForm({ ...profileForm, sports: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input type="text" value={profileForm.image_url} onChange={e => setProfileForm({ ...profileForm, image_url: e.target.value })} />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Save Changes</button>
                                </div>
                            </form>
                        ) : profile && (
                            <div className="profile-card">
                                <div className="pc-header">
                                    <img src={profile.image_url} alt="Academy" style={{ width: 100, height: 100, borderRadius: '12px', objectFit: 'cover' }} />
                                    <div>
                                        <h2>{profile.name}</h2>
                                        <div className="specialization-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{profile.sports}</div>
                                    </div>
                                    <button className="edit-btn" onClick={() => setIsEditingProfile(true)}><Edit size={16} /> Edit Profile</button>
                                </div>
                                <div className="pc-details">
                                    <div className="detail-item"><MapPin size={20} /> {profile.location}</div>
                                    <div className="detail-item"><Users size={20} /> {stats.active_students} Active Students</div>
                                </div>
                                <div className="bio-box" style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h4>About Academy</h4>
                                    <p style={{ color: '#ccc', lineHeight: '1.6' }}>{profile.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Student Roster Modal */}
            {
                showStudentModal && selectedBatch && (
                    <div className="modal-overlay" onClick={() => setShowStudentModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2>{selectedBatch.name} - Students</h2>
                                <button onClick={() => setShowStudentModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div className="student-list" style={{ display: 'grid', gap: '1rem' }}>
                                {batchStudents.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No active students in this batch.</p>
                                ) : (
                                    batchStudents.map(student => (
                                        <div key={student.id} className="student-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{student.name}</h4>
                                                    <small style={{ color: '#888' }}>{student.email}</small>
                                                </div>
                                            </div>
                                            <div className="status" style={{ textAlign: 'right' }}>
                                                <div className="status-badge status-confirmed" style={{ display: 'inline-block', marginBottom: '0.2rem' }}>Active</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Since {student.enrollment_date}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AcademyDashboard;
