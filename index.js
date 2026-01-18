import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

const app = express();

// Middleware
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);
app.use(express.json());

// =================================================
// MONGODB SETUP - MODIFIED FOR VERCEL
// =================================================

const uri = process.env.DB_URI;
let client;
let db, articlesCollection;

let isConnected = false;

const connectDB = async () => {
    if (isConnected && client) {
        return;
    }

    try {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10, // Limit connection pool
        });

        await client.connect();

        db = client.db("article_nest_db");
        articlesCollection = db.collection("articles_collections");

        isConnected = true;
        console.log("MongoDB connected ...");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        isConnected = false;
        throw error;
    }
};

// Middleware to ensure DB connection before each request
const ensureDBConnection = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ error: "Database connection failed" });
    }
};

// Apply to all routes
app.use(ensureDBConnection);


// =================================================
// ROUTES
// =================================================

app.get("/", (req, res) => {
    res.send("artical nest Server is running!");
});


app.get("/api/articles", async (req, res) => {
    try {
        const articles = await articlesCollection.find().toArray();
        res.status(200).json(articles);
    } catch (err) {
        console.error("Error loading users:", err);
        res.status(500).json({ error: "Failed to load articles" });
    }
});


app.get("/api/articles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        // Query the database for a single document matching this ID
        const query = { _id: new ObjectId(id) };
        const article = await articlesCollection.findOne(query);

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        res.status(200).json(article);
    } catch (err) {
        console.error("Error loading article:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// =======================================================
// SERVER START
// =======================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;