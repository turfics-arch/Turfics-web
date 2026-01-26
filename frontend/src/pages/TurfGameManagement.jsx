import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, AlertCircle, Image as ImageIcon, ChevronLeft, DollarSign, Clock, Zap, Target, Users, MapPin, CheckCircle, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import { showSuccess, showError, showConfirm } from '../utils/SwalUtils';
import { API_URL } from '../utils/api';
import './TurfGameManagement.css';

const TurfGameManagement = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();
    const [turf, setTurf] = useState(null);
    const [games, setGames] = useState([]);
    const [showGameModal, setShowGameModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [editingUnit, setEditingUnit] = useState(null);

    const [gameForm, setGameForm] = useState({
        sport_type: 'Football',
        game_category: 'team',
        default_price: '',
        slot_duration: 60,
        weekend_multiplier: '',
        peak_start: 18,
        peak_end: 22,
        peak_hour_multiplier: ''
    });

    const [unitForm, setUnitForm] = useState({
        name: '',
        unit_type: 'PITCH',
        capacity: '',
        size: '',
        price_override: '',
        indoor: false,
        has_lighting: true
    });

    const sportTypes = ['Football', 'Badminton', 'Tennis', 'Cricket', 'Swimming', 'Basketball'];

    // Image Mgmt State
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentUnitForImg, setCurrentUnitForImg] = useState(null);
    const [newImageUrl, setNewImageUrl] = useState('');

    const unitTypeMap = {
        'Football': 'PITCH',
        'Badminton': 'COURT',
        'Tennis': 'COURT',
        'Cricket': 'NET',
        'Swimming': 'POOL',
        'Basketball': 'COURT'
    };

    useEffect(() => {
        fetchTurfAndGames();
    }, [turfId]);

    const fetchTurfAndGames = async () => {
        try {
            const token = localStorage.getItem('token');
            const turfRes = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const turfs = await turfRes.json();
            const currentTurf = turfs.find(t => t.id === parseInt(turfId));
            setTurf(currentTurf);

            const gamesRes = await fetch(`${API_URL}/api/turfs/${turfId}/games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (gamesRes.ok) {
                const gamesData = await gamesRes.json();
                setGames(gamesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSaveGame = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = selectedGame ? `${API_URL}/api/games/${selectedGame.id}` : `${API_URL}/api/turfs/${turfId}/games`;
            const method = selectedGame ? 'PUT' : 'POST';

            const rules = {};
            if (gameForm.weekend_multiplier) rules.weekend_multiplier = parseFloat(gameForm.weekend_multiplier);
            if (gameForm.peak_hour_multiplier) {
                rules.peak_hour_multiplier = parseFloat(gameForm.peak_hour_multiplier);
                rules.peak_start = parseInt(gameForm.peak_start);
                rules.peak_end = parseInt(gameForm.peak_end);
            }

            const payload = { ...gameForm, pricing_rules: JSON.stringify(rules) };
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showSuccess('Success', `Game configuration saved.`);
                fetchTurfAndGames();
                setShowGameModal(false);
                resetGameForm();
            } else {
                const data = await res.json();
                showError('Error', data.message || 'Failed to save configuration');
            }
        } catch (error) {
            showError('Error', 'Network request failed');
        }
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingUnit ? `${API_URL}/api/units/${editingUnit.id}` : `${API_URL}/api/games/${selectedGame.id}/units`;
            const method = editingUnit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(unitForm)
            });

            if (res.ok) {
                showSuccess('Success', 'Facility unit saved.');
                fetchTurfAndGames();
                setShowUnitModal(false);
                resetUnitForm();
            } else {
                const data = await res.json();
                showError('Error', data.message || 'Failed to save unit');
            }
        } catch (error) {
            showError('Error', 'Network request failed');
        }
    };

    const handleDeleteUnit = async (unitId) => {
        const confirmed = await showConfirm('Disable Unit?', 'This will suspend bookings for this unit.');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/units/${unitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchTurfAndGames();
        } catch (error) {
            showError('Error', 'Failed to remove unit');
        }
    };

    const handleAddImage = async () => {
        if (!newImageUrl) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/units/${currentUnitForImg.id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ image_url: newImageUrl })
            });
            if (res.ok) {
                setNewImageUrl('');
                await fetchTurfAndGames();
                setShowImageModal(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteImage = async (imgId) => {
        const confirmed = await showConfirm('Delete Image?', "Are you sure you want to delete this image?");
        if (!confirmed) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/unit-images/${imgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchTurfAndGames();
                setShowImageModal(false);
            }
        } catch (err) { console.error(err); }
    };


    const openEditGameModal = (game) => {
        setSelectedGame(game);
        let rules = {};
        try { if (game.pricing_rules) rules = JSON.parse(game.pricing_rules); } catch (e) { }

        setGameForm({
            sport_type: game.sport_type,
            game_category: game.game_category,
            default_price: game.default_price,
            slot_duration: game.slot_duration,
            weekend_multiplier: rules.weekend_multiplier || '',
            peak_start: rules.peak_start || 18,
            peak_end: rules.peak_end || 22,
            peak_hour_multiplier: rules.peak_hour_multiplier || ''
        });
        setShowGameModal(true);
    };

    const openAddUnitModal = (game) => {
        setSelectedGame(game);
        setUnitForm({ ...unitForm, unit_type: unitTypeMap[game.sport_type] || 'COURT' });
        setShowUnitModal(true);
    };

    const openEditUnitModal = (game, unit) => {
        setSelectedGame(game);
        setEditingUnit(unit);
        setUnitForm({
            name: unit.name,
            unit_type: unit.unit_type,
            capacity: unit.capacity,
            size: unit.size || '',
            price_override: unit.price_override || '',
            indoor: unit.indoor,
            has_lighting: unit.has_lighting
        });
        setShowUnitModal(true);
    };

    const resetGameForm = () => {
        setGameForm({
            sport_type: 'Football', game_category: 'team', default_price: '', slot_duration: 60,
            weekend_multiplier: '', peak_start: 18, peak_end: 22, peak_hour_multiplier: ''
        });
        setSelectedGame(null);
    };

    const resetUnitForm = () => {
        setUnitForm({ name: '', unit_type: 'PITCH', capacity: '', size: '', price_override: '', indoor: false, has_lighting: true });
        setEditingUnit(null);
    };

    if (!turf) return <div className="loading">Loading configurations...</div>;

    return (
        <div className="game-management-page">
            <Navbar />
            <div className="game-management">
                <header className="gm-header">
                    <div>
                        <button className="back-btn" onClick={() => navigate('/manage-turfs')}>
                            <ChevronLeft size={18} /> Back to Venues
                        </button>
                        <h1>{turf.name}</h1>
                        <p className="turf-location"><MapPin size={16} /> {turf.location}</p>
                    </div>
                    <button className="add-game-btn" onClick={() => { resetGameForm(); setShowGameModal(true); }}>
                        <Plus size={20} /> Onboard New Sport
                    </button>
                </header>

                {games.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon" style={{ margin: '0 auto 2rem' }}>
                            <Target size={48} color="#64748b" />
                        </div>
                        <h3>No Sports Configured</h3>
                        <p>Configure which sports and courts/pitches are available at this venue</p>
                        <button className="add-game-btn" style={{ margin: '0 auto' }} onClick={() => { resetGameForm(); setShowGameModal(true); }}>
                            <Plus size={20} /> Add Your First Sport
                        </button>
                    </div>
                ) : (
                    <div className="games-list">
                        {games.map(game => (
                            <div key={game.id} className="game-card">
                                <header className="game-header">
                                    <div>
                                        <h2>{game.sport_type}</h2>
                                        <div className="game-meta">
                                            <span>₹{game.default_price}/hr</span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            <span>{game.slot_duration} min slots</span>
                                            <span className={`status-badge ${game.is_active ? 'active' : 'inactive'}`}>
                                                {game.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="config-btn" onClick={() => openEditGameModal(game)}>
                                        <Edit size={16} /> Configure Sport
                                    </button>
                                </header>

                                <div className="units-section">
                                    <div className="units-header">
                                        <h3>Manage Facility Units ({game.units_count})</h3>
                                        <button className="add-unit-circle-btn" onClick={() => openAddUnitModal(game)} title="Add Unit">
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {game.units.length === 0 ? (
                                        <p className="no-units">No courts or pitches added for this sport yet.</p>
                                    ) : (
                                        <div className="units-grid">
                                            {game.units.map(unit => (
                                                <div key={unit.id} className="unit-card">
                                                    <span className="unit-type-tag">{unit.unit_type}</span>
                                                    <h4>{unit.name}</h4>

                                                    <div className="unit-stat">
                                                        <Users size={14} /> Cap: {unit.capacity} Players
                                                    </div>
                                                    {unit.size && <div className="unit-stat"><Info size={14} /> {unit.size}</div>}

                                                    <div className="unit-price-display">
                                                        ₹{unit.price_override || game.default_price}<span>/hr</span>
                                                    </div>

                                                    <div className="features-row">
                                                        {unit.indoor && <span className="feature-chip">Indoor</span>}
                                                        {unit.has_lighting && <span className="feature-chip">Floodlights</span>}
                                                    </div>

                                                    <div className="unit-card-actions">
                                                        <div className="action-icon-btn" onClick={() => openEditUnitModal(game, unit)} title="Edit Unit">
                                                            <Edit size={16} />
                                                        </div>
                                                        <div className="action-icon-btn unit-image-manage-btn" onClick={() => { setCurrentUnitForImg(unit); setShowImageModal(true); }} title="Gallery">
                                                            <ImageIcon size={16} />
                                                        </div>
                                                        <div className="action-icon-btn delete-action" onClick={() => handleDeleteUnit(unit.id)} title="Disable Unit">
                                                            <Trash2 size={16} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {game.pricing_rules && (
                                    <div className="pricing-rules-vbox">
                                        <h4><Zap size={16} /> Active Pricing Rules</h4>
                                        <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            {JSON.parse(game.pricing_rules).weekend_multiplier && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <CheckCircle size={14} color="#10b981" />
                                                    Weekend Markup: {JSON.parse(game.pricing_rules).weekend_multiplier}x
                                                </div>
                                            )}
                                            {JSON.parse(game.pricing_rules).peak_hour_multiplier && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <CheckCircle size={14} color="#10b981" />
                                                    Peak Hours ({JSON.parse(game.pricing_rules).peak_start}:00-{JSON.parse(game.pricing_rules).peak_end}:00): {JSON.parse(game.pricing_rules).peak_hour_multiplier}x
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modals remain similarly functional but with premium styling via the CSS classes defined */}
                {showGameModal && (
                    <div className="modal-overlay" onClick={() => setShowGameModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <header className="modal-header">
                                <h2>{selectedGame ? 'Edit Sport Config' : 'Onboard New Sport'}</h2>
                                <button className="close-btn" onClick={() => setShowGameModal(false)}><X size={20} /></button>
                            </header>
                            <form onSubmit={handleSaveGame} className="turf-form">
                                <div className="form-section-title"><Target size={14} /> Sport Logistics</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Select Activity</label>
                                        <select className="premium-input" value={gameForm.sport_type} onChange={e => setGameForm({ ...gameForm, sport_type: e.target.value })} required disabled={!!selectedGame}>
                                            {sportTypes.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Game Type</label>
                                        <select className="premium-input" value={gameForm.game_category} onChange={e => setGameForm({ ...gameForm, game_category: e.target.value })} required>
                                            <option value="team">Team Based</option>
                                            <option value="individual">Individual Slots</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Base Hourly Price (₹)</label>
                                        <input type="number" className="premium-input" value={gameForm.default_price} onChange={e => setGameForm({ ...gameForm, default_price: e.target.value })} required min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label>Slot Duration</label>
                                        <select className="premium-input" value={gameForm.slot_duration} onChange={e => setGameForm({ ...gameForm, slot_duration: parseInt(e.target.value) })} required>
                                            {[30, 60, 90, 120].map(v => <option key={v} value={v}>{v} Minutes</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-section-title"><Zap size={14} /> Intelligence & Dynamic Pricing</div>
                                <div className="pricing-rules-vbox" style={{ marginTop: 0, border: ' none', background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="form-grid" style={{ marginBottom: 0 }}>
                                        <div className="form-group">
                                            <label>Weekend Multiplier (e.g. 1.2)</label>
                                            <input type="number" step="0.1" className="premium-input" value={gameForm.weekend_multiplier} onChange={e => setGameForm({ ...gameForm, weekend_multiplier: e.target.value })} placeholder="1.0" />
                                        </div>
                                        <div className="form-group">
                                            <label>Peak Hour Multiplier</label>
                                            <input type="number" step="0.1" className="premium-input" value={gameForm.peak_hour_multiplier} onChange={e => setGameForm({ ...gameForm, peak_hour_multiplier: e.target.value })} placeholder="1.0" />
                                        </div>
                                        <div className="form-group">
                                            <label>Peak Start Hour</label>
                                            <input type="number" className="premium-input" value={gameForm.peak_start} onChange={e => setGameForm({ ...gameForm, peak_start: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Peak End Hour</label>
                                            <input type="number" className="premium-input" value={gameForm.peak_end} onChange={e => setGameForm({ ...gameForm, peak_end: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <footer className="modal-footer" style={{ background: 'transparent', padding: '1rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowGameModal(false)}>Cancel</button>
                                    <button type="submit" className="add-game-btn">Save Configuration</button>
                                </footer>
                            </form>
                        </div>
                    </div>
                )}

                {showUnitModal && (
                    <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <header className="modal-header">
                                <h2>{editingUnit ? 'Edit Unit' : `Add ${selectedGame?.sport_type} Unit`}</h2>
                                <button className="close-btn" onClick={() => setShowUnitModal(false)}><X size={20} /></button>
                            </header>
                            <form onSubmit={handleCreateUnit} className="turf-form">
                                <div className="form-section-title"><Info size={14} /> Unit Specifications</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Internal Name</label>
                                        <input type="text" className="premium-input" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })} required placeholder="Pitch A, Court 1" />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Capacity (Players)</label>
                                        <input type="number" className="premium-input" value={unitForm.capacity} onChange={e => setUnitForm({ ...unitForm, capacity: e.target.value })} required min="1" />
                                    </div>
                                    <div className="form-group">
                                        <label>Size / Dimensions</label>
                                        <input type="text" className="premium-input" value={unitForm.size} onChange={e => setUnitForm({ ...unitForm, size: e.target.value })} placeholder="7-a-side, 40x20m" />
                                    </div>
                                    <div className="form-group">
                                        <label>Price Override (Optional)</label>
                                        <input type="number" className="premium-input" value={unitForm.price_override} onChange={e => setUnitForm({ ...unitForm, price_override: e.target.value })} placeholder={`Default ₹${selectedGame?.default_price}`} />
                                    </div>
                                </div>

                                <div className="form-section-title"><Zap size={14} /> Features & Type</div>
                                <div className="form-grid" style={{ marginBottom: 0 }}>
                                    <div className="form-group" style={{ display: 'flex', gap: '2rem', alignItems: 'center', paddingTop: '1rem', gridColumn: '1/-1' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                            <input type="checkbox" checked={unitForm.indoor} onChange={e => setUnitForm({ ...unitForm, indoor: e.target.checked })} /> Indoor Facility
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                            <input type="checkbox" checked={unitForm.has_lighting} onChange={e => setUnitForm({ ...unitForm, has_lighting: e.target.checked })} /> Floodlights Available
                                        </label>
                                    </div>
                                </div>

                                <footer className="modal-footer" style={{ background: 'transparent', padding: '2rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowUnitModal(false)}>Cancel</button>
                                    <button type="submit" className="add-game-btn">{editingUnit ? 'Update Unit' : 'Register Unit'}</button>
                                </footer>
                            </form>
                        </div>
                    </div>
                )}

                {showImageModal && currentUnitForImg && (
                    <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                            <header className="modal-header">
                                <h2>Gallery: {currentUnitForImg.name}</h2>
                                <button className="close-btn" onClick={() => setShowImageModal(false)}><X size={20} /></button>
                            </header>
                            <div className="turf-form">
                                <div className="form-group">
                                    <label>Add Image URL</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="text" className="premium-input" placeholder="https://..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
                                        <button className="add-game-btn" onClick={handleAddImage} disabled={!newImageUrl} style={{ padding: '0 1rem' }}><Plus size={20} /></button>
                                    </div>
                                </div>

                                <div className="images-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {currentUnitForImg.images?.map(img => (
                                        <div key={img.id} style={{ position: 'relative', height: '100px', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                onClick={() => handleDeleteImage(img.id)}
                                                style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TurfGameManagement;

