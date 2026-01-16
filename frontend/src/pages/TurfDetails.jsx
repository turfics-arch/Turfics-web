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
import Loader from '../components/Loader';
import { API_URL } from '../utils/api';
import { showSuccess, showError, showConfirm, showWarning } from '../utils/SwalUtils';
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
    const [showModal, setShowModal] = useState(false); // Full screen modal state
    const [suggestedTurfs, setSuggestedTurfs] = useState([]); // All suggested turfs
    const [visibleCount, setVisibleCount] = useState(2); // Initially show 2
    useEffect(() => { setActiveImgIndex(0); }, [selectedUnit]);

    // Auto-slide Gallery
    useEffect(() => {
        if (!selectedUnit || !selectedUnit.images || selectedUnit.images.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImgIndex(prev => (prev === selectedUnit.images.length - 1 ? 0 : prev + 1));
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, [selectedUnit]);

    // Fetch Turf Data
    useEffect(() => {
        const fetchTurf = async () => {
            try {
                const res = await fetch(`${API_URL}/api/turfs/${id}/full`);
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

    // Fetch Suggested Turfs
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`${API_URL}/api/turfs`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter current turf and take some random ones (e.g., up to 10)
                    const others = data.filter(t => t.id !== parseInt(id));
                    setSuggestedTurfs(others.sort(() => 0.5 - Math.random()).slice(0, 8));
                }
            } catch (err) {
                console.error("Error fetching suggestions", err);
            }
        };
        fetchSuggestions();
    }, [id]);

    // Fetch Slots when Unit or Date changes
    useEffect(() => {
        if (selectedUnit && selectedDate) {
            setSlots([]); // Clear prev slots
            const fetchSlots = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/units/${selectedUnit.id}/slots?date=${selectedDate}`);
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
            showWarning('Login Required', 'Please login to book a slot').then(() => {
                navigate('/login');
            });
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



        const result = await showConfirm(
            'Book Turf?',
            `Book <b>${batches.length > 1 ? batches.length + ' separate blocks ' : ''}</b> for <b>${totalHours} hours</b>?<br/>Total Price: <b>₹${totalPrice}</b>`,
            'Yes, Book it!'
        );

        if (!result.isConfirmed) return;

        setBookingStatus('loading');
        let successInfo = [];
        let errors = [];

        try {
            for (const batch of batches) {
                const start = batch[0].start_iso;
                const end = batch[batch.length - 1].end_iso;
                const batchPrice = batch.reduce((a, s) => a + s.price, 0);

                const response = await fetch(`${API_URL}/api/bookings`, {
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

                    // Specific fix for execution: Check for token expiration
                    if (response.status === 401 || err.message === 'Token has expired') {
                        setBookingStatus('idle');
                        await showWarning('Session Expired', 'Your session has expired. Please login again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/login');
                        return; // Stop booking loop
                    }

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
                showError('Booking Failed', `Errors: ${errors.join(', ')}`);
                // Refresh slots
                const slotRes = await fetch(`${API_URL}/api/units/${selectedUnit.id}/slots?date=${selectedDate}`);
                const slotData = await slotRes.json();
                setSlots(slotData);
            }
        } catch (error) {
            console.error('Booking Error:', error);
            setBookingStatus('error');
            showError('Error', 'Failed to connect to server');
        } finally {
            setBookingStatus('idle');
        }
    };

    if (loading) return <Loader text="Preparing Pitch..." />;
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

                            <div className="catalog-hero" onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
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
                        <div className="booking-card">
                            <div className="booking-card-header">
                                <h3>Book {selectedUnit.name}</h3>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{selectedDate}</div>
                            </div>

                            {/* Date Strip */}
                            <div className="date-strip-compact">
                                {Array.from({ length: 90 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = selectedDate === dateStr;
                                    const isFirstDayOfMonth = d.getDate() === 1;

                                    return (
                                        <div key={dateStr} style={{ display: 'flex', flexDirection: 'column' }}>
                                            {isFirstDayOfMonth && <div style={{ fontSize: '0.6rem', color: 'var(--primary)', marginBottom: '2px', fontWeight: 'bold' }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>}
                                            <button
                                                className={`date-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => setSelectedDate(dateStr)}
                                                style={{ marginTop: isFirstDayOfMonth ? 0 : '14px' }}
                                            >
                                                <span className="day">{d.getDate()}</span>
                                                <span className="weekday">{d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time Filters */}
                            <div className="time-filters">
                                {['Morning', 'Afternoon', 'Evening', 'Night'].map(filter => (
                                    <button
                                        key={filter}
                                        className={`time-filter-btn ${timeFilter === filter ? 'active' : ''}`}
                                        onClick={() => setTimeFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* Scrollable Slots Area */}
                            <div className="slots-scroll-area">
                                <div className="slots-grid-sidebar">
                                    {slots.filter(s => {
                                        const h = new Date(s.start_iso).getHours();
                                        if (timeFilter === 'Morning') return h >= 5 && h < 12;
                                        if (timeFilter === 'Afternoon') return h >= 12 && h < 17;
                                        if (timeFilter === 'Evening') return h >= 17 && h < 21;
                                        if (timeFilter === 'Night') return h >= 21 || h < 5;
                                        return true;
                                    }).length === 0 ? (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#555', padding: '2rem 1rem', fontSize: '0.8rem' }}>
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
                                                    className={`slot-btn ${isSelected ? 'selected' : ''}`}
                                                >
                                                    <span className="time">{slot.time.split(' ')[0]}</span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Footer Action */}
                            {selectedSlots.length > 0 && (
                                <div className="booking-card-footer">
                                    <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem', textAlign: 'center' }}>
                                        {(() => {
                                            const totalHours = selectedSlots.length * 0.5;
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

                                            if (hasShortBlock) return <span style={{ color: '#eab308' }}>Min 1h blocks</span>;
                                            return <span style={{ color: '#10b981' }}>{totalHours}h • ₹{selectedSlots.reduce((a, s) => a + s.price, 0)}</span>;
                                        })()}
                                    </div>

                                    <button
                                        className="book-btn"
                                        onClick={handleBookSlot}
                                        disabled={(() => {
                                            if (selectedSlots.length === 0 || bookingStatus === 'loading') return true;
                                            const sorted = [...selectedSlots].sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso));
                                            if (sorted.length === 0) return true;
                                            let currentRun = 1;
                                            for (let i = 1; i < sorted.length; i++) {
                                                if (new Date(sorted[i - 1].end_iso).getTime() === new Date(sorted[i].start_iso).getTime()) {
                                                    currentRun++;
                                                } else {
                                                    if (currentRun < 2) return true;
                                                    currentRun = 1;
                                                }
                                            }
                                            return currentRun < 2;
                                        })()}
                                    >
                                        {bookingStatus === 'loading' ? 'Processing...' : 'Book Now'}
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

            {/* Platform Stats Banner Full Width */}
            <div className="stats-banner-full">
                <div className="container">
                    <div className="stats-grid-centered">
                        <div className="stat-item">
                            <h3>500+</h3>
                            <p>Venues</p>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <h3>150K</h3>
                            <p>Players</p>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <h3>4.8</h3>
                            <p>App Rating</p>
                        </div>
                    </div>

                    <div className="stats-tagline">
                        <h2>One App. <span className="highlight">Every Sport.</span></h2>
                        <p>Built for the pros, accessible to everyone.</p>
                    </div>
                </div>
            </div>

            {/* Suggested Turfs Section */}
            {suggestedTurfs.length > 0 && (
                <div className="container section suggestions-section" style={{ marginTop: '2rem', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>You Might Also Like</h3>
                    <div className="suggestions-grid">
                        {suggestedTurfs.slice(0, visibleCount).map(turf => (
                            <div key={turf.id} className="suggestion-card" onClick={() => {
                                navigate(`/turf/${turf.id}`);
                                window.scrollTo(0, 0);
                            }}>
                                <div className="sug-img-wrapper">
                                    <img src={turf.image_url || '/default-turf.jpg'} alt={turf.name} />
                                    <div className="sug-rating">
                                        <Star size={12} fill="currentColor" /> {turf.rating || 'New'}
                                    </div>
                                </div>
                                <div className="sug-content">
                                    <h4>{turf.name}</h4>
                                    <p className="sug-loc"><MapPin size={14} /> {turf.location}</p>
                                    <div className="sug-tags">
                                        {(turf.amenities || '').split(',').slice(0, 2).map((bg, i) => (
                                            <span key={i}>{bg.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {visibleCount < suggestedTurfs.length && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="view-more-sug-btn" onClick={() => setVisibleCount(prev => prev + 4)}>
                                See More Results
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* Mobile Sticky Booking Footer */}
            {
                selectedSlots.length > 0 && (
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
                )
            }
            {/* Full Screen Image Modal */}
            {
                showModal && selectedUnit && (
                    <div className="fullscreen-overlay" onClick={() => setShowModal(false)}>
                        <button className="fullscreen-close" onClick={() => setShowModal(false)}>×</button>

                        <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={selectedUnit.images[activeImgIndex].url}
                                alt={selectedUnit.images[activeImgIndex].caption}
                                className="fullscreen-img"
                            />
                            {selectedUnit.images[activeImgIndex].caption && (
                                <div className="fullscreen-caption">{selectedUnit.images[activeImgIndex].caption}</div>
                            )}

                            {selectedUnit.images.length > 1 && (
                                <>
                                    <button className="fs-nav prev" onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImgIndex(prev => prev === 0 ? selectedUnit.images.length - 1 : prev - 1);
                                    }}>&#10094;</button>
                                    <button className="fs-nav next" onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImgIndex(prev => prev === selectedUnit.images.length - 1 ? 0 : prev + 1);
                                    }}>&#10095;</button>
                                </>
                            )}

                        </div>
                    </div>
                )}
        </div>
    );
};

export default TurfDetails;
