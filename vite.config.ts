import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tanstackStart({
    // Keep the SSR error wrapper in src/server.ts.
    server: { entry: "server" },
  }), viteReact(), tailwindcss(), tsConfigPaths(), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
});