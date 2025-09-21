import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
export default defineConfig({
    plugins: [uni()],
    server: {
        port: 3000,
        host: "0.0.0.0",
        strictPort: true,
        hmr: {
            overlay: true, // 显示错误覆盖层
            port: 3002 // HMR 端口
        },
        watch: {
            usePolling: true, // 在某些环境下启用轮询
            interval: 1000, // 轮询间隔
        },
        proxy: {
            // 匹配所有请求
            "/api": {
                target: "http://localhost:3001", // 转发到3001端口
                changeOrigin: true // 开启跨域
                // 不需要重写路径，因为我们要转发所有请求
                // rewrite: (path) => path.replace(/^\/api/, "")
            },
            "/static": {
                target: "http://localhost:3001", // 转发到3001端口
                changeOrigin: true // 开启跨域
                // 不需要重写路径，因为我们要转发所有请求
                // rewrite: (path) => path.replace(/^\/api/, "")
            }
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
    