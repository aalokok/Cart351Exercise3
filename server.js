const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alksud:Pd6P7yJ6ghZWhn3a@cluster0.nffxw.mongodb.net/artgenerator?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Schemas
const ArtClickSchema = new mongoose.Schema({
    shapeType: String,
    color: String,
    x: Number,
    y: Number,
    size: Number,
    timestamp: { type: Date, default: Date.now }
});

const NoteSchema = new mongoose.Schema({
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const GlobalStatsSchema = new mongoose.Schema({
    totalClicks: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

// Models
const ArtClick = mongoose.model('ArtClick', ArtClickSchema);
const Note = mongoose.model('Note', NoteSchema);
const GlobalStats = mongoose.model('GlobalStats', GlobalStatsSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/art-clicks', async (req, res) => {
    try {
        const clicks = await ArtClick.find().sort({ timestamp: -1 });
        const stats = await GlobalStats.findOne() || await GlobalStats.create({ totalClicks: 0 });
        res.json({ clicks, totalClicks: stats.totalClicks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/art-clicks', async (req, res) => {
    try {
        const artClick = new ArtClick({
            shapeType: req.body.shapeType,
            color: req.body.color,
            x: req.body.x,
            y: req.body.y,
            size: req.body.size
        });
        await artClick.save();

        let stats = await GlobalStats.findOne();
        if (!stats) {
            stats = new GlobalStats({ totalClicks: 1 });
        } else {
            stats.totalClicks += 1;
            stats.lastUpdated = new Date();
        }
        await stats.save();

        res.status(201).json({ click: artClick, totalClicks: stats.totalClicks });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/latest-note', async (req, res) => {
    try {
        const note = await Note.findOne().sort({ timestamp: -1 });
        res.json(note || { message: "No messages yet!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/leave-note', async (req, res) => {
    try {
        const note = new Note({ message: req.body.message });
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});