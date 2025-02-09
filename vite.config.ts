import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as https from './https-config'

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],
   base: "/",
   server: {
      https: https.useHttps ? https.certs : undefined,
      host: 'localhost', // Убедитесь, что хост совпадает с именем в сертификате
   },
   resolve: {
      alias: {
         src: "/src",
         components: "/src/components",
         hooks: "/src/hooks",
         pages: "/src/pages",
      },
   },
});
