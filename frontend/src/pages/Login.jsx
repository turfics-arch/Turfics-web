
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Mail, Users, ArrowRight, Github, Chrome, Phone, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { showSuccess, showError } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import logo from '../assets/turfics_logo.png';
import './Auth.css';

const Login = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.state?.mode === 'signup' ? false : true);
    const [loginMethod, setLoginMethod] = useState('credentials'); // 'credentials' or 'phone'
    const [otpSent, setOtpSent] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        role: 'user',
        phone_number: '',
        otp: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.mode === 'signup') setIsLogin(false);
        else if (location.state?.mode === 'login') setIsLogin(true);
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/google`, {
                token: tokenResponse.access_token
            });

            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('user_id', res.data.user_id);
            localStorage.setItem('username', res.data.username);

            showSuccess('Welcome!', `Logged in with Google as ${res.data.username}`);

            setTimeout(() => {
                if (res.data.role === 'coach') navigate('/coach/dashboard');
                else if (res.data.role === 'admin') navigate('/admin/dashboard');
                else if (res.data.role === 'academy') navigate('/academy/dashboard');
                else navigate('/my-bookings');
            }, 1000);
        } catch (err) {
            showError('Google Login Failed', err.response?.data?.message || 'Authentication error');
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => showError('Google Login Failed', 'Login attempt was unsuccessful or cancelled.'),
    });

    const handleSendOTP = async () => {
        if (!formData.phone_number) return showError('Error', 'Please enter your phone number');

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/otp/send`, {
                phone_number: formData.phone_number
            });
            setOtpSent(true);
            showSuccess('OTP Sent', `A 6-digit code has been sent to ${formData.phone_number}`);
        } catch (err) {
            showError('OTP Failed', err.response?.data?.message || 'Could not send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/otp/verify`, {
                phone_number: formData.phone_number,
                otp: formData.otp,
                role: formData.role
            });

            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('user_id', res.data.user_id);
            localStorage.setItem('username', res.data.username);

            showSuccess('Success', `Logged in as ${res.data.username}`);

            setTimeout(() => {
                if (res.data.role === 'coach') navigate('/coach/dashboard');
                else if (res.data.role === 'admin') navigate('/admin/dashboard');
                else if (res.data.role === 'academy') navigate('/academy/dashboard');
                else navigate('/my-bookings');
            }, 1000);
        } catch (err) {
            showError('Verification Failed', err.response?.data?.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loginMethod === 'phone') {
            if (otpSent) return handleVerifyOTP(e);
            return handleSendOTP();
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                const res = await axios.post(`${API_URL}/api/auth/login`, {
                    username: formData.username,
                    password: formData.password
                });
                localStorage.setItem('token', res.data.access_token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('user_id', res.data.user_id);
                localStorage.setItem('username', formData.username);

                if (res.data.role === 'coach') navigate('/coach/dashboard');
                else if (res.data.role === 'admin') navigate('/admin/dashboard');
                else if (res.data.role === 'academy') navigate('/academy/dashboard');
                else navigate('/my-bookings');
            } else {
                await axios.post(`${API_URL}/api/auth/register`, {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    role: formData.role
                });
                setIsLogin(true);
                showSuccess('Registration Successful', 'Please login with your new account.');
            }
        } catch (err) {
            console.error("Login Error Details:", err);
            console.error("Response:", err.response);
            showError('Authentication Failed', err.response?.data?.message || 'Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="auth-page-wrapper">
            {/* Mesh Background */}
            <div className="mesh-gradient-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="auth-content-box">
                <motion.div
                    className="auth-branding-section"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <img src={logo} alt="Turfics" className="premium-auth-logo" />
                </motion.div>

                <motion.div
                    className="auth-glass-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <div className="auth-card-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Choose your preferred login method' : 'Join the elite community of turf enthusiasts'}</p>
                    </div>

                    <div className="auth-method-toggle">
                        <button
                            className={`method-btn ${loginMethod === 'credentials' ? 'active' : ''}`}
                            onClick={() => { setLoginMethod('credentials'); setOtpSent(false); }}
                        >
                            Email / User
                        </button>
                        <button
                            className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                            onClick={() => setLoginMethod('phone')}
                        >
                            Phone
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-modern-form">
                        <AnimatePresence mode="wait">
                            {loginMethod === 'credentials' ? (
                                <motion.div key="creds" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                    <div className="modern-input-field">
                                        <User size={18} className="field-icon" />
                                        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                                        <div className="input-focus-border"></div>
                                    </div>

                                    {!isLogin && (
                                        <motion.div className="modern-input-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <Mail size={18} className="field-icon" />
                                            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                                            <div className="input-focus-border"></div>
                                        </motion.div>
                                    )}

                                    <div className="modern-input-field" style={{ marginTop: '1.25rem' }}>
                                        <Lock size={18} className="field-icon" />
                                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                                        <div className="input-focus-border"></div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="phone" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                    <div className="modern-input-field">
                                        <Phone size={18} className="field-icon" />
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            placeholder="Mobile Number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            disabled={otpSent}
                                            required
                                        />
                                        <div className="input-focus-border"></div>
                                    </div>

                                    {otpSent && (
                                        <motion.div className="modern-input-field" style={{ marginTop: '1.25rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <CheckCircle2 size={18} className="field-icon" />
                                            <input type="text" name="otp" placeholder="6-Digit OTP" value={formData.otp} onChange={handleChange} required />
                                            <div className="input-focus-border"></div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isLogin && (
                            <div className="modern-input-field">
                                <Users size={18} className="field-icon" />
                                <select name="role" value={formData.role} onChange={handleChange} className="modern-select">
                                    <option value="user">Player</option>
                                    <option value="owner">Turf Owner</option>
                                    <option value="coach">Coach</option>
                                    <option value="academy">Academy Admin</option>
                                </select>
                                <div className="input-focus-border"></div>
                            </div>
                        )}

                        <button type="submit" className="premium-auth-btn" disabled={isLoading}>
                            {isLoading ? <span className="loader-dots">Loading...</span> : (
                                <>
                                    <span>
                                        {loginMethod === 'phone'
                                            ? (otpSent ? 'Login' : 'Send OTP')
                                            : (isLogin ? 'Sign In' : 'Get Started')}
                                    </span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-separator">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div className="social-auth-grid">
                        <button className="social-btn" onClick={() => googleLogin()}>
                            <Chrome size={20} /> Google
                        </button>
                        <button className="social-btn"><Github size={20} /> GitHub</button>
                    </div>

                    <div className="auth-card-footer">
                        <p>
                            {isLogin ? "New to Turfics? " : "Already part of the team? "}
                            <button onClick={() => { setIsLogin(!isLogin); setOtpSent(false); }} className="text-toggle-btn">
                                {isLogin ? 'Join Now' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
