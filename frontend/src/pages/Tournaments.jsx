
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Calendar, MapPin, Users, Filter, Plus, Smartphone, Award, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import './Tournaments.css';

const Tournaments = () => {
    const navigate = useNavigate();
    const [selectedSport, setSelectedSport] = useState('All');
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/tournaments');
                if (res.ok) {
                    const data = await res.json();
                    setTournaments(data);
                } else {
                    throw new Error('Failed to fetch tournaments');
                }
            } catch (error) {
                console.error("Failed to fetch tournaments", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const filteredTournaments = selectedSport === 'All'
        ? tournaments
        : tournaments.filter(t => t.sport?.includes(selectedSport));

    return (
        <div className="tournaments-page">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>

            {/* Hero Section */}
            <header className="tournaments-hero">
                <div className="hero-content">
                    <div className="hero-badge"><Trophy size={16} /> The Big Leagues</div>
                    <h1>Compete. Win. <span className="highlight-text">Glory.</span></h1>
                    <p>Discover local tournaments with huge prize pools or host your own professionally.</p>

                    <div className="hero-actions">
                        <button className="primary-btn glow-effect" onClick={() => {
                            const section = document.querySelector('.tournaments-grid');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }}>Explore Tournaments</button>

                        <button className="secondary-btn" onClick={() => navigate('/host-tournament')}>
                            <Plus size={18} /> Host a Tournament
                        </button>

                        {localStorage.getItem('token') && (
                            <button className="secondary-btn" style={{ marginLeft: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid #444' }} onClick={() => navigate('/my-tournaments')}>
                                <Trophy size={18} /> My Tournaments
                            </button>
                        )}
                    </div>
                </div>
                <div className="hero-visual-3d">
                    {/* Abstract Trophy Graphic placeholder */}
                    <div className="trophy-orb"></div>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="toolbar-section">
                <div className="search-bar">
                    <Search size={20} color="#666" />
                    <input type="text" placeholder="Search tournaments by name, location..." />
                </div>

                <div className="sport-filters">
                    {['All', 'Cricket', 'Football', 'Badminton', 'Tennis'].map(sport => (
                        <button
                            key={sport}
                            className={`filter-pill ${selectedSport === sport ? 'active' : ''}`}
                            onClick={() => setSelectedSport(sport)}
                        >
                            {sport}
                        </button>
                    ))}
                </div>

                <button className="filter-btn-icon"><Filter size={20} /></button>
            </div>

            {/* Tournaments Grid */}
            <div className="tournaments-grid">
                {error && <p style={{ color: 'red', textAlign: 'center', width: '100%' }}>Error: {error}</p>}
                {loading ? <p style={{ color: 'white', textAlign: 'center', width: '100%' }}>Loading tournaments...</p> : (
                    filteredTournaments.length > 0 ? filteredTournaments.map(t => (
                        <div key={t.id} className="tournament-card">
                            <div className="card-image" style={{ backgroundImage: `url(${t.image_url})` }}>
                                <span className="sport-badge">{t.sport}</span>
                                <div className="status-badge">Open</div>
                            </div>

                            <div className="card-content">
                                <div className="card-header">
                                    <h3 className="t-name">{t.name}</h3>
                                    {/* Organizer ID might need mapping or mock for now, backend returns just ID unless joined */}
                                    <div className="organizer-row">
                                        <span className="by-label">by</span>
                                        <span className="org-name">Organizer</span>
                                    </div>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <Calendar size={14} />
                                        <span>{new Date(t.start_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <MapPin size={14} />
                                        <span>{t.location}</span>
                                    </div>
                                    <div className="info-item">
                                        <Users size={14} />
                                        <span>Max {t.max_teams} Teams</span>
                                    </div>
                                </div>

                                <div className="prize-section">
                                    <div className="prize-box">
                                        <span className="prize-label">Prize Pool</span>
                                        <span className="prize-amount">₹{t.prize_pool}</span>
                                    </div>
                                    <div className="entry-box">
                                        <span className="entry-label">Entry</span>
                                        <span className="entry-amount">₹{t.entry_fee}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="slots-bar">
                                        <div className="slots-text">
                                            <span>Slots</span>
                                            <strong>Available</strong>
                                        </div>
                                        <div className="progress-bg">
                                            <div className="progress-fill" style={{ width: '50%' }}></div>
                                        </div>
                                    </div>

                                    <div className="action-row">
                                        <button className="share-btn"><Share2 size={18} /></button>
                                        <button className="view-btn" onClick={() => navigate(`/tournaments/${t.id}`)}>View Details</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : <p style={{ color: '#888', textAlign: 'center', width: '100%' }}>No tournaments found for {selectedSport}.</p>
                )}
            </div>

            {/* Hosting Promo */}
            <section className="hosting-promo">
                <div className="promo-content">
                    <h2>Want to organize a Tournament?</h2>
                    <p>We handle venue booking, registrations, and fixtures. You focus on the game.</p>
                    <ul className="promo-features">
                        <li><CheckCircleIcon text="Auto-generated Fixtures" /></li>
                        <li><CheckCircleIcon text="Secure Payments" /></li>
                        <li><CheckCircleIcon text="Live Digital Posters" /></li>
                    </ul>
                    <button className="host-cta-btn" onClick={() => navigate('/host-tournament')}>Start Hosting</button>
                </div>
                <div className="promo-visual">
                    <Smartphone size={100} color="#333" />
                </div>
            </section>
        </div>
    );
};

const CheckCircleIcon = ({ text }) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Award size={16} color="var(--primary)" /> {text}
    </div>
);

export default Tournaments;
