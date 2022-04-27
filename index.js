const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { status } = require('express/lib/response');
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// JWT middleware 
function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SEC_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@node-mongo-server-1.pkxfn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('genius-car-service').collection('services');
        const orderCollection = client.db('genius-car-service').collection('order');


        // Place Order
        app.post('/placeorder', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // Get all orders by user Email 
        app.get('/order', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = {
                    email: {
                        $in: [email]
                    }
                };
                const cursor = orderCollection.find(query);
                const order = await cursor.toArray();
                res.send(order);
            } else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        // Auth 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SEC_KEY, {
                expiresIn: '1d'
            })
            res.send({ accessToken });
        })

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // POST
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });

        // DELETE
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Genius Server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})