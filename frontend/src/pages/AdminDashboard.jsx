import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Shield, Trophy } from 'lucide-react';
import { API_URL } from '../utils/api';
import Loader from '../components/Loader';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users. Please try again.');
            setLoading(false);
        }
    };

    if (loading) return <Loader text="Loading Users..." />;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <h1><Shield size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />Admin Dashboard</h1>
                <p>Manage users and system settings</p>
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={() => navigate('/tournaments')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'var(--primary)',
                            color: 'black',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trophy size={18} /> Manage Tournaments
                    </button>
                </div>
            </div>

            {error && <div className="error-container">{error}</div>}

            <div className="dashboard-section">
                <h2><Users size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />Registered Users ({users.length})</h2>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>#{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
