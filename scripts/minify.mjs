import { minify } from "html-minifier-terser";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = ".";
const DIST = "dist";
const SKIP = new Set(["node_modules", "dist", ".git", ".github"]);

function collectFiles(dir) {
    const result = [];
    for (const entry of readdirSync(dir)) {
        if (SKIP.has(entry)) continue;
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
            result.push(...collectFiles(full));
        } else {
            result.push(full);
        }
    }
    return result;
}

async function main() {
    const files = collectFiles(ROOT);
    let count = 0;

    for (const file of files) {
        const dest = join(DIST, relative(ROOT, file));
        mkdirSync(dirname(dest), { recursive: true });

        if (file.endsWith(".html")) {
            const src = readFileSync(file, "utf8");
            const out = await minify(src, {
                collapseWhitespace: true,
                removeComments: true,
                removeAttributeQuotes: true,
                minifyCSS: true,
                minifyJS: true
            });
            writeFileSync(dest, out);
            console.log("minified:", file);
        } else {
            copyFileSync(file, dest);
            console.log("copied:  ", file);
        }
        count++;
    }

    console.log(`\n完成，共处理 ${count} 个文件，输出到 dist/`);
}

main().catch((e) => {
    console.error("构建失败:", e);
    process.exit(1);
});
