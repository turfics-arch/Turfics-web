
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { TrendingUp, Users, Calendar, Shield, ArrowRight, BarChart } from 'lucide-react';
import './PartnerWithUs.css'; // Reusing the same CSS

const SamplePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        turfName: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("This is a sample submission.");
        setFormData({ name: '', email: '', phone: '', turfName: '' });
    };

    return (
        <div className="marketing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Sample Page <br /> Showcase</h1>
                    <p className="hero-subtitle">
                        This is a sample page demonstrating the high-fidelity design system used for the Partner Landing Page.
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
                                <h4 style={{ margin: 0 }}>Sample Data</h4>
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
                                <h4 style={{ margin: 0 }}>New Interaction</h4>
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
                    <p>Sample Stats</p>
                </div>
                <div className="stat-item">
                    <h3>1M+</h3>
                    <p>Data Points</p>
                </div>
                <div className="stat-item">
                    <h3>2x</h3>
                    <p>Efficiency</p>
                </div>
                <div className="stat-item">
                    <h3>24/7</h3>
                    <p>Uptime</p>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Everything You Need</h2>
                    <p>Comprehensive tools designed specifically for your needs.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><Calendar size={28} /></div>
                        <h4>Feature One</h4>
                        <p>Eliminate double bookings with our real-time, conflict-free scheduling engine that syncs across all platforms.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><BarChart size={28} /></div>
                        <h4>Feature Two</h4>
                        <p>Gain deep insights into peak hours, revenue trends, and customer retention to make data-driven decisions.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Shield size={28} /></div>
                        <h4>Feature Three</h4>
                        <p>Automated payment processing with instant payouts. Say goodbye to chasing payments and cash handling.</p>
                    </div>
                </div>
            </section>

            {/* CTA / Form Section */}
            <section className="cta-section">
                <div className="contact-card">
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Get Started?</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>This form demonstrates the input styling and layout.</p>

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

                        <button type="submit" className="primary-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                            Submit Sample
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default SamplePage;
