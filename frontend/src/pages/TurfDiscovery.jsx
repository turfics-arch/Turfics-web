
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Search, MapPin, Star, Crosshair, X, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showError } from '../utils/SwalUtils';
import 'leaflet/dist/leaflet.css';
import './TurfDiscovery.css';
import L from 'leaflet';
import Navbar from '../components/Navbar';
import { API_URL } from '../utils/api';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Data Removed - Fetching from API
const MOCK_TURFS = [];

// Helper: Haversine Distance Formula (Km)
// Helper: Estimated Road Distance (Haversine * Tortuosity Factor)
const getEstimatedRoadDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Tortuosity Factor: 1.4 is average for urban road networks vs straight line
    const TORTUOSITY_FACTOR = 1.4;
    return (R * c) * TORTUOSITY_FACTOR;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// --- Smart Helpers ---
const getSmartAddress = (fullAddress) => {
    if (!fullAddress) return "";
    const parts = fullAddress.split(',').map(p => p.trim());

    const knownCities = ['Bengaluru', 'Bangalore', 'Chennai', 'Mumbai', 'Coimbatore', 'Hyderabad', 'Pune', 'Delhi', 'Kolkata', 'Kochi', 'Mysore'];
    const ignoredTerms = ['India', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Telangana', 'Kerala', 'Urban', 'Rural', 'District', 'Corporation', 'Municipality', 'Taluk', 'Zone', 'Region'];

    // 1. Filter out obvious end-of-address noise (Pincodes, "India", State Names)
    const cleanParts = parts.filter(p => {
        // Remove Pincode (6 digits or 6 digits with spaces)
        if (/^(\d{6}|\d{3}\s\d{3})$/.test(p)) return false;
        if (p.toLowerCase() === 'india') return false;
        // Remove States if they are just the state name
        if (['karnataka', 'tamil nadu', 'maharashtra', 'telangana', 'kerala', 'delhi', 'andhra pradesh'].includes(p.toLowerCase())) return false;
        return true;
    });

    // 2. Find the "Anchor" City
    // Prefer exact matches to avoid "Bengaluru Urban" being taken as the city if "Bengaluru" exists
    let city = cleanParts.find(p => knownCities.some(c => p.toLowerCase() === c.toLowerCase()));

    // Fallback to substring match if no exact match
    if (!city) {
        city = cleanParts.find(p => knownCities.some(c => p.toLowerCase().includes(c.toLowerCase())));
    }

    // If no city identified, fallback to last 2 clean parts
    if (!city) {
        if (cleanParts.length >= 2) return `${cleanParts[cleanParts.length - 2]}, ${cleanParts[cleanParts.length - 1]}`;
        return cleanParts.join(', ');
    }

    // 3. Find the Area (Part before city that isn't admin junk)
    const cityIndex = cleanParts.indexOf(city);
    let areaIndex = cityIndex - 1;

    while (areaIndex >= 0) {
        const candidate = cleanParts[areaIndex];
        const lower = candidate.toLowerCase();

        // Skip administrative junk or redundant city references
        if (ignoredTerms.some(term => lower.includes(term.toLowerCase())) ||
            knownCities.some(c => lower.includes(c.toLowerCase()))) {
            areaIndex--;
            continue;
        }

        return `${candidate}, ${city}`;
    }

    return city;
};

const getFormatLabel = (sport, category) => {
    const s = sport.toLowerCase();
    if (s.includes('football')) return "5v5 / 7v7";
    if (s.includes('cricket')) return "Team of 11";
    if (s.includes('badminton') || s.includes('tennis')) return "2-4 Players";
    return category || "Standard";
};

// Sub-component to handle map clicks for picking location
const LocationPicker = ({ position, onPositionChange }) => {
    const map = useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

// Start Component
const MapRecenter = ({ location, zoom = 12 }) => {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], zoom);
        }
    }, [location, map, zoom]);
    return null;
};

