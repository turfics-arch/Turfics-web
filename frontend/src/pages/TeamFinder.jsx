
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Search, PlusCircle, Shield, Zap, Calendar, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import './TeamFinder.css';

const TeamFinder = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('matches'); // matches, teams, my_matches
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [myActivity, setMyActivity] = useState({ hosted: [], joined: [] });
    const [filter, setFilter] = useState('All');

    // Existing Team State
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', skill_required: 'Beginner' });

    useEffect(() => {
        if (activeTab === 'matches') fetchMatches();
        else if (activeTab === 'teams') fetchTeams();
        else if (activeTab === 'my_matches') fetchMyActivity();
    }, [activeTab, filter]);

    const fetchMatches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/matches');
            setMatches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/matches/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyActivity(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/teams?skill=${filter}`);
            setTeams(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleHostMatch = () => {
        // Redirect to discovery with intent to host
        // We will read this 'mode' in BookingConfirmation to prompt match creation
        // But for now, just sending them to book is the first step.
        navigate('/discovery', { state: { mode: 'host_match' } });
    };

    const handleJoinMatch = async (matchId) => {
        const token = localStorage.getItem('token');
        if (!token) { alert("Please login"); return; }

        try {
            await axios.post(`http://localhost:5000/api/matches/${matchId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Join Request Sent! Waiting for host approval.");
            fetchMatches();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to join");
        }
    };

    const handleAction = async (reqId, action) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://localhost:5000/api/matches/join-requests/${reqId}/action`, { action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyActivity();
        } catch (err) {
            alert("Action failed");
        }
    };

    const handlePay = async (reqId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://localhost:5000/api/matches/join-requests/${reqId}/pay`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Payment Successful!");
            fetchMyActivity();
        } catch (err) {
            alert("Payment failed");
        }
    };

    // ... Existing Team functions (handleCreateTeam, handleJoinTeam) ...
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/teams/create', newTeam, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateTeamModal(false);
            fetchTeams();
            alert("Team Created Successfully!");
        } catch (err) {
            alert("Failed to create team");
        }
    };

    const handleJoinTeam = async (teamId, type) => { /* logic */ };

    return (
        <div className="team-finder-container">
            <Navbar />
            <div className="team-finder-content" style={{ marginTop: '80px' }}>
                <header className="page-header">
                    <div>
                        <h2>Find a Game</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Host a match, join a squad, or find a team.</p>
                    </div>
                    {activeTab === 'matches' ? (
                        <button className="primary-btn" onClick={handleHostMatch}>
                            <PlusCircle size={20} /> Host a Match
                        </button>
                    ) : activeTab === 'teams' ? (
                        <button className="primary-btn" onClick={() => setShowCreateTeamModal(true)}>
                            <PlusCircle size={20} /> Create Team
                        </button>
                    ) : null}
                </header>

                <div className="tabs-container" style={{ margin: '20px 2rem', display: 'flex', gap: '15px' }}>
                    <button className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>Pick-up Matches</button>
                    <button className={`tab-btn ${activeTab === 'my_matches' ? 'active' : ''}`} onClick={() => setActiveTab('my_matches')}>My Activity</button>
                    <button className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>Teams</button>
                </div>

                {activeTab === 'my_matches' && (
                    <div style={{ padding: '0 2rem' }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Hosted Matches</h3>
                        <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                            {myActivity.hosted.length === 0 ? <p style={{ color: '#666' }}>No matches hosted.</p> :
                                myActivity.hosted.map(m => (
                                    <div key={m.id} className="match-card glass-panel" style={{ padding: '20px', borderRadius: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h4>{m.sport} at {m.turf_name}</h4>
                                            <span className={`status-badge ${m.status}`}>{m.status}</span>
                                        </div>
                                        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Needs {m.players_needed} players | {m.join_requests_count} Requests</p>

                                        <div className="requests-list" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                            <h5 style={{ marginBottom: '10px', color: '#ccc' }}>Requests</h5>
                                            {m.requests && m.requests.length > 0 ? (
                                                m.requests.map(req => (
                                                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{req.user_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{req.user_skill}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                            {req.status === 'pending' ? (
                                                                <>
                                                                    <button onClick={() => handleAction(req.id, 'approve')} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black' }}>
                                                                        <Check size={14} />
                                                                    </button>
                                                                    <button onClick={() => handleAction(req.id, 'reject')} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                                                                        <PlusCircle size={14} style={{ transform: 'rotate(45deg)' }} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: '0.8rem', color: req.status === 'approved' || req.status === 'paid' ? 'var(--primary)' : '#888', fontWeight: 'bold' }}>
                                                                    {req.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>No requests yet.</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Joined Matches</h3>
                        <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {myActivity.joined.length === 0 ? <p style={{ color: '#666' }}>No matches joined.</p> :
                                myActivity.joined.map(j => (
                                    <div key={j.id} className="match-card glass-panel" style={{ padding: '20px', borderRadius: '15px' }}>
                                        <h4>{j.sport} at {j.turf_name}</h4>
                                        <div style={{ margin: '10px 0' }}>
                                            Status: <span style={{ color: j.status === 'approved' || j.status === 'paid' ? 'var(--primary)' : 'orange', fontWeight: 'bold' }}>{j.status.toUpperCase()}</span>
                                        </div>

                                        {j.status === 'approved' && (
                                            <button className="primary-btn" style={{ width: '100%' }} onClick={() => handlePay(j.id)}>
                                                Pay Now & Confirm
                                            </button>
                                        )}
                                        {j.status === 'paid' && (
                                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center' }}>
                                                <Check size={20} style={{ verticalAlign: 'middle' }} /> Confirmed
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '0 2rem' }}>
                        {matches.length === 0 ? (
                            <div className="empty-state">No active matches found. Be the first to host one!</div>
                        ) : (
                            matches.map(m => (
                                <div key={m.id} className="match-card glass-panel" style={{ padding: '20px', borderRadius: '15px', position: 'relative' }}>
                                    <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span className="sport-badge">{m.sport}</span>
                                        <span className="time-badge">{m.time}</span>
                                    </div>
                                    <h3>{m.turf_name}</h3>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>{m.location}</p>

                                    <div className="match-details" style={{ margin: '15px 0' }}>
                                        <div className="detail-row"><span>Creator:</span> <strong>{m.creator_name}</strong></div>
                                        <div className="detail-row"><span>Looking for:</span> <strong>{m.players_needed} Players</strong></div>
                                        <div className="detail-row"><span>Cost per person:</span> <strong>${Math.round(m.cost_per_player)}</strong></div>
                                        <div className="detail-row"><span>Gender:</span> <strong>{m.gender_preference}</strong></div>
                                    </div>

                                    <button className="join-match-btn primary-btn" style={{ width: '100%' }} onClick={() => handleJoinMatch(m.id)}>
                                        Request to Join
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}


                {activeTab === 'teams' && (
                    <>
                        {/* Smart Filters */}
                        <div className="filters-bar glass-panel">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                                <button key={level} className={`filter-pill ${filter === level ? 'active' : ''}`} onClick={() => setFilter(level)}>{level}</button>
                            ))}
                        </div>

                        {/* Team Grid (Existing Logic) */}
                        <div className="teams-grid">
                            {teams.map(team => (
                                <div key={team.id} className="team-card glass-panel">
                                    <div className="team-header">
                                        <div className="team-avatar"><Users size={24} /></div>
                                        <div className="team-info">
                                            <h3>{team.name}</h3>
                                            <span className={`skill-badge ${team.skill_required.toLowerCase()}`}>{team.skill_required}</span>
                                        </div>
                                    </div>
                                    <p className="team-desc">{team.description}</p>
                                    <div className="team-stats"><span>{team.members_count || 0} Members</span><span>Active now</span></div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Create Team Modal */}
                {showCreateTeamModal && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-panel">
                            <h3>Create New Team</h3>
                            <form onSubmit={handleCreateTeam}>
                                <div className="form-group">
                                    <label>Team Name</label>
                                    <input type="text" required value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} />
                                </div>
                                {/* ... other fields ... */}
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowCreateTeamModal(false)}>Cancel</button>
                                    <button type="submit" className="primary-btn">Create Team</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamFinder;
