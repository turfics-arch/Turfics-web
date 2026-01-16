import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Clock, Calendar, ChevronRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import { showSuccess, showError, showConfirm } from '../utils/SwalUtils';
import './AcademyProfile.css';

const AcademyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [academy, setAcademy] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [activeSport, setActiveSport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Academy Details
                const accRes = await fetch(`http://localhost:5000/api/academies/${id}`);
                if (accRes.ok) {
                    const accData = await accRes.json();
                    // Inject mock facilities if missing
                    if (!accData.facilities) accData.facilities = ["Changing Rooms", "Washrooms", "Drinking Water"];
                    setAcademy(accData);
                }

                // Fetch Programs
                const progRes = await fetch(`http://localhost:5000/api/academies/${id}/programs`);
                if (progRes.ok) {
                    const progData = await progRes.json();
                    setPrograms(progData);
                    if (progData.length > 0) setActiveSport(progData[0].sport);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleEnroll = async (batchId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const confirmed = await showConfirm('Confirm Enrollment', "Confirm enrollment request for this batch?");
        if (!confirmed) return;

        try {
            const res = await fetch('http://localhost:5000/api/academies/enroll', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ batch_id: batchId, notes: "I am interested in joining." })
            });

            if (res.ok) {
                showSuccess('Request Sent', "Enrollment request submitted! The academy will contact you.");
            } else {
                const err = await res.json();
                showError('Enrollment Failed', err.message || "Enrollment failed");
            }
        } catch (error) {
            console.error(error);
            showError('Error', "Something went wrong");
        }
    };

    if (loading) return <div className="loading-screen">Loading Academy...</div>;
    if (!academy) return <div className="loading-screen">Academy Not Found</div>;

    const currentProgram = programs.find(p => p.sport === activeSport);

    return (
        <div className="academy-page">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>
            <button className="back-link-simple" onClick={() => navigate(-1)}>
                &larr; Back
            </button>

            {/* Hero Section */}
            <div className="academy-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${academy.image_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200'})` }}>
                <div className="academy-hero-content">
                    {/* Placeholder Logo if none */}
                    <div className="academy-logo" style={{ background: 'white', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                        {academy.name.charAt(0)}
                    </div>
                    <div>
                        <h1>{academy.name}</h1>
                        <p className="location-row"><MapPin size={16} /> {academy.location}</p>
                        <div className="rating-row">
                            <span className="rating-pill"><Star size={14} fill="white" /> {academy.rating || 'New'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="academy-layout">
                {/* Main Content */}
                <div className="academy-main">
                    <section className="info-section">
                        <h2>About the Academy</h2>
                        <p>{academy.description}</p>
                        <div className="facilities-grid">
                            {['Changing Rooms', 'Drinking Water', 'Parking', 'Equipment'].map(fac => (
                                <span key={fac} className="facility-pill"><CheckCircle size={14} /> {fac}</span>
                            ))}
                        </div>
                    </section>

                    <section className="programs-section">
                        <h2>Our Programs</h2>

                        {programs.length === 0 ? (
                            <p>No programs listed yet.</p>
                        ) : (
                            <>
                                {/* Sport Selector Tabs */}
                                <div className="sport-tabs">
                                    {programs.map(p => (
                                        <button
                                            key={p.id}
                                            className={`sport-tab ${activeSport === p.sport ? 'active' : ''}`}
                                            onClick={() => setActiveSport(p.sport)}
                                        >
                                            {p.sport}
                                        </button>
                                    ))}
                                </div>

                                {/* Selected Program Details */}
                                {currentProgram && (
                                    <div className="program-details fade-in">
                                        <p className="program-desc">{currentProgram.description}</p>

                                        {/* Coach Context */
                                            currentProgram.head_coach && (
                                                <div className="program-coach-card" onClick={() => navigate(`/coaches/${currentProgram.head_coach.id}`)}>
                                                    <div className="coach-info-left">
                                                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>
                                                            {currentProgram.head_coach.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="coach-label">Head Coach</span>
                                                            <h4>{currentProgram.head_coach.name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="coach-action">
                                                        <span>View Profile</span>
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>
                                            )}

                                        <h3>Select a Batch</h3>
                                        <div className="batches-list">
                                            {currentProgram.batches.length === 0 ? (
                                                <p style={{ color: '#888' }}>No batches available currently.</p>
                                            ) : (
                                                currentProgram.batches.map((batch) => (
                                                    <div key={batch.id} className="batch-card">
                                                        <div className="batch-info">
                                                            <h4>{batch.name} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#888', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{batch.age_group}</span></h4>
                                                            <div className="batch-meta">
                                                                <span><Clock size={14} /> {batch.start_time} - {batch.end_time}</span>
                                                                <span><Calendar size={14} /> {batch.days}</span>
                                                            </div>
                                                        </div>
                                                        <div className="batch-action">
                                                            <span className="price">₹{batch.price_per_month}<small>/mo</small></span>
                                                            <button className="enroll-btn-small" onClick={() => handleEnroll(batch.id)}>
                                                                Book Trial / Enroll
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="academy-sidebar">
                    <div className="contact-card">
                        <h3>Contact Info</h3>
                        <p>Have questions about enrollment?</p>
                        <button className="primary-btn-full">Call Now</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademyProfile;
