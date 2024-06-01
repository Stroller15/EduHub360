import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js"
import courseRoutes from "./routes/course.routes.js"
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();
config();

//! built-in Middleware

app.use(express.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("/pong");
});


//! custom middleware

// user routing
app.use('/api/v1/user', userRoutes);

//course routing
app.use('/api/v1/course', courseRoutes);

app.all("*", (req, res) => {
  res.status(404).send("OOPs!! page not found");
});

app.use(errorMiddleware);

export default app;
