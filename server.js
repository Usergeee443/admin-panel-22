const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/burgers', async (req, res) => {
    try {
        const data = await fs.readFile('burgers.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading burger data:', error);
        res.status(500).json({ error: 'Error reading burger data' });
    }
});

app.post('/api/burgers', async (req, res) => {
    try {
        const currentData = await fs.readFile('burgers.json', 'utf8');
        const burgers = JSON.parse(currentData);
        burgers.push(req.body);
        await fs.writeFile('burgers.json', JSON.stringify(burgers, null, 2));
        res.json({ message: 'Burger added successfully' });
    } catch (error) {
        console.error('Error saving burger data:', error);
        res.status(500).json({ error: 'Error saving burger data' });
    }
});

app.delete('/api/burgers/:index', async (req, res) => {
    try {
        const currentData = await fs.readFile('burgers.json', 'utf8');
        let burgers = JSON.parse(currentData);
        const index = parseInt(req.params.index);
        burgers.splice(index, 1);
        await fs.writeFile('burgers.json', JSON.stringify(burgers, null, 2));
        res.json({ message: 'Burger deleted successfully' });
    } catch (error) {
        console.error('Error deleting burger:', error);
        res.status(500).json({ error: 'Error deleting burger' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;