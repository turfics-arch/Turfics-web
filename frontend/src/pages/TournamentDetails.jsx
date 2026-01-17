import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, Trophy, Shield, CheckCircle, Clock, Info, Megaphone, Activity, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { showSuccess, showError, showInput, showWarning } from '../utils/SwalUtils';
import html2canvas from 'html2canvas';
import { API_URL } from '../utils/api';
import './TournamentDetails.css';

import TournamentRegistrationModal from '../components/TournamentRegistrationModal';

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, matches, updates
    const [currentUser, setCurrentUser] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const posterRef = React.useRef(null);

    useEffect(() => {
        fetchTournament();
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        const phone = localStorage.getItem('phone_number'); // Assuming stored
        if (userId) {
            setCurrentUser({ id: parseInt(userId), username, phone_number: phone });
        }
    }, [id]);

    const fetchTournament = async () => {
        try {
            // Use API
            const res = await axios.get(`${API_URL}/api/tournaments/${id}`);
            setTournament(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleJoinClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showWarning('Login Required', 'Please login to join tournaments.');
            return navigate('/login');
        }
        setShowRegisterModal(true);
    };

    const handleShare = async () => {
        const element = posterRef.current;
        if (!element) return;

        try {
            // Capture the poster
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#0f172a',
                logging: false,
                useCORS: true // Important for external images
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'tournament_invite.png', { type: 'image/png' });

            const shareData = {
                title: `Join ${tournament.name} on Turfics!`,
                text: `Greetings from Turfics! 🏆\n\nI'm inviting you to check out the "${tournament.name}" tournament.\n\nDownload the Turfics app to join the action!`,
                files: [file]
            };

            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback
                const link = document.createElement('a');
                link.download = 'tournament_invite.png';
                link.href = canvas.toDataURL();
                link.click();
                showSuccess('Poster Saved', 'Image downloaded since sharing is not supported on this device.');
            }
        } catch (err) {
            console.error(err);
            showError('Share Failed', 'Could not generate share image.');
        }
    };

    if (loading) return <Loader text="Loading Tournament..." />;
    if (!tournament) return <div className="error-container">Tournament not found</div>;

    const startDate = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD';

    return (
        <div className="tournament-details-page">
            <Navbar />

            {showRegisterModal && (
                <TournamentRegistrationModal
                    tournament={tournament}
                    currentUser={currentUser}
                    onClose={() => setShowRegisterModal(false)}
                    onRegisterSuccess={() => fetchTournament()}
                />
            )}

            {/* Hidden Poster for Sharing */}
            <div className="share-poster-container" ref={posterRef}>
                <div className="poster-content" style={{ backgroundImage: `url(${tournament.image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e'})` }}>
                    <div className="poster-overlay">
                        <div className="poster-header">
                            <span className="poster-brand">TURFICS</span>
                            <span className="poster-tag">TOURNAMENT INVITE</span>
                        </div>
                        <div className="poster-body">
                            <h1>{tournament.name}</h1>
                            <div className="poster-badges">
                                <span>{tournament.sport}</span>
                                <span>{startDate}</span>
                            </div>
                            <div className="poster-prize">
                                <label>Prize Pool</label>
                                <strong>₹{tournament.prize_pool}</strong>
                            </div>
                        </div>
                        <div className="poster-footer">
                            <p>Download App to Register</p>
                            <div className="poster-cta">JOIN NOW</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <header className="td-hero" style={{ backgroundImage: `url(${tournament.image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e'})` }}>
                <div className="td-hero-content">
                    <div>
                        <div className="td-badges">
                            <span className="td-badge sport">{tournament.sport}</span>
                            {/* <span className={`td-badge status-${tournament.status.toLowerCase()}`}>{tournament.status}</span> */}
                        </div>
                        <h1>{tournament.name}</h1>
                        <div className="td-organizer">
                            <Shield size={18} />
                            Hosted by <span>{tournament.organizer_name}</span>
                        </div>
                        <div className="td-organizer" style={{ marginTop: '0.5rem' }}>
                            <MapPin size={18} />
                            <span>{tournament.location || 'Location TBD'}</span>
                        </div>
                    </div>

                    <div className="td-status-box">
                        <div className="status-info-group">
                            <span className="td-status-label">Status</span>
                            <span className={`td-status-val ${tournament.status === 'published' ? 'text-green' : 'text-gray'}`}>
                                {tournament.status === 'published' ? 'Registration Open' : (tournament.status === 'closed' ? 'Closed' : tournament.status)}
                            </span>
                        </div>

                        <div className="spots-badge">
                            <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            {tournament.registered_teams}/{tournament.max_teams} Joined
                        </div>

                        <button
                            className="share-btn-transparent"
                            onClick={handleShare}
                            title="Share Tournament"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                        >
                            <Share2 size={24} color="#fff" />
                        </button>
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
                            {tournament.matches?.length > 0 ? (
                                tournament.matches.map(m => (
                                    <div key={m.id} className="match-card-public">
                                        <div className="round-badge">{m.round}</div>
                                        <div className="match-teams-row">
                                            <div className="team t1">
                                                <span style={m.winner === m.team1 ? { color: '#ffd700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' } : {}}>
                                                    {m.winner === m.team1 && <Trophy size={14} fill="#ffd700" />}
                                                    {m.team1}
                                                </span>
                                                <span className="score">{m.score1}</span>
                                            </div>
                                            <div className="vs">VS</div>
                                            <div className="team t2">
                                                <span style={m.winner === m.team2 ? { color: '#ffd700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' } : {}}>
                                                    {m.team2}
                                                    {m.winner === m.team2 && <Trophy size={14} fill="#ffd700" />}
                                                </span>
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
                            {tournament.announcements?.length > 0 ? (
                                tournament.announcements.map(a => (
                                    <div key={a.id} className="update-card">
                                        <div className="update-icon"><Megaphone size={20} /></div>
                                        <div className="update-content">
                                            {a.title && <h4 style={{ color: 'var(--primary)', marginBottom: '0.3rem', marginTop: 0 }}>{a.title}</h4>}
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
                            <button className="join-btn-large glow-effect" onClick={handleJoinClick}>
                                Join Tournament
                            </button>
                        )}

                        {/* Show Manage Button ONLY if Current User is Organizer */}
                        {currentUser && tournament.organizer_id === currentUser.id && (
                            <button className="manage-link-btn" onClick={() => navigate(`/tournaments/${id}/manage`)}>
                                Manage Tournament (Host)
                            </button>
                        )}

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
