import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, Clock, MapPin, CreditCard, AlertCircle, Star, PenTool, CheckCircle, X, Download, Share2, Filter } from 'lucide-react';
import Loader from '../components/Loader';
import { showSuccess, showError, showConfirm, showWarning } from '../utils/SwalUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../utils/api';
import './PlayerBookings.css';
import './BookingConfirmation.css'; // Reuse invoice styles

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
    const invoiceRef = React.useRef(null);

    // New Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [sportFilter, setSportFilter] = useState('All');

    // Derived State for Filtering
    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = statusFilter === 'All' || booking.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesSport = sportFilter === 'All' || booking.sport === sportFilter;
        return matchesStatus && matchesSport;
    });

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/my-bookings?filter=${activeTab}`, {
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

        const result = await showConfirm(
            'Cancel Booking?',
            'Are you sure you want to cancel this booking? This action cannot be undone.',
            'Yes, Cancel it'
        );

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/bookings/${selectedBookingDetails.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                showSuccess('Cancelled', 'Booking cancelled successfully.');
                setShowDetailsModal(false);
                fetchBookings(); // Refresh list
            } else {
                const data = await res.json();
                showError('Cancellation Failed', data.message || "Failed to cancel booking.");
            }
        } catch (error) {
            console.error("Error cancelling booking:", error);
        }
    };

    const submitReview = async () => {
        if (!rating) return showWarning('Rating Required', "Please select a rating");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/turfs/${selectedBookingForReview.turf_id}/reviews`, { // Assuming turf_id is available
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
                showSuccess('Thank You!', "Review submitted successfully! Thank you for your feedback.");
                setShowReviewModal(false);
                fetchBookings();
            } else {
                showError('Submission Failed', "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    };

    const handleDownloadPDF = async () => {
        const element = invoiceRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_Turfics_${selectedBookingDetails?.booking_id || 'booking'}.pdf`);
            showSuccess('Downloaded', 'Invoice saved to your device.');
        } catch (error) {
            console.error(error);
            showError('Download Failed', 'Could not generate PDF.');
        }
    };

    const handleShareInvoice = async () => {
        const element = invoiceRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'invoice.png', { type: 'image/png' });

            const shareData = {
                title: 'Game On at Turfics!',
                text: `I just booked a game at ${selectedBookingDetails?.turf_name}! Join me!`,
                url: window.location.href,
                files: [file]
            };

            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}`);
                const link = document.createElement('a');
                link.download = 'invoice.png';
                link.href = canvas.toDataURL();
                link.click();
                showSuccess('Shared', 'Text copied and image downloaded!');
            }
        } catch (error) {
            console.error(error);
            showError('Share Failed', 'Could not share invoice.');
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
                    <div style={{ display: 'flex', gap: '1rem' }}>
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
                        <button
                            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All
                        </button>
                    </div>

                    <button
                        className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle Filters"
                    >
                        <Filter size={20} />
                        <span className="filter-text">Filter</span>
                        {(statusFilter !== 'All' || sportFilter !== 'All') && <span className="filter-dot"></span>}
                    </button>
                </div>

                {showFilters && (
                    <div className="filters-bar animate-slide-down">
                        <div className="filter-group">
                            <label>Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="All">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sport:</label>
                            <select
                                value={sportFilter}
                                onChange={(e) => setSportFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="All">All Sports</option>
                                {/* Get unique sports from current bookings */}
                                {[...new Set(bookings.map(b => b.sport))].map(sport => (
                                    <option key={sport} value={sport}>{sport}</option>
                                ))}
                            </select>
                        </div>

                        {(statusFilter !== 'All' || sportFilter !== 'All') && (
                            <button className="clear-filters-btn" onClick={() => { setStatusFilter('All'); setSportFilter('All'); }}>
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                )}

                <div className="bookings-list">
                    {loading ? (
                        <Loader text="Checking Schedule..." />
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => (
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
                            <h3>No bookings found</h3>
                            <p>Try adjusting your filters or check the discovery page!</p>
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

                            {/* Professional Invoice Section */}
                            <div className="invoice-container-professional" ref={invoiceRef} style={{ margin: 0, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                                <div className="inv-header">
                                    <div className="inv-logo">TURFICS</div>
                                    <div className="inv-title">BOOKING RECEIPT</div>
                                </div>

                                <div className="inv-details-grid">
                                    <div className="inv-item">
                                        <label>Booking ID</label>
                                        <span>#{selectedBookingDetails.booking_id}</span>
                                    </div>
                                    <div className="inv-item">
                                        <label>Date</label>
                                        <span>{selectedBookingDetails.date}</span>
                                    </div>
                                    <div className="inv-item">
                                        <label>Venue</label>
                                        <span>{selectedBookingDetails.turf_name}</span>
                                    </div>
                                </div>

                                <div className="inv-slots-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Details</th>
                                                <th>Time</th>
                                                <th className="text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{selectedBookingDetails.sport} ({selectedBookingDetails.unit_name})</td>
                                                <td>{selectedBookingDetails.start_time} - {selectedBookingDetails.end_time}</td>
                                                <td className="text-right">₹{selectedBookingDetails.price}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="inv-summary-box">
                                    <div className="summary-row">
                                        <span>Status</span>
                                        <span className={`status-badge ${selectedBookingDetails.status}`}>{selectedBookingDetails.status}</span>
                                    </div>
                                    <div className="summary-row big-total">
                                        <span>Total Amount</span>
                                        <span>₹{selectedBookingDetails.price}</span>
                                    </div>
                                </div>

                                <div className="inv-footer">
                                    <div className="inv-qr">
                                        <div style={{ background: 'white', padding: '5px' }}>
                                            <div style={{ width: '80px', height: '80px', background: 'black' }}></div>
                                        </div>
                                    </div>
                                    <div className="inv-thankyou">
                                        <h4>Game On!</h4>
                                        <p>{selectedBookingDetails.location}</p>
                                        <small>Show at entry</small>
                                    </div>
                                </div>
                            </div>

                            <div className="details-actions">
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="action-btn" style={{ background: '#334155', color: 'white' }} onClick={handleDownloadPDF}>
                                        <Download size={18} /> PDF
                                    </button>
                                    <button className="action-btn" style={{ background: 'var(--primary)', color: 'black' }} onClick={handleShareInvoice}>
                                        <Share2 size={18} /> Share
                                    </button>
                                </div>

                                {activeTab === 'history' && selectedBookingDetails.status === 'completed' && (
                                    <button className="action-btn review" onClick={() => {
                                        setShowDetailsModal(false);
                                        handleOpenReview(selectedBookingDetails);
                                    }}>
                                        <Star size={18} /> Write a Review
                                    </button>
                                )}

                                {activeTab === 'upcoming' && (selectedBookingDetails.status === 'pending' || selectedBookingDetails.status === 'confirmed') && (
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
