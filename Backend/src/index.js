import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });


const app = express();
const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "http://localhost:3001",
    "http://localhost:3101",
].filter(Boolean).map(normalizeOrigin);

const isVercelOrigin = (origin) => {
    try {
        return new URL(origin).hostname.endsWith(".vercel.app");
    } catch {
        return false;
    }
};

const corsOptions = {
    origin(origin, callback) {
        const normalizedOrigin = normalizeOrigin(origin);

        if (
            !origin ||
            allowedOrigins.length === 0 ||
            allowedOrigins.includes(normalizedOrigin) ||
            isVercelOrigin(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked request from ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());


app.get('/' , (req, res) => {
    res.send("Financial Tracker API is running");
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Financial Tracker API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/wallets", walletRoutes);


app.use(errorHandler);


const PORT = process.env.PORT || 5000;
await connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
