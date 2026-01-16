import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Settings, Lock, Globe, Send, Radio, MoreVertical, Check, X, Shield, ShieldAlert, Link as LinkIcon, Phone, Video, Search } from 'lucide-react';
import axios from 'axios';
import './ChatWindow.css';

const ChatWindow = ({ communityId, onBack }) => {
    const [community, setCommunity] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('chat'); // chat, info
    const messagesEndRef = useRef(null);
    const [isBroadcast, setIsBroadcast] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
    }, []);

    useEffect(() => {
        if (communityId) {
            fetchDetails();
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [communityId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://127.0.0.1:5000/api/communities/${communityId}`, {
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
            const res = await axios.get(`http://127.0.0.1:5000/api/communities/${communityId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            const tempMsg = {
                id: Date.now(),
                content: newMessage,
                sender_name: currentUser?.username || 'Me',
                sender_id: currentUser?.id,
                timestamp: new Date().toISOString(),
                is_broadcast: isBroadcast
            };
            setMessages(prev => [...prev, tempMsg]);
            setNewMessage('');

            await axios.post(`http://127.0.0.1:5000/api/communities/${communityId}/messages`, {
                content: tempMsg.content,
                is_broadcast: isBroadcast
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages(); // Sync
        } catch (error) {
            console.error(error);
        }
    };

    const handleJoin = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://127.0.0.1:5000/api/communities/${communityId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDetails(); // Refresh
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Error joining');
        }
    };

    if (loading) return <div className="chat-window-loading">Loading chat...</div>;
    if (!community) return <div className="chat-window-empty">Select a conversation</div>;

    const isMember = community.is_member || community.role === 'admin' || (community.members && community.members.some(m => m.user_id === currentUser?.id));

    if (!isMember) {
        return (
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-avatar" style={{ backgroundImage: `url(${community.image_url})` }}></div>
                    <div className="chat-header-info">
                        <h3>{community.name}</h3>
                        <p>{community.type}</p>
                    </div>
                </div>
                <div className="chat-locked-view">
                    <Lock size={48} color="#8696a0" />
                    <h3>{community.type === 'private' ? 'Private Community' : 'Join to Chat'}</h3>
                    <p>{community.description}</p>
                    <button className="big-join-btn" onClick={handleJoin}>Join Community</button>
                </div>
            </div>
        );
    }

    const canBroadcast = (community.role === 'admin') || (currentUser && ['coach', 'owner', 'admin', 'academy'].includes(currentUser.role));

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-avatar" style={{ backgroundImage: `url(${community.image_url || 'https://via.placeholder.com/100'})` }}></div>
                <div className="chat-header-info" onClick={() => setActiveTab('info')}>
                    <h3>{community.name}</h3>
                    <p>{community.members_count} members • {community.type}</p>
                </div>
                <div className="chat-header-actions">
                    <button><Search size={20} /></button>
                    <button><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className={`chat-body ${activeTab === 'info' ? 'shrink' : ''}`} style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender_id === currentUser?.id ? 'sent' : 'received'} ${msg.is_broadcast ? 'broadcast' : ''}`}>
                        <div className="msg-bubble">
                            {msg.sender_id !== currentUser?.id && <span className="msg-sender">{msg.sender_name}</span>}
                            {msg.is_broadcast && <span className="broadcast-label"><Radio size={10} /> Broadcast</span>}
                            <div className="msg-text">{msg.content}</div>
                            <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-footer">
                {canBroadcast && (
                    <button
                        className={`footer-btn ${isBroadcast ? 'active' : ''}`}
                        onClick={() => setIsBroadcast(!isBroadcast)}
                        title="Broadcast"
                    >
                        <Radio size={20} />
                    </button>
                )}
                <form onSubmit={handleSendMessage} className="footer-input-wrapper">
                    <input
                        type="text"
                        placeholder={isBroadcast ? "Type a broadcast..." : "Type a message"}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                    />
                </form>
                <button className="footer-send-btn" onClick={handleSendMessage}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
