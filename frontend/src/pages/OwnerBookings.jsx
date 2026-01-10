import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Check, X, Bell, Calendar, Clock, DollarSign, Filter, Search, ChevronRight, XCircle, Lock } from 'lucide-react';
import './OwnerBookings.css';

const OwnerBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total_revenue: 0, total_bookings: 0 });
    const [loading, setLoading] = useState(true);
    const [showPendingModal, setShowPendingModal] = useState(false);

    const [myTurfs, setMyTurfs] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [bRes, sRes, tRes] = await Promise.all([
                fetch('http://localhost:5000/api/owner/bookings', { headers: { 'Authorization': `Bearer ${token} ` } }),
                fetch('http://localhost:5000/api/owner/stats', { headers: { 'Authorization': `Bearer ${token} ` } }),
                fetch('http://localhost:5000/api/turfs/my-turfs', { headers: { 'Authorization': `Bearer ${token} ` } })
            ]);

            if (bRes.ok && sRes.ok) {
                const bData = await bRes.json();
                const sData = await sRes.json();
                setBookings(bData);
                setStats(sData);

                if (tRes.ok) {
                    setMyTurfs(await tRes.json());
                }

                // Check for pending
                const pendingCount = bData.filter(b => b.status === 'pending').length;
                if (pendingCount > 0) {
                    setShowPendingModal(true);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/bookings/confirm', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token} `,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ booking_id: id })
            });
            if (res.ok) {
                // Optimistic Update
                setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status: 'confirmed' } : b));

                // If modal is open, check if we should close it (no more pending)
                const remainingPending = bookings.filter(b => b.status === 'pending' && b.booking_id !== id).length;
                if (remainingPending === 0) setShowPendingModal(false);

            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (e) { console.error(e); }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to reject/cancel this booking?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Optimistic Update
                setBookings(prev => prev.filter(b => b.booking_id !== id));

                // Modal check
                const remainingPending = bookings.filter(b => b.booking_id !== id && b.status === 'pending').length;
                if (remainingPending === 0) setShowPendingModal(false);
            }
        } catch (e) { console.error(e); }
    };

    // --- Slot Management State ---
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotAction, setSlotAction] = useState('manual'); // 'manual', 'block', 'edit-manual', 'edit-block'
    const [slotForm, setSlotForm] = useState({
        guest_name: '', guest_phone: '', price: 0, reason: '', duration_mins: 60, turf_id: '', unit_id: ''
    });
    const [imgUnits, setImgUnits] = useState([]); // Units for dropdown

    // Fetch units when opening modal if turf selected
    // Fetch units when opening modal if turf selected
    const fetchUnitsForTurf = async (turfId) => {
        if (!turfId || turfId === 'all') return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/turfs/${turfId}/games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const games = await res.json();
                // Flatten units from games and include price info
                const units = games.flatMap(g => g.units.map(u => ({
                    ...u,
                    game_name: g.game_category,
                    // Use override if exists, else game default
                    calculated_price: u.price_override ? parseFloat(u.price_override) : parseFloat(g.default_price)
                })));
                setImgUnits(units);

                // Default to first unit if none selected
                if (units.length > 0) {
                    setSlotForm(prev => {
                        // Only set if not already set, or if we want to force defaults when switching venues
                        if (!prev.unit_id) {
                            return { ...prev, unit_id: units[0].id, price: units[0].calculated_price };
                        }
                        return prev;
                    });
                }
            }
        } catch (e) { console.error(e); }
    };

    // --- Notifications & Live Updates ---
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!loading && bookings.length > 0) {
            const pending = bookings.filter(b => b.status === 'pending');
            if (pending.length > 0) {
                const latest = pending[0]; // simplistic latest
                setNotification({
                    title: 'Live Update • New Request',
                    message: `${latest.guest_name} wants to book ${latest.turf_name}`,
                    time: 'Just now'
                });

                // Sound effect hint?
                // Auto hide after 8s
                const timer = setTimeout(() => setNotification(null), 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [bookings, loading]);

    const handleSlotClick = (slot) => {
        setSelectedSlot(slot);

        // Reset Form
        const initialTurf = filterTurfId !== 'all' ? filterTurfId : '';
        setSlotForm({
            guest_name: '', guest_phone: '', price: 0, reason: '',
            duration_mins: 60, turf_id: initialTurf, unit_id: ''
        });

        if (initialTurf) fetchUnitsForTurf(initialTurf);

        if (slot.booking) {
            const b = slot.booking;
            const isManual = b.booking_source === 'walk-in' || b.booking_source === 'owner-block';
            if (isManual) {
                setSlotAction(b.status === 'blocked' ? 'edit-block' : 'edit-manual');
                setSlotForm({
                    guest_name: b.guest_name,
                    guest_phone: b.guest_phone || '',
                    price: b.total_price || 0,
                    reason: b.booking_source === 'owner-block' ? b.guest_name.replace('Blocked: ', '') : '',
                    duration_mins: 60, // Cannot easily deduce without end_time - start_time logic, simplifying
                    turf_id: b.turf_id,
                    unit_id: b.turf_unit_id
                });
                setShowSlotModal(true);
            } else {
                alert(`Online Booking: ${b.guest_name}\nStatus: ${b.status}\nCannot edit online bookings here.`);
            }
        } else {
            setSlotAction('manual');
            setShowSlotModal(true);
        }
    };

    const handleSlotSubmit = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // Validation for New Bookings
        if ((slotAction === 'manual' || slotAction === 'block') && (!slotForm.turf_id || !slotForm.unit_id)) {
            alert('Please select a Venue and Court/Unit');
            return;
        }

        try {
            // ISO Start Time
            // selectedSlot.iso is reliable
            const startTimeStr = selectedSlot.iso;

            let url = 'http://localhost:5000/api/owner/bookings/walk-in';
            let method = 'POST';
            let body = {};

            if (slotAction === 'manual') {
                body = {
                    turf_id: parseInt(slotForm.turf_id),
                    unit_id: parseInt(slotForm.unit_id),
                    start_time: startTimeStr,
                    duration_mins: parseInt(slotForm.duration_mins),
                    guest_name: slotForm.guest_name,
                    guest_phone: slotForm.guest_phone,
                    price: parseFloat(slotForm.price) || 0,
                    payment_status: 'paid'
                };
            } else if (slotAction === 'block') {
                url = 'http://localhost:5000/api/owner/bookings/block';
                body = {
                    turf_id: parseInt(slotForm.turf_id),
                    unit_id: parseInt(slotForm.unit_id),
                    start_time: startTimeStr,
                    duration_mins: parseInt(slotForm.duration_mins),
                    reason: slotForm.reason
                };
            } else if (slotAction.startsWith('edit-')) {
                // Update Entry
                url = `http://localhost:5000/api/owner/bookings/${selectedSlot.booking.booking_id}`;
                method = 'PUT';
                body = {
                    guest_name: slotAction === 'edit-block' ? `Blocked: ${slotForm.reason}` : slotForm.guest_name,
                    guest_phone: slotForm.guest_phone,
                    total_price: parseFloat(slotForm.price) || 0
                };
            }

            const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
            const data = await res.json();

            if (res.ok) {
                setShowSlotModal(false);
                fetchData(); // Refresh grid
            } else {
                alert(data.message || 'Operation failed');
            }
        } catch (e) { console.error(e); alert('Error submitting form'); }
    };

    const [activeTab, setActiveTab] = useState('upcoming');

    // Global Filters State (replaces Grid-only state)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
    const [filterTurfId, setFilterTurfId] = useState('all');
    const [filterSource, setFilterSource] = useState('all');

    // Derived Turfs for Dropdown
    const uniqueTurfs = myTurfs.length > 0 ? myTurfs : Array.from(new Set(bookings.map(b => JSON.stringify({ id: b.turf_id, name: b.turf_name }))))
        .map(s => JSON.parse(s));

    // 1. First Layer: Apply Global Filters (Turf, Source, Date)
    const globalFilteredBookings = bookings.filter(b => {
        // Turf Filter
        if (filterTurfId !== 'all' && String(b.turf_id) !== String(filterTurfId)) return false;

        // Source Filter
        if (filterSource !== 'all') {
            const source = b.booking_source || 'online'; // Default to online if missing
            if (filterSource === 'manual' && !['walk-in', 'phone'].includes(source)) return false;
            if (filterSource === 'online' && source !== 'online') return false;
        }

        // Date Filter (Strict Match if selected)
        if (filterDate) {
            const bDate = new Date(b.start_time).toISOString().split('T')[0];
            if (bDate !== filterDate) return false;
        }

        return true;
    });

    // Pending count for badge (always based on raw bookings to alert owner)
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    // Current filtered pending (for display in pending tab)
    const filteredPending = globalFilteredBookings.filter(b => b.status === 'pending');

    // 2. Second Layer: Apply Tab Logic (Status Grouping) for List View
    const getListBookings = () => {
        const base = globalFilteredBookings;
        const now = new Date();

        if (activeTab === 'pending') return filteredPending;

        if (activeTab === 'upcoming') {
            // If explicit date is set, just show all confirmed for that date
            if (filterDate) return base.filter(b => b.status === 'confirmed');
            // Otherwise, show future confirmed
            return base.filter(b => b.status === 'confirmed' && new Date(b.end_time) > now);
        }

        if (activeTab === 'history') {
            return base.filter(b =>
                ['completed', 'cancelled'].includes(b.status) ||
                (b.status === 'confirmed' && new Date(b.end_time) <= now)
            );
        }
        return base;
    };

    const filteredBookings = getListBookings();

    // Helper: Generate Slots for Grid (Uses Global Filters)
    const generateGridSlots = () => {
        // Grid always needs a target date. Use filterDate or Today.
        const targetDate = filterDate || new Date().toISOString().split('T')[0];

        const slots = [];
        const startHour = 5; // 5 AM
        const endHour = 23;  // 11 PM

        for (let h = startHour; h <= endHour; h++) {
            ['00', '30'].forEach(m => {
                const timeLabel = `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
                const slotIso = `${targetDate}T${h.toString().padStart(2, '0')}:${m}:00`;
                const slotDate = new Date(slotIso);

                // Find booking overlapping this slot
                // We use globalFilteredBookings because it already filters Turf & Source.
                // We just need to check the time overlap against the *targetDate* slots.

                const booking = globalFilteredBookings.find(b => {
                    const bStart = new Date(b.start_time);
                    const bEnd = new Date(b.end_time);
                    const sTime = slotDate.getTime();

                    // Simple check: is the slot start time strictly inside the booking duration?
                    // (Or booking matches slot start)
                    return bStart.getTime() <= sTime && bEnd.getTime() > sTime && b.status !== 'cancelled';
                });

                slots.push({
                    time: timeLabel,
                    iso: slotIso,
                    booking: booking
                });
            });
        }
        return slots;
    };

    // Calculate grid slots if in upcoming or history tab
    const gridSlots = ['upcoming', 'history'].includes(activeTab) ? generateGridSlots() : [];

    // Pending bookings (Raw list for Modal support)
    const pendingBookings = bookings.filter(b => b.status === 'pending');

    return (
        <div className="owner-bookings-page">
            <Navbar />

            {/* Pending Modal - same as before */}
            {showPendingModal && pendingBookings.length > 0 && (
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
                                        <button className="action-btn-large btn-accept" onClick={() => handleConfirm(b.booking_id)}>
                                            <Check size={18} /> Approve
                                        </button>
                                        <button className="action-btn-large btn-decline" onClick={() => handleCancel(b.booking_id)}>
                                            <X size={18} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Slot Action Modal --- */}
            {showSlotModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <h2>
                                {slotAction === 'manual' ? 'New Manual Booking' :
                                    slotAction === 'block' ? 'Block Slot' :
                                        slotAction.startsWith('edit') ? 'Update Booking' : 'Manage Slot'}
                            </h2>
                            <button className="modal-close-btn" onClick={() => setShowSlotModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
                            {/* Action toggle for new slots */}
                            {['manual', 'block'].includes(slotAction) && !selectedSlot?.booking && (
                                <div className="tabs-container" style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
                                    <button
                                        className={`tab-btn ${slotAction === 'manual' ? 'active' : ''}`}
                                        onClick={() => setSlotAction('manual')}
                                    >Manual Booking</button>
                                    <button
                                        className={`tab-btn ${slotAction === 'block' ? 'active' : ''}`}
                                        onClick={() => setSlotAction('block')}
                                    >Block Slot</button>
                                </div>
                            )}

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                {/* Selected Time Card */}
                                <div style={{
                                    gridColumn: '1 / -1',
                                    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                                    padding: '1.2rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    marginBottom: '0.5rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '6px' }}>Selected Slot</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center' }}>
                                            <Calendar size={16} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                            {new Date(selectedSlot?.iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            <span style={{ margin: '0 10px', opacity: 0.2 }}>|</span>
                                            <Clock size={16} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                            {new Date(selectedSlot?.iso).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {slotForm.price > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Estimated Price</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>₹{slotForm.price}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Turf/Unit Selection (if not pre-filtered or to change) */}
                                {(!selectedSlot?.booking) && (
                                    <>
                                        {filterTurfId === 'all' && (
                                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Venue Selection</label>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
                                                        value={slotForm.turf_id}
                                                        onChange={(e) => {
                                                            const tid = e.target.value;
                                                            setSlotForm({ ...slotForm, turf_id: tid, unit_id: '' });
                                                            fetchUnitsForTurf(tid);
                                                        }}
                                                    >
                                                        <option value="">Select Venue...</option>
                                                        {uniqueTurfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                    <ChevronRight size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: '#64748b', pointerEvents: 'none' }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Court / Unit</label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
                                                    value={slotForm.unit_id}
                                                    onChange={(e) => {
                                                        const uid = e.target.value;
                                                        const unit = imgUnits.find(u => String(u.id) === String(uid));
                                                        setSlotForm({ ...slotForm, unit_id: uid, price: unit ? unit.calculated_price : 0 });
                                                    }}
                                                    disabled={!slotForm.turf_id}
                                                >
                                                    <option value="">
                                                        {!slotForm.turf_id ? 'Select Venue First' : (imgUnits.length > 0 ? 'Select Court/Pitch' : 'No Units Available')}
                                                    </option>
                                                    {imgUnits.map(u => <option key={u.id} value={u.id}>{u.name} ({u.game_name}) - ₹{u.calculated_price}</option>)}
                                                </select>
                                                <ChevronRight size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: '#64748b', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Fields based on Action */}
                                {slotAction.includes('block') ? (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Blocking Reason</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Scheduled Maintenance"
                                            style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '0.95rem' }}
                                            value={slotForm.reason}
                                            onChange={(e) => setSlotForm({ ...slotForm, reason: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ gridColumn: '1 / -1', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Guest Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter Name"
                                                style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '0.95rem' }}
                                                value={slotForm.guest_name}
                                                onChange={(e) => setSlotForm({ ...slotForm, guest_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Phone (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Mobile Number"
                                                style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '0.95rem' }}
                                                value={slotForm.guest_phone}
                                                onChange={(e) => setSlotForm({ ...slotForm, guest_phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Final Price (₹)</label>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    style={{ width: '100%', padding: '0.9rem', paddingLeft: '2.5rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '0.95rem', fontWeight: 'bold' }}
                                                    value={slotForm.price}
                                                    onChange={(e) => setSlotForm({ ...slotForm, price: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.6rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Duration</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            style={{ width: '100%', padding: '0.9rem', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: 'white', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
                                            value={slotForm.duration_mins}
                                            onChange={(e) => setSlotForm({ ...slotForm, duration_mins: parseInt(e.target.value) })}
                                            disabled={!!selectedSlot?.booking} // Disable for edit
                                        >
                                            <option value={30}>30 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={90}>1.5 Hours</option>
                                            <option value={120}>2 Hours</option>
                                        </select>
                                        <Clock size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions - Sticky at bottom */}
                        <div className="modal-actions" style={{
                            padding: '1.5rem',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: '#151e2d', // Slightly darker
                            display: 'flex', gap: '1rem', justifyContent: 'flex-end',
                            flexShrink: 0
                        }}>
                            <button className="btn-cancel-text" onClick={() => setShowSlotModal(false)}>Cancel</button>
                            <button
                                className="btn-accept"
                                style={{ padding: '0.8rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                onClick={handleSlotSubmit}
                            >
                                {slotAction.startsWith('edit') ? 'Update Booking' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="content-container">
                <div className="section-header">
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Bookings Management</h1>
                        <p style={{ color: '#94a3b8', marginTop: '5px' }}>Track and manage all your venue reservations</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {pendingBookings.length > 0 && !showPendingModal && (
                            <button
                                className="btn-accept highlight-pulse highlight-pulse-btn"
                                style={{ padding: '0.8rem 1.5rem', borderRadius: '50px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                onClick={() => setShowPendingModal(true)}
                            >
                                <Bell size={18} style={{ marginRight: '8px' }} /> Review ({pendingBookings.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* --- NEW SECTION: Quick Stats & Actions --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Card 1: Today's Overview */}
                    <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Visitors</span>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Live</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                            {bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time).toDateString() === new Date().toDateString()).length}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Confirmed bookings for today</div>
                    </div>

                    {/* Card 2: Pending Requests Quick View */}
                    <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Required</span>
                            {pendingCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Urgent</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: pendingCount > 0 ? '#f87171' : 'white' }}>{pendingCount}</div>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>requests</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Awaiting your approval</div>
                    </div>

                    {/* Card 3: Quick Actions */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => { setSlotAction('manual'); setSlotForm({ ...slotForm, turf_id: '', unit_id: '' }); setShowSlotModal(true); }}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                        >
                            <Calendar size={18} /> New Walk-in Booking
                        </button>
                        <button
                            onClick={() => { setSlotAction('block'); setSlotForm({ ...slotForm, turf_id: '', unit_id: '' }); setShowSlotModal(true); }}
                            style={{ background: 'transparent', color: '#cbd5e1', border: '1px solid #475569', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Lock size={18} /> Block a Slot
                        </button>
                    </div>
                </div>

                {/* --- FILTERS BAR --- */}
                <div className="filters-bar" style={{
                    display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
                    background: '#1e293b', padding: '1rem', borderRadius: '12px', marginTop: '1rem', marginBottom: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontWeight: '600', marginRight: '0.5rem' }}>
                        <Filter size={18} style={{ marginRight: '6px' }} /> Filters:
                    </div>

                    {/* Date Picker */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <input
                            type="date"
                            value={filterDate}
                            placeholder="All Dates"
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', paddingLeft: '2.2rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
                        />
                        <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        {filterDate && (
                            <button
                                onClick={() => setFilterDate('')}
                                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>

                    {/* Turf Selector */}
                    <select
                        value={filterTurfId}
                        onChange={(e) => setFilterTurfId(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}
                    >
                        <option value="all">All Venues</option>
                        {uniqueTurfs.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    {/* Source Selector */}
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}
                    >
                        <option value="all">All Sources</option>
                        <option value="online">Online Booking</option>
                        <option value="manual">Manual / Walk-in</option>
                    </select>
                </div>

                {/* --- TAB NAVIGATION (Updated with Pending Count) --- */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('upcoming'); if (!filterDate) setFilterDate(new Date().toISOString().split('T')[0]); }}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending {pendingCount > 0 && <span style={{ marginLeft: '6px', fontSize: '0.8rem', background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '10px' }}>{pendingCount}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>




                {/* --- GRID VIEW (Upcoming & History) --- */}
                {['upcoming', 'history'].includes(activeTab) && (
                    <div className="grid-view-container" style={{ marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                                {activeTab === 'upcoming' && <span className="live-indicator"></span>}
                                {activeTab === 'history' ? 'Past Schedule' : 'Live Schedule'}
                            </span>
                            <span>• <span style={{ color: 'white', marginLeft: '4px' }}>{filterDate || (activeTab === 'history' ? 'Today (Select Date)' : 'Today')}</span></span>
                            {filterTurfId !== 'all' && <span> • Venue: <span style={{ color: 'white' }}>{uniqueTurfs.find(t => String(t.id) === String(filterTurfId))?.name}</span></span>}
                        </div>

                        {/* Slots Render */}
                        <div className="slots-grid-full" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                            gap: '0.8rem'
                        }}>
                            {gridSlots.map((slot, idx) => {
                                let bg = 'rgba(255,255,255,0.02)';
                                let border = '1px solid rgba(255,255,255,0.05)';
                                let color = '#94a3b8';

                                const now = new Date();
                                const slotDate = new Date(slot.iso);
                                const isCurrentHour = activeTab === 'upcoming' &&
                                    (!filterDate || filterDate === now.toISOString().split('T')[0]) &&
                                    now.getHours() === slotDate.getHours();

                                if (isCurrentHour) {
                                    border = '1px solid #10b981';
                                    if (!slot.booking) bg = 'rgba(16, 185, 129, 0.05)';
                                }

                                if (slot.booking) {
                                    color = 'white';
                                    if (['confirmed', 'completed'].includes(slot.booking.status)) {
                                        bg = 'rgba(16, 185, 129, 0.15)';
                                        border = '1px solid rgba(16, 185, 129, 0.4)';
                                    } else if (slot.booking.status === 'pending') {
                                        bg = 'rgba(245, 158, 11, 0.15)';
                                        border = '1px dashed #f59e0b';
                                    } else {
                                        bg = 'rgba(239, 68, 68, 0.15)';
                                        border = '1px solid rgba(239, 68, 68, 0.3)';
                                    }
                                }

                                return (
                                    <div
                                        key={idx}
                                        className="slot-item"
                                        style={{
                                            background: bg, border: border, color: color,
                                            borderRadius: '12px', padding: '1rem',
                                            textAlign: 'center', minHeight: '90px', // slightly taller
                                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'transform 0.2s',
                                            boxShadow: isCurrentHour ? '0 0 15px rgba(16, 185, 129, 0.1)' : 'none'
                                        }}
                                        onClick={() => handleSlotClick(slot)}
                                    >
                                        {isCurrentHour && <div className="live-indicator" style={{ position: 'absolute', top: '6px', right: '6px', margin: 0 }}></div>}

                                        {/* Source Indicator (Top Left) */}
                                        {slot.booking && (
                                            <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                                                {(slot.booking.booking_source === 'walk-in' || slot.booking.booking_source === 'owner-block') ? (
                                                    <div title="Manual / Walk-in" style={{ background: '#3b82f6', borderRadius: '50%', width: '6px', height: '6px', boxShadow: '0 0 5px #3b82f6' }}></div>
                                                ) : (
                                                    <div title="Online" style={{ background: '#10b981', borderRadius: '50%', width: '6px', height: '6px', boxShadow: '0 0 5px #10b981' }}></div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>{slot.time}</div>
                                        {slot.booking ? (
                                            <div style={{ fontSize: '0.75rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ fontWeight: '600', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {slot.booking.guest_name || 'Booked'}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    marginTop: '2px',
                                                    opacity: 0.8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {['walk-in', 'owner-block', 'phone'].includes(slot.booking.booking_source) ? 'MANUAL' : 'ONLINE'}
                                                </div>
                                                <div style={{ textTransform: 'capitalize', opacity: 0.6, fontSize: '0.65rem' }}>{slot.booking.status}</div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.7rem', opacity: 0.3 }}>Available</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}


                {/* List Grid (Shows for All Tabs, filtered) */}
                <div className="bookings-grid" style={{ display: activeTab === 'pending' ? 'grid' : 'none' }}>
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map(b => (
                            <div key={b.booking_id} className="booking-card">
                                <div className="card-header">
                                    <span className={`status-pill ${b.status}`}>{b.status}</span>
                                    <span className="card-price">₹{b.total_price}</span>
                                </div>
                                <div className="card-body">
                                    <div className="card-source-badge" style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {b.booking_source || 'ONLINE'}
                                    </div>
                                    <h3 className="card-title">{b.turf_name}</h3>
                                    <p className="card-subtitle">{b.game_type} • {b.unit_name}</p>

                                    <div className="card-meta">
                                        <div className="meta-row">
                                            <Calendar size={14} />
                                            <span>{new Date(b.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="meta-row">
                                            <Clock size={14} />
                                            <span>
                                                {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {b.guest_name && (
                                        <div className="guest-info">
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Guest</div>
                                            <div>{b.guest_name}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    {b.status === 'pending' ? (
                                        <>
                                            <button className="btn-approve-full" onClick={() => handleConfirm(b.booking_id)}>
                                                <Check size={16} style={{ marginRight: '6px' }} /> Approve
                                            </button>
                                            <button className="btn-reject-icon" onClick={() => handleCancel(b.booking_id)}>
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        (activeTab !== 'history' && b.status !== 'cancelled') && (
                                            <button className="btn-cancel-text" onClick={() => handleCancel(b.booking_id)}>
                                                Cancel Booking
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-grid-state">
                            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No bookings found for this category.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* --- Live Notification Toast --- */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    background: '#1e293b', padding: '1rem 1.5rem', borderRadius: '16px',
                    borderLeft: '4px solid #10b981',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    zIndex: 10000, animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '50%' }}>
                        <Bell size={20} color="#10b981" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>{notification.title}</div>
                        <div style={{ color: 'white', fontWeight: '500', marginTop: '2px' }}>{notification.message}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{notification.time}</div>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '1rem' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};


export default OwnerBookings;
