import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // ¡Esto es vital para probar la instalación sin hacer "build"!
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],

      manifest: {
        name: "MotoPro360",
        short_name: "MotoPro360",
        description: "Tu plataforma de servicios para motociclistas",
        theme_color: "#ffffff",
        icons: [
          {
            src: "assets/imagenes/logo.png", // Asegúrate de tener estos archivos en tu carpeta /public
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/imagenes/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
