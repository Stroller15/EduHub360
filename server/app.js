import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import morgan from "morgan";

const app = express();
config();

app.use(express.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("/pong");
});

app.all("*", (req, res) => {
  res.status(404).send("OOPs!! page not found");
});

export default app;
