import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, Clock, MapPin, CreditCard, AlertCircle, Star, PenTool, CheckCircle, X } from 'lucide-react';
import './PlayerBookings.css';

const PlayerBookings = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/my-bookings?filter=${activeTab}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReview = (booking) => {
        setSelectedBookingForReview(booking);
        setRating(0);
        setReviewText('');
        setShowReviewModal(true);
    };

    const handleOpenDetails = (booking) => {
        setSelectedBookingDetails(booking);
        setShowDetailsModal(true);
    };

    const handleCancelBooking = async () => {
        if (!selectedBookingDetails) return;
        if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/bookings/${selectedBookingDetails.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("Booking cancelled successfully.");
                setShowDetailsModal(false);
                fetchBookings(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.message || "Failed to cancel booking.");
            }
        } catch (error) {
            console.error("Error cancelling booking:", error);
        }
    };

    const submitReview = async () => {
        if (!rating) return alert("Please select a rating");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/turfs/${selectedBookingForReview.turf_id}/reviews`, { // Assuming turf_id is available
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    booking_id: selectedBookingForReview.id,
                    rating: rating,
                    comment: reviewText
                })
            });

            if (res.ok) {
                alert("Review submitted successfully! Thank you for your feedback.");
                setShowReviewModal(false);
                fetchBookings();
            } else {
                alert("Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    return (
        <div className="player-bookings-page">
            <Navbar />
            <div style={{ marginTop: '70px' }}></div>

            <div className="bookings-container">
                <header className="page-header">
                    <h1>My Bookings</h1>
                    <p>Manage your upcoming games and view history</p>
                </header>

                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>

                <div className="bookings-list">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading bookings...</div>
                    ) : bookings.length > 0 ? (
                        bookings.map(booking => (
                            <div
                                key={booking.id}
                                className="booking-card"
                                onClick={() => handleOpenDetails(booking)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="turf-image" style={{ backgroundImage: `url(${booking.turf_image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=500'})` }}>
                                    <span className="sport-badge">{booking.sport}</span>
                                </div>
                                <div className="booking-details">
                                    <div className="header-row">
                                        <h3>{booking.turf_name}</h3>
                                        <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                                    </div>

                                    <div className="info-grid">
                                        <div className="info-item">
                                            <Calendar size={16} />
                                            <span>{booking.date}</span>
                                        </div>
                                        <div className="info-item">
                                            <Clock size={16} />
                                            <span>{booking.start_time} - {booking.end_time}</span>
                                        </div>
                                        <div className="info-item">
                                            <MapPin size={16} />
                                            <span>{booking.location}</span>
                                        </div>
                                        <div className="info-item">
                                            <CreditCard size={16} />
                                            <span>{booking.game_category} ({booking.unit_name})</span>
                                        </div>
                                    </div>

                                    <div className="price-row">
                                        <span className="booking-ref">Ref: {booking.booking_id}</span>
                                        <div className="price">₹{booking.price}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <h3>No {activeTab} bookings found</h3>
                            <p>Check out the discovery page to find new turfs!</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Review Modal */}
            {
                showReviewModal && (
                    <div className="modal-overlay">
                        <div className="review-modal">
                            <div className="modal-header">
                                <h3>Rate your experience</h3>
                                <button className="close-btn" onClick={() => setShowReviewModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <p className="review-subtitle">How was your game at <strong>{selectedBookingForReview?.turf_name}</strong>?</p>

                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={32}
                                            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                        />
                                    ))}
                                </div>

                                <textarea
                                    className="review-textarea"
                                    placeholder="Share details of your own experience at this place..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                />

                                <button className="submit-review-btn" onClick={submitReview}>
                                    Submit Review
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Booking Details Modal */}
            {showDetailsModal && selectedBookingDetails && (
                <div className="modal-overlay">
                    <div className="details-modal">
                        <div className="modal-header">
                            <h3>Booking Details</h3>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body details-body">

                            {/* Ticket / Poster Section */}
                            <div className="ticket-poster">
                                <div className="ticket-header">
                                    <div className="ticket-status">
                                        {selectedBookingDetails.status === 'confirmed' && <CheckCircle size={40} color="#10b981" />}
                                        {(selectedBookingDetails.status === 'pending' || selectedBookingDetails.status === 'under_review') && <Clock size={40} color="#fbbf24" />}
                                        {selectedBookingDetails.status === 'cancelled' && <X size={40} color="#ef4444" />}
                                        <span>{selectedBookingDetails.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                    <h2>{selectedBookingDetails.turf_name}</h2>
                                    <p>{selectedBookingDetails.location}</p>
                                </div>

                                <div className="ticket-grid">
                                    <div className="ticket-item">
                                        <label>Date</label>
                                        <span>{selectedBookingDetails.date}</span>
                                    </div>
                                    <div className="ticket-item">
                                        <label>Time</label>
                                        <span>{selectedBookingDetails.start_time} - {selectedBookingDetails.end_time}</span>
                                    </div>
                                    <div className="ticket-item">
                                        <label>Sport</label>
                                        <span>{selectedBookingDetails.sport}</span>
                                    </div>
                                    <div className="ticket-item">
                                        <label>Court</label>
                                        <span>{selectedBookingDetails.unit_name}</span>
                                    </div>
                                    <div className="ticket-item full-width">
                                        <label>Booking Ref</label>
                                        <span className="mono">{selectedBookingDetails.booking_id}</span>
                                    </div>
                                </div>

                                <div className="qr-section">
                                    <div className="qr-placeholder">
                                        {/* Mock QR Code Pattern */}
                                        <div className="qr-pattern"></div>
                                    </div>
                                    <small>Scan at entry</small>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="details-actions">
                                {activeTab === 'history' && selectedBookingDetails.status === 'completed' && (
                                    <button className="action-btn review" onClick={() => {
                                        setShowDetailsModal(false);
                                        handleOpenReview(selectedBookingDetails);
                                    }}>
                                        <Star size={18} /> Write a Review
                                    </button>
                                )}

                                {activeTab === 'upcoming' && selectedBookingDetails.status !== 'cancelled' && (
                                    <button className="action-btn cancel" onClick={handleCancelBooking}>
                                        Cancel Booking
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default PlayerBookings;
