
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Smartphone, Star, Users, Shield, Trophy, Lock, ArrowUpRight, Menu, X } from 'lucide-react';
import './LandingPage.css';
import Loader from '../components/Loader';

import logo from '../assets/turfics_logo.png';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [nearbyTurfs, setNearbyTurfs] = useState([]);
    const [allTurfs, setAllTurfs] = useState([]); // Store all fetched turfs
    const [activeSport, setActiveSport] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial Fetch & Location
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const fetchTurfs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/turfs');
                if (response.ok) {
                    let data = await response.json();

                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const userLat = position.coords.latitude;
                                const userLng = position.coords.longitude;

                                const sortedData = data.map(turf => ({
                                    ...turf,
                                    distance: calculateDistance(userLat, userLng, turf.latitude, turf.longitude)
                                })).sort((a, b) => a.distance - b.distance);

                                setAllTurfs(sortedData);
                                setNearbyTurfs(sortedData.slice(0, 3));
                            },
                            (error) => {
                                console.log("Location access denied or error, showing random turfs.", error);
                                const shuffled = data.sort(() => 0.5 - Math.random());
                                setAllTurfs(shuffled);
                                setNearbyTurfs(shuffled.slice(0, 3));
                            }
                        );
                    } else {
                        const shuffled = data.sort(() => 0.5 - Math.random());
                        setAllTurfs(shuffled);
                        setNearbyTurfs(shuffled.slice(0, 3));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch turfs", error);
            } finally {
                // Short delay for effect
                setTimeout(() => setLoading(false), 1500);
            }
        };

        fetchTurfs();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSportClick = (sport) => {
        setActiveSport(sport);

        // Filter Logic
        let filtered = allTurfs;
        if (sport) {
            filtered = allTurfs.filter(t => t.sports && t.sports.includes(sport));
        }

        // If filtered list is empty, maybe fallback or show empty. 
        // Showing top 3 of filtered
        setNearbyTurfs(filtered.slice(0, 3));

        // Scroll to section
        const section = document.querySelector('.popular-turfs-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            navigate('/discovery');
            return;
        }

        const query = searchQuery.toLowerCase();

        if (query.includes('coach') || query.includes('trainer') || query.includes('academy')) {
            navigate('/trainers', { state: { searchQuery } });
        } else if (query.includes('tournament') || query.includes('league') || query.includes('cup')) {
            navigate('/tournaments', { state: { searchQuery } });
        } else {
            navigate('/discovery', { state: { searchQuery } });
        }
    };

    return (
        loading ? <Loader text="Warming Up..." /> :
            <div className="landing-container">
                <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                    <div className="nav-logo">
                        <img src={logo} alt="Turfics" style={{ height: '75px', objectFit: 'contain' }} />
                    </div>

                    {/* Desktop Links */}
                    <div className="nav-links desktop-only">
                        <span onClick={() => navigate('/discovery')} className="nav-link" style={{ cursor: 'pointer' }}>Turfs</span>
                        <span onClick={() => navigate('/community')} className="nav-link" style={{ cursor: 'pointer' }}>Community</span>
                        <span onClick={() => navigate('/trainers')} className="nav-link" style={{ cursor: 'pointer' }}>Coaches</span>
                        <span onClick={() => navigate('/teams')} className="nav-link" style={{ cursor: 'pointer' }}>Teams</span>
                        <a href="#" className="nav-link">Partner with us</a>
                        <a href="#" className="nav-link">Support</a>
                    </div>

                    <div className="nav-cta desktop-only">
                        {localStorage.getItem('token') ? (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div
                                    onClick={() => navigate('/dashboard')}
                                    title="Go to Dashboard"
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}
                                >
                                    <span className="nav-icon"><Users size={18} /></span>
                                    <span style={{ fontWeight: '600' }}>Welcome, {localStorage.getItem('username') || 'User'}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('role');
                                        localStorage.removeItem('user_id');
                                        localStorage.removeItem('username');
                                        window.location.reload();
                                    }}
                                    style={{ background: 'transparent', border: '1px solid #333', padding: '0.4rem', borderRadius: '50%', color: '#ccc', cursor: 'pointer', display: 'flex' }}
                                    title="Logout"
                                >
                                    <Lock size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="secondary-btn" onClick={() => navigate('/login', { state: { mode: 'login' } })}>Login</button>
                                <button className="primary-btn" onClick={() => navigate('/login', { state: { mode: 'signup' } })}>Sign Up</button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Mobile Navigation Overlay */}
                    <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
                        <div className="mobile-nav-links">
                            <span onClick={() => navigate('/discovery')} className="mobile-nav-link">Turfs</span>
                            <span onClick={() => navigate('/community')} className="mobile-nav-link">Community</span>
                            <span onClick={() => navigate('/trainers')} className="mobile-nav-link">Coaches</span>
                            <span onClick={() => navigate('/teams')} className="mobile-nav-link">Teams</span>
                            <a href="#" className="mobile-nav-link">Partner with us</a>
                            <a href="#" className="mobile-nav-link">Support</a>

                            <div className="mobile-auth-buttons">
                                {localStorage.getItem('token') ? (
                                    <>
                                        <button className="mobile-dashboard-btn" onClick={() => navigate('/dashboard')}>
                                            <Users size={16} /> Dashboard
                                        </button>
                                        <button className="mobile-logout-btn" onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('role');
                                            window.location.reload();
                                        }}>
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="secondary-btn" onClick={() => navigate('/login', { state: { mode: 'login' } })}>Login</button>
                                        <button className="primary-btn" onClick={() => navigate('/login', { state: { mode: 'signup' } })}>Sign Up</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="hero-section">
                    <div className="hero-bg-viz"></div>
                    <div className="hero-visual-left decorative-float">
                        <div className="float-card glass-panel-sm user-booking-card">
                            <div className="flex-row">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60" alt="User" className="avatar-sm" />
                                <div>
                                    <span className="text-xs text-muted">Just Booked</span>
                                    <p className="text-sm bold">The Arena, Mumbai</p>
                                </div>
                            </div>
                        </div>
                        <div className="float-card glass-panel-sm verified-badge-card" style={{ marginTop: '2rem', marginLeft: '2rem' }}>
                            <Shield size={20} color="#00e676" />
                            <div>
                                <p className="text-sm bold">Verified Turfs</p>
                                <span className="text-xs text-muted">100% Secure Payments</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-content">
                        <div className="live-ticker">
                            <span className="dot"></span> 124 Games Happening Now in Mumbai
                        </div>
                        <h1 className="hero-title">The World's Largest <br /> <span className="highlight-text">Sports Community.</span></h1>
                        <p className="hero-subtitle">Book courts, find players, and host tournaments. Join 2 Million+ sports enthusiasts today.</p>

                        <div className="search-widget glass-effect">
                            <div className="search-input-group full-width">
                                <MapPin size={20} color="var(--primary)" />
                                <input
                                    type="text"
                                    placeholder="Search for turfs, trainers, or tournaments nearby..."
                                    style={{ width: '100%' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button className="widget-btn" onClick={handleSearch}>
                                Let's Play <Search size={18} />
                            </button>
                        </div>

                        {/* Sports Carousel */}
                        <div className="sports-carousel">
                            {[
                                { name: 'Football', icon: '⚽' },
                                { name: 'Cricket', icon: '🏏' },
                                { name: 'Badminton', icon: '🏸' },
                                { name: 'Tennis', icon: '🎾' },
                                { name: 'Swimming', icon: '🏊' },
                                { name: 'Basketball', icon: '🏀' },
                                { name: 'Volleyball', icon: '🏐' },
                                { name: 'Hockey', icon: '🏑' }
                            ].map(sport => (
                                <div
                                    key={sport.name}
                                    className={`sport-pill glass-pill ${activeSport === sport.name ? 'active' : ''}`}
                                    onClick={() => handleSportClick(sport.name)}
                                    style={{ cursor: 'pointer', border: activeSport === sport.name ? '1px solid var(--primary)' : '' }}
                                >
                                    <span className="sport-emoji">{sport.icon}</span>
                                    <span>{sport.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hero-visual-right decorative-float">
                        <div className="float-card glass-panel-sm tournament-card-hero">
                            <div className="icon-box-sm"><Trophy size={16} color="#ffd700" /></div>
                            <div>
                                <p className="text-sm bold">Corporate League</p>
                                <span className="text-xs text-accent">₹50,000 Prize Pool</span>
                            </div>
                        </div>
                        <div className="float-card glass-panel-sm rating-card-hero" style={{ marginTop: '3rem' }}>
                            <div className="flex-row gap-1">
                                <Star size={16} fill="#ffd700" color="#ffd700" />
                                <Star size={16} fill="#ffd700" color="#ffd700" />
                                <Star size={16} fill="#ffd700" color="#ffd700" />
                                <Star size={16} fill="#ffd700" color="#ffd700" />
                                <Star size={16} fill="#ffd700" color="#ffd700" />
                            </div>
                            <p className="text-xs text-muted mt-1">Trusted by 150K+ Players</p>
                        </div>
                    </div>
                </header>

                {/* Hybrid Stats/Features Section */}
                <section className="stats-section">
                    <div className="stat-item">
                        <span className="stat-num">500+</span>
                        <span className="stat-label">Venues</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num">150K</span>
                        <span className="stat-label">Players</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num">4.8</span>
                        <span className="stat-label">App Rating</span>
                    </div>
                </section>

                {/* Features Grid with Turf Town Vibe */}
                <section className="features-section" id="features">
                    <div className="section-header">
                        <h2 className="section-title">One App. <span style={{ color: 'var(--primary)' }}>Every Sport.</span></h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Built for the pros, accessible to everyone.</p>
                    </div>

                    <div className="premium-bento-grid">
                        {/* Card 1: Instant Booking (Turfs) */}
                        <div className="bento-card card-booking" onClick={() => navigate('/discovery')}>
                            <div className="bento-bg" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000")' }}></div>
                            <div className="bento-arrow"><ArrowUpRight size={24} /></div>
                            <div className="bento-content">
                                <div className="bento-badge">Most Popular</div>
                                <h3 className="bento-title">Book Top Rated Turfs</h3>
                                <p className="bento-desc">Instant confirmation at 500+ premium venues.</p>
                            </div>
                        </div>

                        {/* Card 2: Coaches */}
                        <div className="bento-card card-coach" onClick={() => navigate('/trainers')}>
                            <div className="bento-bg" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=600")' }}></div>
                            <div className="bento-arrow"><ArrowUpRight size={24} /></div>
                            <div className="bento-content">
                                <div className="bento-badge"><Star size={14} fill="#FFD700" color="#FFD700" /> Pro Training</div>
                                <h3 className="bento-title">Train with Experts</h3>
                                <p className="bento-desc">Elevate your game with certified coaches.</p>
                            </div>
                        </div>

                        {/* Card 3: Teams */}
                        <div className="bento-card card-team" onClick={() => navigate('/teams')}>
                            <div className="bento-bg" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=600")' }}></div>
                            <div className="bento-arrow"><ArrowUpRight size={24} /></div>
                            <div className="bento-content">
                                <div className="bento-badge"><Users size={14} /> Squad Up</div>
                                <h3 className="bento-title">Find Your Team</h3>
                                <p className="bento-desc">Join local squads or build your own legacy.</p>
                            </div>
                        </div>

                        {/* Card 4: Tournaments */}
                        <div className="bento-card card-tournament" onClick={() => navigate('/tournaments')}>
                            <div className="bento-bg" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1628779238951-be2c9f255915?q=80&w=1000")' }}></div>
                            <div className="bento-arrow"><ArrowUpRight size={24} /></div>
                            <div className="bento-content">
                                <div className="bento-badge" style={{ background: '#ffd700', color: 'black' }}><Trophy size={14} color="black" /> 50K Prize Pool</div>
                                <h3 className="bento-title">Compete & Win</h3>
                                <p className="bento-desc">Battle it out in city-wide leagues and tournaments.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Popular Turfs Section */}
                <section className="popular-turfs-section" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="section-header">
                        <h2 className="section-title">Popular <span style={{ color: 'var(--primary)' }}>Venues Nearby</span></h2>
                    </div>
                    <div className="turfs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                        {nearbyTurfs.length > 0 ? nearbyTurfs.map(turf => (
                            <div key={turf.id} className="turf-card-landing" onClick={() => navigate(`/turf/${turf.id}`)} style={{ cursor: 'pointer', background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333', transition: 'transform 0.3s' }}>
                                <div style={{ height: '180px', background: `url(${turf.image_url || 'https://via.placeholder.com/300'}) center/cover` }}></div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', color: 'white', margin: 0 }}>{turf.name}</h3>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{turf.rating || '4.5'} ★</span>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                                        {turf.location} • {turf.distance ? `${turf.distance.toFixed(1)} km • ` : ''} {turf.sports || 'Multi-sport'}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>Loading popular venues...</p>
                        )}
                    </div>
                </section>

                {/* Community Section (Replaces Testimonials) */}
                <section className="community-section-hero" style={{ padding: '2rem 2rem 5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="community-card-landing" onClick={() => navigate('/community')} style={{ background: 'linear-gradient(to right, #1a1a1a, #0d0d0d)', border: '1px border #333', cursor: 'pointer' }}>
                        <div className="community-left">
                            <div className="badge-pill">JOIN THE MOVEMENT</div>
                            <h3>Our Community</h3>
                            <p>Build your tribe. Join public or private sports communities, or follow broadcast channels for exclusive updates.</p>
                            <div className="community-pills">
                                <span><Users size={16} /> Public Groups</span>
                                <span><Lock size={16} /> Private Squads</span>
                                <span><Smartphone size={16} /> Broadcast Channels</span>
                            </div>
                        </div>
                        <div className="community-right-viz">
                            <div className="mock-chat-bubble">Run 5 PM?</div>
                            <div className="mock-chat-bubble right">I'm in! ⚽</div>
                            <div className="mock-broadcast">📢 Tournament Alert!</div>
                        </div>
                    </div>
                </section>

                {/* App Promotion */}
                <section className="app-section">
                    <div className="app-content">
                        <h2>Game on the Go.</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>Download the Turfics app for exclusive mobile-only deals and real-time notifications.</p>
                        <div className="store-buttons">
                            <button className="store-btn"><Smartphone size={20} /> App Store</button>
                            <button className="store-btn"><Smartphone size={20} /> Play Store</button>
                        </div>
                    </div>
                    <div className="app-visual">
                        {/* Phone Mockup with Screen */}
                        <div className="phone-mockup">
                            <div className="phone-notch"></div>
                            <div className="phone-screen" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=300&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                <div className="screen-overlay">
                                    <h3>Book Your Slot</h3>
                                    <button className="screen-btn">Book Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="main-footer">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h2>Turfics.</h2>
                            <p>The smartest way to play. Join the movement.</p>
                        </div>
                        <div className="footer-links">
                            <div className="link-column">
                                <h4>Company</h4>
                                <a href="#">About Us</a>
                                <a href="#">Careers</a>
                                <a href="#">Blog</a>
                            </div>
                            <div className="link-column">
                                <h4>Explore</h4>
                                <a href="#" onClick={() => navigate('/discovery')}>Turfs</a>
                                <a href="#" onClick={() => navigate('/trainers')}>Coaches</a>
                                <a href="#" onClick={() => navigate('/tournaments')}>Tournaments</a>
                            </div>
                            <div className="link-column">
                                <h4>Support</h4>
                                <a href="#">Help Center</a>
                                <a href="#">Privacy Policy</a>
                                <a href="#">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 Turfics India Pvt Ltd. All rights reserved.</p>
                    </div>
                </footer>
            </div>
    );
};

export default LandingPage;
