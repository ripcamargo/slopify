import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { writeManifest } from "./server/media";

// Em desenvolvimento, serve as funções de /api com o mesmo código usado na Vercel.
function devApi(): Plugin {
  return {
    name: "slopify-dev-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const key of ["SLOPFY_PASSWORD", "FIREBASE_SERVICE_ACCOUNT"]) {
        if (env[key]) process.env[key] = env[key];
      }

      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.match(/^\/api\/(login|logout|catalog|albums|order|media|tracks)(?:\?|$)/)?.[1];
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

// Atualiza server/media.json (lista de arquivos em public/) antes de cada build.
function mediaManifest(): Plugin {
  return {
    name: "slopify-media-manifest",
    buildStart() {
      writeManifest();
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi(), mediaManifest()],
});
