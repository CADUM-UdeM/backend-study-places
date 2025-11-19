const express = require('express');
const app = express();
const port = 3000;
const dotenv = require('dotenv');
dotenv.config();


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.mongodb_key;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/test', (req, res) => {
    client.connect(err => {
        if (err) {
            console.error('Failed to connect to the database:', err);
            res.status(500).send('Database connection error');
            return;
        }
        const collection = client.db("sample_mflix").collection("users");
        collection.find({}).toArray((err, users) => {
            if (err) {
                console.error('Failed to fetch users:', err);
                res.status(500).send('Error fetching users');
                return;
            }
            res.json(users);
        });
    });
});



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});