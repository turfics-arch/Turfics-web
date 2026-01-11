import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import Navbar from '../components/Navbar';
import './TournamentManage.css';

const TournamentManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newMatch, setNewMatch] = useState({ round_name: 'Round 1', team1: '', team2: '', time: '' });
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        fetchTournamentData();
    }, [id]);

    const fetchTournamentData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/tournaments/${id}`);
            setTournament(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            // Handle unauthorized or not found
            setLoading(false);
        }
    };

    const handleUpdateScore = async (matchId, score1, score2, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/tournaments/matches/${matchId}/score`,
                { score1, score2, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTournamentData(); // Refresh
        } catch (err) {
            alert('Error updating score');
        }
    };

    const handleAddMatch = async () => {
        if (!newMatch.team1 || !newMatch.team2) return alert('Enter teams');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/tournaments/${id}/matches`,
                newMatch,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewMatch({ round_name: 'Round 1', team1: '', team2: '', time: '' }); // Reset
            fetchTournamentData();
        } catch (err) {
            alert('Error adding match');
        }
    };

    const handlePostAnnouncement = async () => {
        if (!announcement) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/tournaments/${id}/announcements`,
                { content: announcement },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAnnouncement('');
            fetchTournamentData();
        } catch (err) {
            alert('Error posting announcement');
        }
    };

    if (loading) return <div className="loading-container">Loading Dashboard...</div>;
    if (!tournament) return <div className="error-container">Tournament not found</div>;

    return (
        <div className="page-wrapper">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>

            <div className="manage-container">
                <div className="manage-header">
                    <div>
                        <h1>{tournament.name}</h1>
                        <p style={{ color: '#888', marginTop: '0.5rem' }}>Management Dashboard</p>
                    </div>
                    <span className={`status-badge ${tournament.status}`}>{tournament.status}</span>
                </div>

                <div className="manage-tabs">
                    <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>Matches & Scores</button>
                    <button className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`} onClick={() => setActiveTab('registrations')}>Registrations</button>
                    <button className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-section">
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <span className="label">Total Teams</span>
                                    <span className="value">{tournament.registered_teams} / {tournament.max_teams || '∞'}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Revenue</span>
                                    <span className="value">₹{tournament.registered_teams * tournament.entry_fee}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Matches</span>
                                    <span className="value">{tournament.matches.length}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Status</span>
                                    <span className="value" style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>{tournament.status}</span>
                                </div>
                                <div className="stat-box" style={{ cursor: 'pointer' }} onClick={() => {
                                    // Simulating Poster Download by opening image in new tab for now
                                    if (tournament.image_url) window.open(tournament.image_url, '_blank');
                                    else alert('No specific poster image found.');
                                }}>
                                    <span className="label">Poster</span>
                                    <span className="value" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'underline' }}>Download / View</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="matches-section-manage">
                            <div className="section-card">
                                <h3>Add New Match</h3>
                                <div className="match-form">
                                    <input type="text" placeholder="Round (e.g. Semi Final)" value={newMatch.round_name} onChange={e => setNewMatch({ ...newMatch, round_name: e.target.value })} />
                                    <input type="text" placeholder="Team 1" value={newMatch.team1} onChange={e => setNewMatch({ ...newMatch, team1: e.target.value })} />
                                    <input type="text" placeholder="Team 2" value={newMatch.team2} onChange={e => setNewMatch({ ...newMatch, team2: e.target.value })} />
                                    <input type="datetime-local" value={newMatch.time} onChange={e => setNewMatch({ ...newMatch, time: e.target.value })} />
                                    <button className="update-btn" onClick={handleAddMatch}>Add Match</button>
                                </div>
                            </div>

                            <div className="section-card">
                                <h3>Update Scores</h3>
                                <div className="match-list">
                                    {tournament.matches.length === 0 ? <p style={{ color: '#666' }}>No matches scheduled yet.</p> :
                                        tournament.matches.map(m => (
                                            <div key={m.id} className="match-item">
                                                <div>
                                                    <small style={{ color: 'var(--primary)' }}>{m.round}</small>
                                                    <div className="match-teams">{m.team1} vs {m.team2}</div>
                                                    <small style={{ color: '#666' }}>{m.time}</small>
                                                </div>
                                                <div className="match-score">
                                                    <input id={`s1-${m.id}`} type="text" defaultValue={m.score1} className="score-input" placeholder="0" />
                                                    <span>-</span>
                                                    <input id={`s2-${m.id}`} type="text" defaultValue={m.score2} className="score-input" placeholder="0" />
                                                    <button className="update-btn"
                                                        onClick={() => handleUpdateScore(
                                                            m.id,
                                                            document.getElementById(`s1-${m.id}`).value,
                                                            document.getElementById(`s2-${m.id}`).value,
                                                            'completed'
                                                        )}>
                                                        Update
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="announcements-section">
                            <div className="section-card">
                                <h3>Post Announcement</h3>
                                <textarea
                                    className="announcement-input"
                                    rows="3"
                                    placeholder="Keep participants updated..."
                                    value={announcement}
                                    onChange={e => setAnnouncement(e.target.value)}
                                ></textarea>
                                <button className="update-btn" onClick={handlePostAnnouncement}>Post Update</button>
                            </div>

                            <div className="section-card">
                                <h3>History</h3>
                                {tournament.announcements.map(a => (
                                    <div key={a.id} className="announce-item">
                                        <p>{a.content}</p>
                                        <small>{a.created_at}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'registrations' && (
                        <div className="section-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Registered Teams ({tournament.registered_teams})</h3>
                                <button className="update-btn" onClick={fetchTournamentData}>Refresh List</button>
                            </div>

                            <div className="registrations-table-container">
                                {tournament.registrations_list && tournament.registrations_list.length > 0 ? (
                                    <table className="users-table">
                                        <thead>
                                            <tr>
                                                <th>Team Name</th>
                                                <th>Captain</th>
                                                <th>Contact</th>
                                                <th>Status</th>
                                                <th>Payment</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tournament.registrations_list.map(reg => (
                                                <tr key={reg.id}>
                                                    <td>{reg.team_name}</td>
                                                    <td>{reg.captain_name}</td>
                                                    <td>{reg.contact_number}</td>
                                                    <td>
                                                        <span className={`status-badge ${reg.status}`}>{reg.status}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${reg.payment_status === 'paid' ? 'confirmed' : 'pending'}`}>
                                                            {reg.payment_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            {reg.status !== 'approved' && (
                                                                <button
                                                                    className="view-btn-small"
                                                                    style={{ background: '#00e676', color: 'black' }}
                                                                    onClick={async () => {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            await axios.put(`${API_URL}/api/tournaments/registrations/${reg.id}`,
                                                                                { status: 'approved' },
                                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                                            );
                                                                            fetchTournamentData();
                                                                        } catch (e) { alert('Action failed'); }
                                                                    }}
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {reg.payment_status !== 'paid' && (
                                                                <button
                                                                    className="view-btn-small"
                                                                    style={{ background: '#2196f3', color: 'white' }}
                                                                    onClick={async () => {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            await axios.put(`${API_URL}/api/tournaments/registrations/${reg.id}`,
                                                                                { payment_status: 'paid' },
                                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                                            );
                                                                            fetchTournamentData();
                                                                        } catch (e) { alert('Action failed'); }
                                                                    }}
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                            <button
                                                                className="view-btn-small"
                                                                style={{ background: '#ff3d00', color: 'white' }}
                                                                onClick={async () => {
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        await axios.put(`${API_URL}/api/tournaments/registrations/${reg.id}`,
                                                                            { status: 'rejected' },
                                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                                        );
                                                                        fetchTournamentData();
                                                                    } catch (e) { alert('Action failed'); }
                                                                }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No teams have registered yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentManage;
