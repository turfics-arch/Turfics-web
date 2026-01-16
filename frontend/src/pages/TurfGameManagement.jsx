import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
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
        // Pricing Rules
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

            // Fetch turf details
            const turfRes = await fetch(`${API_URL}/api/turfs/my-turfs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const turfs = await turfRes.json();
            const currentTurf = turfs.find(t => t.id === parseInt(turfId));
            setTurf(currentTurf);

            // Fetch games
            const gamesRes = await fetch(`${API_URL}/api/turfs/${turfId}/games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (gamesRes.ok) {
                const gamesData = await gamesRes.json();
                setGames(gamesData);
            } else if (gamesRes.status === 401 || gamesRes.status === 422) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSaveGame = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = selectedGame
                ? `${API_URL}/api/games/${selectedGame.id}`
                : `${API_URL}/api/turfs/${turfId}/games`;

            const method = selectedGame ? 'PUT' : 'POST';

            // Construct Pricing Rules JSON
            const rules = {};
            if (gameForm.weekend_multiplier) rules.weekend_multiplier = parseFloat(gameForm.weekend_multiplier);
            if (gameForm.peak_hour_multiplier) {
                rules.peak_hour_multiplier = parseFloat(gameForm.peak_hour_multiplier);
                rules.peak_start = parseInt(gameForm.peak_start);
                rules.peak_end = parseInt(gameForm.peak_end);
            }

            const payload = {
                ...gameForm,
                pricing_rules: JSON.stringify(rules)
            };

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showSuccess('Success', `Game ${selectedGame ? 'updated' : 'added'} successfully!`);
                fetchTurfAndGames();
                setShowGameModal(false);
                resetGameForm();
            } else if (res.status === 401 || res.status === 422) {
                showError('Session Expired', 'Please login again.');
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const data = await res.json();
                showError('Error', data.message || 'Failed to save sport');
            }
        } catch (error) {
            console.error('Error saving game:', error);
        }
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingUnit
                ? `${API_URL}/api/units/${editingUnit.id}`
                : `${API_URL}/api/games/${selectedGame.id}/units`;

            const method = editingUnit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(unitForm)
            });

            if (res.ok) {
                showSuccess('Success', 'Unit saved successfully!');
                fetchTurfAndGames();
                setShowUnitModal(false);
                resetUnitForm();
                setEditingUnit(null);
            } else if (res.status === 401 || res.status === 422) {
                showError('Session Expired', 'Please login again.');
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const data = await res.json();
                showError('Error', data.message || 'Failed to save unit');
            }
        } catch (error) {
            console.error('Error saving unit:', error);
        }
    };

    const handleDeleteUnit = async (unitId) => {
        const confirmed = await showConfirm('Disable Unit?', 'Are you sure? This will hide it from bookings.');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/units/${unitId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchTurfAndGames();
            } else if (res.status === 401 || res.status === 422) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                showError('Failed', 'Failed to delete unit');
            }
        } catch (error) {
            console.error('Error deleting unit:', error);
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
        } catch (err) { console.error("Error adding image:", err); }
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
        } catch (err) { console.error("Error deleting image:", err); }
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
        setUnitForm({
            ...unitForm,
            unit_type: unitTypeMap[game.sport_type] || 'COURT'
        });
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
            sport_type: 'Football',
            game_category: 'team',
            default_price: '',
            slot_duration: 60,
            weekend_multiplier: '',
            peak_start: 18,
            peak_end: 22,
            peak_hour_multiplier: ''
        });
        setSelectedGame(null);
    };

    const resetUnitForm = () => {
        setUnitForm({
            name: '',
            unit_type: 'PITCH',
            capacity: '',
            size: '',
            price_override: '',
            indoor: false,
            has_lighting: true
        });
    };

    if (!turf) return <div className="loading">Loading...</div>;

    return (
        <div className="game-management-page">
            <Navbar />
            <div style={{ marginTop: '80px' }}></div>

            <div className="game-management">
                <div className="gm-header">
                    <div>
                        <button className="back-btn" onClick={() => navigate('/manage-turfs')}>
                            ← Back to Turfs
                        </button>
                        <h1>{turf.name}</h1>
                        <p className="turf-location">📍 {turf.location}</p>
                    </div>
                    <button className="add-game-btn" onClick={() => { resetGameForm(); setShowGameModal(true); }}>
                        <Plus size={20} /> Add Sport/Game
                    </button>
                </div>

                {games.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} color="#666" />
                        <h3>No Sports Added Yet</h3>
                        <p>Add sports/games to your turf to start accepting bookings</p>
                        <button className="add-game-btn" onClick={() => { resetGameForm(); setShowGameModal(true); }}>
                            <Plus size={20} /> Add Your First Sport
                        </button>
                    </div>
                ) : (
                    <div className="games-list">
                        {games.map(game => (
                            <div key={game.id} className="game-card">
                                <div className="game-header">
                                    <div>
                                        <h2>{game.sport_type}</h2>
                                        <div className="game-meta">
                                            <span>₹{game.default_price}/hr</span>
                                            <span>•</span>
                                            <span>{game.slot_duration} min slots</span>
                                            <span>•</span>
                                            <span className={`status-badge ${game.is_active ? 'active' : 'inactive'}`}>
                                                {game.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="edit-unit-btn" onClick={() => openEditGameModal(game)} style={{ marginLeft: 'auto' }}>
                                        <Edit size={18} /> Edit Config
                                    </button>
                                </div>

                                <div className="units-section">
                                    <div className="units-header">
                                        <h3>Units ({game.units_count})</h3>
                                        <button
                                            className="add-unit-btn"
                                            onClick={() => openAddUnitModal(game)}
                                        >
                                            <Plus size={16} /> Add Unit
                                        </button>
                                    </div>

                                    {game.units.length === 0 ? (
                                        <p className="no-units">No units added yet</p>
                                    ) : (
                                        <div className="units-grid">
                                            {game.units.map(unit => (
                                                <div key={unit.id} className={`unit-card ${unit.status}`}>
                                                    <div className="unit-info">
                                                        <h4>{unit.name}</h4>
                                                        <p className="unit-type">{unit.unit_type}</p>
                                                        {unit.size && <p className="unit-size">{unit.size}</p>}
                                                        <p className="unit-capacity">Capacity: {unit.capacity} players</p>
                                                        <p className="unit-price">
                                                            ₹{unit.price_override || game.default_price}/hr
                                                        </p>
                                                        <div className="unit-features">
                                                            {unit.indoor && <span className="feature-tag">Indoor</span>}
                                                            {unit.has_lighting && <span className="feature-tag">Lights</span>}
                                                        </div>
                                                    </div>
                                                    <div className="unit-actions">
                                                        <button
                                                            className="edit-unit-btn"
                                                            onClick={() => openEditUnitModal(game, unit)}
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            className="edit-unit-btn"
                                                            onClick={() => { setCurrentUnitForImg(unit); setShowImageModal(true); }}
                                                            title="Manage Images"
                                                        >
                                                            <ImageIcon size={14} />
                                                        </button>
                                                        <button
                                                            className="delete-unit-btn"
                                                            onClick={() => handleDeleteUnit(unit.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Game Modal */}
                {showGameModal && (
                    <div className="modal-overlay" onClick={() => setShowGameModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedGame ? 'Edit Game Config' : 'Add New Sport/Game'}</h2>
                                <button className="close-btn" onClick={() => setShowGameModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveGame} className="game-form">
                                <div className="form-group">
                                    <label>Sport Type *</label>
                                    <select
                                        value={gameForm.sport_type}
                                        onChange={(e) => setGameForm({ ...gameForm, sport_type: e.target.value })}
                                        required
                                        disabled={!!selectedGame}
                                    >
                                        {sportTypes.map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Game Category *</label>
                                    <select
                                        value={gameForm.game_category}
                                        onChange={(e) => setGameForm({ ...gameForm, game_category: e.target.value })}
                                        required
                                    >
                                        <option value="team">Team Sport</option>
                                        <option value="individual">Individual Sport</option>
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Default Price (₹/hr) *</label>
                                        <input
                                            type="number"
                                            value={gameForm.default_price}
                                            onChange={(e) => setGameForm({ ...gameForm, default_price: e.target.value })}
                                            required
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Slot Duration (min) *</label>
                                        <select
                                            value={gameForm.slot_duration}
                                            onChange={(e) => setGameForm({ ...gameForm, slot_duration: parseInt(e.target.value) })}
                                            required
                                        >
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>60 minutes</option>
                                            <option value={90}>90 minutes</option>
                                            <option value={120}>120 minutes</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="summary-box" style={{ background: '#252525', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#fbbf24' }}>⚡ Dynamic Pricing Rules (Optional)</h4>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Weekend Multiplier (e.g. 1.2)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={gameForm.weekend_multiplier}
                                                onChange={(e) => setGameForm({ ...gameForm, weekend_multiplier: e.target.value })}
                                                placeholder="1.0"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Peak Start Hour (0-23)</label>
                                            <input
                                                type="number"
                                                value={gameForm.peak_start}
                                                onChange={(e) => setGameForm({ ...gameForm, peak_start: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Peak End Hour (0-23)</label>
                                            <input
                                                type="number"
                                                value={gameForm.peak_end}
                                                onChange={(e) => setGameForm({ ...gameForm, peak_end: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Peak Hour Multiplier (e.g. 1.5)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={gameForm.peak_hour_multiplier}
                                            onChange={(e) => setGameForm({ ...gameForm, peak_hour_multiplier: e.target.value })}
                                            placeholder="1.0"
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowGameModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">
                                        {selectedGame ? 'Update Configuration' : 'Add Sport'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Unit Modal */}
                {showUnitModal && (
                    <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingUnit ? 'Edit Unit' : `Add Unit to ${selectedGame?.sport_type}`}</h2>
                                <button className="close-btn" onClick={() => setShowUnitModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUnit} className="unit-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Unit Name *</label>
                                        <input
                                            type="text"
                                            value={unitForm.name}
                                            onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                                            required
                                            placeholder="e.g., Court 1, Pitch A"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Unit Type *</label>
                                        <select
                                            value={unitForm.unit_type}
                                            onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value })}
                                            required
                                        >
                                            <option value="COURT">Court</option>
                                            <option value="PITCH">Pitch</option>
                                            <option value="POOL">Pool</option>
                                            <option value="NET">Net</option>
                                            <option value="SPACE">Space</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Capacity (players) *</label>
                                        <input
                                            type="number"
                                            value={unitForm.capacity}
                                            onChange={(e) => setUnitForm({ ...unitForm, capacity: e.target.value })}
                                            required
                                            min="1"
                                            placeholder="10"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Size/Type</label>
                                        <input
                                            type="text"
                                            value={unitForm.size}
                                            onChange={(e) => setUnitForm({ ...unitForm, size: e.target.value })}
                                            placeholder="e.g., 7-a-side, Full Size"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Price Override (₹/hr)</label>
                                    <input
                                        type="number"
                                        value={unitForm.price_override}
                                        onChange={(e) => setUnitForm({ ...unitForm, price_override: e.target.value })}
                                        min="0"
                                        placeholder={`Leave empty to use default (₹${selectedGame?.default_price})`}
                                    />
                                    <small>Leave empty to use game's default price</small>
                                </div>

                                <div className="form-row">
                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={unitForm.indoor}
                                                onChange={(e) => setUnitForm({ ...unitForm, indoor: e.target.checked })}
                                            />
                                            Indoor
                                        </label>
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={unitForm.has_lighting}
                                                onChange={(e) => setUnitForm({ ...unitForm, has_lighting: e.target.checked })}
                                            />
                                            Has Lighting
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowUnitModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">
                                        {editingUnit ? 'Update Unit' : 'Add Unit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Images Modal */}
                {showImageModal && currentUnitForImg && (
                    <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Manage Images for {currentUnitForImg.name}</h2>
                                <button className="close-btn" onClick={() => setShowImageModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="add-image-row">
                                    <input
                                        type="text"
                                        placeholder="Enter Image URL..."
                                        value={newImageUrl}
                                        onChange={e => setNewImageUrl(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                                    />
                                    <button className="submit-btn" onClick={handleAddImage} disabled={!newImageUrl}>Add</button>
                                </div>
                                <div className="images-grid" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                    {currentUnitForImg.images?.map(img => (
                                        <div key={img.id} style={{ position: 'relative' }}>
                                            <img src={img.url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button
                                                onClick={() => handleDeleteImage(img.id)}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!currentUnitForImg.images || currentUnitForImg.images.length === 0) && <p style={{ color: '#666', gridColumn: '1/-1' }}>No images added.</p>}
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
