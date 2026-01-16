
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Search, PlusCircle, Shield, Zap, Calendar, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import { showSuccess, showError, showToast, showWarning } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './TeamFinder.css';

const TeamFinder = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('matches'); // matches, my_matches
    const [matches, setMatches] = useState([]);
    const [myActivity, setMyActivity] = useState({ hosted: [], joined: [] });

    useEffect(() => {
        if (activeTab === 'matches') fetchMatches();
        else if (activeTab === 'my_matches') fetchMyActivity();
    }, [activeTab]);

    const fetchMatches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/matches`);
            setMatches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/matches/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyActivity(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleHostMatch = () => {
        // Redirect to discovery with intent to host
        navigate('/discovery', { state: { mode: 'host_match' } });
    };

    const handleJoinMatch = async (matchId) => {
        const token = localStorage.getItem('token');
        if (!token) { showWarning('Login Required', "Please login to join matches"); return; }

        try {
            await axios.post(`${API_URL}/api/matches/${matchId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Request Sent', "Join Request Sent! Waiting for host approval.");
            fetchMatches();
        } catch (err) {
            showError('Join Failed', err.response?.data?.message || "Failed to join");
        }
    };

    const handleAction = async (reqId, action) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/api/matches/join-requests/${reqId}/action`, { action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyActivity();
        } catch (err) {
            showError('Action Failed', "Could not update request status");
        }
    };

    const handlePay = async (reqId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/api/matches/join-requests/${reqId}/pay`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Paid!', "Payment Successful!");
            fetchMyActivity();
        } catch (err) {
            showError('Payment Failed', "Could not process payment");
        }
    };

    return (
        <div className="team-finder-container">
            <Navbar />

            {/* 1. HERO SECTION */}
            <div className="tf-hero">
                <div className="tf-hero-content">
                    <h1>Find Your Squad.<br />Own the Turf.</h1>
                    <p>Join trending pick-up games or host your own match today. The field is calling.</p>
                </div>
                <button className="tf-cta-btn" onClick={handleHostMatch}>
                    <PlusCircle size={20} /> Host a Match
                </button>
            </div>

            {/* 2. CONTROLS BAR */}
            <div className="tf-controls">
                <div className="tf-tabs">
                    <button className={`tf-tab ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>Live Matches</button>
                    <button className={`tf-tab ${activeTab === 'my_matches' ? 'active' : ''}`} onClick={() => setActiveTab('my_matches')}>My Activity</button>
                </div>
            </div>

            {/* 3. CONTENT GRID */}
            <div className="tf-grid">

                {/* --- LIVE MATCHES TAB --- */}
                {activeTab === 'matches' && (
                    <>
                        {matches.length === 0 ? (
                            <div className="tf-empty">
                                <Zap size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                                <h3>No Live Matches Found</h3>
                                <p>Be the first to create one!</p>
                            </div>
                        ) : (
                            matches.map(m => (
                                <div key={m.id} className="tf-match-card">
                                    <div className="tf-match-header" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop)` }}>
                                        <div className="tf-sport-badge">{m.sport}</div>
                                    </div>
                                    <div className="tf-card-body">
                                        <h3>{m.turf_name}</h3>
                                        <div className="tf-location">
                                            <Shield size={14} /> {m.location || 'Downtown Sports Center'}
                                        </div>

                                        <div className="tf-meta-grid">
                                            <div className="tf-meta-item">
                                                <span className="tf-meta-label">Time</span>
                                                <span className="tf-meta-value">{m.time || 'Today, 6 PM'}</span>
                                            </div>
                                            <div className="tf-meta-item">
                                                <span className="tf-meta-label">Looking For</span>
                                                <span className="tf-meta-value">{m.players_needed} Players</span>
                                            </div>
                                            <div className="tf-meta-item">
                                                <span className="tf-meta-label">Entry Fee</span>
                                                <span className="tf-meta-value">${Math.round(m.cost_per_player)}</span>
                                            </div>
                                            <div className="tf-meta-item">
                                                <span className="tf-meta-label">Level</span>
                                                <span className="tf-meta-value">{m.skill_level || 'Open'}</span>
                                            </div>
                                        </div>

                                        <button className="tf-join-btn" onClick={() => handleJoinMatch(m.id)}>
                                            Request to Join
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* --- MY ACTIVITY TAB --- */}
                {activeTab === 'my_matches' && (
                    <>
                        {myActivity.hosted.length === 0 && myActivity.joined.length === 0 && (
                            <div className="tf-empty">
                                <h3>No activity yet.</h3>
                                <p>Join a game or host one to see it here.</p>
                            </div>
                        )}

                        {/* Reuse Match Card Style for Managed Matches */}
                        {myActivity.hosted.map(m => (
                            <div key={m.id} className="tf-match-card" style={{ borderColor: 'var(--tf-neon)' }}>
                                <div className="tf-match-header" style={{ backgroundImage: 'linear-gradient(45deg, #111, #222)' }}>
                                    <div className="tf-sport-badge" style={{ background: 'var(--tf-neon)', color: 'black' }}>HOSTING</div>
                                </div>
                                <div className="tf-card-body">
                                    <h3>{m.sport} at {m.turf_name}</h3>
                                    <div className="tf-location">Status: {m.status}</div>

                                    <div className="tf-meta-grid">
                                        <div className="tf-meta-item">
                                            <span className="tf-meta-label">Requests</span>
                                            <span className="tf-meta-value">{m.join_requests_count} Pending</span>
                                        </div>
                                        <div className="tf-meta-item">
                                            <span className="tf-meta-label">Needed</span>
                                            <span className="tf-meta-value">{m.players_needed}</span>
                                        </div>
                                    </div>

                                    {/* Requests Mini-List */}
                                    {m.requests && m.requests.length > 0 && (
                                        <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                            {m.requests.map(req => (
                                                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                    <span>{req.user_name}</span>
                                                    <div>
                                                        {req.status === 'pending' ? (
                                                            <>
                                                                <button onClick={() => handleAction(req.id, 'approve')} style={{ color: 'var(--tf-neon)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px' }}>Accept</button>
                                                                <button onClick={() => handleAction(req.id, 'reject')} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Deny</button>
                                                            </>
                                                        ) : <span style={{ color: '#888' }}>{req.status}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button className="tf-join-btn" disabled style={{ opacity: 0.7 }}>Manage Match</button>
                                </div>
                            </div>
                        ))}
                    </>
                )}

            </div>
        </div>
    );
};

export default TeamFinder;