const TurfDiscovery = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // States
    const [userLocation, setUserLocation] = useState(null);
    const [turfs, setTurfs] = useState([]);
    const [filteredTurfs, setFilteredTurfs] = useState([]);

    // Fetch Turfs from API
    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                const res = await fetch(`${API_URL}/api/turfs`);
                if (res.ok) {
                    const data = await res.json();
                    const formattedData = data.map(t => ({
                        ...t,
                        lat: t.latitude || 0,
                        lng: t.longitude || 0,
                        sports: Array.isArray(t.sports) ? t.sports : (t.sports ? t.sports.split(',') : [])
                    }));
                    setTurfs(formattedData);
                    setFilteredTurfs(formattedData);
                }
            } catch (err) {
                console.error("Error fetching turfs:", err);
            }
        };
        fetchTurfs();
    }, []);

    // Filters & View Modes
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState('All');
    const [viewMode, setViewMode] = useState('cities');
    const [selectedCity, setSelectedCity] = useState(null); // If null, means "Near Me" mode (if GPS on)

    // Map Center State (Dynamic)
    const [mapCenter, setMapCenter] = useState(null);

    // Track if we have already auto-redirected to split view once
    const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

    // Map Picker State
    const [showLocationMap, setShowLocationMap] = useState(false);
    const [tempLocation, setTempLocation] = useState(null); // Used inside the modal before confirming

    // Initialize temp location with current user location or default when opening modal
    useEffect(() => {
        if (showLocationMap) {
            setTempLocation(userLocation || { lat: 12.9716, lng: 77.5946 }); // Default to Bangalore if no loc
        }
    }, [showLocationMap, userLocation]);

    // Handle incoming search queries from Landing Page
    useEffect(() => {
        if (location.state?.searchQuery) {
            setSearchTerm(location.state.searchQuery);
            setViewMode('split');
            setHasAutoRedirected(true);

            // Clear state so reload doesn't persist it forever if unwanted, 
            // though keeping it allows "back" to work nicely.
            // history.replaceState({}, document.title) // Optional
        }
    }, [location.state]);

    // 1. Get Live User Location (Watch Position)
    useEffect(() => {
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const loc = { lat: latitude, lng: longitude };
                    setUserLocation(loc);

                    // If we are in "Near Me" mode (no specific city selected), update map center to user
                    if (!selectedCity) {
                        setMapCenter(loc);
                    }

                    // Auto-switch to split view ONLY on the FIRST successful fix
                    // AND if we haven't already redirected due to search query
                    if (!hasAutoRedirected && !location.state?.searchQuery) {
                        setViewMode('split');
                        setHasAutoRedirected(true);
                    }
                },
                (error) => console.log("Location tracking error", error),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [selectedCity, hasAutoRedirected, location.state]);

    // 2. Filter & Sort Logic
    useEffect(() => {
        let result = turfs.map(t => {
            // Initial Estimate (Instant)
            if (userLocation) {
                const dist = getEstimatedRoadDistance(userLocation.lat, userLocation.lng, t.lat, t.lng);
                return {
                    ...t,
                    distanceRaw: dist, // Keep for sorting until real update
                    distanceDisplay: dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`,
                    isEstimated: true
                };
            }
            return t;
        });

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(t => t.name.toLowerCase().includes(lowerTerm) || t.location.toLowerCase().includes(lowerTerm));
        }

        if (selectedSport !== 'All') {
            result = result.filter(t => t.sports.includes(selectedSport));
        }

        // Initial Sort by Estimate
        if (selectedCity) {
            result = result.filter(t => t.location.toLowerCase().includes(selectedCity.toLowerCase()));
        } else if (userLocation) {
            result.sort((a, b) => a.distanceRaw - b.distanceRaw);
        }

        setFilteredTurfs(result);

        // 3. Background Fetch for Real Road Distance (OSRM)
        if (userLocation && result.length > 0 && !selectedCity) {
            const fetchRealDistances = async () => {
                const updated = await Promise.all(result.map(async (t) => {
                    try {
                        // OSRM: lon,lat order !important
                        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${t.lng},${t.lat}?overview=false`;
                        const res = await fetch(url);
                        const data = await res.json();

                        if (data.code === 'Ok' && data.routes && data.routes[0]) {
                            const meters = data.routes[0].distance;
                            const km = meters / 1000;
                            return {
                                ...t,
                                distanceRaw: km,
                                distanceDisplay: km < 1 ? `${meters.toFixed(0)} m` : `${km.toFixed(1)} km`,
                                isEstimated: false // It's real now
                            };
                        }
                    } catch (err) {
                        // Fallback silently to estimate
                    }
                    return t;
                }));

                // Re-sort with real data
                updated.sort((a, b) => a.distanceRaw - b.distanceRaw);
                setFilteredTurfs(updated);
            };

            // Debounce or just run
            const timeoutId = setTimeout(() => fetchRealDistances(), 500);
            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm, selectedSport, turfs, userLocation, selectedCity]);

    const handleCitySelect = (cityName) => {
        setSelectedCity(cityName);
        setSearchTerm(''); // Clear previous search
        setViewMode('split');

        // Hardcoded City Centers for Map FlyTo
        const cityCenters = {
            'Coimbatore': { lat: 11.0168, lng: 76.9558 },
            'Mumbai': { lat: 19.0760, lng: 72.8777 },
            'Bangalore': { lat: 12.9716, lng: 77.5946 },
            'Chennai': { lat: 13.0827, lng: 80.2707 }
        };
        if (cityCenters[cityName]) {
            setMapCenter(cityCenters[cityName]);
        }
    };

    const handleBackToNearMe = () => {
        setSelectedCity(null);
        setSearchTerm('');
        if (userLocation) {
            setMapCenter(userLocation);
        }
    };

    const handleManualLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const loc = { lat: latitude, lng: longitude };
                    setUserLocation(loc);
                    setTempLocation(loc); // Update temp loc too
                    setTempLocation(loc); // Update temp loc too
                    // Don't auto-close if in picker mode, let user confirm
                },
                () => showError('Location Access Denied', "Location access is disabled.")
            );
        } else {
            showError('Not Supported', "Geolocation not supported.");
        }
    };

    const handleConfirmLocation = () => {
        if (tempLocation) {
            setUserLocation(tempLocation);
            setMapCenter(tempLocation);
            setViewMode('split');
            setShowLocationMap(false);
            setSelectedCity(null); // Clear city since we are using specific coords
        }
    };

    const popularCities = [
        { name: 'Coimbatore', img: 'https://images.unsplash.com/photo-1582510003544-524378877227?q=80&w=500', count: 12 },
        { name: 'Mumbai', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=500', count: 45 },
        { name: 'Bangalore', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=500', count: 56 },
        { name: 'Chennai', img: 'https://images.unsplash.com/photo-1582510003544-524378877227?q=80&w=500', count: 28 },
    ];

    return (
        <div className="discovery-container">
            <Navbar />
            <div style={{ marginTop: '120px' }}></div>

            {viewMode === 'cities' ? (
                /* City Selection View */
                <div className="city-selection-view">
                    <header className="city-header">
                        <h2>Select your Location</h2>
                        <div className="search-bar-minimal" style={{ position: 'relative' }}>
                            <Search size={18} />
                            <input type="text" placeholder="Search for your city..." />
                            <div
                                onClick={() => setShowLocationMap(true)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '5px',
                                    borderRadius: '50%',
                                    transition: 'background 0.2s'
                                }}
                                title="Pick Location on Map"
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Crosshair size={20} />
                            </div>
                        </div>
                    </header>
                    <div className="cities-grid">
                        {popularCities.map(city => (
                            <div key={city.name} className="city-card" onClick={() => handleCitySelect(city.name)}>
                                <img src={city.img} alt={city.name} />
                                <div className="city-overlay">
                                    <h3>{city.name}</h3>
                                    <span>{city.count} Venues</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Split View */
                <div className="discovery-split-view">
                    <div className="discovery-top-container">
                        {/* Left: Controls */}
                        <div className="discovery-controls">
                            <div className="header-top-row">
                                <button className="back-link" onClick={() => setViewMode('cities')}>&larr; Change Location</button>
                                {selectedCity ? (
                                    <button className="back-link" onClick={handleBackToNearMe} style={{ marginLeft: 'auto', color: '#00e676' }}>
                                        <MapPin size={14} /> Back to Near Me
                                    </button>
                                ) : (
                                    userLocation && <span style={{ color: '#00e676', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> GPS Active</span>
                                )}
                            </div>
                            <div className="search-bar-premium">
                                <Search className="search-icon" size={20} color="#6b7280" />
                                <input type="text" placeholder={`Search in ${selectedCity || 'your area'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="filter-pills">
                                {['All', 'Football', 'Cricket', 'Tennis', 'Badminton'].map(sport => (
                                    <button key={sport} className={`pill ${selectedSport === sport ? 'active' : ''}`} onClick={() => setSelectedSport(sport)}>{sport}</button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Map (Restored Layout) */}
                        <div className="discovery-map-inline">
                            <MapContainer center={mapCenter ? [mapCenter.lat, mapCenter.lng] : [11.0168, 76.9558]} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                                <MapRecenter location={mapCenter} />
                                {userLocation && <Marker position={[userLocation.lat, userLocation.lng]}><Popup>You are Here</Popup></Marker>}
                                {filteredTurfs.map(turf => (
                                    <Marker key={turf.id} position={[turf.lat, turf.lng]} eventHandlers={{ click: () => navigate(`/turf/${turf.id}`) }}>
                                        <Popup className="premium-popup"><strong>{turf.name}</strong><br />From ₹{turf.min_price}/hr<br />{turf.distanceDisplay || turf.location}</Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>

                    {/* Bottom: List (Full Width) */}
                    <div className="turf-list-premium">
                        {filteredTurfs.length > 0 ? (
                            filteredTurfs.map(turf => {
                                const isSportSpecific = selectedSport !== 'All';
                                const activeGame = isSportSpecific && turf.games ? turf.games.find(g => g.sport_type === selectedSport) : null;
                                const displayPrice = activeGame ? activeGame.default_price : (turf.min_price || turf.price_per_hour);

                                return (
                                    <div key={turf.id}
                                        className={`turf-card-premium ${isSportSpecific ? 'turf-card-specific' : ''}`}
                                        onClick={() => navigate(`/turf/${turf.id}`)}>
                                        <div className="card-image" style={{ backgroundImage: `url(${turf.image_url})` }}>
                                            <span className="price-tag">₹{displayPrice}/hr</span>
                                            <div className="rating-badge"><Star size={12} fill="white" /> {turf.rating}</div>

                                            {/* Distance Badge */}
                                            {turf.distanceDisplay && (
                                                <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.8)', color: '#00e676', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                    {turf.distanceDisplay}
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-info">
                                            <h3>{turf.name}</h3>
                                            <p className="location"><MapPin size={14} /> {getSmartAddress(turf.location)}</p>

                                            {!isSportSpecific && (
                                                <div className="amenities-row">
                                                    {turf.sports.slice(0, 3).map(s => <span key={s} className="mini-badge">{s}</span>)}
                                                    {turf.sports.length > 3 && <span className="mini-badge">+{turf.sports.length - 3}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div style={{ color: '#666', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>No turfs found in {selectedCity || "this area"}.</div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Location Picker Modal --- */}
            {showLocationMap && (
                <div className="location-picker-modal-overlay">
                    <div className="location-picker-modal" style={{ position: 'relative' }}>
                        <button
                            className="close-btn"
                            onClick={() => setShowLocationMap(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                zIndex: 1000,
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <div className="modal-body-map">
                            <MapContainer center={tempLocation || [12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                                <LocationPicker position={tempLocation} onPositionChange={setTempLocation} />
                                <MapRecenter location={tempLocation} zoom={13} />
                            </MapContainer>
                            <button
                                className="locate-me-btn"
                                onClick={handleManualLocation}
                                title="Use My Current Location"
                            >
                                <Crosshair size={20} />
                            </button>
                        </div>
                        <div className="modal-footer">
                            <p className="hint-text">Click on the map to set your location</p>
                            <button className="confirm-loc-btn" onClick={handleConfirmLocation}>
                                <Check size={18} style={{ marginRight: '6px' }} /> Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TurfDiscovery;

