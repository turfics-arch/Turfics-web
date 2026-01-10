
import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar as CalIcon, Clock, Video, MapPin, CheckCircle } from 'lucide-react';
import './CoachScheduler.css';

const CoachScheduler = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    // Default mode if not passed via state
    const bookingMode = location.state?.mode || 'online';
    const price = location.state?.price || 800;

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Mock Calendar Dates (Next 7 days)
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.getDate(),
                fullDate: d
            });
        }
        return dates;
    };
    const dates = generateDates();

    // Mock Time Slots
    const morningSlots = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM'];
    const eveningSlots = ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'];

    const handleConfirm = () => {
        if (!selectedDate || !selectedSlot) {
            alert("Please select a date and time slot.");
            return;
        }
        navigate('/booking-confirmation', {
            state: {
                id: "BKG-CH-" + Math.floor(Math.random() * 10000),
                type: `${bookingMode.charAt(0).toUpperCase() + bookingMode.slice(1)} Coaching`,
                name: "Rohan Gavaskar", // Should ideally come from prop/state
                date: `${selectedDate} ${new Date().toLocaleString('default', { month: 'short' })}`,
                time: selectedSlot,
                amount: price,
                location: bookingMode === 'offline' ? "Mumbai Sports Complex" : "Online / Zoom",
                status: "Confirmed"
            }
        });
    };

    return (
        <div className="scheduler-page">
            <header className="scheduler-header">
                <button className="back-btn-scheduler" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="header-title">
                    <h1>Schedule Session</h1>
                    <span className="mode-tag">
                        {bookingMode === 'online' ? <Video size={14} /> : <MapPin size={14} />}
                        {bookingMode.charAt(0).toUpperCase() + bookingMode.slice(1)} Session
                    </span>
                </div>
            </header>

            <div className="coach-scheduler-container">
                <div className="scheduler-main">
                    {/* Date Selector */}
                    <section className="section-block">
                        <h2><CalIcon size={18} /> Select Date</h2>
                        <div className="dates-scroller">
                            {dates.map((d, idx) => (
                                <button
                                    key={idx}
                                    className={`date-card ${selectedDate === d.date ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(d.date)}
                                >
                                    <span className="day-name">{d.day}</span>
                                    <span className="date-num">{d.date}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Time Slots */}
                    <section className="section-block">
                        <h2><Clock size={18} /> Select Time Slot</h2>
                        <div className="slots-group">
                            <h3>Morning</h3>
                            <div className="slots-grid">
                                {morningSlots.map(slot => (
                                    <button
                                        key={slot}
                                        className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="slots-group">
                            <h3>Evening</h3>
                            <div className="slots-grid">
                                {eveningSlots.map(slot => (
                                    <button
                                        key={slot}
                                        className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Booking Summary Sidebar */}
                <aside className="summary-sidebar">
                    <div className="summary-card">
                        <h3>Booking Summary</h3>

                        <div className="summary-row">
                            <span>Coach</span>
                            <strong>Rohan Gavaskar</strong>
                        </div>
                        <div className="summary-row">
                            <span>Mode</span>
                            <span style={{ textTransform: 'capitalize' }}>{bookingMode}</span>
                        </div>

                        {selectedDate && selectedSlot && (
                            <div className="summary-highlight">
                                <CalIcon size={14} /> {selectedDate}th {new Date().toLocaleString('default', { month: 'long' })}
                                <br />
                                <Clock size={14} /> {selectedSlot}
                            </div>
                        )}

                        <div className="total-row">
                            <span>Total</span>
                            <span className="total-price">₹{price}</span>
                        </div>

                        <button className="confirm-btn glow-effect" onClick={handleConfirm}>
                            Proceed to Pay
                        </button>

                        <p className="note-text"><CheckCircle size={12} /> Secure Payment</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CoachScheduler;
