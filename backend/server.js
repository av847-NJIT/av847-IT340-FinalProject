// Wanderlist back-end API (Milestone 2): register + login
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Fail early with a clear message if the .env values did not load
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGO_URI or JWT_SECRET. Check your .env file.");
    process.exit(1);
}

const app = express();
app.use(express.json({ limit: "10kb" }));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    })
);

// Password hashing: salted scrypt, stored as "salt:hash"
const hashPassword = (password) =>
    new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (err, key) =>
            err ? reject(err) : resolve(`${salt}:${key.toString("hex")}`)
        );
    });

const verifyPassword = (password, stored) =>
    new Promise((resolve, reject) => {
        const [salt, hash] = stored.split(":");
        crypto.scrypt(password, salt, 64, (err, key) =>
            err
                ? reject(err)
                : resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), key))
        );
    });

// Injection protection: every input must be a plain string
const isString = (v) => typeof v === "string";

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body || {};

    if (![username, email, password].every(isString)) {
        return res.status(400).json({ error: "Invalid input." });
    }
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
        return res
            .status(400)
            .json({ error: "Username must be 3-30 letters, numbers, or underscores." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email." });
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: "Password must be 8-128 characters." });
    }

    try {
        const passwordHash = await hashPassword(password);
        await User.create({ username, email: email.toLowerCase(), passwordHash });
        console.log(`REGISTER success user=${username}`);
        res.status(201).json({ message: "Account created." });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Username or email already in use." });
        }
        console.error(err);
        res.status(500).json({ error: "Server error." });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (![username, password].every(isString)) {
        return res.status(400).json({ error: "Invalid input." });
    }

    try {
        const user = await User.findOne({ username });
        const ok = user && (await verifyPassword(password, user.passwordHash));

        if (!ok) {
            console.log(`LOGIN failed user=${username.slice(0, 30)}`);
            return res.status(401).json({ error: "Invalid username or password." });
        }

        const token = jwt.sign(
            { sub: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log(`LOGIN success user=${username}`);
        res.json({ token, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error." });
    }
});

app.listen(process.env.PORT || 3000, process.env.HOST || "127.0.0.1", () =>
    console.log(`API listening on ${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3000}`)
);