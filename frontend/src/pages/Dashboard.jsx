import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Award, Calendar, Wallet, TrendingUp, Users, Activity, Clock, PieChart as PieIcon, ArrowRight, Zap, BarChart2, Check, X, Bell } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('User');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pending Queue Logic
    const [pendingBookings, setPendingBookings] = useState([]);
    const [showPendingModal, setShowPendingModal] = useState(false);

    useEffect(() => {
        const r = localStorage.getItem('role');
        setRole(r);
        fetchDashboardData(r);
    }, []);

    const fetchDashboardData = async (currentRole) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const endpoint = currentRole === 'owner'
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/owner/stats`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/activity`;

            const res = await fetch(endpoint, { headers });
            const data = await res.json();
            setStats(data);

            // If Owner and has pending items, fetch the details immediately
            if (currentRole === 'owner' && data.bookings_breakdown?.pending > 0) {
                const bookingRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/owner/bookings`, { headers });
                if (bookingRes.ok) {
                    const allBookings = await bookingRes.json();
                    const pending = allBookings.filter(b => b.status === 'pending');
                    setPendingBookings(pending);
                    if (pending.length > 0) setShowPendingModal(true);
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ booking_id: id })
            });

            if (res.ok) {
                // Optimistic UI Update
                const updatedPending = pendingBookings.filter(b => b.booking_id !== id);
                setPendingBookings(updatedPending);

                // Update stats locally to reflect change
                setStats(prev => ({
                    ...prev,
                    bookings_breakdown: {
                        ...prev.bookings_breakdown,
                        pending: prev.bookings_breakdown.pending - 1,
                        confirmed: prev.bookings_breakdown.confirmed + 1
                    }
                }));

                if (updatedPending.length === 0) setShowPendingModal(false);
            }
        } catch (e) { console.error(e); }
    };

    const handleRejectBooking = async (id) => {
        if (!window.confirm('Reject this booking?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const updatedPending = pendingBookings.filter(b => b.booking_id !== id);
                setPendingBookings(updatedPending);

                setStats(prev => ({
                    ...prev,
                    bookings_breakdown: {
                        ...prev.bookings_breakdown,
                        pending: prev.bookings_breakdown.pending - 1
                    }
                }));

                if (updatedPending.length === 0) setShowPendingModal(false);
            }
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // --- RENDER HELPERS ---

    const renderOwnerDashboard = () => {
        if (!stats) return null;

        return (
            <div className="dashboard-sections">
                {/* KPI ROW */}
                <div className="dashboard-grid-row kpi-grid">
                    <div className="kpi-card relative-action-card" onClick={() => navigate('/owner/analytics')} style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                            <Wallet size={24} color="#3b82f6" />
                        </div>
                        <div className="kpi-label">Revenue (This Month)</div>
                        <div className="kpi-value">₹{stats.revenue_month?.toLocaleString() || 0}</div>
                        <div className="kpi-trend trend-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                            <span><TrendingUp size={14} /> Total: ₹{stats.total_revenue?.toLocaleString()}</span>
                            <div style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                View Analytics <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="kpi-card relative-action-card bookings-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            if (stats.bookings_breakdown?.pending > 0) {
                                if (pendingBookings.length === 0) fetchDashboardData('owner');
                                setShowPendingModal(true);
                            } else {
                                navigate('/owner/bookings');
                            }
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.2)', marginBottom: '0.5rem' }}>
                                <Activity size={24} color="#10b981" />
                            </div>
                            {/* Pending Badge or Icon */}
                            {stats.bookings_breakdown?.pending > 0 && (
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    color: '#f59e0b',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    <Bell size={12} /> {stats.bookings_breakdown.pending} Review
                                </div>
                            )}
                        </div>

                        <div className="kpi-label">Bookings (Today)</div>
                        <div className="kpi-value" style={{ marginBottom: '0.5rem' }}>{stats.bookings_today || 0}</div>

                        {/* Improved Breakdown Grid */}
                        {stats.bookings_breakdown && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '8px',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Verified
                                    <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600' }}>{stats.bookings_breakdown.confirmed}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Pending
                                    <div style={{ fontSize: '0.9rem', color: stats.bookings_breakdown.pending > 0 ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>
                                        {stats.bookings_breakdown.pending}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    In-App
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '600' }}>{stats.bookings_breakdown.online}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Manual
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '600' }}>{stats.bookings_breakdown.manual}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.75rem' }}>
                            {stats.bookings_breakdown?.pending > 0 ? 'Review Actions' : 'Manage Bookings'} <ArrowRight size={14} />
                        </div>
                    </div>

                    <div className="kpi-card relative-action-card"
                        onClick={() => {
                            const el = document.getElementById('recent-transactions');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
                            <Zap size={24} color="#f59e0b" />
                        </div>
                        <div className="kpi-label">Revenue (Today)</div>
                        <div className="kpi-value">₹{stats.revenue_today?.toLocaleString() || 0}</div>
                        <div className="kpi-trend trend-up">
                            <span style={{ color: '#10b981' }}>Active Now</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.75rem' }}>
                            See Transactions <ArrowRight size={14} />
                        </div>
                    </div>

                    <div className="kpi-card relative-action-card" onClick={() => navigate('/manage-turfs')} style={{
                        cursor: 'pointer',
                        borderColor: 'var(--accent-primary)',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)'
                    }}>
                        <div className="kpi-icon-wrapper" style={{ background: '#3b82f6', color: 'white' }}>
                            <MapPin size={24} />
                        </div>
                        <div className="kpi-label" style={{ color: '#93c5fd' }}>Quick Access</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            Manage Turfs
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Configure venues & slots <ArrowRight size={14} />
                        </div>
                    </div>
                </div>

                {/* CHARTS ROW 1: Revenue Trend & Peak Hours */}
                <div className="dashboard-grid-row chart-grid">
                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-title">Revenue Trajectory (30 Days)</div>
                            <select style={{ background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '4px', padding: '2px 5px' }}>
                                <option>Last 30 Days</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.revenue_trend || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-title">Peak Hours</div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.peak_hours || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                                />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CHARTS ROW 2: Sport Dist & Recent Activity */}
                <div className="dashboard-grid-row chart-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-title">Sport Popularity (Revenue)</div>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <defs>
                                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
                                    </filter>
                                </defs>
                                <Pie
                                    data={stats.sport_distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {(stats.sport_distribution || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: 'url(#shadow)' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => `₹${value}`}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="activity-card" id="recent-transactions">
                        <div className="table-header">
                            <div className="chart-title">Recent Transactions</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Turf/Sport</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_activity?.length > 0 ? (
                                        stats.recent_activity.map((act, i) => (
                                            <tr key={act.id || i}>
                                                <td>
                                                    <div style={{ fontWeight: '500' }}>{act.turf}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{act.action}</div>
                                                </td>
                                                <td style={{ color: '#94a3b8' }}>{act.time}</td>
                                                <td>
                                                    <span className={`status-badge status-${act.status.toLowerCase()}`}>
                                                        {act.status}
                                                    </span>
                                                </td>
                                                <td className="text-right" style={{ fontWeight: '600' }}>₹{act.amount}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>No recent activity</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => navigate('/owner/bookings')}>
                                View All Bookings &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCommonDashboard = () => (
        <div className="dashboard-sections">
            <div className="kpi-card">
                <h3>Welcome to Turfics</h3>
                <p>Explore venues and manage your bookings.</p>
                <button className="action-btn mt-4" onClick={() => navigate('/discovery')}>Find Turfs</button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Navbar />

            {/* PENDING MODAL */}
            {role === 'owner' && showPendingModal && pendingBookings.length > 0 && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Action Required</h2>
                            <p>You have {pendingBookings.length} new booking request(s) pending approval.</p>
                            <button className="modal-close-btn" onClick={() => setShowPendingModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="pending-list">
                            {pendingBookings.map(b => (
                                <div key={b.booking_id} className="pending-item">
                                    <div className="pi-details">
                                        <h4>{b.turf_name}</h4>
                                        <div className="pi-info">
                                            <span><Calendar size={14} /> {new Date(b.start_time).toLocaleDateString()}</span>
                                            <span><Clock size={14} /> {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="pi-info" style={{ marginTop: '4px' }}>
                                            <span style={{ color: '#94a3b8' }}>{b.game_type} • {b.unit_name}</span>
                                            <span className="pi-price">₹{b.total_price}</span>
                                        </div>
                                    </div>
                                    <div className="pi-actions">
                                        <button className="action-btn-large btn-accept" onClick={() => handleConfirmBooking(b.booking_id)}>
                                            <Check size={18} /> Approve
                                        </button>
                                        <button className="action-btn-large btn-decline" onClick={() => handleRejectBooking(b.booking_id)}>
                                            <X size={18} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <h1>{role === 'owner' ? 'Owner Analytics' : 'Dashboard'}</h1>
                        <p className="welcome-text">Real-time insights and performance metrics</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn-minimal">
                        <LogOut size={18} /> Logout
                    </button>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading analytics...</div>
                ) : (
                    role === 'owner' ? renderOwnerDashboard() : renderCommonDashboard()
                )}
            </div>
        </div>
    );
};

export default Dashboard;
