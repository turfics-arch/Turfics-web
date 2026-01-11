
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API_URL from '../config';
import { Send, MessageSquare, Headphones, CreditCard, LifeBuoy, AlertTriangle } from 'lucide-react';
import './Support.css';

const Support = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hello! I'm Alex, the Senior Service Lead here at Turfics. How can I assist you today with bookings, matches, or payments?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/support/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ message: userMsg, history: messages })
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting to my knowledge base right now. Please try again later." }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', text: "Network error. Please check your connection." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="support-page">
            <Navbar />

            <div className="support-hero">
                <h1>Help & Support</h1>
                <p>Expert assistance available 24/7. From booking issues to platform navigation, Alex is here to help.</p>
            </div>

            <div className="support-content">
                {/* Left Side: FAQ & Shortcuts */}
                <div className="faq-section">
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Common Topics</h2>

                    <div className="faq-card">
                        <h3><CreditCard size={20} /> Payment Issues</h3>
                        <p>If your booking failed but money was deducted, it will be auto-refunded within 5-7 business days. You can also chat with Alex for immediate status checks.</p>
                    </div>

                    <div className="faq-card">
                        <h3><LifeBuoy size={20} /> Cancellation Policy</h3>
                        <p>Bookings can be cancelled up to 24 hours before the slot time for a full refund. Late cancellations may incur a 50% fee.</p>
                    </div>

                    <div className="faq-card">
                        <h3><AlertTriangle size={20} /> Reporting a Venue</h3>
                        <p>Found a discrepancy with a turf? Let us know immediately. We take quality assurance seriously.</p>
                    </div>
                </div>

                {/* Right Side: Chatbot */}
                <div className="chat-section">
                    <div className="chat-header">
                        <div className="chat-avatar">
                            <Headphones size={24} />
                        </div>
                        <div className="chat-info">
                            <h3>Turfics Support</h3>
                            <p>Alex (Senior Team Lead)</p>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="message bot loading">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type your question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Support;
