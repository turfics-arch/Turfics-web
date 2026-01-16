import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { Search, Plus, Users, Radio, Globe, Lock, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Community.css';

const Community = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-communities');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [myCommunities, setMyCommunities] = useState([]);
    const [publicCommunities, setPublicCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // Handle no token
                return;
            }

            // Parallel fetch
            const [myRes, publicRes] = await Promise.all([
                axios.get('http://127.0.0.1:5000/api/communities/my', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:5000/api/communities', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setMyCommunities(myRes.data);
            setPublicCommunities(publicRes.data);

            // Auto-switch to Discover if no joined communities
            if (myComms.length === 0 && publicRes.data.length > 0) {
                setActiveTab('discover');
            }

        } catch (error) {
            console.error("Error fetching communities:", error);
            // Optional: Set an error state to show a toast
        } finally {
            setLoading(false);
        }
    };

    const handleCommunityCreated = (newCommunity) => {
        // Refresh or append
        fetchCommunities();
    };

    const handleSearch = async (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.length > 2) {
            try {
                const res = await axios.get(`http://127.0.0.1:5000/api/communities?q=${e.target.value}`);
                setPublicCommunities(res.data);
                if (activeTab !== 'discover') setActiveTab('discover');
            } catch (err) {
                console.error(err);
            }
        } else if (e.target.value.length === 0) {
            // Reset
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/communities', { headers: { Authorization: `Bearer ${token}` } });
            setPublicCommunities(res.data);
        }
    };

    return (
        <div className="community-page">
            <Navbar />
            <div className="community-spacer"></div>

            <div className="community-container">
                <header className="community-header">
                    <div className="header-content">
                        <h1>Community Hub</h1>
                        <p>Connect with players, join squads, and stay updated.</p>
                    </div>
                    <button className="create-action-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Create Community
                    </button>
                </header>

                <div className="community-controls">
                    <div className="community-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'my-communities' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-communities')}
                        >
                            My Communities
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
                            onClick={() => setActiveTab('discover')}
                        >
                            Discover
                        </button>
                    </div>

                    <div className="community-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find communities..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="tab-content">
                    {loading ? (
                        <div className="loading-state">
                            <Loader size={32} className="animate-spin" />
                            <p>Loading communities...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'my-communities' && (
                                <div className="communities-grid">
                                    {myCommunities.length === 0 ? (
                                        <div className="empty-state">
                                            <Users size={48} />
                                            <h3>No Communities Yet</h3>
                                            <p>Create one or discover existing ones to join!</p>
                                        </div>
                                    ) : (
                                        myCommunities.map(c => (
                                            <div key={c.id} className="community-card" onClick={() => navigate(`/community/${c.id}`)}>
                                                <div className="card-image-wrapper">
                                                    <div className="card-image" style={{ backgroundImage: `url(${c.image_url || 'https://via.placeholder.com/400x200?text=Community'})` }}></div>
                                                </div>

                                                {c.unread_count > 0 && (
                                                    <div className="unread-card-badge">
                                                        {c.unread_count}
                                                    </div>
                                                )}
                                                <div className="card-info">
                                                    <h3>{c.name}</h3>
                                                    <div className="meta-row">
                                                        <span className="type-badge">
                                                            {c.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                                                            {c.type}
                                                        </span>
                                                        <span className="member-count">
                                                            <Users size={12} /> {c.members_count || '10+'}
                                                        </span>
                                                    </div>
                                                    <p className="card-desc">{c.description || 'Welcome back! Check out the latest updates.'}</p>
                                                    <button className="view-btn" style={{ background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', borderColor: '#00E676' }}>
                                                        Open Community
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'discover' && (
                                <div className="communities-grid">
                                    {publicCommunities.length === 0 ? (
                                        <div className="empty-state">
                                            <div style={{
                                                width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px'
                                            }}>
                                                <Globe size={40} color="#666" />
                                            </div>
                                            <h3>Explore New Communities</h3>
                                            <p style={{ marginBottom: '25px' }}>Search for sports communities around you.</p>
                                            <div className="search-bar-minimal"
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '450px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px 20px',
                                                    background: '#0f0f0f',
                                                    borderRadius: '50px',
                                                    border: '1px solid #333'
                                                }}
                                            >
                                                <Search size={20} color="#666" />
                                                <input
                                                    type="text"
                                                    placeholder="Search communities by name..."
                                                    value={searchTerm}
                                                    onChange={handleSearch}
                                                    autoFocus
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'white',
                                                        flex: 1,
                                                        outline: 'none',
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        publicCommunities.map(c => (
                                            <div key={c.id} className="community-card" onClick={() => navigate(`/community/${c.id}`)}>
                                                <div className="card-image-wrapper">
                                                    <div className="card-image" style={{ backgroundImage: `url(${c.image_url || 'https://via.placeholder.com/400x200?text=Community'})` }}></div>
                                                </div>
                                                <div className="card-info">
                                                    <h3>{c.name}</h3>
                                                    <div className="meta-row">
                                                        <span className="type-badge">
                                                            {c.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                                                            {c.type}
                                                        </span>
                                                        <span className="member-count">
                                                            <Users size={12} /> {c.members_count}
                                                        </span>
                                                    </div>
                                                    <p className="card-desc">{c.description || 'No description available for this community.'}</p>
                                                    <button className="join-btn">View Details</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateCommunityModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCommunityCreated}
                />
            )}
        </div>
    );
};

export default Community;
