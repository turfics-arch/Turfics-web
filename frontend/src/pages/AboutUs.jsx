
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Target, Heart, Globe, ArrowRight } from 'lucide-react';
import './PartnerWithUs.css'; // Reusing for consistency

const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="marketing-page">
            <Navbar />

            <section className="hero-section" style={{ minHeight: '60vh', paddingBottom: '2rem' }}>
                <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 className="hero-title">Connecting the World <br /> Through Sports</h1>
                    <p className="hero-subtitle">
                        Turfics is on a mission to make sports accessible to everyone. We build technology that empowers players, connects communities, and helps venues thrive.
                    </p>
                </div>
            </section>

            <section className="features-section" style={{ paddingTop: '0' }}>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><Target size={28} /></div>
                        <h4>Our Mission</h4>
                        <p>To eliminate the friction in playing sports by providing seamless booking experiences and fostering vibrant local communities.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Heart size={28} /></div>
                        <h4>For The Love of Game</h4>
                        <p>We believe sports bring people together. Whether you are a casual player or a pro, Turfics is your home ground.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Globe size={28} /></div>
                        <h4>Global Reach</h4>
                        <p>Starting locally but thinking globally. We are expanding to new cities every month to bring the game to you.</p>
                    </div>
                </div>
            </section>

            {/* Partner CTA Section */}
            <section className="cta-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="contact-card" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', maxWidth: '1000px', padding: '3rem' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>Own a Sports Venue?</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                            Partner with us to streamline your operations, increase bookings, and grow your business with our top-tier management tools.
                        </p>
                    </div>
                    <div>
                        <button className="primary-btn-lg" onClick={() => navigate('/partner')}>
                            Partner With Us <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="cta-section" style={{ paddingTop: '0' }}>
                <div className="contact-card" style={{
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '2rem',
                    maxWidth: '1000px',
                    padding: '3rem',
                    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                    borderColor: 'rgba(255,255,255,0.05)'
                }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>See It In Action</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                            Check out our high-fidelity sample page to see the design quality and component library we use.
                        </p>
                    </div>
                    <div>
                        <button className="secondary-btn-lg" onClick={() => navigate('/sample')}>
                            View Sample Page
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
