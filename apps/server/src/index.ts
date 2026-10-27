import { Hono } from "hono";
import { logger } from "hono/logger";
import auth from "./routes/api/v1/auth";
import oauth from "./routes/api/v1/oauth.route";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.use(logger());

app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

app.onError((err, c) => {
  return c.json(
    {
      success: false,
      message: err.message || "Internal server error",
      data: null,
    },
    500,
  );
});

const v1 = new Hono().basePath("/v1");
v1.route("/auth", auth);
v1.route("/oauth", oauth);
app.route("/", v1);
export default app;
