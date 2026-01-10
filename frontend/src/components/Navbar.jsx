
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, MessageSquare, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userRole = localStorage.getItem('role');
            setIsLoggedIn(!!token);
            setRole(userRole);
        };
        checkAuth();

        window.addEventListener('storage', checkAuth);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setRole(null);
        navigate('/');
        window.location.reload();
    };

    if (['/login', '/signup'].includes(location.pathname)) return null;

    return (
        <nav className={`app-navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="nav-brand" onClick={() => navigate(role === 'owner' ? '/dashboard' : '/')}>
                <h1>Turfics.</h1>
            </div>

            <div className={`nav-menu ${isMobileMenuOpen ? 'mobile-hidden' : ''}`}>
                {role === 'owner' ? (
                    // OWNER NAVIGATION
                    <>
                        <span onClick={() => navigate('/dashboard')} className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</span>
                        <span onClick={() => navigate('/manage-turfs')} className={location.pathname === '/manage-turfs' ? 'active' : ''}>My Turfs</span>
                        <span onClick={() => navigate('/owner/bookings')} className={location.pathname === '/owner/bookings' ? 'active' : ''}>Bookings</span>
                        <span onClick={() => navigate('/owner/analytics')} className={location.pathname === '/owner/analytics' ? 'active' : ''}>Analytics</span>
                        <span onClick={() => navigate('/organizer/tournaments')} className={location.pathname.includes('/organizer/tournaments') ? 'active' : ''}>Tournaments</span>
                        <span onClick={() => navigate('/about')} className={location.pathname === '/about' ? 'active' : ''}>About Us</span>
                        <span onClick={() => navigate('/support')} className={location.pathname === '/support' ? 'active' : ''}>Support</span>
                    </>

                ) : role === 'academy' ? (
                    // ACADEMY NAVIGATION
                    <>
                        <span onClick={() => navigate('/academy/dashboard')} className={location.pathname === '/academy/dashboard' ? 'active' : ''}>Dashboard</span>
                        <span onClick={() => navigate('/organizer/tournaments')} className={location.pathname.includes('/organizer/tournaments') ? 'active' : ''}>Tournaments</span>
                        <span onClick={() => navigate('/about')} className={location.pathname === '/about' ? 'active' : ''}>About Us</span>
                        <span onClick={() => navigate('/support')} className={location.pathname === '/support' ? 'active' : ''}>Support</span>
                    </>
                ) : role === 'coach' ? (
                    // COACH NAVIGATION
                    <>
                        <span onClick={() => navigate('/coach/dashboard')} className={location.pathname === '/coach/dashboard' ? 'active' : ''}>Dashboard</span>
                        <span onClick={() => navigate('/organizer/tournaments')} className={location.pathname.includes('/organizer/tournaments') ? 'active' : ''}>Tournaments</span>
                        <span onClick={() => navigate('/about')} className={location.pathname === '/about' ? 'active' : ''}>About Us</span>
                        <span onClick={() => navigate('/support')} className={location.pathname === '/support' ? 'active' : ''}>Support</span>
                    </>
                ) : (
                    // PLAYER / GUEST NAVIGATION
                    <>
                        <span onClick={() => navigate('/discovery')} className={location.pathname === '/discovery' ? 'active' : ''}>Turfs</span>
                        {isLoggedIn && (
                            <span onClick={() => navigate('/my-bookings')} className={location.pathname === '/my-bookings' ? 'active' : ''}>My Bookings</span>
                        )}
                        <span onClick={() => navigate('/trainers')} className={location.pathname.includes('/trainers') ? 'active' : ''}>Coaches</span>
                        <span onClick={() => navigate('/tournaments')} className={location.pathname.includes('/tournaments') ? 'active' : ''}>Tournaments</span>
                        <span onClick={() => navigate('/teams')} className={location.pathname === '/teams' ? 'active' : ''}>Play With Others</span>
                        <span onClick={() => navigate('/about')} className={location.pathname === '/about' ? 'active' : ''}>About Us</span>
                        <span onClick={() => navigate('/support')} className={location.pathname === '/support' ? 'active' : ''}>Support</span>
                    </>
                )}
            </div>

            <div className="nav-auth desktop-only">
                {isLoggedIn ? (
                    <div className="user-menu-group" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        {/* Community / Messages Icon */}
                        <div
                            className="nav-icon-btn community-trigger"
                            onClick={() => navigate('/community')}
                            title="Community & Messages"
                        >
                            <MessageSquare size={22} className={location.pathname.includes('/community') ? 'active-icon' : ''} />
                            {/* Simulator for unread count - in real app, fetch from context/API */}
                            <span className="nav-badge">3</span>
                        </div>

                        <div
                            className="user-welcome"
                            onClick={() => navigate('/dashboard')}
                            title="Go to Dashboard"
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}
                        >
                            <span className="user-icon"><User size={18} /></span>
                            <span className="welcome-text" style={{ fontWeight: '600' }}>
                                {localStorage.getItem('username') || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{ background: 'transparent', border: '1px solid #333', padding: '0.4rem', borderRadius: '50%', color: '#666', cursor: 'pointer', display: 'flex' }}
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <button className="login-btn" onClick={() => navigate('/login', { state: { mode: 'login' } })}>Login</button>
                        <button className="signup-btn" onClick={() => navigate('/login', { state: { mode: 'signup' } })}>Sign Up</button>
                    </div>
                )}
            </div>

            {/* Mobile Actions */}
            <button className="mobile-toggle-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {role === 'owner' ? (
                        <>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/manage-turfs'); }}>My Turfs</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/owner/bookings'); }}>Bookings</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/owner/analytics'); }}>Analytics</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/organizer/tournaments'); }}>Tournaments</span>
                        </>
                    ) : role === 'academy' ? (
                        <>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/academy/dashboard'); }}>Dashboard</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/organizer/tournaments'); }}>Tournaments</span>
                        </>
                    ) : role === 'coach' ? (
                        <>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/coach/dashboard'); }}>Dashboard</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/organizer/tournaments'); }}>Tournaments</span>
                        </>
                    ) : (
                        <>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/discovery'); }}>Turfs</span>
                            {isLoggedIn && (
                                <span onClick={() => { setIsMobileMenuOpen(false); navigate('/my-bookings'); }}>My Bookings</span>
                            )}
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/trainers'); }}>Coaches</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/tournaments'); }}>Tournaments</span>
                            <span onClick={() => { setIsMobileMenuOpen(false); navigate('/teams'); }}>Play With Others</span>
                        </>
                    )}

                    <span onClick={() => { setIsMobileMenuOpen(false); navigate('/community'); }}>Community</span>
                    <span onClick={() => { setIsMobileMenuOpen(false); navigate('/about'); }}>About Us</span>
                    <span onClick={() => { setIsMobileMenuOpen(false); navigate('/support'); }}>Support</span>

                    <div className="mobile-auth-section">
                        {isLoggedIn ? (
                            <button className="mobile-logout" onClick={handleLogout}>
                                <LogOut size={16} /> Logout ({localStorage.getItem('username')})
                            </button>
                        ) : (
                            <div className="mobile-auth-btns">
                                <button className="login-btn" onClick={() => { setIsMobileMenuOpen(false); navigate('/login', { state: { mode: 'login' } }); }}>Login</button>
                                <button className="signup-btn" onClick={() => { setIsMobileMenuOpen(false); navigate('/login', { state: { mode: 'signup' } }); }}>Sign Up</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
