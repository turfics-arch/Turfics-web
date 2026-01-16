
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Video, Users, Calendar, Clock, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import './Trainers.css';

const Trainers = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('coaches'); // 'coaches' or 'academies'
    const [coaches, setCoaches] = useState([]);
    const [academies, setAcademies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coachRes, academyRes] = await Promise.all([
                    fetch('http://localhost:5000/api/coaches'),
                    fetch('http://localhost:5000/api/academies')
                ]);

                if (coachRes.ok) {
                    const data = await coachRes.json();
                    setCoaches(data);
                } else {
                    throw new Error('Failed to fetch coaches');
                }

                if (academyRes.ok) {
                    const data = await academyRes.json();
                    setAcademies(data);
                }
            } catch (error) {
                console.error("Failed to fetch trainers data", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="trainers-page">
            <Navbar />
            {/* Header Hero */}
            <header className="trainers-hero">
                <div className="hero-content">
                    <h1>Coach & Academy Booking</h1>
                    <p className="subtitle">Train with certified coaches — online, offline, or through academies.</p>
                </div>
            </header>

            {/* Tab Navigation */}
            {/* Tab Navigation */}
            <div className="toolbar-container">
                <div className="trainers-toolbar">
                    <button
                        className={`tab-btn ${activeTab === 'coaches' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coaches')}
                    >
                        Personal Coaches
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'academies' ? 'active' : ''}`}
                        onClick={() => setActiveTab('academies')}
                    >
                        Academies
                    </button>
                </div>
            </div>

            <div className="trainers-content">
                {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}
                {loading ? <p style={{ color: 'white', textAlign: 'center' }}>Loading professionals...</p> : (
                    <>
                        {activeTab === 'coaches' ? (
                            <div className="coach-grid">
                                {coaches.map(coach => (
                                    <div key={coach.id} className="coach-card">
                                        <div className="card-header">
                                            <img src={coach.image_url} alt={coach.name} className="coach-img" />
                                            <div className="verified-badge"><CheckCircle size={14} /> Verified</div>
                                        </div>
                                        <div className="card-body">
                                            <div className="coach-meta">
                                                <span className="sport-tag">{coach.specialization}</span>
                                                <div className="rating">
                                                    <Star size={14} fill="#FFD700" color="#FFD700" /> {coach.rating}
                                                </div>
                                            </div>
                                            <h3 className="coach-name">{coach.name}</h3>
                                            <p className="experience">{coach.experience} Years Experience</p>

                                            <div className="card-footer">
                                                <div className="price-info">
                                                    <span className="label">Starts at</span>
                                                    <span className="price">₹{coach.price_per_session}<small>/session</small></span>
                                                </div>
                                                <button className="view-profile-btn" onClick={() => navigate(`/coaches/${coach.id}`)}>
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="academy-grid">
                                {academies.map(academy => (
                                    <div key={academy.id} className="academy-card">
                                        <img src={academy.image_url} alt={academy.name} className="academy-img" />
                                        <div className="academy-info">
                                            <div className="academy-header">
                                                <h3>{academy.name}</h3>
                                                <span className="rating"><Star size={14} fill="white" /> {academy.rating}</span>
                                            </div>
                                            <p className="location"><MapPin size={14} /> {academy.location}</p>

                                            <div className="batches-row">
                                                <span className="batch-tag">{academy.sports}</span>
                                            </div>
                                            <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0.5rem 0' }}>{academy.description}</p>

                                            <button className="enroll-btn" onClick={() => navigate(`/academies/${academy.id}`)}>
                                                View Programs
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Trainers;
