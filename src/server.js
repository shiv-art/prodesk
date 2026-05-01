import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "team-task-manager-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri || !process.env.JWT_SECRET) {
  throw new Error("MONGO_URI and JWT_SECRET must be set");
}

connectDB(mongoUri)
  .then(() => {
    app.listen(port, () => {
      // Keeping one startup log line for Railway and local debug.
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
