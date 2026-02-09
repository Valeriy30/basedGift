import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// PostCSS плагин: снимает @layer обёртки с CSS из node_modules.
//
// Зачем: OnchainKit CSS содержит @layer components / @layer utilities.
// Tailwind v3 трактует @layer как свои директивы и требует
// @tailwind components в том же файле. Но Vite обрабатывает каждый
// CSS-файл через PostCSS отдельно, поэтому Tailwind ломается.
//
// Этот плагин запускается ДО tailwindcss и убирает @layer обёртки
// только из файлов node_modules. Содержимое правил сохраняется.
const stripLayersFromNodeModules = {
  postcssPlugin: "strip-layers-from-node-modules",
  Once(root: any) {
    const file: string = root.source?.input?.file || "";
    if (!file.includes("node_modules")) return;

    root.walkAtRules("layer", (atRule: any) => {
      if (atRule.nodes && atRule.nodes.length > 0) {
        // @layer utilities { .foo { ... } } → .foo { ... }
        atRule.replaceWith(atRule.nodes);
      } else {
        // @layer components; → удаляем пустую декларацию
        atRule.remove();
      }
    });
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Inline PostCSS config — обходит postcss-load-config и гарантирует
  // что наш strip-layers плагин запускается для КАЖДОГО CSS файла.
  css: {
    postcss: {
      plugins: [
        stripLayersFromNodeModules as any,
        require("tailwindcss"),
        require("autoprefixer"),
      ],
    },
  },
});
