import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Calendar, Clock, User, Phone, CheckCircle, CreditCard, X, MapPin, Zap, AlertCircle } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './WalkInBooking.css';

const WalkInBooking = () => {
    const navigate = useNavigate();
    const [turfs, setTurfs] = useState([]);
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Selection State (Discovery Pattern)
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);

    // Slots State
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Interaction State
    const [mode, setMode] = useState('book'); // 'book' or 'block'
    const [selectedSlots, setSelectedSlots] = useState([]); // Array of slot objects
    const [timeFilter, setTimeFilter] = useState('Morning'); // Morning, Afternoon, Evening, Night

    // Form State (for booking)
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_phone: '',
        payment_mode: 'cash',
        payment_status: 'paid'
    });

    useEffect(() => {
        fetchTurfs();
    }, []);

    useEffect(() => {
        if (selectedTurf) {
            fetchTurfDetails();
        }
    }, [selectedTurf]);

    // Fetch Slots whenever Unit or Date changes
    useEffect(() => {
        if (selectedUnit && date) {
            fetchSlots();
            setSelectedSlots([]); // Clear selection on context change
        }
    }, [selectedUnit, date]);

    const fetchTurfs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTurfs(data);
                if (data.length > 0) setSelectedTurf(data[0]);
            }
        } catch (err) { console.error(err); }
    };

    const fetchTurfDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/${selectedTurf.id}/games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setGames(data);

            // Auto Select Defaults
            if (data.length > 0) {
                setSelectedGame(data[0]);
                if (data[0].units && data[0].units.length > 0) {
                    setSelectedUnit(data[0].units[0]);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
            // Using the same endpoint as Discovery Page for consistency
            const res = await fetch(`${API_URL}/api/units/${selectedUnit.id}/slots?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoadingSlots(false); }
    };

    const handleGameClick = (game) => {
        setSelectedGame(game);
        if (game.units && game.units.length > 0) {
            setSelectedUnit(game.units[0]);
        } else {
            setSelectedUnit(null);
        }
    };

    const toggleSlot = (slot) => {
        if (slot.status === 'booked' || slot.status === 'blocked') return;

        let newSelection = [...selectedSlots];
        const existingIndex = newSelection.findIndex(s => s.id === slot.id);

        if (existingIndex >= 0) {
            newSelection.splice(existingIndex, 1);
        } else {
            newSelection.push(slot);
        }

        // Sort by time
        newSelection.sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
        setSelectedSlots(newSelection);
    };

    // Calculate Total Price
    const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
    const totalDuration = selectedSlots.length * 30; // Assuming 30 min slots based on Discovery pattern, or adjust based on slot logic

    const handleSubmit = async () => {
        if (selectedSlots.length === 0) return;

        // Group selected slots into contiguous blocks
        const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
        const blocks = [];
        let currentBlock = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            // Check continuity (end of prev == start of curr)
            if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                currentBlock.push(sorted[i]);
            } else {
                blocks.push(currentBlock);
                currentBlock = [sorted[i]];
            }
        }
        blocks.push(currentBlock);

        // Validation: Enforce Minimum 1 Hour (2 slots) per block for BOOKINGS
        // (Blocking for maintenance might legitimately be 30 mins, so we skip this check for 'block' mode)
        if (mode === 'book') {
            const invalidBlocks = blocks.filter(b => b.length < 2);
            if (invalidBlocks.length > 0) {
                showWarning('Invalid Duration', "Minimum booking duration is 1 hour (2 slots) per continuous block.");
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const promises = blocks.map(async (block) => {
                const startTime = block[0].start_iso;
                const durationMins = block.length * 30; // Assuming 30min slots
                const blockPrice = block.reduce((sum, s) => sum + s.price, 0);

                let url = `${API_URL}/api/owner/bookings/walk-in`;
                let payload = {
                    turf_id: selectedTurf.id,
                    unit_id: selectedUnit.id,
                    start_time: startTime,
                    duration_mins: durationMins
                };

                if (mode === 'block') {
                    url = `${API_URL}/api/owner/bookings/block`;
                    payload.reason = formData.guest_name || 'Maintenance';
                } else {
                    payload.guest_name = formData.guest_name || 'Walk-In';
                    payload.guest_phone = formData.guest_phone;
                    payload.payment_mode = formData.payment_mode;
                    payload.payment_status = formData.payment_status;
                    payload.price = blockPrice;
                }

                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Booking failed');
                }
                return res.json();
            });

            await Promise.all(promises);

            await Promise.all(promises);

            showSuccess(mode === 'block' ? 'Blocked' : 'Confirmed', mode === 'block' ? 'Slots Blocked Successfully' : 'Bookings Confirmed');
            setFormData({ ...formData, guest_name: '', guest_phone: '' });
            fetchSlots(); // Refresh grid

        } catch (e) {
            console.error(e);
            showError('Process Failed', 'Failed to process: ' + e.message);
        }
    };

    return (
        <div className="walk-in-page">
            <Navbar />

            <div className="walk-in-container">
                {/* Header Section */}
                <div className="wb-header-new">
                    <div>
                        <h1>{mode === 'block' ? 'Block Slots' : 'Walk-In Booking'}</h1>
                        <p className="subtitle">Manage availability and instant bookings</p>
                    </div>

                    {/* Mode Toggle & Turf Select */}
                    <div className="wb-actions">
                        <div className="mode-toggle">
                            <button
                                className={mode === 'book' ? 'active' : ''}
                                onClick={() => setMode('book')}
                            >
                                <Zap size={16} /> Book
                            </button>
                            <button
                                className={mode === 'block' ? 'active block-mode' : ''}
                                onClick={() => setMode('block')}
                            >
                                <AlertCircle size={16} /> Block
                            </button>
                        </div>

                        <select
                            className="turf-select"
                            value={selectedTurf?.id || ''}
                            onChange={(e) => {
                                const t = turfs.find(t => t.id === parseInt(e.target.value));
                                setSelectedTurf(t);
                            }}
                        >
                            {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Info */}
                <div className="wb-layout">

                    {/* Left Panel: Slot Selection */}
                    <div className="wb-main-panel">

                        {/* 1. Game & Unit Selection (Pills) */}
                        <div className="selection-section">
                            {/* Game Tabs */}
                            {games.length > 1 && (
                                <div className="game-tabs">
                                    {games.map(game => (
                                        <button
                                            key={game.id}
                                            className={`game-tab ${selectedGame?.id === game.id ? 'active' : ''}`}
                                            onClick={() => handleGameClick(game)}
                                        >
                                            {game.sport_type}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Unit Pills */}
                            {selectedGame && selectedGame.units && (
                                <div className="unit-pills-row">
                                    {selectedGame.units.map(unit => (
                                        <button
                                            key={unit.id}
                                            className={`unit-pill-item ${selectedUnit?.id === unit.id ? 'active' : ''}`}
                                            onClick={() => setSelectedUnit(unit)}
                                        >
                                            <span style={{ fontWeight: '600' }}>{unit.name}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '6px' }}>{unit.unit_type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Date & Time Filter */}
                        <div className="filter-bar">
                            <input
                                type="date"
                                className="date-input-styled"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />

                            <div className="time-filters">
                                {['Morning', 'Afternoon', 'Evening', 'Night'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setTimeFilter(filter)}
                                        className={`time-filter-btn ${timeFilter === filter ? 'active' : ''}`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Slots Grid */}
                        <div className="slots-grid-area">
                            {loadingSlots ? (
                                <div className="loading-state">Loading availability...</div>
                            ) : (
                                <div className="slots-grid-display">
                                    {slots.filter(s => {
                                        const h = new Date(s.start_iso).getHours();
                                        if (timeFilter === 'Morning') return h >= 5 && h < 12;
                                        if (timeFilter === 'Afternoon') return h >= 12 && h < 17;
                                        if (timeFilter === 'Evening') return h >= 17 && h < 21;
                                        if (timeFilter === 'Night') return h >= 21 || h < 5;
                                        return true;
                                    }).length === 0 ? (
                                        <div className="empty-state">No slots available for {timeFilter}</div>
                                    ) : (
                                        slots.filter(s => {
                                            const h = new Date(s.start_iso).getHours();
                                            if (timeFilter === 'Morning') return h >= 5 && h < 12;
                                            if (timeFilter === 'Afternoon') return h >= 12 && h < 17;
                                            if (timeFilter === 'Evening') return h >= 17 && h < 21;
                                            if (timeFilter === 'Night') return h >= 21 || h < 5;
                                            return true;
                                        }).map(slot => {
                                            const isSelected = selectedSlots.find(s => s.id === slot.id);
                                            // Handle blocked vs booked visually
                                            const isBooked = slot.status === 'booked';
                                            const isBlocked = slot.status === 'blocked';
                                            const isDisabled = isBooked || isBlocked;

                                            return (
                                                <button
                                                    key={slot.id}
                                                    disabled={isDisabled}
                                                    onClick={() => toggleSlot(slot)}
                                                    className={`slot-btn ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${isBlocked ? 'blocked' : ''}`}
                                                >
                                                    <div className="slot-time">{slot.time.split(' ')[0]}</div>
                                                    <div className="slot-ampm">{slot.time.split(' ')[1]}</div>
                                                    {/* Price hint if needed */}
                                                    <div className="slot-price">₹{slot.price}</div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Booking Summary (Sticky) */}
                    <div className="wb-sidebar">
                        <div className="booking-card-summary">
                            <h3>{mode === 'block' ? 'Block Summary' : 'Booking Summary'}</h3>

                            <div className="summary-details">
                                <div className="sd-row">
                                    <span>Turf</span>
                                    <strong>{selectedTurf?.name}</strong>
                                </div>
                                <div className="sd-row">
                                    <span>Unit</span>
                                    <strong>{selectedUnit?.name}</strong>
                                </div>
                                <div className="sd-row">
                                    <span>Date</span>
                                    <strong>{date}</strong>
                                </div>
                            </div>

                            <div className="selected-slots-list">
                                {selectedSlots.length > 0 ? (
                                    <>
                                        <div className="slot-tags">
                                            {selectedSlots.map(s => (
                                                <span key={s.id} className="slot-tag">
                                                    {s.time}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="total-row">
                                            <span>Total Duration</span>
                                            <span>{totalDuration / 60} hrs</span>
                                        </div>
                                        {mode !== 'block' && (
                                            <div className="total-row highlight">
                                                <span>Total Price</span>
                                                <span>₹{totalPrice}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-selection">Select slots from the grid</div>
                                )}
                            </div>

                            {/* Form Inputs */}
                            {selectedSlots.length > 0 && (
                                <div className="form-inputs">
                                    {mode === 'block' ? (
                                        <div className="form-grp">
                                            <label>Reason (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Maintenance"
                                                value={formData.guest_name}
                                                onChange={e => setFormData({ ...formData, guest_name: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="form-grp">
                                                <label>Customer Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Walk-In Guest"
                                                    value={formData.guest_name}
                                                    onChange={e => setFormData({ ...formData, guest_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-grp">
                                                <label>Phone (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.guest_phone}
                                                    onChange={e => setFormData({ ...formData, guest_phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-grp">
                                                <label>Payment Mode</label>
                                                <div className="toggle-grp">
                                                    <button
                                                        className={formData.payment_mode === 'cash' ? 'active' : ''}
                                                        onClick={() => setFormData({ ...formData, payment_mode: 'cash' })}
                                                    >Cash</button>
                                                    <button
                                                        className={formData.payment_mode === 'upi' ? 'active' : ''}
                                                        onClick={() => setFormData({ ...formData, payment_mode: 'upi' })}
                                                    >UPI</button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        className={`confirm-btn ${mode === 'block' ? 'btn-danger' : 'btn-primary'}`}
                                        onClick={handleSubmit}
                                    >
                                        {mode === 'block' ? 'Block Selected Slots' : 'Confirm & Collect'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default WalkInBooking;
