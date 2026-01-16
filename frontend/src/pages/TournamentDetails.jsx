import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, Trophy, Shield, CheckCircle, Clock, Info, Megaphone, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import { showSuccess, showError, showInput, showWarning } from '../utils/SwalUtils';
import './TournamentDetails.css';

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, matches, updates

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const fetchTournament = async () => {
        try {
            // Use API
            const res = await axios.get(`http://localhost:5000/api/tournaments/${id}`);
            setTournament(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        // Simple registration Flow
        const result = await showInput("Register Team", "Enter your Team Name:", "e.g. Thunder Strikers");
        if (!result.isConfirmed || !result.value) return;

        const teamName = result.value;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showWarning('Login Required', 'Please login to join tournaments.');
                return navigate('/login');
            }

            await axios.post(`http://localhost:5000/api/tournaments/${id}/register`,
                { team_name: teamName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showSuccess('Registered Successfully!', `Team ${teamName} has been registered.`);
            fetchTournament(); // Refresh
        } catch (err) {
            showError('Registration Failed', err.response?.data?.message || 'Registration failed');
        }
    };

    if (loading) return <div className="loading-container">Loading Tournament...</div>;
    if (!tournament) return <div className="error-container">Tournament not found</div>;

    const startDate = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD';

    return (
        <div className="tournament-details-page">
            <Navbar />

            {/* Hero */}
            <header className="td-hero" style={{ backgroundImage: `url(${tournament.image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e'})` }}>
                <div className="td-hero-content">
                    <div className="td-main-info">
                        <div className="td-badges">
                            <span className="td-badge sport">{tournament.sport}</span>
                            <span className={`td-badge status-${tournament.status}`}>{tournament.status}</span>
                        </div>
                        <h1>{tournament.name}</h1>
                        <div className="td-organizer">
                            {/* Organizer Name would need an API update to include username */}
                        </div>
                    </div>

                    <div className="td-status-box">
                        <div>
                            <span className="td-status-label">Status</span>
                            <span className="td-status-val">{tournament.status}</span>
                            <span className="td-spots">{tournament.registered_teams}/{tournament.max_teams || '∞'} Teams Joined</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="td-nav">
                <button className={`td-nav-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Information</button>
                <button className={`td-nav-btn ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>Matches & Bracket</button>
                <button className={`td-nav-btn ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>Announcements</button>
            </div>

            <div className="td-layout">
                {/* Left Content */}
                <main>
                    {activeTab === 'info' && (
                        <>
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon"><Calendar /></div>
                                    <div className="stat-info">
                                        <span>Start Date</span>
                                        <strong>{startDate}</strong>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><MapPin /></div>
                                    <div className="stat-info">
                                        <span>Venue</span>
                                        <strong>{tournament.location || 'N/A'}</strong>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><Users /></div>
                                    <div className="stat-info">
                                        <span>Prize Pool</span>
                                        <strong>₹{tournament.prize_pool}</strong>
                                    </div>
                                </div>
                            </div>

                            <section className="td-section">
                                <h2>About</h2>
                                <p style={{ lineHeight: '1.6', color: '#ccc' }}>{tournament.description || 'No description provided.'}</p>
                            </section>

                            <section className="td-section">
                                <h2>Rules</h2>
                                <p style={{ whiteSpace: 'pre-line', color: '#ccc' }}>{tournament.rules || 'Standard rules apply.'}</p>
                            </section>
                        </>
                    )}

                    {activeTab === 'matches' && (
                        <div className="matches-list">
                            {tournament.matches && tournament.matches.length > 0 ? (
                                tournament.matches.map(m => (
                                    <div key={m.id} className="match-card-public">
                                        <div className="round-badge">{m.round}</div>
                                        <div className="match-teams-row">
                                            <div className="team t1">
                                                <span>{m.team1}</span>
                                                <span className="score">{m.score1}</span>
                                            </div>
                                            <div className="vs">VS</div>
                                            <div className="team t2">
                                                <span>{m.team2}</span>
                                                <span className="score">{m.score2}</span>
                                            </div>
                                        </div>
                                        <div className="match-meta">
                                            <span className={`status-dot ${m.status}`}></span> {m.status} • {m.time}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <Activity size={40} />
                                    <p>No matches scheduled yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="updates-list">
                            {tournament.announcements && tournament.announcements.length > 0 ? (
                                tournament.announcements.map(a => (
                                    <div key={a.id} className="update-card">
                                        <div className="update-icon"><Megaphone size={20} /></div>
                                        <div className="update-content">
                                            <p>{a.content}</p>
                                            <small>{a.created_at}</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <Megaphone size={40} />
                                    <p>No announcements yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <aside>
                    <div className="td-sidebar-card">
                        <h3>Registration</h3>

                        <div className="fee-row">
                            <span className="fee-label">Entry Fee</span>
                            <span className="fee-val">₹{tournament.entry_fee}</span>
                        </div>

                        {tournament.status !== 'completed' && (
                            <button className="join-btn-large glow-effect" onClick={handleJoin}>
                                Join Tournament
                            </button>
                        )}

                        {/* If user is owner, show Manage Button */}
                        {/* In a real app, compare organizer_id with current user id from token */}
                        <button className="manage-link-btn" onClick={() => navigate(`/tournaments/${id}/manage`)}>
                            Manage Tournament (Host)
                        </button>

                        <span className="secure-badge">
                            <CheckCircle size={14} /> Team Spot Guaranteed
                        </span>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TournamentDetails;
