
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Users } from 'lucide-react';
import './Auth.css';
import API_URL from '../config';

const Login = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.state?.mode === 'signup' ? false : true);
    const [formData, setFormData] = useState({ username: '', password: '', email: '', role: 'user' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Reset state if location changes (e.g., clicking link while on page)
    useEffect(() => {
        if (location.state?.mode === 'signup') {
            setIsLogin(false);
        } else if (location.state?.mode === 'login') {
            setIsLogin(true);
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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

                if (res.data.role === 'coach') {
                    navigate('/coach/dashboard');
                } else if (res.data.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (res.data.role === 'academy') {
                    navigate('/academy/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                await axios.post(`${API_URL}/api/auth/register`, {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    role: formData.role
                });
                // Auto login or ask to login
                setIsLogin(true);
                alert('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="glow-orb orb-1"></div>
                <div className="glow-orb orb-2"></div>
            </div>

            <motion.div
                className="auth-card glass-panel"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <Shield className="auth-icon" size={48} color="var(--primary)" />
                    <h2>{isLogin ? 'Welcome Back' : 'Join Turfics'}</h2>
                    <p>{isLogin ? 'Enter your credentials to access your account' : 'Start your journey with us today'}</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <User size={20} className="input-icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <User size={20} className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <Users size={20} className="input-icon" />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="auth-select"
                            >
                                <option value="user">Player</option>
                                <option value="owner">Turf Owner</option>
                                <option value="coach">Coach</option>
                                <option value="academy">Academy Admin</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="auth-btn">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
