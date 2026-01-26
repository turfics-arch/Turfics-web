import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Activity, Wrench, Package, Droplets, Sun, CloudRain,
    AlertTriangle, Plus, ChevronRight, Camera, Clipboard,
    ArrowRight, Settings, Info, Cloud
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { showSuccess, showError } from '../utils/SwalUtils';
import './OwnerBookings.css'; // Reuse common layout styles
import './MaintenanceDashboard.css';

const localizer = momentLocalizer(moment);

const MaintenanceDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [assets, setAssets] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [turfs, setTurfs] = useState([]);
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [view, setView] = useState('week');

    // Weather Mock (Replace with real API later)
    const [weather] = useState({
        temp: 28,
        condition: 'Sunny',
        humidity: '45%',
        advice: 'Excellent for mowing and fertilizing. Irrigation not required today.'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTurfs(data);
                if (data.length > 0) {
                    setSelectedTurf(data[0].id);
                    fetchMaintenanceData(data[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMaintenanceData = async (turfId) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [tRes, aRes, iRes] = await Promise.all([
                fetch(`${API_URL}/api/maintenance/tasks?turf_id=${turfId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/maintenance/assets?turf_id=${turfId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/maintenance/inventory?turf_id=${turfId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (tRes.ok) setTasks(await tRes.json());
            if (aRes.ok) setAssets(await aRes.json());
            if (iRes.ok) setInventory(await iRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calendarEvents = tasks.map(t => ({
        id: t.id,
        title: t.title,
        start: new Date(t.scheduled_date),
        end: moment(t.scheduled_date).add(1, 'hour').toDate(),
        resource: t
    }));

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6';
        if (event.resource.priority === 'high') backgroundColor = '#ef4444';
        if (event.resource.priority === 'critical') backgroundColor = '#dc2626';
        if (event.resource.status === 'completed') backgroundColor = '#10b981';

        return {
            style: { backgroundColor, borderRadius: '6px', opacity: 0.8, color: 'white', border: '0px', display: 'block', fontSize: '0.75rem' }
        };
    };

    if (loading && turfs.length === 0) return <div className="loading-screen">Loading Maintenance Studio...</div>;

    return (
        <div className="maintenance-page">
            <Navbar />

            <div className="content-container">
                <div className="section-header">
                    <div>
                        <h1 className="main-title">Maintenance Studio</h1>
                        <p className="subtitle">Operational excellence for your facility</p>
                    </div>

                    <div className="header-actions">
                        <select
                            className="turf-selector-premium"
                            value={selectedTurf}
                            onChange={(e) => {
                                setSelectedTurf(e.target.value);
                                fetchMaintenanceData(e.target.value);
                            }}
                        >
                            {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button className="btn-primary-glow">
                            <Plus size={18} /> Plan New Task
                        </button>
                    </div>
                </div>

                {/* Quick Glance Stats */}
                <div className="stats-dashboard">
                    <div className="mini-stat-card weather">
                        <div className="card-inner">
                            <div className="icon-wrap-weather">
                                <Sun size={32} color="#f59e0b" />
                            </div>
                            <div className="stat-info">
                                <span className="label">Today's Forecast</span>
                                <div className="value-group">
                                    <span className="value">{weather.temp}°C</span>
                                    <span className="condition">{weather.condition}</span>
                                </div>
                                <p className="advice">{weather.advice}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mini-stat-card asset-health">
                        <div className="card-inner">
                            <div className="icon-wrap service">
                                <Wrench size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="label">Asset Health</span>
                                <span className="value">{assets.filter(a => a.status === 'active').length}/{assets.length}</span>
                                <p className="advice">1 Machine requires service this week</p>
                            </div>
                        </div>
                    </div>

                    <div className="mini-stat-card stock-alert">
                        <div className="card-inner">
                            <div className="icon-wrap stock">
                                <Package size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="label">Low Inventory</span>
                                <span className="value text-warning">{inventory.filter(i => i.current_stock <= i.min_stock_alert).length}</span>
                                <p className="advice">Reorder fertilizers soon</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid-layout">
                    {/* Left Column: Calendar & Logs */}
                    <div className="main-column">
                        {/* Task Calendar */}
                        <div className="calendar-card-premium">
                            <div className="card-header-flex">
                                <h3>Maintenance Planner</h3>
                                <div className="view-toggles">
                                    <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
                                    <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
                                    <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
                                </div>
                            </div>
                            <div className="calendar-wrap-maintenance">
                                <BigCalendar
                                    localizer={localizer}
                                    events={calendarEvents}
                                    startAccessor="start"
                                    endAccessor="end"
                                    view={view}
                                    onView={setView}
                                    style={{ height: '450px' }}
                                    eventPropGetter={eventStyleGetter}
                                    components={{
                                        toolbar: () => null // Use custom toolbar
                                    }}
                                />
                            </div>
                        </div>

                        {/* Condition History */}
                        <div className="health-history-card">
                            <div className="card-header-flex">
                                <h3>Turf Condition Logs</h3>
                                <button className="btn-ghost-small">View All History</button>
                            </div>
                            <div className="log-entries-compact">
                                <div className="log-entry">
                                    <div className="entry-img-placeholder">
                                        <Camera size={20} />
                                    </div>
                                    <div className="entry-details">
                                        <div className="entry-header">
                                            <span className="date">Jan 24, 2026</span>
                                            <span className="health-pill excellent">Health: 9/10</span>
                                        </div>
                                        <p className="note">Mowing height adjusted to 15mm. Color looking vibrant. Drainage stable after light rain.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assets & Quick Actions */}
                    <div className="side-column">
                        <div className="asset-list-card">
                            <div className="card-header-flex">
                                <h3>Equipment Fleet</h3>
                                <Plus size={18} className="icon-action" />
                            </div>
                            <div className="fleet-list">
                                {assets.length > 0 ? assets.map(asset => (
                                    <div key={asset.id} className="asset-item-mini">
                                        <div className="asset-info-mini">
                                            <span className="a-name">{asset.name}</span>
                                            <span className="a-meta">{asset.current_hours || 0} hrs used</span>
                                        </div>
                                        <div className={`status-dot ${asset.status}`}></div>
                                    </div>
                                )) : (
                                    <div className="empty-mini">No assets registered</div>
                                )}
                            </div>
                            <button className="btn-full-width-ghost">
                                Manage Fleet <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="utility-cards">
                            <div className="u-card condition">
                                <Clipboard size={20} />
                                <span>Record Health Check</span>
                                <ArrowRight size={16} />
                            </div>
                            <div className="u-card inventory">
                                <Package size={20} />
                                <span>Log Supply Usage</span>
                                <ArrowRight size={16} />
                            </div>
                            <div className="u-card fleet">
                                <Settings size={20} />
                                <span>Service Machine</span>
                                <ArrowRight size={16} />
                            </div>
                        </div>

                        <div className="compliance-notice">
                            <Info size={16} />
                            <p>Last pesticides application was 12 days ago. Compliance record is up to date.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceDashboard;
