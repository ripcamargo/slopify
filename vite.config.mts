import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, serve as funções de /api com o mesmo código usado na Vercel.
function devApi(): Plugin {
  return {
    name: "slopfy-dev-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      if (env.SLOPFY_PASSWORD) process.env.SLOPFY_PASSWORD = env.SLOPFY_PASSWORD;

      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.match(/^\/api\/(login|logout|catalog)(?:\?|$)/)?.[1];
        if (!route) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          await mod.default(req, res);
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
});
