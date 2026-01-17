
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Calendar, MapPin, Users, Filter, Plus, Smartphone, Award, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { API_URL } from '../utils/api';

import './Tournaments.css';

const Tournaments = () => {
    const navigate = useNavigate();
    const [selectedSport, setSelectedSport] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        date: '',
        host: '',
        turf: '',
        city: ''
    });

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch(`${API_URL}/api/tournaments`);
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

    const handleShare = async (tournament) => {
        const url = `${window.location.origin}/tournaments/${tournament.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tournament.name,
                    text: `Check out ${tournament.name} on Turfics!`,
                    url: url
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert('Tournament link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        const matchesSport = selectedSport === 'All' || t.sport?.includes(selectedSport);
        const matchesSearch = (t.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (t.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        // Advanced Filters
        const matchesDate = !advancedFilters.date || (t.start_date && t.start_date.startsWith(advancedFilters.date));
        // Note: Backend might need to send host/organizer name. Assuming 'Organizer' for now or t.organizer if available.
        const matchesHost = !advancedFilters.host || (t.organizer_name?.toLowerCase() || 'organizer').includes(advancedFilters.host.toLowerCase());
        const matchesTurf = !advancedFilters.turf || (t.location?.toLowerCase() || '').includes(advancedFilters.turf.toLowerCase());
        const matchesCity = !advancedFilters.city || (t.location?.toLowerCase() || '').includes(advancedFilters.city.toLowerCase());

        return matchesSport && matchesSearch && matchesDate && matchesHost && matchesTurf && matchesCity;
    });

    return (
        <div className="tournaments-page">
            <Navbar />

            {/* Hero Section */}
            {/* Hero Section */}
            <header className="tournaments-hero">
                <div className="hero-content">
                    <div className="hero-badge"><Trophy size={16} /> The Big Leagues</div>
                    <h1>Compete. Win. <span className="highlight-text">Glory.</span></h1>
                    <p>Discover local tournaments with huge prize pools or host your own professionally.</p>

                    <div className="hero-actions">
                        <button className="tab-pill active" onClick={() => {
                            const section = document.querySelector('.tournaments-grid');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }}>Explore Tournaments</button>

                        <button className="tab-pill" onClick={() => navigate('/host-tournament')}>
                            Host a Tournament
                        </button>

                        {localStorage.getItem('token') && (
                            <button className="tab-pill" onClick={() => navigate('/my-tournaments')}>
                                My Tournaments
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="toolbar-section">
                <div className="mobile-search-container">
                    <div className="search-bar">
                        <Search size={20} color="#666" />
                        <input
                            type="text"
                            placeholder="Search tournaments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="filter-btn-icon" onClick={() => setShowFilters(true)}><Filter size={20} /></button>
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
            </div>

            {/* Advanced Filter Modal */}
            {showFilters && (
                <div className="filter-modal-overlay" onClick={() => setShowFilters(false)}>
                    <div className="filter-modal" onClick={e => e.stopPropagation()}>
                        <h3>Advanced Filters</h3>

                        <div className="filter-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={advancedFilters.date}
                                onChange={e => setAdvancedFilters({ ...advancedFilters, date: e.target.value })}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Host (Organizer)</label>
                            <input
                                type="text"
                                placeholder="Enter organizer name"
                                value={advancedFilters.host}
                                onChange={e => setAdvancedFilters({ ...advancedFilters, host: e.target.value })}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Turf (Venue)</label>
                            <input
                                type="text"
                                placeholder="Enter turf name"
                                value={advancedFilters.turf}
                                onChange={e => setAdvancedFilters({ ...advancedFilters, turf: e.target.value })}
                            />
                        </div>

                        <div className="filter-group">
                            <label>City</label>
                            <input
                                type="text"
                                placeholder="Enter city"
                                value={advancedFilters.city}
                                onChange={e => setAdvancedFilters({ ...advancedFilters, city: e.target.value })}
                            />
                        </div>

                        <div className="filter-actions">
                            <button className="reset-btn" onClick={() => setAdvancedFilters({ date: '', host: '', turf: '', city: '' })}>Reset</button>
                            <button className="apply-btn" onClick={() => setShowFilters(false)}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tournaments Grid */}
            <div className="tournaments-grid">
                {error && <p style={{ color: 'red', textAlign: 'center', width: '100%' }}>Error: {error}</p>}
                {loading ? <Loader text="Scouting Tournaments..." /> : (
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

                                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div className="action-row" style={{ marginBottom: 0 }}>
                                        <button className="view-btn" onClick={() => navigate(`/tournaments/${t.id}`)}>View Details</button>
                                        <button
                                            className="share-btn-transparent"
                                            onClick={() => handleShare(t)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', transform: 'translateY(8px)' }}
                                        >
                                            <Share2 size={20} color="#888" />
                                        </button>
                                    </div>

                                    <div className="slots-bar" style={{ marginBottom: 0, width: '120px' }}>
                                        <div className="slots-text">
                                            <span>Slots</span>
                                            <strong>{Math.max(0, (t.max_teams || 0) - (t.registered_teams || 0))} Left</strong>
                                        </div>
                                        <div className="progress-bg">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, ((t.registered_teams || 0) / (t.max_teams || 1)) * 100))}%`
                                                }}
                                            ></div>
                                        </div>
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
