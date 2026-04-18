import express from "express";
import { dbConnect } from "./db.js";
import router from "./routes/route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { redirectingToOriginalUrl } from "./controllers/shortenUrl.controller.js";
import useragent from "express-useragent";
const app = express();
const Port = 8000 || process.env.PORT;
app.use(express.json());
app.use(cookieParser());

dotenv.config();

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.end(`Server Started at PORT:${Port}`);
});

app.get("/:code", redirectingToOriginalUrl);

dbConnect();

app.listen(Port, () => {
  console.log("Server Started");
});
