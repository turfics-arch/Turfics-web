import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Settings, Lock, Globe, Send, Radio, MoreVertical, Check, X, Shield, ShieldAlert, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../utils/SwalUtils';
import './CommunityDetails.css';

const CommunityDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [community, setCommunity] = useState(null);
    const [activeTab, setActiveTab] = useState('chat');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showCopied, setShowCopied] = useState(false);
    const messagesEndRef = useRef(null);

    // ... (existing effects)

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    useEffect(() => {
        // Get user from token (simple decode or stored user)
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'chat' && community?.is_member) {
            fetchMessages();
            // Polling for demo purposes
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        } else if (activeTab === 'members' && community?.is_member) {
            fetchMembers();
        }
    }, [activeTab, community]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/communities/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunity(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/communities/${id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/communities/${id}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleJoin = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://127.0.0.1:5000/api/communities/${id}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchDetails(); // Refresh status
            showSuccess('Joined!', res.data.message);
        } catch (error) {
            showError('Join Failed', error.response?.data?.message || 'Error joining');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/communities/${id}/messages`, {
                content: newMessage,
                is_broadcast: isBroadcast
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            showError('Send Failed', error.response?.data?.message || 'Failed to send');
        }
    };

    const handleMemberAction = async (userId, action) => {
        const confirmed = await showConfirm('Confirm Action', `Are you sure you want to ${action} this user?`);
        if (!confirmed) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:5000/api/communities/${id}/members/action`, {
                user_id: userId,
                action: action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMembers();
        } catch (error) {
            showError('Action Failed', error.response?.data?.message || 'Action failed');
        }
    };

    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!community) return <div className="error-screen">Community not found</div>;

    const canBroadcast = (community.role === 'admin') || (currentUser && ['coach', 'owner', 'admin', 'academy'].includes(currentUser.role));

    return (
        <div className="community-details-page">
            <Navbar />
            <div className="community-spacer"></div>

            <div className="details-container">
                {/* Header */}
                <div className="details-header" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${community.image_url || 'https://via.placeholder.com/1200x300?text=Community'})` }}>
                    <div className="header-info">
                        <div className="badges">
                            <span className="type-badge">
                                {community.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                                {community.type}
                            </span>
                            {community.role === 'admin' && <span className="admin-badge">Admin</span>}
                        </div>
                        <h1>{community.name}</h1>
                        <p>{community.description}</p>

                        <div className="stats-bar">
                            <span><Users size={16} /> {community.members_count} Members</span>
                        </div>
                    </div>

                    <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Share Button for Everyone */}
                        <button
                            className="share-btn"
                            onClick={handleCopyLink}
                            title="Copy Invitation Link"
                        >
                            <LinkIcon size={18} />
                            {showCopied ? "Copied!" : "Share"}
                        </button>

                        {!community.is_member && community.status !== 'pending' && (
                            <button className="join-action-btn" onClick={handleJoin}>Join Community</button>
                        )}
                        {community.status === 'pending' && (
                            <button className="pending-btn" disabled>Request Pending</button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="details-tabs">
                    <button
                        className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <MessageSquare size={18} /> Chat
                    </button>
                    <button
                        className={`tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        <Users size={18} /> Members
                    </button>
                </div>

                {/* Content */}
                <div className="details-content">
                    {!community.is_member ? (
                        <div className="locked-view">
                            <Lock size={48} />
                            <h3>Community Locked</h3>
                            <p>{community.message || "Join this community to view content."}</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'chat' && (
                                <div className="chat-container">
                                    <div className="messages-list">
                                        {messages.length === 0 ? (
                                            <div className="empty-chat">No messages yet. Start the conversation!</div>
                                        ) : (
                                            messages.map(msg => (
                                                <div key={msg.id} className={`message ${msg.sender_id === currentUser?.id ? 'own' : ''} ${msg.is_broadcast ? 'broadcast' : ''}`}>
                                                    <div className="message-header">
                                                        <span className="sender">{msg.sender_name}</span>
                                                        {msg.is_broadcast && <span className="broadcast-tag"><Radio size={10} /> Broadcast</span>}
                                                        <span className="time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="message-content">{msg.content}</div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <form className="chat-input" onSubmit={handleSendMessage}>
                                        {canBroadcast && (
                                            <div className="broadcast-toggle">
                                                <label title="Send as Broadcast">
                                                    <input
                                                        type="checkbox"
                                                        checked={isBroadcast}
                                                        onChange={e => setIsBroadcast(e.target.checked)}
                                                    />
                                                    <Radio size={18} className={isBroadcast ? 'active' : ''} />
                                                </label>
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder={isBroadcast ? "Type a broadcast announcement..." : "Type a message..."}
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                        />
                                        <button type="submit"><Send size={20} /></button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <div className="members-list">
                                    {members.map(member => (
                                        <div key={member.userId} className="member-item">
                                            <div className="member-info">
                                                <div className="avatar">{member.username[0].toUpperCase()}</div>
                                                <div>
                                                    <div className="name">
                                                        {member.username}
                                                        {member.role === 'admin' && <Shield size={14} className="icon-admin" />}
                                                    </div>
                                                    <div className="joined">Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="member-status">
                                                {member.status === 'pending' && <span className="status-tag pending">Pending</span>}
                                                {member.status === 'banned' && <span className="status-tag banned">Banned</span>}
                                            </div>

                                            {community.role === 'admin' && member.role !== 'admin' && ( // Only Admins can act on others
                                                <div className="admin-actions">
                                                    {member.status === 'pending' && (
                                                        <>
                                                            <button className="action-btn approve" onClick={() => handleMemberAction(member.userId, 'approve')}><Check size={16} /></button>
                                                            <button className="action-btn reject" onClick={() => handleMemberAction(member.userId, 'reject')}><X size={16} /></button>
                                                        </>
                                                    )}
                                                    {member.status === 'active' && (
                                                        <button className="action-btn kick" title="Kick" onClick={() => handleMemberAction(member.userId, 'kick')}><ShieldAlert size={16} /></button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunityDetails;
