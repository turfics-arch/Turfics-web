import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Plus, LayoutDashboard, Wallet, Users, Trophy, Calendar } from 'lucide-react';
import './OrganizerHub.css';

const OrganizerHub = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, activeCount: 0, totalTeams: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/organizer/tournaments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTournaments(res.data);

            // Calculate Stats
            let revenue = 0;
            let teams = 0;
            const active = res.data.filter(t => t.status !== 'completed').length;

            res.data.forEach(t => {
                revenue += t.wallet_balance || 0;
                teams += t.team_count || 0;
            });

            setStats({ totalRevenue: revenue, activeCount: active, totalTeams: teams });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="organizer-hub">
            <Navbar />

            <header className="hub-header">
                <h1>Organizer Dashboard</h1>
                <p>Manage your tournaments, registrations, and revenue.</p>

                <div className="hub-stats">
                    <div className="stat-card">
                        <div className="stat-icon"><Trophy size={24} /></div>
                        <div>
                            <div className="stat-value">{stats.activeCount}</div>
                            <div className="stat-label">Active Tournaments</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><Users size={24} /></div>
                        <div>
                            <div className="stat-value">{stats.totalTeams}</div>
                            <div className="stat-label">Total Teams</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><Wallet size={24} /></div>
                        <div>
                            <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                            <div className="stat-label">Total Wallet Revenue</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="hub-content">
                <div className="hub-actions">
                    <h2>Your Tournaments</h2>
                    <button className="create-btn" onClick={() => navigate('/host-tournament')}>
                        <Plus size={20} /> Host New Tournament
                    </button>
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="tournaments-list">
                        {tournaments.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#1a1a1a', borderRadius: '12px' }}>
                                <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <h3>No tournaments hosted yet.</h3>
                                <p style={{ color: '#666', marginBottom: '1rem' }}>Create your first tournament to start managing.</p>
                            </div>
                        )}

                        {tournaments.map(t => (
                            <div key={t.id} className="hub-card">
                                <div className="hub-card-image" style={{ backgroundImage: `url(${t.image_url || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500'})` }}>
                                    <span className="hub-status">{t.status}</span>
                                </div>
                                <div className="hub-card-content">
                                    <h3 className="hub-title">{t.name}</h3>
                                    <div className="hub-meta">
                                        <span><Calendar size={14} style={{ marginRight: '5px' }} /> {t.start_date || 'TBA'}</span>
                                        <span>{t.sport}</span>
                                    </div>
                                    <div className="hub-meta">
                                        <span><Users size={14} style={{ marginRight: '5px' }} /> {t.team_count} / {t.max_teams} Teams</span>
                                    </div>

                                    <div className="hub-wallet">
                                        <span>Wallet Balance</span>
                                        <span className="wallet-amount">₹{t.wallet_balance.toLocaleString()}</span>
                                    </div>

                                    <button className="manage-btn" onClick={() => navigate(`/tournaments/${t.id}/manage`)}>
                                        Manage Tournament
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerHub;
