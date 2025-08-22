import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
export default defineConfig({
    plugins: [uni()],
    server: {
        port: 3000,
        host: "0.0.0.0",
        proxy: {
            // "": {
            //     target: "", //接口地址
            //     changeOrigin: true,
            //     rewrite: (path) => path.replace(RegExp(`^`), "")
            // }
        }
    },
    build: {
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: false
            }
        },
        sourcemap: false
    }
});
