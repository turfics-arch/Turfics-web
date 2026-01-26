import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Clock, Users, MapPin, Star, Trophy, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { showSuccess, showError } from '../utils/SwalUtils';
import Navbar from '../components/Navbar';
import { API_URL } from '../utils/api';
import './Dashboard.css'; // Reusing dashboard styles

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const OwnerAnalytics = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [advancedData, setAdvancedData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Default to Custom as requested
    const [timeRange, setTimeRange] = useState('custom');

    // Default custom range: Start of current month to Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [customStart, setCustomStart] = useState(firstDay);
    const [customEnd, setCustomEnd] = useState(today);

    useEffect(() => {
        // Fetch initially if custom range is set by default logic, or simple ranges
        fetchAnalytics();
    }, [timeRange]); // Trigger fetch on range change; Manual Apply triggers same function

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/api/owner/analytics/detailed?range=${timeRange}`;

            if (timeRange === 'custom' && customStart && customEnd) {
                url += `&start_date=${customStart}&end_date=${customEnd}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                console.log(json); // Debugging
                setData(json);
            }

            // Fetch Advanced Analytics (Phase 3)
            const resAdv = await fetch(`${API_URL}/api/analytics/advanced`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resAdv.ok) {
                const advJson = await resAdv.json();
                setAdvancedData(advJson);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const input = document.getElementById('analytics-dashboard');
        if (!input) return;

        showSuccess('Generating Report', 'Please wait while we generate your PDF...');

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Turfics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) {
            console.error(e);
            showError('Export Failed', 'Could not generate PDF.');
        }
    };

    const formatHour = (hour) => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };

    if (loading) return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-content" style={{ textAlign: 'center', color: '#888' }}>
                <h2>Loading Analytics...</h2>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-content">
                <header className="dashboard-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/dashboard')} className="manage-btn-xs" style={{ padding: '0.5rem', border: 'none', color: '#ccc' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1>Detailed Analytics</h1>
                            <p className="welcome-text">Deep dive into your business performance</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', padding: '0.5rem', borderRadius: '6px', height: '40px' }}
                        >
                            <option value="custom">Custom Range</option>
                            <option value="day">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>

                        {timeRange === 'custom' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', padding: '0.5rem', borderRadius: '6px' }}
                                />
                                <span style={{ color: 'white' }}>to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', padding: '0.5rem', borderRadius: '6px' }}
                                />
                                <button
                                    className="manage-btn-xs"
                                    onClick={fetchAnalytics}
                                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', fontWeight: '600' }}
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleExport}
                            style={{
                                background: '#10b981', color: 'white', border: 'none',
                                padding: '0.5rem 1rem', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            <Download size={18} /> Export
                        </button>
                    </div>
                </header>

                <div className="dashboard-sections" id="analytics-dashboard">



                    {/* NEW: OPERATIONS HEALTH (Occupancy & Peak) */}
                    <section>
                        <h3 className="section-heading"><Users size={20} /> Operations Health</h3>
                        <div className="dashboard-grid-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="kpi-card" style={{ textAlign: 'center' }}>
                                <h4>Occupancy Rate</h4>
                                <div style={{
                                    fontSize: '3rem', fontWeight: 'bold',
                                    color: (advancedData?.occupancy_rate || 0) > 70 ? '#10b981' : (advancedData?.occupancy_rate || 0) > 40 ? '#f59e0b' : '#ef4444',
                                    margin: '1rem 0'
                                }}>
                                    {advancedData?.occupancy_rate || 0}%
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Slots booked vs Total Capacity</p>
                            </div>

                            <div className="chart-card">
                                <div className="chart-title">Peak Hours</div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={advancedData?.peak_hours || []} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="hour" type="category" tickFormatter={formatHour} stroke="#94a3b8" width={60} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* 0. REVENUE FORECAST (NEW) */}
                    <section>
                        <h3 className="section-heading"><TrendingUp size={20} /> Revenue Forecast (Next 30 Days)</h3>
                        <div className="chart-card" style={{ padding: '1.5rem' }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data?.forecast || [
                                    { name: 'Week 1', revenue: 12000, forecast: 12500 },
                                    { name: 'Week 2', revenue: 15000, forecast: 16000 },
                                    { name: 'Week 3', revenue: 11000, forecast: 14000 },
                                    { name: 'Week 4', revenue: 18000, forecast: 19000 },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorFc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" name="Past Performance" />
                                    <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeDasharray="5 5" fill="url(#colorFc)" name="Adjusted Forecast" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
                                Based on historical booking density and upcoming holidays.
                            </p>
                        </div>
                    </section>

                    {/* 1. FINANCIAL BREAKDOWN */}
                    <section>
                        <h3 className="section-heading"><DollarSign size={20} /> Financial Overview</h3>
                        <div className="dashboard-grid-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <div className="chart-card">
                                <div className="chart-title">Revenue Breakdown (Type)</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={data?.revenue_breakdown || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                                            {(data?.revenue_breakdown || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} formatter={(val) => `₹${val}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <div className="chart-title">Payment Timing Analysis</div>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Avg. Time from Booking to Payment: {data?.avg_payment_time || 'N/A'}</p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', alignItems: 'center', height: '150px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                            ₹{data?.advance_collected?.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Advance / Online</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                            ₹{data?.pending_collection?.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pending Collection</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. BOOKING PATTERNS */}
                    <section>
                        <h3 className="section-heading"><Clock size={20} /> Booking Behavior</h3>
                        <div className="chart-card">
                            <div className="chart-title">Booking Time vs Playing Time</div>
                            <ResponsiveContainer width="100%" height={320}>
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Booking Hour"
                                        domain={[0, 24]}
                                        tickCount={9}
                                        tickFormatter={formatHour}
                                        stroke="#94a3b8"
                                        label={{ value: 'Time of Booking', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Playing Hour"
                                        domain={[0, 24]}
                                        tickCount={9}
                                        tickFormatter={formatHour}
                                        stroke="#94a3b8"
                                        label={{ value: 'Time of Play', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                    />
                                    <ZAxis type="number" dataKey="z" range={[60, 400]} name="Count" />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{ backgroundColor: '#1e293b', padding: '10px', border: '1px solid #475569', borderRadius: '8px' }}>
                                                        <p style={{ color: '#fff', margin: 0 }}>Booked at: <strong>{formatHour(data.x)}</strong></p>
                                                        <p style={{ color: '#fff', margin: 0 }}>Played at: <strong>{formatHour(data.y)}</strong></p>
                                                        <p style={{ color: '#8884d8', margin: '5px 0 0 0' }}>Volume: {data.z / 20} Bookings</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Bookings" data={data?.booking_scatter || []} fill="#8884d8" shape="circle" />
                                </ScatterChart>
                            </ResponsiveContainer>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '0.8rem' }}>
                                Identifies correlations between when users book and when they actually play.
                            </p>
                        </div>
                    </section>

                    {/* 3. USER RETENTION & REGION */}
                    <section>
                        <h3 className="section-heading"><Users size={20} /> Customer Insights</h3>
                        <div className="dashboard-grid-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="chart-card">
                                <div className="chart-title">New vs Returning</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={data?.user_retention || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                            <Cell fill="#0088FE" /> {/* New */}
                                            <Cell fill="#FFBB28" /> {/* Returning */}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="kpi-card">
                                <MapPin size={24} color="#ef4444" />
                                <h4 style={{ marginTop: '1rem' }}>Top Player Regions</h4>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                    {(data?.top_regions || []).map((r, i) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                                            <span>{r.region || 'Unknown'}</span>
                                            <span style={{ fontWeight: 'bold' }}>{r.count} Bookings</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 4. TOURNAMENTS & REVIEWS */}
                    <section>
                        <h3 className="section-heading"><Trophy size={20} /> Events & Feedback</h3>
                        <div className="dashboard-grid-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                            <div className="chart-card">
                                <div className="chart-title">Tournament Participation</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={data?.tournament_stats || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                        <Bar dataKey="participants" fill="#82ca9d" name="Participants" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="kpi-card">
                                <Star size={24} color="#ffd700" />
                                <h4 style={{ marginTop: '1rem' }}>Recent Reviews</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                                    {/* Mock Data for now as Reviews table wasn't in main models context yet */}
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold' }}>Rahul S.</span>
                                            <span style={{ color: '#ffd700' }}>★ 5.0</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#ccc', margin: '0.5rem 0' }}>Great turf! Lighting was perfect.</p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold' }}>Amit K.</span>
                                            <span style={{ color: '#ffd700' }}>★ 4.5</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#ccc', margin: '0.5rem 0' }}>Good maintenance, bit pricey.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default OwnerAnalytics;
