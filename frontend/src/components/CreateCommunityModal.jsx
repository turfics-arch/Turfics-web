import React, { useState } from 'react';
import { X, Upload, Globe, Lock } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';
import './CreateCommunityModal.css';

const CreateCommunityModal = ({ onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'public',
        image_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/communities`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onCreated(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create community');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content community-modal">
                <div className="modal-header">
                    <h2>Create Community</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="community-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Community Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Weekend Footballers"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            required
                            placeholder="What is this community about?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Image URL</label>
                        <div className="input-with-icon">
                            <Upload size={18} />
                            <input
                                type="text"
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Privacy Type</label>
                        <div className="type-options">
                            <label className={`type-option ${formData.type === 'public' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="public"
                                    checked={formData.type === 'public'}
                                    onChange={e => setFormData({ ...formData, type: 'public' })}
                                />
                                <div className="type-icon"><Globe size={20} /></div>
                                <div className="type-info">
                                    <strong>Public</strong>
                                    <span>Anyone can search and join</span>
                                </div>
                            </label>

                            <label className={`type-option ${formData.type === 'private' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="private"
                                    checked={formData.type === 'private'}
                                    onChange={e => setFormData({ ...formData, type: 'private' })}
                                />
                                <div className="type-icon"><Lock size={20} /></div>
                                <div className="type-info">
                                    <strong>Private</strong>
                                    <span>Invite only, admin approval required</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                        <button type="submit" className="create-submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;
