
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { TrendingUp, Users, Calendar, Shield, ArrowRight, BarChart, CheckCircle } from 'lucide-react';
import { showSuccess } from '../utils/SwalUtils';
import './PartnerWithUs.css';

const PartnerWithUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        turfName: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        showSuccess('Application Submitted', "Thank you for your interest! Our team will contact you shortly.");
        setFormData({ name: '', email: '', phone: '', turfName: '' });
    };

    return (
        <div className="marketing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Transform Your <br /> Sports Venue</h1>
                    <p className="hero-subtitle">
                        Join the fastest growing sports network. Manage bookings, increase revenue, and connect with thousands of players effortlessly.
                    </p>
                    <div className="hero-actions">
                        <button className="primary-btn-lg">
                            Get Started <ArrowRight size={20} />
                        </button>
                        <button className="secondary-btn-lg">
                            View Demo
                        </button>
                    </div>
                </div>

                <div className="hero-image-wrapper">
                    {/* Floating Cards Effect */}
                    <div className="hero-card card-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(0,230,118,0.2)', padding: '10px', borderRadius: '10px', color: '#00E676' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0 }}>Revenue</h4>
                                <small style={{ color: '#888' }}>+125% this month</small>
                            </div>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: '70%', background: '#00E676', borderRadius: '2px' }}></div>
                        </div>
                    </div>

                    <div className="hero-card card-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(41, 121, 255, 0.2)', padding: '10px', borderRadius: '10px', color: '#2979FF' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0 }}>New Bookings</h4>
                                <small style={{ color: '#888' }}>Just now</small>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ width: '30px', height: '30px', borderRadius: '50%', background: `rgba(255,255,255,${0.1 * i})`, border: '1px solid rgba(255,255,255,0.2)' }} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stat-item">
                    <h3>500+</h3>
                    <p>Partner Turfs</p>
                </div>
                <div className="stat-item">
                    <h3>1M+</h3>
                    <p>Bookings Completed</p>
                </div>
                <div className="stat-item">
                    <h3>2x</h3>
                    <p>Revenue Growth</p>
                </div>
                <div className="stat-item">
                    <h3>24/7</h3>
                    <p>Premium Support</p>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything You Need to Scale</h2>
                    <p>Comprehensive tools designed specifically for sports venue owners.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><Calendar size={28} /></div>
                        <h4>Smart Scheduling</h4>
                        <p>Eliminate double bookings with our real-time, conflict-free scheduling engine that syncs across all platforms.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><BarChart size={28} /></div>
                        <h4>Advanced Analytics</h4>
                        <p>Gain deep insights into peak hours, revenue trends, and customer retention to make data-driven decisions.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Shield size={28} /></div>
                        <h4>Secure Payments</h4>
                        <p>Automated payment processing with instant payouts. Say goodbye to chasing payments and cash handling.</p>
                    </div>
                </div>
            </section>

            {/* CTA / Form Section */}
            <section className="cta-section">
                <div className="contact-card">
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Get Started?</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>Fill out the form below and our partnership team will get back to you within 24 hours.</p>

                    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Full Name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="Phone Number"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Turf / Venue Name"
                                required
                                value={formData.turfName}
                                onChange={e => setFormData({ ...formData, turfName: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="primary-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                            Submit Application
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default PartnerWithUs;
