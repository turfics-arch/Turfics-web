import React, { useState, useRef } from 'react';
import { X, Sparkles, Download, Wand2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import { showSuccess, showError, showToast } from '../utils/SwalUtils';
import html2canvas from 'html2canvas';

// Default background options ("The 3 present")
const BACKGROUNDS = [
    { id: 'neon', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop', name: 'Neon Sports' },
    { id: 'dark', url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop', name: 'Dark Arena' },
    { id: 'minimal', url: 'https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop', name: 'Minimal Field' },
    { id: 'ai-custom', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop', name: 'AI Suggest' }
];

const AIPosterGeneratorModal = ({ tournament, onClose }) => {
    const [step, setStep] = useState(1); // 1: Input, 2: Generating, 3: Preview
    const [tone, setTone] = useState('Energetic & Competitive');
    const [customTone, setCustomTone] = useState('');
    const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const posterRef = useRef(null);

    const handleGenerate = async () => {
        setStep(2);
        try {
            const token = localStorage.getItem('token');
            // DEBUG: Check if token exists
            if (!token) {
                console.error("No token found in localStorage");
                setStep(1);
                showError('Auth Error', 'You are not logged in.');
                return;
            }

            console.log("Sending AI request with token:", token ? "Token present" : "No Token");

            const res = await axios.post(`${API_URL}/api/ai/generate-poster`, {
                name: tournament.name,
                sport: tournament.sport,
                entry_fee: tournament.entry_fee,
                prize_pool: tournament.prize_pool,
                start_date: tournament.start_date || 'Date TBD',
                tone: tone,
                custom_tone: tone === 'Other' ? customTone : null,
                image_prompt: selectedBg.id === 'ai-custom' ? imagePrompt : null
            }, { headers: { Authorization: `Bearer ${token}` } });

            setGeneratedContent(res.data);
            setTimeout(() => setStep(3), 1500); // Small delay for "finish" effect
        } catch (err) {
            console.error("AI Generation Error:", err);
            setStep(1);
            if (err.response && err.response.status === 401) {
                showError('Session Expired', 'Please log in again to use AI features.');
            } else {
                showError('AI Error', 'Failed to generate poster content.');
            }
        }
    };

    const handleDownload = async () => {
        if (posterRef.current) {
            try {
                // Use html2canvas with CORs handling enabled
                const canvas = await html2canvas(posterRef.current, {
                    useCORS: true,
                    scale: 2,
                    allowTaint: true
                });
                const link = document.createElement('a');
                link.download = `${tournament.name.replace(/\s+/g, '_')}_Poster.png`;
                link.href = canvas.toDataURL();
                link.click();
                showSuccess('Downloaded', 'Poster saved to device!');
                onClose();
            } catch (err) {
                console.error(err);
                showError('Download Warning', 'Image saved but some external assets might be missing due to security policies.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="wizard-card scale-in" style={{ maxWidth: '900px', width: '90%', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="wizard-header" style={{ position: 'relative' }}>
                    <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={24} color="#00e676" />
                        Smart Poster Generator
                    </h2>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                    {/* Step 1: Input */}
                    {step === 1 && (
                        <div className="slide-in" style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Poster Tone</label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', background: '#1e293b', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                                >
                                    <option>Energetic & Competitive</option>
                                    <option>Clean & Professional</option>
                                    <option>Fun & Community</option>
                                    <option>Urgent (Last Call)</option>
                                    <option>Other</option>
                                </select>
                                {tone === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="Describe tone (e.g. Luxurious, Aggressive...)"
                                        value={customTone}
                                        onChange={e => setCustomTone(e.target.value)}
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                                    />
                                )}
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Background Style</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                                    {BACKGROUNDS.map(bg => (
                                        <div
                                            key={bg.id}
                                            onClick={() => setSelectedBg(bg)}
                                            style={{
                                                border: selectedBg.id === bg.id ? '2px solid #00e676' : '2px solid transparent',
                                                borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative'
                                            }}
                                        >
                                            <div style={{ height: '80px', position: 'relative' }}>
                                                {bg.id === 'ai-custom' ? (
                                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Sparkles size={24} color="#ffd700" />
                                                    </div>
                                                ) : (
                                                    <img src={bg.url} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', padding: '2px', textAlign: 'center' }}>{bg.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedBg.id === 'ai-custom' && (
                                    <textarea
                                        rows="3"
                                        placeholder="Describe the background image (e.g. Neon football stadium at night with lightning)"
                                        value={imagePrompt}
                                        onChange={e => setImagePrompt(e.target.value)}
                                        style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: '#111', border: '1px solid #var(--primary)', color: 'white', borderRadius: '8px', resize: 'none' }}
                                    ></textarea>
                                )}
                            </div>

                            <button className="join-btn-large glow-effect" onClick={handleGenerate}>
                                <Wand2 size={20} style={{ marginRight: '8px' }} />
                                create poster with AI
                            </button>
                        </div>
                    )}

                    {/* Step 2: Loading State */}
                    {step === 2 && (
                        <div style={{ textAlign: 'center' }}>
                            <div className="loader" style={{ margin: '0 auto 2rem auto' }}></div>
                            <h3 className="fade-in-out">AI is crafting your poster...</h3>
                            <p style={{ color: '#888' }}>Generating text & designing visuals...</p>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && generatedContent && (
                        <div className="slide-in" style={{ width: '100%', height: '100%', display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <div ref={posterRef} style={{
                                width: '400px',
                                height: '500px', // Standard Story/Poster Ratio
                                position: 'relative',
                                background: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${generatedContent.background_image || selectedBg.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: '2rem',
                                color: 'white',
                                boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                                fontFamily: "'Inter', sans-serif"
                            }}>
                                {/* Header Section */}
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    <div style={{ background: '#00e676', color: 'black', display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                        {tournament.sport}
                                    </div>
                                    <h1 style={{ fontSize: '2.5rem', lineHeight: '1', fontWeight: '900', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,0.5)', margin: '0 0 0.5rem 0' }}>
                                        {generatedContent.headline}
                                    </h1>
                                    <p style={{ fontSize: '1rem', fontStyle: 'italic', opacity: '0.9' }}>{generatedContent.subheadline}</p>
                                </div>

                                {/* Mid Section: Highlights */}
                                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                        {generatedContent.highlights.map((h, i) => (
                                            <li key={i} style={{ marginBottom: '0.3rem' }}>{h}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Footer Section: Details */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '1rem' }}>
                                        <div>
                                            <small style={{ color: '#ccc', fontSize: '0.7rem', textTransform: 'uppercase' }}>Entry</small>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#00e676' }}>₹{tournament.entry_fee}</div>
                                        </div>
                                        <div>
                                            <small style={{ color: '#ccc', fontSize: '0.7rem', textTransform: 'uppercase' }}>Win</small>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#ffd700' }}>₹{tournament.prize_pool}</div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'white', color: 'black', padding: '0.8rem', borderRadius: '8px', fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                                        {generatedContent.call_to_action}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="manage-link-btn" onClick={() => setStep(1)} style={{ width: 'auto' }}>Try Again</button>
                                <button className="join-btn-large glow-effect" onClick={handleDownload} style={{ width: 'auto', marginBottom: 0 }}>
                                    <Download size={20} style={{ marginRight: '8px' }} /> Download Poster
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIPosterGeneratorModal;
