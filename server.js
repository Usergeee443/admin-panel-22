const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static('public'));

// Utility function to get the path to the burgers.json file
const getBurgersFilePath = () => path.join(__dirname, 'burgers.json');

// API routes
app.get('/api/burgers', async (req, res) => {
    try {
        const filePath = getBurgersFilePath();
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading burger data:', error);
        res.status(500).json({ error: 'Error reading burger data', details: error.message });
    }
});

app.post('/api/burgers', async (req, res) => {
    try {
        const filePath = getBurgersFilePath();
        const currentData = await fs.readFile(filePath, 'utf8');
        const burgers = JSON.parse(currentData);
        burgers.push(req.body);
        await fs.writeFile(filePath, JSON.stringify(burgers, null, 2));
        res.json({ message: 'Burger added successfully' });
    } catch (error) {
        console.error('Error saving burger data:', error);
        res.status(500).json({ error: 'Error saving burger data', details: error.message });
    }
});

app.delete('/api/burgers/:index', async (req, res) => {
    try {
        const filePath = getBurgersFilePath();
        const currentData = await fs.readFile(filePath, 'utf8');
        let burgers = JSON.parse(currentData);
        const index = parseInt(req.params.index, 10);
        if (isNaN(index) || index < 0 || index >= burgers.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        burgers.splice(index, 1);
        await fs.writeFile(filePath, JSON.stringify(burgers, null, 2));
        res.json({ message: 'Burger deleted successfully' });
    } catch (error) {
        console.error('Error deleting burger:', error);
        res.status(500).json({ error: 'Error deleting burger', details: error.message });
    }
});

// Serve index.html for all non-API routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;