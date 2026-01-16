import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import './MyTournaments.css';

const MyTournaments = () => {
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMyRegistrations();
    }, []);

    const fetchMyRegistrations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tournaments/my-registrations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistrations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load your tournaments.');
            setLoading(false);
        }
    };

    return (
        <div className="my-tournaments-page">
            <Navbar />
            <div className="mt-header">
                <div className="mt-content-wrapper">
                    <h1>My Tournaments</h1>
                    <p style={{ color: '#aaa' }}>Track your team's progress and upcoming matches.</p>
                </div>
            </div>

            <div className="mt-content">
                {loading && <p>Loading...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && registrations.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
                        <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No tournaments joined yet.</h3>
                        <button
                            onClick={() => navigate('/tournaments')}
                            style={{
                                marginTop: '1rem',
                                padding: '0.8rem 1.5rem',
                                background: 'var(--primary)',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                            Find Tournaments
                        </button>
                    </div>
                )}

                <div className="mt-grid">
                    {registrations.map(reg => (
                        <div key={reg.registration_id} className="mt-card">
                            <img src={reg.tournament.image_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500'} alt="Tournament" className="mt-image" />

                            <div className="mt-info">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span className={`mt-status-badge ${reg.status || 'pending'}`}>
                                            {reg.status || 'Pending'}
                                        </span>
                                        <h3 className="mt-title">{reg.tournament.name}</h3>
                                        <div className="mt-meta">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={14} /> {reg.tournament.start_date || 'TBA'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <MapPin size={14} /> {reg.tournament.location}
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                <div className="mt-team-info">
                                    <div>
                                        <span style={{ color: '#666', fontSize: '0.85rem' }}>Registered as:</span>
                                        <div className="mt-team-name">{reg.team_name}</div>
                                    </div>
                                    <button className="view-btn-small" onClick={() => navigate(`/tournaments/${reg.tournament.id}`)}>
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyTournaments;
