import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Edit, Trash2, Clock, DollarSign, Users, X, Trophy, BarChart2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import LocationPicker from '../components/LocationPicker';
import { showSuccess, showError, showConfirm } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './TurfManagement.css';


const TurfManagement = () => {
    const navigate = useNavigate();
    const [turfs, setTurfs] = useState([]);
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
        image_url: ''
    });

    useEffect(() => {
        fetchTurfs();
    }, []);

    const fetchTurfs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

            console.log('Submitting turf data:', formData);

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            console.log('Response:', data);

            if (res.ok) {
                showSuccess('Saved', 'Turf saved successfully!');
                fetchTurfs();
                resetForm();
                setShowModal(false);
            } else {
                if (res.status === 401 || res.status === 422) {
                    showError('Session Expired', 'Please login again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    showError('Error', data.message || 'Failed to save turf');
                }
            }
        } catch (error) {
            console.error('Failed to save turf:', error);
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            image_url: turf.image_url || ''
        });
        setShowModal(true);
    };


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            location: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude
        }));
        setShowMapModal(false); // Close map modal after selection
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
            image_url: ''
        });
    };

    return (
        <div className="turf-management-page">
            <Navbar />
            <div style={{ marginTop: '80px' }}></div>
            <div className="turf-management">
                <div className="tm-header">
                    <div>
                        <h2>My Turfs</h2>
                        <p>Manage your venues and availability</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="add-turf-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={20} /> Add New Turf
                        </button>
                    </div>
                </div>

                <div className="turfs-grid">
                    {turfs.length === 0 ? (
                        <div className="empty-state">
                            <MapPin size={48} color="#444" />
                            <h3>No Turfs Yet</h3>
                            <p>Create your first turf to start accepting bookings</p>
                            <button className="add-turf-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus size={20} /> Add Your First Turf
                            </button>
                        </div>
                    ) : (
                        turfs.map(turf => (
                            <div key={turf.id} className="turf-card">
                                <div className="turf-image" style={{ backgroundImage: `url(${turf.image_url || 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=500'})` }}>
                                    <span className="status-badge">{turf.status}</span>
                                </div>
                                <div className="turf-info">
                                    <h3>{turf.name}</h3>
                                    <p className="location"><MapPin size={14} /> {turf.location}</p>

                                    <div className="turf-meta">
                                        <div className="meta-item">
                                            <Clock size={16} />
                                            <span>{turf.opening_time} - {turf.closing_time}</span>
                                        </div>
                                    </div>

                                    <div className="turf-actions">
                                        <button className="manage-games-btn" onClick={() => navigate(`/manage-turfs/${turf.id}/games`)}>
                                            <Trophy size={16} /> Manage Games
                                        </button>
                                        <button className="edit-btn" onClick={() => handleEdit(turf)}>
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(turf.id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingTurf ? 'Edit Turf' : 'Add New Turf'}</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="turf-form">
                                <div className="form-group">
                                    <label>Turf Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Green Valley Arena"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Location *</label>
                                    <div className="location-input-group">
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter location or click map icon"
                                        />
                                        <button
                                            type="button"
                                            className="map-picker-btn"
                                            onClick={() => setShowMapModal(true)}
                                            title="Pick location on map"
                                        >
                                            <MapPin size={20} />
                                            Select on Map
                                        </button>
                                    </div>
                                    {formData.latitude && formData.longitude && (
                                        <small className="coordinates-display">
                                            📍 Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                        </small>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Opening Time *</label>
                                        <input
                                            type="time"
                                            name="opening_time"
                                            value={formData.opening_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Closing Time *</label>
                                        <input
                                            type="time"
                                            name="closing_time"
                                            value={formData.closing_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Amenities (comma-separated)</label>
                                    <input
                                        type="text"
                                        name="amenities"
                                        value={formData.amenities}
                                        onChange={handleChange}
                                        placeholder="e.g., Parking, WiFi, Changing Rooms"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Facilities (comma-separated)</label>
                                    <input
                                        type="text"
                                        name="facilities"
                                        value={formData.facilities}
                                        onChange={handleChange}
                                        placeholder="e.g., Floodlights, Scoreboard, First Aid"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input
                                        type="url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">
                                        {editingTurf ? 'Update Turf' : 'Create Turf'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Map Picker Modal */}
                {showMapModal && (
                    <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
                        <div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>📍 Select Turf Location</h2>
                                <button className="close-btn" onClick={() => setShowMapModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <LocationPicker
                                    onLocationSelect={handleLocationSelect}
                                    initialLocation={
                                        formData.latitude && formData.longitude
                                            ? { lat: formData.latitude, lng: formData.longitude }
                                            : null
                                    }
                                    initialAddress={formData.location}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TurfManagement;
