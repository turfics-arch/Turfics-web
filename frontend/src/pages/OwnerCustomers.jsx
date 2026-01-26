import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Search, Mail, Phone, Calendar, DollarSign, User, MessageCircle, X, ChevronRight } from 'lucide-react';
import { showError, showSuccess } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './Dashboard.css'; // Reuse dashboard styles

const OwnerCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/owner/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!messageText.trim()) return;

        // Mock Sending
        setTimeout(() => {
            showSuccess('Message Sent', `Message sent to ${selectedCustomer.name} via WhatsApp/SMS.`);
            setShowMessageModal(false);
            setMessageText('');
        }, 1000);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <Navbar />

            <div className="dashboard-content">
                <div className="section-header">
                    <div>
                        <h1>Customer Management</h1>
                        <p style={{ color: '#94a3b8' }}>View and engage with your loyal players</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.8rem 1rem 0.8rem 2.5rem',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: 'white',
                                width: '300px'
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading customers...</div>
                ) : (
                    <div className="customers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {filteredCustomers.map(customer => (
                            <div key={customer.id} style={{
                                background: '#1e293b',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '50px', height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', fontWeight: 'bold'
                                    }}>
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{customer.name}</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                                            {customer.phone || 'No Phone'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                                    background: '#0f172a', padding: '1rem', borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bookings</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{customer.total_bookings}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Spend</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>₹{customer.total_spend}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Visit</div>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setSelectedCustomer(customer); setShowMessageModal(true); }}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        fontWeight: '600',
                                        marginTop: 'auto'
                                    }}
                                >
                                    <MessageCircle size={18} /> Send Message
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {showMessageModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Message {selectedCustomer.name}</h3>
                            <button className="modal-close-btn" onClick={() => setShowMessageModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Send a promotional offers or reminder directly to their phone/email.
                            </p>
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                                style={{
                                    width: '100%', height: '120px',
                                    background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: '8px', padding: '0.8rem', color: 'white',
                                    marginBottom: '1rem'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn-cancel-text" onClick={() => setShowMessageModal(false)}>Cancel</button>
                                <button className="btn-accept" onClick={handleSendMessage}>Send Broadcast</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerCustomers;
