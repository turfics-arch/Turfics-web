import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Calendar, MapPin, DollarSign, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import './HostTournament.css';

const HostTournament = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data Loading State
    const [myTurfs, setMyTurfs] = useState([]);
    const [externalTurfs, setExternalTurfs] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sport: 'Cricket',
        format: 'Knockout',
        teamSize: '11',
        venueType: 'manual', // manual, own_turf, external_turf
        venueId: '', // If own/external
        venueName: '', // For manual or display
        startDate: '',
        endDate: '',
        entryFee: '',
        prizePool: '',
        description: '',
        rules: '',
        maxTeams: 16,
        dailyStartTime: '09:00',
        dailyEndTime: '18:00'
    });

    useEffect(() => {
        fetchVenueOptions();
    }, []);

    const fetchVenueOptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            // 1. Fetch My Turfs if owner
            if (role === 'owner') {
                const res = await axios.get('http://localhost:5000/api/turfs/my-turfs', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyTurfs(res.data);
            }

            // 2. Fetch All Active Turfs for "External" selection
            const resExt = await axios.get('http://localhost:5000/api/turfs');
            setExternalTurfs(resExt.data);

        } catch (err) {
            console.error("Error fetching venues", err);
        }
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleVenueSelect = (e) => {
        const type = e.target.value;
        setFormData(prev => ({
            ...prev,
            venueType: type,
            venueId: '', // Reset selection
            venueName: ''
        }));
    };

    const handleActualVenueChange = (e) => {
        const id = e.target.value;
        const type = formData.venueType;
        let name = '';

        if (type === 'own_turf') {
            const t = myTurfs.find(x => x.id === parseInt(id));
            name = t ? t.name : '';
        } else if (type === 'external_turf') {
            const t = externalTurfs.find(x => x.id === parseInt(id));
            name = t ? t.name : '';
        }

        setFormData(prev => ({
            ...prev,
            venueId: id,
            venueName: name
        }));
    };

    const handlePublish = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                name: formData.name,
                sport: formData.sport,
                entry_fee: parseFloat(formData.entryFee) || 0,
                prize_pool: parseFloat(formData.prizePool) || 0,
                start_date: formData.startDate,
                end_date: formData.endDate,
                location: formData.venueName || 'To be decided',
                max_teams: formData.maxTeams,
                description: formData.description,
                rules: `${formData.format} format. Team Size: ${formData.teamSize}. ${formData.rules}`,
                image_url: `https://placehold.co/600x400/000000/FFFFFF?text=${formData.name}`, // Placeholder for now
                venue_type: formData.venueType,
                turf_id: formData.venueType === 'own_turf' ? formData.venueId : null,
                booking_turf_id: formData.venueType === 'external_turf' ? formData.venueId : null,
                daily_start_time: formData.dailyStartTime,
                daily_end_time: formData.dailyEndTime
            };

            await axios.post('http://localhost:5000/api/tournaments', dataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Tournament Published Successfully!');
            navigate('/tournaments'); // Go to list
        } catch (err) {
            console.error(err);
            alert('Failed to publish tournament: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="step-content">
            <h2>Basic Details</h2>
            <div className="form-group">
                <label>Tournament Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Mumbai Corporate Cup 2026" />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Sport</label>
                    <select name="sport" value={formData.sport} onChange={handleChange}>
                        <option>Cricket</option>
                        <option>Football</option>
                        <option>Badminton</option>
                        <option>Tennis</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Format</label>
                    <select name="format" value={formData.format} onChange={handleChange}>
                        <option>Knockout</option>
                        <option>League</option>
                        <option>League + Knockout</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Team Size</label>
                <input type="text" name="teamSize" value={formData.teamSize} onChange={handleChange} placeholder="Ex: 5v5, 11v11" />
            </div>

            <div className="form-group">
                <label>Max Teams</label>
                <input type="number" name="maxTeams" value={formData.maxTeams} onChange={handleChange} />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h2>Venue & Schedule</h2>

            {/* OWNER'S OWN TURFS - DISPLAYED AS CARDS */}
            {myTurfs.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={18} color="var(--primary)" /> Your Turfs
                    </h3>
                    <div className="turf-selection-grid">
                        {myTurfs.map(t => (
                            <div
                                key={t.id}
                                className={`selection-card ${formData.venueType === 'own_turf' && formData.venueId == t.id ? 'active' : ''}`}
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        venueType: 'own_turf',
                                        venueId: t.id,
                                        venueName: t.name
                                    }));
                                }}
                            >
                                <img src={t.image_url || 'https://via.placeholder.com/300'} alt={t.name} />
                                <div className="sel-card-info">
                                    <h4>{t.name}</h4>
                                    <p>{t.location}</p>
                                </div>
                                {formData.venueType === 'own_turf' && formData.venueId == t.id && (
                                    <div className="check-badge"><CheckCircle size={16} /> Selected</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EXTERNAL / PARTNER TURFS */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Book a Partner Venue</h3>

                {/* Search Bar for External */}
                <div className="host-search-bar" style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder={`Search ${formData.sport} turfs...`}
                        onChange={(e) => {
                            // Simple client-side search simulation for now
                            // ideally triggers API search
                        }}
                    />
                </div>

                <div className="turf-selection-grid">
                    {/* Filter external turfs roughly by sport if needed, or show all */}
                    {externalTurfs.filter(t => !formData.sport || t.sports?.includes(formData.sport) || true).slice(0, 6).map(t => (
                        <div
                            key={t.id}
                            className={`selection-card ${formData.venueType === 'external_turf' && formData.venueId == t.id ? 'active' : ''}`}
                            onClick={() => {
                                setFormData(prev => ({
                                    ...prev,
                                    venueType: 'external_turf',
                                    venueId: t.id,
                                    venueName: t.name
                                }));
                            }}
                        >
                            <div className="card-badge-sport">{formData.sport}</div>
                            <img src={t.image_url || 'https://via.placeholder.com/300'} alt={t.name} />
                            <div className="sel-card-info">
                                <h4>{t.name}</h4>
                                <p>{t.location}</p>
                                <span className="price-hint">From ₹{t.min_price}/hr</span>
                            </div>
                            {formData.venueType === 'external_turf' && formData.venueId == t.id && (
                                <div className="check-badge"><CheckCircle size={16} /> Selected</div>
                            )}
                        </div>
                    ))}
                </div>
                {externalTurfs.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>No external venues found matching criteria.</p>}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Daily Start Time</label>
                    <input type="time" name="dailyStartTime" value={formData.dailyStartTime || '09:00'} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Daily End Time</label>
                    <input type="time" name="dailyEndTime" value={formData.dailyEndTime || '18:00'} onChange={handleChange} />
                </div>
            </div>
            <p className="hint-text" style={{ marginTop: '-10px', marginBottom: '1rem' }}>
                This will block the selected venue for these hours on all tournament days.
            </p>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h2>Prizes & Entry</h2>
            <div className="form-row">
                <div className="form-group">
                    <label>Entry Fee (per team)</label>
                    <div className="input-icon-wrap">
                        <DollarSign size={16} />
                        <input type="number" name="entryFee" value={formData.entryFee} onChange={handleChange} placeholder="0" />
                    </div>
                </div>
                <div className="form-group">
                    <label>Total Prize Pool</label>
                    <div className="input-icon-wrap">
                        <Trophy size={16} color="#ffd700" />
                        <input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} placeholder="0" />
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Briefly describe your tournament..."></textarea>
            </div>

            <div className="form-group">
                <label>Rules</label>
                <textarea name="rules" value={formData.rules} onChange={handleChange} rows="3" placeholder="Specific rules for this tournament..."></textarea>
            </div>
        </div>
    );

    // Mock Poster themes
    const [theme, setTheme] = useState('neon'); // neon, gold, clean

    const renderStep4 = () => (
        <div className="step-content preview-step">
            <h2>Generate Poster & Publish</h2>

            <div className="poster-generator-layout">
                <div className="poster-controls">
                    <label>Select Template Style</label>
                    <div className="theme-options">
                        <button className={`theme-btn ${theme === 'neon' ? 'active' : ''}`} onClick={() => setTheme('neon')}>Neon Dark</button>
                        <button className={`theme-btn ${theme === 'gold' ? 'active' : ''}`} onClick={() => setTheme('gold')}>Pro Gold</button>
                        <button className={`theme-btn ${theme === 'clean' ? 'active' : ''}`} onClick={() => setTheme('clean')}>Clean White</button>
                    </div>

                    <p className="generator-tip">
                        Your poster is auto-generated with a unique QR code for instant registration.
                    </p>

                    <button className="download-btn-outline">
                        Download Poster (PNG)
                    </button>
                </div>

                {/* Live Poster Preview */}
                <div className={`poster-canvas theme-${theme}`}>
                    <div className="poster-header">
                        <span className="p-sport-tag">{formData.sport}</span>
                        <h1>{formData.name || 'Tournament Name'}</h1>
                        <p className="p-venue"><MapPin size={14} /> {formData.venueName || 'Venue TBD'}</p>
                    </div>

                    <div className="poster-body">
                        <div className="p-huge-prize">
                            <span className="label">WINNING PRIZE</span>
                            <strong className="val">₹{formData.prizePool || '0'}</strong>
                        </div>

                        <div className="p-grid">
                            <div className="p-item">
                                <span className="lbl">ENTRY FEE</span>
                                <span className="txt">₹{formData.entryFee}</span>
                            </div>
                            <div className="p-item">
                                <span className="lbl">FORMAT</span>
                                <span className="txt">{formData.format}</span>
                            </div>
                            <div className="p-item">
                                <span className="lbl">DATE</span>
                                <span className="txt">{formData.startDate}</span>
                            </div>
                            <div className="p-item">
                                <span className="lbl">TEAM SIZE</span>
                                <span className="txt">{formData.teamSize}</span>
                            </div>
                        </div>
                    </div>

                    <div className="poster-footer">
                        <div className="qr-section">
                            {/* Simulated QR */}
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=turfics://${formData.name}`} alt="Scan to Join" className="qr-img" />
                            <span>Scan to Register</span>
                        </div>
                        <div className="brand-sect">
                            <span>Powered by</span>
                            <strong>Turfics.</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="host-page">
            <Navbar />
            <div style={{ marginTop: '60px' }}></div>

            <div className="host-container">
                <div className="wizard-sidebar">
                    <h1>Host Tournament</h1>
                    <div className="step-indicator">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`step-item ${step >= s ? 'active' : ''}`}>
                                <div className="step-circle">{step > s ? <CheckCircle size={16} /> : s}</div>
                                <span>{s === 1 ? 'Details' : s === 2 ? 'Venue' : s === 3 ? 'Prizes' : 'Review'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="wizard-content">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}

                    <div className="wizard-actions">
                        {step > 1 ? (
                            <button className="back-btn" onClick={handleBack}><ArrowLeft size={18} /> Back</button>
                        ) : <div></div>}

                        {step < 4 ? (
                            <button className="next-btn" onClick={handleNext}>Next <ArrowRight size={18} /></button>
                        ) : (
                            <button className="publish-btn glow-effect" onClick={handlePublish} disabled={loading}>
                                {loading ? 'Publishing...' : 'Publish Tournament'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostTournament;
