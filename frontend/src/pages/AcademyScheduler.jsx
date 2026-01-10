
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Calendar, MapPin, Users, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import './AcademyScheduler.css';

const AcademyScheduler = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Academy ID

    // State for filters
    const [selectedMonth, setSelectedMonth] = useState('Jan 2026');
    const [sessionType, setSessionType] = useState('Group Classes');
    const [ageGroup, setAgeGroup] = useState('Kids & Teens');
    const [timeDay, setTimeDay] = useState('Evening');

    const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'];

    // Mock Batches Data
    const batches = [
        {
            id: 1,
            time: "4:00 pm - 5:00 pm",
            days: ["mon", "tue", "wed", "thu", "fri"],
            activeDays: ["mon", "wed", "fri"], // Specifically highlighted days
            spotsLeft: 7,
            gender: ["Men", "Women"],
            desc: "This batch runs on any three days between Monday to Friday and includes three classes...",
            sessions: 12,
            price: 1800,
            tag: "3 Days/Week"
        },
        {
            id: 2,
            time: "5:00 pm - 6:00 pm",
            days: ["mon", "tue", "wed", "thu", "fri"],
            activeDays: ["mon", "tue", "wed", "thu", "fri"],
            spotsLeft: 5,
            gender: ["Men", "Women"],
            desc: "This batch runs from Monday to Friday with classes conducted five days per week for...",
            sessions: 20,
            price: 3200,
            tag: "5 Days/Week"
        },
        {
            id: 3,
            time: "6:00 pm - 7:00 pm",
            days: ["mon", "tue", "wed", "thu", "fri"],
            activeDays: ["mon", "wed", "fri"],
            spotsLeft: 2,
            gender: ["Men", "Women"],
            desc: "Advanced training batch focused on tactical drills and match simulations.",
            sessions: 12,
            price: 1800,
            tag: "3 Days/Week"
        }
    ];

    return (
        <div className="scheduler-page">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>
            <header className="scheduler-header">
                <button className="back-btn-scheduler" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="venue-info">
                    <div className="venue-thumb"></div>
                    <div>
                        <h1>Elite Sports Academy</h1>
                        <p className="location-text"><MapPin size={14} /> Goregaon West, Mumbai</p>
                    </div>
                </div>
            </header>

            <div className="scheduler-layout">
                {/* Filters Sidebar */}
                <aside className="filters-panel">
                    <div className="filter-group">
                        <label>SESSION TYPE</label>
                        <div className="chip-cloud">
                            <button className={`chip ${sessionType === 'Group Classes' ? 'active' : ''}`} onClick={() => setSessionType('Group Classes')}>Group Classes</button>
                            <button className={`chip ${sessionType === 'Personal' ? 'active' : ''}`} onClick={() => setSessionType('Personal')}>Personal</button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>AGE GROUP</label>
                        <div className="chip-cloud">
                            <button className={`chip ${ageGroup === 'Kids & Teens' ? 'active' : ''}`} onClick={() => setAgeGroup('Kids & Teens')}>Kids & Teens</button>
                            <button className={`chip ${ageGroup === 'Adults' ? 'active' : ''}`} onClick={() => setAgeGroup('Adults')}>Adults</button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>MONTH</label>
                        <div className="month-scroller">
                            {months.map(m => (
                                <button key={m} className={`month-btn ${selectedMonth === m ? 'active' : ''}`} onClick={() => setSelectedMonth(m)}>
                                    <span className="m-name">{m.split(' ')[0]}</span>
                                    <span className="m-year">{m.split(' ')[1]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>TIME OF DAY</label>
                        <div className="checkbox-list">
                            <label className="checkbox-row">
                                <input type="checkbox" checked={timeDay === 'Morning'} onChange={() => setTimeDay('Morning')} /> Morning
                            </label>
                            <label className="checkbox-row">
                                <input type="checkbox" checked={timeDay === 'Evening'} onChange={() => setTimeDay('Evening')} /> Evening
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Batches List */}
                <main className="batches-content">
                    <div className="batches-header">
                        <h2>Choose your batch</h2>
                        <span>{batches.length} Batches Available</span>
                    </div>

                    <div className="batches-list">
                        {batches.map(batch => (
                            <div key={batch.id} className="batch-full-card">
                                <div className="batch-main-info">
                                    <div className="time-section">
                                        <Clock size={16} className="icon-gold" />
                                        <span className="time-text">{batch.time}</span>
                                    </div>

                                    <div className="days-display">
                                        <Calendar size={16} className="icon-gold" />
                                        <div className="week-days">
                                            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                                                <span key={day} className={`day-letter ${batch.activeDays.includes(day) ? 'active' : ''}`}>
                                                    {day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="meta-row">
                                        <span className="spots-badge">{batch.spotsLeft} Spots left</span>
                                        <span className="gender-info"><Users size={12} /> {batch.gender.join(', ')}</span>
                                    </div>

                                    <p className="batch-desc">
                                        {batch.desc} <span className="read-more">Read More</span>
                                    </p>
                                </div>

                                <div className="batch-action-sidebar">
                                    <span className="batch-tag">{batch.tag}</span>
                                    <div className="pricing">
                                        <span className="sessions-count">{batch.sessions} sessions / month</span>
                                        <span className="price-val">₹ {batch.price.toLocaleString()}</span>
                                    </div>
                                    <button className="join-btn" onClick={() => navigate('/booking-confirmation', {
                                        state: {
                                            id: "BKG-AC-" + Math.floor(Math.random() * 100000),
                                            type: "Academy Training",
                                            name: "Elite Sports Academy",
                                            date: `${selectedMonth}`,
                                            time: batch.time,
                                            amount: batch.price,
                                            location: "Goregaon West, Mumbai",
                                            status: "Enrolled"
                                        }
                                    })}>Join</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AcademyScheduler;
