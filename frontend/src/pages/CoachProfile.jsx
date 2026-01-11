
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Video, Calendar, Clock, ArrowLeft, Shield, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import API_URL from '../config';
import './CoachProfile.css';

const CoachProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [coach, setCoach] = useState(null);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingType, setBookingType] = useState('online');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Coach Profile
                const cRes = await fetch(`${API_URL}/api/coaches/${id}`);
                if (cRes.ok) {
                    setCoach(await cRes.json());
                }

                // Fetch Batches
                const bRes = await fetch(`${API_URL}/api/coaches/${id}/batches`);
                if (bRes.ok) {
                    setBatches(await bRes.json());
                }
            } catch (error) {
                console.error("Error fetching coach data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleJoinBatch = async (batch) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to join a batch");
            navigate('/login');
            return;
        }

        if (window.confirm(`Confirm enrollment for ${batch.name} at ₹${batch.price_per_month}/mo?`)) {
            try {
                const res = await fetch(`${API_URL}/api/bookings/coach`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        coach_id: coach.id,
                        batch_id: batch.id,
                        notes: `Enrolled in ${batch.name}`
                    })
                });

                if (res.ok) {
                    alert("Enrollment Request Sent! Coach will confirm shortly.");
                } else {
                    alert("Failed to enroll.");
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <div className="loading-screen">Loading Profile...</div>;
    if (!coach) return <div className="loading-screen">Coach not found</div>;

    return (
        <div className="profile-container">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back to Coaches
            </button>

            <div className="profile-header-card">
                <div className="profile-image-section">
                    <img src={coach.image || "https://images.unsplash.com/photo-1566932769119-7a1a2b72cb5e?q=80&w=600"} alt={coach.name} className="profile-img" />
                    <div className="verified-status">
                        <CheckCircle size={16} fill="var(--primary)" color="black" /> Verified Coach
                    </div>
                </div>

                <div className="profile-info-section">
                    <div className="profile-top-row">
                        <span className="sport-badge">{coach.specialization}</span>
                        <div className="rating-box">
                            <Star size={16} fill="#FFD700" color="#FFD700" />
                            <span>{coach.rating || 4.8} (24 reviews)</span>
                        </div>
                    </div>

                    <h1 className="coach-name">{coach.name}</h1>
                    <p className="coach-title">{coach.title || 'Professional Coach'}</p>

                    <div className="quick-stats">
                        <div className="stat">Experience: <strong>{coach.experience || 5} Years</strong></div>
                        <div className="stat">Students: <strong>100+ Trained</strong></div>
                    </div>

                    <div className="tags-section">
                        <span className="tag">{coach.specialization}</span>
                        <span className="tag">Fitness</span>
                        <span className="tag">Technique</span>
                    </div>
                </div>
            </div>

            <div className="profile-layout">
                {/* Left Column: About, Batches & Reviews */}
                <div className="profile-main">
                    <section className="section-card">
                        <h2>About Coach</h2>
                        <p className="bio-text">{coach.bio || 'No bio available.'}</p>
                        <p><strong>Availability:</strong> {coach.availability}</p>
                    </section>

                    {/* BATCHES SECTION */}
                    {batches.length > 0 && (
                        <section className="section-card">
                            <h2>Training Batches (Group Classes)</h2>
                            <div className="batches-list">
                                {batches.map(batch => (
                                    <div key={batch.id} className="batch-card-pub">
                                        <div className="batch-info">
                                            <h4>{batch.name}</h4>
                                            {batch.description && <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem', fontStyle: 'italic', display: 'block' }}>{batch.description}</p>}
                                            <p><Calendar size={14} /> {batch.days} • <Clock size={14} /> {batch.start_time} - {batch.end_time}</p>
                                        </div>
                                        <div className="batch-action">
                                            <span className="batch-price">₹{batch.price_per_month}<small>/mo</small></span>
                                            <button className="join-btn" onClick={() => handleJoinBatch(batch)}>Join Batch</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="section-card">
                        <h2>Reviews</h2>
                        <div className="review-item">
                            <div className="reviewer-header">
                                <strong>User Review</strong>
                                <div className="stars"><Star size={12} fill="#FFD700" /> 5.0</div>
                            </div>
                            <p>"Great coach! Really helped improve my game."</p>
                        </div>
                    </section>
                </div>

                {/* Right Column: Booking Widget for 1-on-1 */}
                <aside className="booking-sidebar">
                    <div className="booking-card">
                        <h3>Book 1-on-1 Session</h3>

                        <div className="booking-tabs">
                            <button className={bookingType === 'online' ? 'active' : ''} onClick={() => setBookingType('online')}>Standard</button>
                        </div>

                        <div className="price-display">
                            <span className="currency">₹</span>
                            <span className="amount">{coach.price_per_session}</span>
                            <span className="unit">/session</span>
                        </div>

                        <div className="features-list">
                            <li><Users size={14} /> Personal Attention</li>
                            <li><Clock size={14} /> 60 Minutes</li>
                            <li><MapPin size={14} /> {coach.location}</li>
                        </div>

                        <button
                            className="book-btn glow-effect"
                            onClick={() => {
                                // For 1-on-1, maybe navigate to a schedule picker or just quick book
                                // Keeping it simple for now -> Direct book or alert
                                alert("1-on-1 Booking feature coming next! Use Batches for now.");
                            }}
                        >
                            Book Session
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CoachProfile;
