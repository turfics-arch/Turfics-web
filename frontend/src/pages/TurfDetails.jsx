import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Calendar, Clock, MapPin, Check, AlertCircle, Shield,
    Info, Star, Phone, MessageCircle, Ruler, Zap, Sun, Award, ThumbsUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import './TurfDetails.css';

// Fix Leaflet Default Icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TurfDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data States
    const [turfData, setTurfData] = useState(null); // { turf, games }
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);

    // Booking States
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error
    const [timeFilter, setTimeFilter] = useState('Morning'); // Morning, Afternoon, Evening, Night



    // Image Catalog State
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    useEffect(() => { setActiveImgIndex(0); }, [selectedUnit]);

    // Fetch Turf Data
    useEffect(() => {
        const fetchTurf = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/turfs/${id}/full`);
                if (res.ok) {
                    const data = await res.json();
                    setTurfData(data);

                    // Auto-select first game/unit
                    if (data.games && data.games.length > 0) {
                        const firstGame = data.games[0];
                        setSelectedGame(firstGame);
                        if (firstGame.units && firstGame.units.length > 0) {
                            setSelectedUnit(firstGame.units[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching turf:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTurf();
    }, [id]);

    // Fetch Slots when Unit or Date changes
    useEffect(() => {
        if (selectedUnit && selectedDate) {
            setSlots([]); // Clear prev slots
            const fetchSlots = async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/units/${selectedUnit.id}/slots?date=${selectedDate}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSlots(data);
                    }
                } catch (error) {
                    console.error("Error fetching slots:", error);
                }
            };
            fetchSlots();
        }
    }, [selectedUnit, selectedDate]);

    // Handle Game Selection Change
    const handleGameClick = (game) => {
        setSelectedGame(game);
        if (game.units && game.units.length > 0) {
            setSelectedUnit(game.units[0]);
        } else {
            setSelectedUnit(null);
        }
    };

    const toggleSlot = (slot) => {
        console.log('Toggling slot:', slot);
        if (slot.status === 'booked') {
            console.log('Slot is booked, ignoring.');
            return;
        }

        let newSelection = [...selectedSlots];
        // Use loose comparison or string conversion for safety
        const existingIndex = newSelection.findIndex(s => String(s.id) === String(slot.id));

        if (existingIndex >= 0) {
            newSelection.splice(existingIndex, 1);
        } else {
            newSelection.push(slot);
        }

        newSelection.sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
        setSelectedSlots(newSelection);
    };

    const handleBookSlot = async () => {
        if (!selectedSlots.length || !selectedUnit) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to book a slot");
            navigate('/login');
            return;
        }

        // Group slots into contiguous batches
        const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
        const batches = [];
        let currentBatch = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const prev = currentBatch[currentBatch.length - 1];
            const curr = sorted[i];
            // Check if contiguous (end of prev matches start of curr)
            if (new Date(prev.end_iso).getTime() === new Date(curr.start_iso).getTime()) {
                currentBatch.push(curr);
            } else {
                batches.push(currentBatch);
                currentBatch = [curr];
            }
        }
        batches.push(currentBatch);

        // Validation: Enforce 1 Hour (2 slots) per batch
        const shortBatches = batches.filter(b => b.length < 2);
        if (shortBatches.length > 0) {
            alert('Each continuous playing session must be at least 1 hour (2 slots).');
            return;
        }

        const totalHours = selectedSlots.length * 0.5;
        const totalPrice = selectedSlots.reduce((a, s) => a + s.price, 0);

        if (!window.confirm(`Hold ${batches.length > 1 ? batches.length + ' separate blocks ' : ''}for total ${totalHours} hours?\nTotal Price: ₹${totalPrice}`)) {
            return;
        }

        setBookingStatus('loading');
        let successInfo = [];
        let errors = [];

        try {
            for (const batch of batches) {
                const start = batch[0].start_iso;
                const end = batch[batch.length - 1].end_iso;
                const batchPrice = batch.reduce((a, s) => a + s.price, 0);

                const response = await fetch('http://localhost:5000/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        turf_unit_id: selectedUnit.id,
                        start_time: start,
                        end_time: end,
                        total_price: batchPrice
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    successInfo.push({
                        id: data.booking_id,
                        start_time: start,
                        end_time: end,
                        price: batchPrice
                    });
                } else {
                    const err = await response.json();
                    errors.push(err.message || 'Unknown error');
                }
            }

            if (successInfo.length > 0) {
                // Navigate to confirmation with held bookings
                const confirmedTotal = successInfo.reduce((a, b) => a + b.price, 0);
                navigate('/booking-confirmation', {
                    state: {
                        bookingIds: successInfo.map(b => b.id),
                        totalPrice: confirmedTotal,
                        bookingsInfo: successInfo
                    }
                });
            } else {
                setBookingStatus('error');
                alert(`All holds failed.\nErrors: ${errors.join(', ')}`);
                // Refresh slots
                const slotRes = await fetch(`http://localhost:5000/api/units/${selectedUnit.id}/slots?date=${selectedDate}`);
                const slotData = await slotRes.json();
                setSlots(slotData);
            }
        } catch (error) {
            console.error('Booking Error:', error);
            setBookingStatus('error');
            alert('Failed to connect to server');
        } finally {
            setBookingStatus('idle');
        }
    };

    if (loading) return <div className="loading">Loading turf details...</div>;
    if (!turfData) return <div className="error">Turf not found</div>;

    const { turf, games } = turfData;

    return (
        <div className="turf-details-page">
            <Navbar />

            {/* Header Section */}
            <header className="turf-header" style={{ backgroundImage: `url(${turf.image_url || '/default-turf.jpg'})` }}>
                <div className="header-overlay">
                    <div className="container">
                        <h1>{turf.name}</h1>
                        <p className="location"><MapPin size={18} /> {turf.location}</p>
                        <div className="badges">
                            {turf.facilities && turf.facilities.split(',').map((f, i) => (
                                <span key={i} className="badge">{f.trim()}</span>
                            ))}
                            {turf.rating && <span className="badge star"><Star size={14} fill="white" /> {turf.rating}</span>}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container content-layout">
                {/* Main Content */}
                <div className="main-section">

                    {/* Game Selection Tabs */}
                    {/* SELECTION AREA: Games & Units - Split Layout */}
                    {(games.length > 1 || (selectedGame && selectedGame.units && selectedGame.units.length > 1)) && (
                        <div className="selection-row">

                            {/* Left: Sport Selector (Only if multiple games) */}
                            {games.length > 1 && (
                                <div className="sports-col">
                                    <h3>Sport</h3>
                                    <div className="vertical-tabs">
                                        {games.map(game => (
                                            <button
                                                key={game.id}
                                                className={`tab-btn ${selectedGame?.id === game.id ? 'active' : ''}`}
                                                onClick={() => handleGameClick(game)}
                                            >
                                                {game.sport_type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Right: Unit Selector */}
                            <div className="units-col">
                                {selectedGame && selectedGame.units && selectedGame.units.length > 1 ? (
                                    <>
                                        <h3>Select Court/Pitch</h3>
                                        <div className="unit-pills">
                                            {selectedGame.units.map(unit => (
                                                <button
                                                    key={unit.id}
                                                    className={`unit-pill ${selectedUnit?.id === unit.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedUnit(unit)}
                                                >
                                                    <div className="unit-name">{unit.name}</div>
                                                    <div className="unit-meta">{unit.unit_type} • {unit.capacity} Players</div>
                                                    {unit.indoor && <span className="tag">Indoor</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    /* Single Unit Summary */
                                    <div>
                                        <h3>{selectedUnit?.name || 'Selected Unit'}</h3>
                                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                            {selectedUnit?.unit_type} • {selectedUnit?.capacity} Players
                                            {selectedUnit?.indoor && ' • Indoor'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Single Info Header (Only if BOTH are single - otherwise handled above) */}
                    {games.length === 1 && selectedGame?.units && selectedGame.units.length === 1 && (
                        <div className="section single-game-header" style={{ padding: '1rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{selectedGame.sport_type}</span>
                                {selectedUnit && (
                                    <>
                                        <span style={{ color: '#666' }}>•</span>
                                        <span style={{ color: 'var(--primary)' }}>{selectedUnit.name}</span>
                                    </>
                                )}
                            </h3>
                            {selectedUnit && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                    {selectedUnit.unit_type} • {selectedUnit.capacity} Players {selectedUnit.indoor ? '• Indoor' : ''}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Unit Gallery (Catalog Style) */}
                    {selectedUnit && selectedUnit.images && selectedUnit.images.length > 0 && (
                        <div className="section unit-gallery-catalog">
                            <h3>{selectedUnit.name} Gallery</h3>

                            <div className="catalog-hero">
                                <img
                                    src={selectedUnit.images[activeImgIndex].url}
                                    alt={selectedUnit.images[activeImgIndex].caption}
                                    className="hero-img"
                                />
                                {selectedUnit.images.length > 1 && (
                                    <>
                                        <button className="nav-btn prev" onClick={() => setActiveImgIndex(prev => prev === 0 ? selectedUnit.images.length - 1 : prev - 1)}>
                                            &#10094;
                                        </button>
                                        <button className="nav-btn next" onClick={() => setActiveImgIndex(prev => prev === selectedUnit.images.length - 1 ? 0 : prev + 1)}>
                                            &#10095;
                                        </button>
                                    </>
                                )}
                                {selectedUnit.images[activeImgIndex].caption && (
                                    <div className="hero-caption">{selectedUnit.images[activeImgIndex].caption}</div>
                                )}
                            </div>

                            {selectedUnit.images.length > 1 && (
                                <div className="catalog-thumbnails">
                                    {selectedUnit.images.map((img, idx) => (
                                        <div
                                            key={img.id}
                                            className={`thumb-item ${idx === activeImgIndex ? 'active' : ''}`}
                                            onClick={() => setActiveImgIndex(idx)}
                                        >
                                            <img src={img.url} alt="" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}




                    {/* Amenities Details */}
                    <div className="section details">
                        <h3>About Venue</h3>
                        <p>{turf.description || "No description available."}</p>

                        <h4>Amenities</h4>
                        <div className="features-grid">
                            {turf.amenities && turf.amenities.split(',').map((amenity, i) => (
                                <div key={i} className="feature-item">
                                    <Check size={16} color="var(--primary)" /> {amenity.trim()}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location Section (Main Bottom) */}
                    <div className="section location-section">
                        <h3>Location</h3>
                        <p>{turf.location}</p>
                        <div
                            className="map-container-large"
                            style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem', position: 'relative', zIndex: 1, border: '1px solid var(--border)' }}
                        >
                            <MapContainer
                                center={[turf.latitude || 0, turf.longitude || 0]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                <Marker position={[turf.latitude || 0, turf.longitude || 0]} />
                            </MapContainer>
                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 999, cursor: 'pointer' }} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${turf.latitude},${turf.longitude}`, '_blank')} title="Get Directions" />
                        </div>
                    </div>
                </div>

                <div className="sidebar">
                    {selectedUnit ? (
                        <div className="section booking-card" style={{ position: 'sticky', top: '100px', padding: '0.8rem', borderRadius: '16px', background: '#111', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Book {selectedUnit.name}</h3>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{selectedDate}</div>
                            </div>

                            {/* Date Strip (Extended Scroll - 90 Days) */}
                            <div className="date-strip-compact" style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1.2rem', scrollbarWidth: 'thin' }}>
                                {Array.from({ length: 90 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = selectedDate === dateStr;
                                    const isFirstDayOfMonth = d.getDate() === 1;

                                    return (
                                        <div key={dateStr} style={{ display: 'flex', flexDirection: 'column' }}>
                                            {isFirstDayOfMonth && <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 'bold' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>}
                                            <button
                                                onClick={() => setSelectedDate(dateStr)}
                                                style={{
                                                    flex: '0 0 auto', minWidth: '50px', height: '60px', borderRadius: '12px',
                                                    background: isSelected ? 'var(--primary)' : '#222',
                                                    border: isSelected ? 'none' : '1px solid #333',
                                                    color: isSelected ? 'black' : '#888',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.75rem',
                                                    marginTop: isFirstDayOfMonth ? 0 : '14px' // Align with month label if present logic (simplified)
                                                    // actually aligning might be tricky with flex. Let's keep it simple.
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{d.getDate()}</span>
                                                <span style={{ fontSize: '0.7rem' }}>{d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time Filters */}
                            <div className="time-scale" style={{ display: 'flex', background: '#222', borderRadius: '12px', padding: '3px', marginBottom: '1rem' }}>
                                {['Morning', 'Afternoon', 'Evening', 'Night'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setTimeFilter(filter)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            borderRadius: '10px',
                                            background: timeFilter === filter ? '#333' : 'transparent',
                                            color: timeFilter === filter ? 'white' : '#666',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: timeFilter === filter ? 'bold' : 'normal',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* Slots Grid (Expanded Height & Standard Size) */}
                            <div className="slots-grid-sidebar" style={{ minHeight: '300px', maxHeight: '550px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem', padding: '2px' }}>
                                {slots.filter(s => {
                                    const h = new Date(s.start_iso).getHours();
                                    if (timeFilter === 'Morning') return h >= 5 && h < 12;
                                    if (timeFilter === 'Afternoon') return h >= 12 && h < 17;
                                    if (timeFilter === 'Evening') return h >= 17 && h < 21;
                                    if (timeFilter === 'Night') return h >= 21 || h < 5;
                                    return true;
                                }).length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#555', padding: '3rem', fontSize: '0.9rem' }}>
                                        No slots available in {timeFilter}
                                    </div>
                                ) : (
                                    slots.filter(s => {
                                        const h = new Date(s.start_iso).getHours();
                                        if (timeFilter === 'Morning') return h >= 5 && h < 12;
                                        if (timeFilter === 'Afternoon') return h >= 12 && h < 17;
                                        if (timeFilter === 'Evening') return h >= 17 && h < 21;
                                        if (timeFilter === 'Night') return h >= 21 || h < 5;
                                        return true;
                                    }).map(slot => {
                                        const isSelected = selectedSlots.find(s => String(s.id) === String(slot.id));
                                        return (
                                            <button
                                                key={slot.id}
                                                disabled={slot.status === 'booked'}
                                                onClick={() => toggleSlot(slot)}
                                                style={{
                                                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    border: isSelected ? 'none' : '1px solid #333',
                                                    color: isSelected ? 'black' : '#ccc',
                                                    borderRadius: '12px',
                                                    padding: '0.6rem 0.4rem',
                                                    fontSize: '0.8rem',
                                                    cursor: slot.status === 'booked' ? 'not-allowed' : 'pointer',
                                                    opacity: slot.status === 'booked' ? 0.4 : 1,
                                                    height: '60px',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{slot.time.split(' ')[0]}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{slot.time.split(' ')[1]}</div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {selectedSlots.length > 0 && (
                                <div className="booking-action" style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '0.8rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem', textAlign: 'center' }}>
                                        {(() => {
                                            const totalHours = selectedSlots.length * 0.5;

                                            // Check Logic
                                            const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
                                            let hasShortBlock = false;
                                            if (sorted.length > 0) {
                                                let currentRun = 1;
                                                for (let i = 1; i < sorted.length; i++) {
                                                    if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                                                        currentRun++;
                                                    } else {
                                                        if (currentRun < 2) hasShortBlock = true;
                                                        currentRun = 1;
                                                    }
                                                }
                                                if (currentRun < 2) hasShortBlock = true;
                                            }

                                            if (hasShortBlock) return <span style={{ color: '#eab308' }}>Min 1 hour per continuous block</span>;
                                            return <span style={{ color: '#10b981' }}>{totalHours}h Selected • ₹{selectedSlots.reduce((a, s) => a + s.price, 0)}</span>;
                                        })()}
                                    </div>

                                    <button
                                        className="book-btn"
                                        onClick={handleBookSlot}
                                        disabled={(() => {
                                            if (selectedSlots.length === 0 || bookingStatus === 'loading') return true;

                                            // Validation Logic
                                            const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
                                            if (sorted.length === 0) return true;

                                            let currentRun = 1;
                                            for (let i = 1; i < sorted.length; i++) {
                                                if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                                                    currentRun++;
                                                } else {
                                                    if (currentRun < 2) return true; // Short block found
                                                    currentRun = 1;
                                                }
                                            }
                                            return currentRun < 2;
                                        })()}
                                        style={{
                                            width: '100%', padding: '0.8rem', fontSize: '0.95rem', borderRadius: '50px',
                                            background: (() => {
                                                if (selectedSlots.length === 0) return '#333';

                                                // Validation Logic for color
                                                const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
                                                let isValid = true;
                                                let currentRun = 1;
                                                for (let i = 1; i < sorted.length; i++) {
                                                    if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                                                        currentRun++;
                                                    } else {
                                                        if (currentRun < 2) isValid = false;
                                                        currentRun = 1;
                                                    }
                                                }
                                                if (currentRun < 2) isValid = false;

                                                return isValid ? 'var(--primary)' : '#333';
                                            })(),
                                            color: (() => {
                                                if (selectedSlots.length === 0) return '#666';

                                                const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
                                                let isValid = true;
                                                let currentRun = 1;
                                                for (let i = 1; i < sorted.length; i++) {
                                                    if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                                                        currentRun++;
                                                    } else {
                                                        if (currentRun < 2) isValid = false;
                                                        currentRun = 1;
                                                    }
                                                }
                                                if (currentRun < 2) isValid = false;

                                                return isValid ? 'black' : '#666';
                                            })(),
                                            fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: 'all 0.2s'
                                        }}
                                    >
                                        {bookingStatus === 'loading' ? 'Processing...' : 'Hold & Proceed'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="section" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888', position: 'sticky', top: '100px' }}>
                            <h3>Ready to Book?</h3>
                            <p>Select a sport and court to see available times.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sticky Booking Footer */}
            {selectedSlots.length > 0 && (
                <div className="mobile-booking-footer">
                    <div className="mbf-info">
                        <span className="mbf-time">{selectedSlots.length * 0.5} Hours</span>
                        <span className="mbf-price">₹{selectedSlots.reduce((a, s) => a + s.price, 0)}</span>
                    </div>
                    <button
                        className="mbf-btn"
                        onClick={handleBookSlot}
                        disabled={bookingStatus === 'loading'}
                    >
                        {bookingStatus === 'loading' ? 'Processing...' : 'Proceed'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TurfDetails;
