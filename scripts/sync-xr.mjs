import fs from "node:fs";
import path from "node:path";

const source = path.resolve("node_modules/@8thwall/engine-binary/dist");
const target = path.resolve("public/xr");

if (!fs.existsSync(source)) {
  console.error("Missing @8thwall/engine-binary. Run npm install before starting the dev server.");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log("Copied 8th Wall engine artifacts to public/xr");
