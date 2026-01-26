import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Edit, Trash2, Clock, Users, X, Trophy, AlertCircle, Info, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import LocationPicker from '../components/LocationPicker';
import { showSuccess, showError, showConfirm } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './TurfManagement.css';

const TurfManagement = () => {
    const navigate = useNavigate();
    const [turfs, setTurfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [editingTurf, setEditingTurf] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        latitude: null,
        longitude: null,
        opening_time: '06:00',
        closing_time: '22:00',
        amenities: '',
        facilities: '',
        image_url: '',
        status: 'active'
    });

    useEffect(() => {
        fetchTurfs();
    }, []);

    const fetchTurfs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTurfs(data);
            } else if (res.status === 401 || res.status === 422) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } catch (error) {
            console.error('Failed to fetch turfs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingTurf
                ? `${API_URL}/api/turfs/${editingTurf.id}`
                : `${API_URL}/api/turfs/create`;

            const method = editingTurf ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                showSuccess('Saved', 'Turf saved successfully!');
                fetchTurfs();
                resetForm();
                setShowModal(false);
            } else {
                showError('Error', data.message || 'Failed to save turf');
            }
        } catch (error) {
            showError('Error', error.message);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Delete Turf?', "Are you sure you want to delete this turf? This cannot be undone.");
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTurfs();
            }
        } catch (error) {
            console.error('Failed to delete turf:', error);
        }
    };

    const handleEdit = (turf) => {
        setEditingTurf(turf);
        setFormData({
            name: turf.name,
            location: turf.location,
            latitude: turf.latitude || null,
            longitude: turf.longitude || null,
            opening_time: turf.opening_time,
            closing_time: turf.closing_time,
            amenities: turf.amenities || '',
            facilities: turf.facilities || '',
            image_url: turf.image_url || '',
            status: turf.status || 'active'
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            location: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude
        }));
        setShowMapModal(false);
    };

    const resetForm = () => {
        setEditingTurf(null);
        setFormData({
            name: '',
            location: '',
            latitude: null,
            longitude: null,
            opening_time: '06:00',
            closing_time: '22:00',
            amenities: '',
            facilities: '',
            image_url: '',
            status: 'active'
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'active': return 'status-active';
            case 'maintenance': return 'status-maintenance';
            case 'rain_closure': return 'status-weather';
            default: return 'status-inactive';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return '🟢 Active';
            case 'maintenance': return '🟠 Maintenance';
            case 'rain_closure': return '🌧️ Weather Closure';
            default: return '🔴 Inactive';
        }
    };

    return (
        <div className="turf-management-page">
            <Navbar />
            {loading ? <Loader text="Loading Your Venues..." /> : (
                <div className="turf-management">
                    <header className="tm-header">
                        <div>
                            <h2>My Venues</h2>
                            <p>Manage and configure your sports facilities</p>
                        </div>
                        <div className="tm-header-actions">
                            <button className="manage-staff-btn" onClick={() => navigate('/owner/staff')}>
                                <Users size={18} /> Manage Staff
                            </button>
                            <button className="add-turf-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus size={20} /> Add New Turf
                            </button>
                        </div>
                    </header>

                    <div className="turfs-grid">
                        {turfs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <MapPin size={40} color="#64748b" />
                                </div>
                                <h3>No Venues Yet</h3>
                                <p>Get started by adding your first sports venue to the platform</p>
                                <button className="add-turf-btn" style={{ margin: '0 auto' }} onClick={() => { resetForm(); setShowModal(true); }}>
                                    <Plus size={20} /> Add Your First Turf
                                </button>
                            </div>
                        ) : (
                            turfs.map(turf => (
                                <div key={turf.id} className="turf-card">
                                    <div className="turf-image" style={{ backgroundImage: `url(${turf.image_url || 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800'})` }}>
                                        <span className={`status-badge ${getStatusClass(turf.status)}`}>
                                            {turf.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="turf-info">
                                        <h3>{turf.name}</h3>
                                        <p className="location"><MapPin size={16} /> {turf.location}</p>

                                        <div className="turf-meta-compact">
                                            <div className="meta-item">
                                                <Clock size={16} />
                                                <span>{turf.opening_time} - {turf.closing_time}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Trophy size={16} />
                                                <span>Active Games</span>
                                            </div>
                                        </div>

                                        <div className="turf-actions">
                                            <button className="manage-games-btn" onClick={() => navigate(`/manage-turfs/${turf.id}/games`)}>
                                                <Trophy size={18} /> Manage Games & Units
                                            </button>
                                            <button className="icon-action-btn edit-action" onClick={() => handleEdit(turf)} title="Edit Details">
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-action-btn delete-action" onClick={() => handleDelete(turf.id)} title="Delete Venue">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {showModal && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <header className="modal-header">
                                    <h2>{editingTurf ? 'Edit Venue' : 'Create New Venue'}</h2>
                                    <button className="close-btn" onClick={() => setShowModal(false)}>
                                        <X size={20} />
                                    </button>
                                </header>

                                <form onSubmit={handleSubmit} className="turf-form">
                                    <div className="form-section-title"><Info size={14} /> Basic Information</div>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Venue Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="premium-input"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., Downtown Sports Arena"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Operational Status</label>
                                            <select
                                                name="status"
                                                className="premium-input"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="active">🟢 Active</option>
                                                <option value="maintenance">🟠 Maintenance</option>
                                                <option value="rain_closure">🌧️ Weather Closure</option>
                                                <option value="inactive">🔴 Inactive</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Location Address *</label>
                                            <input
                                                type="text"
                                                name="location"
                                                className="premium-input"
                                                value={formData.location}
                                                onChange={handleChange}
                                                required
                                                placeholder="Street, City, State"
                                            />
                                            <button type="button" className="location-picker-trigger" onClick={() => setShowMapModal(true)}>
                                                <MapPin size={16} /> Pin on Map
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-section-title"><Clock size={14} /> Schedule & Operations</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Opening Time *</label>
                                            <input type="time" name="opening_time" className="premium-input" value={formData.opening_time} onChange={handleChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Closing Time *</label>
                                            <input type="time" name="closing_time" className="premium-input" value={formData.closing_time} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    <div className="form-section-title"><ImageIcon size={14} /> Media & Features</div>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Cover Image URL</label>
                                            <input type="url" name="image_url" className="premium-input" value={formData.image_url} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Amenities</label>
                                            <input type="text" name="amenities" className="premium-input" value={formData.amenities} onChange={handleChange} placeholder="Parking, WiFi, Cafe" />
                                        </div>
                                        <div className="form-group">
                                            <label>Facilities</label>
                                            <input type="text" name="facilities" className="premium-input" value={formData.facilities} onChange={handleChange} placeholder="Floodlights, First Aid" />
                                        </div>
                                    </div>
                                </form>

                                <footer className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" onClick={handleSubmit} className="add-turf-btn">
                                        {editingTurf ? 'Update Venue' : 'Create Venue'}
                                    </button>
                                </footer>
                            </div>
                        </div>
                    )}

                    {showMapModal && (
                        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
                            <div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}>
                                <header className="modal-header">
                                    <h2>📍 Pin Venue Location</h2>
                                    <button className="close-btn" onClick={() => setShowMapModal(false)}>
                                        <X size={20} />
                                    </button>
                                </header>
                                <div className="modal-body">
                                    <LocationPicker
                                        onLocationSelect={handleLocationSelect}
                                        initialLocation={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                                        initialAddress={formData.location}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TurfManagement;

