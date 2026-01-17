import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { showSuccess, showError, showWarning, showConfirm } from '../utils/SwalUtils';
import Swal from 'sweetalert2';
import { API_URL } from '../utils/api';
import AIPosterGeneratorModal from '../components/AIPosterGeneratorModal'; // Import
import './TournamentManage.css';

const TournamentManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newMatch, setNewMatch] = useState({
        round_number: 1,
        team1: '',
        team2: '',
        time: '',
        note: '' // 1.1, 1.2 etc will be derived but can be noted
    });
    const [announcement, setAnnouncement] = useState('');

    const [showPosterModal, setShowPosterModal] = useState(false);
    const [showAddMatchForm, setShowAddMatchForm] = useState(false);
    const [showManualAddModal, setShowManualAddModal] = useState(false);
    const [manualReg, setManualReg] = useState({ team_name: '', captain_name: '', contact_number: '' });

    // ... existing state ...
    const [announcementTitle, setAnnouncementTitle] = useState('');

    useEffect(() => {
        fetchTournamentData();
    }, [id]);

    const fetchTournamentData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/tournaments/${id}`);
            setTournament(res.data);

            // Default time to tournament start date if not set
            if (res.data.start_date) {
                const startDate = new Date(res.data.start_date).toISOString().slice(0, 16);
                setNewMatch(prev => ({ ...prev, time: startDate }));
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleUpdateScore = async (matchId, s1, s2, status, winner = null) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                score1: s1,
                score2: s2,
                status: status
            };
            if (winner) payload.winner = winner;

            await axios.put(`${API_URL}/api/tournaments/matches/${matchId}/score`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTournamentData();
            showSuccess('Updated', 'Match score updated');
        } catch (err) {
            showError('Update Failed', 'Could not update score');
        }
    };

    const handleEndMatch = async (m, s1, s2) => {
        const score1 = parseInt(s1) || 0;
        const score2 = parseInt(s2) || 0;

        if (score1 === score2) {
            showError('Tie Game', 'Cannot end match with a tie. Update score manually or play overtime.');
            return;
        }

        const winner = score1 > score2 ? m.team1 : m.team2;
        const result = await showConfirm('End Match?', `Declare <b>${winner}</b> as the winner?`);
        if (result.isConfirmed) {
            handleUpdateScore(m.id, s1, s2, 'completed', winner);
        }
    };

    const handleAddMatch = async () => {
        if (!newMatch.team1 || !newMatch.team2) return showWarning('Input Required', 'Please select both teams');
        if (newMatch.team1 === newMatch.team2) return showWarning('Invalid Selection', 'Team 1 and Team 2 cannot be the same');

        try {
            const token = localStorage.getItem('token');

            // Determine match number for the round (sub-notation)
            const matchesInRound = tournament.matches.filter(m => m.round && m.round.startsWith(`Round ${newMatch.round_number}.`));
            const matchIndex = matchesInRound.length + 1;
            const fullRoundName = `Round ${newMatch.round_number}.${matchIndex}`;

            await axios.post(`${API_URL}/api/tournaments/${id}/matches`,
                {
                    ...newMatch,
                    round_name: fullRoundName,
                    team1: newMatch.team1,
                    team2: newMatch.team2,
                    time: newMatch.time,
                    notes: newMatch.note
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Reset but keep round and time
            setNewMatch(prev => ({ ...prev, team1: '', team2: '', note: '' }));
            fetchTournamentData();
            showSuccess('Match Added', `Scheduled as ${fullRoundName}`);
            setShowAddMatchForm(false); // Hide form after success
        } catch (err) {
            showError('Action Failed', 'Error adding match');
        }
    };

    const handleDeleteMatch = async (matchId) => {
        const result = await showConfirm('Delete Match?', 'Are you sure you want to delete this match?');
        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/tournaments/matches/${matchId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTournamentData();
            showSuccess('Deleted', 'Match has been removed.');
        } catch (err) {
            showError('Delete Failed', 'Error deleting match');
        }
    };

    const handlePostAnnouncement = async () => {
        if (!announcement) return;

        // Optimistic UI Update
        const newAnn = {
            id: Date.now(), // Temp ID
            title: announcementTitle,
            content: announcement,
            created_at: 'Just now'
        };

        const prevTournament = { ...tournament };
        setTournament(prev => ({
            ...prev,
            announcements: [newAnn, ...prev.announcements]
        }));
        setAnnouncement('');
        setAnnouncementTitle('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/tournaments/${id}/announcements`,
                { title: newAnn.title, content: newAnn.content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Silent refresh to get real ID
            fetchTournamentData();
            showSuccess('Posted', 'Announcement has been posted.');
        } catch (err) {
            // Revert on failure
            setTournament(prevTournament);
            setAnnouncement(newAnn.content);
            setAnnouncementTitle(newAnn.title);
            showError('Post Failed', 'Error posting announcement');
        }
    };

    const handleDeleteAnnouncement = async (annId) => {
        const result = await showConfirm('Delete Announcement?', 'Are you sure you want to delete this announcement?');
        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/tournaments/announcements/${annId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTournamentData();
            showSuccess('Deleted', 'Announcement removed.');
        } catch (err) {
            showError('Delete Failed', 'Error deleting');
        }
    };

    const handleManualAdd = async () => {
        if (!manualReg.team_name || !manualReg.captain_name || !manualReg.contact_number) {
            showWarning('Missing Fields', 'Please fill in all team details.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/tournaments/${id}/registrations/manual`,
                manualReg,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTournamentData();
            setShowManualAddModal(false);
            setManualReg({ team_name: '', captain_name: '', contact_number: '' });
            showSuccess('Added', 'Team registered successfully.');
        } catch (err) {
            showError('Failed', err.response?.data?.message || 'Error adding team');
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/tournaments/${id}/registrations/bulk`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );
            fetchTournamentData();
            showSuccess('Upload Complete', res.data.message);
            if (res.data.errors && res.data.errors.length > 0) {
                showWarning('With Errors', res.data.errors.join('\n'));
            }
        } catch (err) {
            showError('Upload Failed', err.response?.data?.message || 'Error uploading file');
        }
    };

    const handleRegAction = async (regId, updates, actionName) => {
        // Optimistic Update
        const prevTournament = { ...tournament };
        setTournament(prev => ({
            ...prev,
            registrations_list: prev.registrations_list.map(r =>
                r.id === regId ? { ...r, ...updates } : r
            )
        }));

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/tournaments/registrations/${regId}`,
                updates,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Consistently refresh data to be safe, but UI is already updated
            fetchTournamentData();
            // showSuccess('Success', `${actionName} successful`); // Optional: cleaner without too many popups for fast actions
        } catch (err) {
            // Revert
            setTournament(prevTournament);
            Swal.fire({
                icon: 'error',
                title: 'Action Failed',
                text: 'Could not update registration status. Reverting changes.',
                background: '#1a1a1a',
                color: '#fff'
            });
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
                                    <select
                                        className="status-select-manage"
                                        value={tournament.status}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            try {
                                                const token = localStorage.getItem('token');
                                                await axios.put(`${API_URL}/api/tournaments/${id}`,
                                                    { status: newStatus },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                fetchTournamentData();
                                                showSuccess('Updated', `Status changed to ${newStatus}`);
                                            } catch (err) {
                                                showError('Update Failed', 'Could not update status');
                                            }
                                        }}
                                        style={{
                                            background: '#333',
                                            color: 'white',
                                            border: '1px solid #555',
                                            padding: '0.3rem',
                                            borderRadius: '4px',
                                            marginTop: '0.2rem',
                                            width: '100%',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        <option value="published">Open</option>
                                        <option value="closed">Closed</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="stat-box" style={{ cursor: 'pointer', border: '1px solid var(--primary)', background: 'rgba(0, 230, 118, 0.05)' }} onClick={() => setShowPosterModal(true)}>
                                    <span className="label" style={{ color: 'var(--primary)' }}>Marketing</span>
                                    <span className="value" style={{ fontSize: '1rem', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        Make Poster with AI
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="matches-section-manage">
                            <div className="section-card" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>Matches & Scores</h3>
                                    <button
                                        className="update-btn"
                                        onClick={() => setShowAddMatchForm(!showAddMatchForm)}
                                    >
                                        {showAddMatchForm ? 'Cancel' : '+ Add New Match'}
                                    </button>
                                </div>
                            </div>

                            {showAddMatchForm && (
                                <div className="section-card slide-down" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Generate New Match</h3>
                                    <div className="match-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Round Number</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newMatch.round_number}
                                                onChange={e => setNewMatch({ ...newMatch, round_number: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Match Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={newMatch.time}
                                                onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Team 1</label>
                                            <select
                                                value={newMatch.team1}
                                                onChange={e => setNewMatch({ ...newMatch, team1: e.target.value })}
                                                className="status-select-manage"
                                                style={{ width: '100%', padding: '0.6rem' }}
                                            >
                                                <option value="">Select Team 1</option>
                                                {tournament.registrations_list
                                                    .filter(reg => reg.status === 'approved')
                                                    .filter(reg => {
                                                        // If round > 1, only show winners from previous round
                                                        if (newMatch.round_number > 1) {
                                                            const prevRoundPrefix = `Round ${newMatch.round_number - 1}.`;
                                                            const prevRoundMatches = tournament.matches.filter(m => m.round && m.round.startsWith(prevRoundPrefix));
                                                            const winners = prevRoundMatches.map(m => m.winner).filter(w => w);
                                                            return winners.includes(reg.team_name);
                                                        }
                                                        return true;
                                                    })
                                                    .map(reg => {
                                                        const isBusy = tournament.matches.some(m =>
                                                            m.round && m.round.startsWith(`Round ${newMatch.round_number}.`) &&
                                                            (m.team1 === reg.team_name || m.team2 === reg.team_name)
                                                        );
                                                        return (
                                                            <option key={reg.id} value={reg.team_name} disabled={isBusy}>
                                                                {reg.team_name} {isBusy ? '(Already in Round)' : ''}
                                                            </option>
                                                        );
                                                    })
                                                }
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Team 2</label>
                                            <select
                                                value={newMatch.team2}
                                                onChange={e => setNewMatch({ ...newMatch, team2: e.target.value })}
                                                className="status-select-manage"
                                                style={{ width: '100%', padding: '0.6rem' }}
                                            >
                                                <option value="">Select Team 2</option>
                                                {tournament.registrations_list
                                                    .filter(reg => reg.status === 'approved')
                                                    .filter(reg => {
                                                        // If round > 1, only show winners from previous round
                                                        if (newMatch.round_number > 1) {
                                                            const prevRoundPrefix = `Round ${newMatch.round_number - 1}.`;
                                                            const prevRoundMatches = tournament.matches.filter(m => m.round && m.round.startsWith(prevRoundPrefix));
                                                            const winners = prevRoundMatches.map(m => m.winner).filter(w => w);
                                                            return winners.includes(reg.team_name);
                                                        }
                                                        return true;
                                                    })
                                                    .map(reg => {
                                                        const isBusy = tournament.matches.some(m =>
                                                            m.round && m.round.startsWith(`Round ${newMatch.round_number}.`) &&
                                                            (m.team1 === reg.team_name || m.team2 === reg.team_name)
                                                        );
                                                        return (
                                                            <option key={reg.id} value={reg.team_name} disabled={isBusy || reg.team_name === newMatch.team1}>
                                                                {reg.team_name} {isBusy ? '(Already in Round)' : (reg.team_name === newMatch.team1 ? '(Selected as Team 1)' : '')}
                                                            </option>
                                                        );
                                                    })
                                                }
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label>Match Note (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Special ground details"
                                                value={newMatch.note}
                                                onChange={e => setNewMatch({ ...newMatch, note: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <button className="update-btn" style={{ width: '100%', padding: '1rem' }} onClick={handleAddMatch}>Create Match & Notify Teams</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="section-card">
                                <h3>Scheduled Matches</h3>
                                <div className="match-list">
                                    {tournament.matches.length === 0 ? <p style={{ color: '#666' }}>No matches scheduled yet.</p> :
                                        tournament.matches.map(m => (
                                            <div key={m.id} className="match-item">
                                                <div>
                                                    <small style={{ color: 'var(--primary)' }}>{m.round}</small>
                                                    <div className="match-teams">{m.team1} vs {m.team2}</div>
                                                    {m.notes && <small style={{ display: 'block', color: '#888', fontStyle: 'italic' }}>Note: {m.notes}</small>}
                                                    <small style={{ color: '#666' }}>{m.time}</small>
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <button
                                                            className="btn-text"
                                                            style={{ color: '#ff3d00', fontSize: '0.8rem', padding: 0 }}
                                                            onClick={() => handleDeleteMatch(m.id)}
                                                        >
                                                            Delete Match
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="match-score">
                                                    <div className="score-group">
                                                        <input id={`s1-${m.id}`} type="text" defaultValue={m.score1} className="score-input" placeholder="0" />
                                                        <span>-</span>
                                                        <input id={`s2-${m.id}`} type="text" defaultValue={m.score2} className="score-input" placeholder="0" />
                                                    </div>
                                                    <div className="match-actions">
                                                        <button className="update-btn"
                                                            style={{ marginRight: '5px' }}
                                                            onClick={() => handleUpdateScore(
                                                                m.id,
                                                                document.getElementById(`s1-${m.id}`).value,
                                                                document.getElementById(`s2-${m.id}`).value,
                                                                'completed'
                                                            )}>
                                                            Update
                                                        </button>
                                                        <button className="update-btn"
                                                            style={{ background: '#00e676', color: 'black' }}
                                                            onClick={() => handleEndMatch(
                                                                m,
                                                                document.getElementById(`s1-${m.id}`).value,
                                                                document.getElementById(`s2-${m.id}`).value
                                                            )}>
                                                            End Match
                                                        </button>
                                                    </div>
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
                                <h3>New Announcement</h3>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>Title (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Schedule Change"
                                        value={announcementTitle}
                                        onChange={e => setAnnouncementTitle(e.target.value)}
                                        style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #444', padding: '0.6rem', borderRadius: '4px' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Message</label>
                                    <textarea
                                        className="announcement-input"
                                        rows="3"
                                        placeholder="Keep participants updated..."
                                        value={announcement}
                                        onChange={e => setAnnouncement(e.target.value)}
                                        style={{ width: '100%', background: '#222', color: 'white', border: '1px solid #444', padding: '0.6rem', borderRadius: '4px' }}
                                    ></textarea>
                                </div>
                                <button className="update-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePostAnnouncement}>Post to Notice Board</button>
                            </div>

                            <div className="section-card">
                                <h3>Notice Board History</h3>
                                {tournament.announcements.length === 0 ? <p style={{ color: '#666' }}>No announcements yet.</p> :
                                    tournament.announcements.map(a => (
                                        <div key={a.id} className="announce-item" style={{ position: 'relative' }}>
                                            <button
                                                className="btn-text"
                                                style={{ position: 'absolute', right: 0, top: 0, color: '#ff3d00' }}
                                                onClick={() => handleDeleteAnnouncement(a.id)}
                                            >
                                                Delete
                                            </button>
                                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.3rem' }}>{a.title || 'Broadcast'}</h4>
                                            <p style={{ color: '#ccc' }}>{a.content}</p>
                                            <small style={{ color: '#666' }}>{a.created_at}</small>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'registrations' && (
                        <div className="section-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                <h3>Registered Teams ({tournament.registered_teams})</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="update-btn" style={{ background: '#333', border: '1px solid #555' }} onClick={() => setShowManualAddModal(true)}>+ Add Team</button>
                                    <label className="update-btn" style={{ background: '#333', border: '1px solid #555', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        Import CSV/Excel
                                        <input type="file" accept=".csv, .xlsx, .xls" style={{ display: 'none' }} onChange={handleBulkUpload} />
                                    </label>
                                    <button className="update-btn" onClick={fetchTournamentData}>Refresh</button>
                                </div>
                            </div>

                            {showManualAddModal && (
                                <div className="modal-overlay">
                                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                                        <h3>Add Team Manually</h3>
                                        <div className="form-group">
                                            <label>Team Name</label>
                                            <input type="text" value={manualReg.team_name} onChange={e => setManualReg({ ...manualReg, team_name: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Captain Name</label>
                                            <input type="text" value={manualReg.captain_name} onChange={e => setManualReg({ ...manualReg, captain_name: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Contact Number</label>
                                            <input type="text" value={manualReg.contact_number} onChange={e => setManualReg({ ...manualReg, contact_number: e.target.value })} />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" onClick={() => setShowManualAddModal(false)}>Cancel</button>
                                            <button className="primary-btn" onClick={handleManualAdd}>Add Team</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="reg-table-container">
                                {tournament.registrations_list && tournament.registrations_list.length > 0 ? (
                                    <table className="reg-table">
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
                                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                            {reg.status !== 'approved' && (
                                                                <button
                                                                    className="view-btn-small"
                                                                    style={{ background: '#00e676', color: 'black' }}
                                                                    onClick={() => handleRegAction(reg.id, { status: 'approved' }, 'Approve')}
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {reg.payment_status !== 'paid' && (
                                                                <button
                                                                    className="view-btn-small"
                                                                    style={{ background: '#2196f3', color: 'white' }}
                                                                    onClick={() => handleRegAction(reg.id, { payment_status: 'paid' }, 'Mark Paid')}
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                            <button
                                                                className="view-btn-small"
                                                                style={{ background: '#ff3d00', color: 'white' }}
                                                                onClick={() => handleRegAction(reg.id, { status: 'rejected' }, 'Reject')}
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

            {/* AI Poster Generator Modal */}
            {showPosterModal && (
                <AIPosterGeneratorModal
                    tournament={tournament}
                    onClose={() => setShowPosterModal(false)}
                />
            )}
        </div>
    );
};

export default TournamentManage;
