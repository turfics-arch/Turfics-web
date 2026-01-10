import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationPicker.css';

// Fix for default marker icon in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition, setAddress }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Reverse geocoding to get address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.display_name) {
                        setAddress(data.display_name);
                    }
                })
                .catch(err => console.error('Geocoding error:', err));
        },
    });

    return position ? <Marker position={position} /> : null;
}

const LocationPicker = ({ onLocationSelect, initialLocation, initialAddress }) => {
    const [position, setPosition] = useState(
        initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
    );
    const [address, setAddress] = useState(initialAddress || '');
    const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default: Bangalore
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Get user's current location on mount
    useEffect(() => {
        if (!initialLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    setMapCenter([userLocation.lat, userLocation.lng]);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        } else if (initialLocation) {
            setMapCenter([initialLocation.lat, initialLocation.lng]);
        }
    }, [initialLocation]);

    // Update parent component when location changes
    useEffect(() => {
        if (position && address) {
            onLocationSelect({
                latitude: position.lat,
                longitude: position.lng,
                address: address
            });
        }
    }, [position, address, onLocationSelect]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const newPosition = {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
                setPosition(newPosition);
                setMapCenter([newPosition.lat, newPosition.lng]);
                setAddress(result.display_name);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="location-picker">
            <div className="location-search">
                <input
                    type="text"
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="search-input"
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="search-btn"
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </div>

            {address && (
                <div className="selected-address">
                    <strong>Selected:</strong> {address}
                </div>
            )}

            <div className="map-container">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        setAddress={setAddress}
                    />
                </MapContainer>
            </div>

            <p className="map-hint">
                💡 Click on the map to select your turf's location
            </p>
        </div>
    );
};

export default LocationPicker;
