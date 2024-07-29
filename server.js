const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const uri = process.env.MONGODB_URI || 'your-mongodb-connection-string';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let burgersCollection;

async function connectToMongo() {
  try {
    await client.connect();
    const database = client.db('burgerdb');
    burgersCollection = database.collection('burgers');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToMongo();

// API routes
app.get('/api/burgers', async (req, res) => {
  try {
    const burgers = await burgersCollection.find({}).toArray();
    res.json(burgers);
  } catch (error) {
    console.error('Error fetching burgers:', error);
    res.status(500).json({ error: 'Error fetching burgers', details: error.message });
  }
});

app.post('/api/burgers', async (req, res) => {
  try {
    const newBurger = req.body;
    const result = await burgersCollection.insertOne(newBurger);
    res.json({ message: 'Burger added successfully', burger: result.ops[0] });
  } catch (error) {
    console.error('Error adding burger:', error);
    res.status(500).json({ error: 'Error adding burger', details: error.message });
  }
});

app.delete('/api/burgers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await burgersCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.json({ message: 'Burger deleted successfully' });
    } else {
      res.status(404).json({ error: 'Burger not found' });
    }
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