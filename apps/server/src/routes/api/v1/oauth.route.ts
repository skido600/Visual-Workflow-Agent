import { Hono } from "hono";
import {
  GoogleCallback,
  googleUrl,
} from "../../../controller/oauth.controller";

const oauth = new Hono();

oauth.get("/google", googleUrl);
oauth.get("/google/callback", GoogleCallback);

export default oauth;
