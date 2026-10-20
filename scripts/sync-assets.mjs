import fs from "node:fs";

const source = "five.glb";
const target = "public/assets/models/five.glb";

if (!fs.existsSync(source)) {
  if (!fs.existsSync(target)) {
    console.error("Missing five.glb. Expected it at the project root or in public/assets/models.");
    process.exit(1);
  }
  process.exit(0);
}

fs.mkdirSync("public/assets/models", { recursive: true });
fs.copyFileSync(source, target);
