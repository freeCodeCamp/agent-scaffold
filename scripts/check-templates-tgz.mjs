import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const path = new URL("../dist/templates.tgz", import.meta.url);
const tar = gunzipSync(readFileSync(path));

const field = (start, end, offset) =>
  tar
    .subarray(offset + start, offset + end)
    .toString("utf8")
    .replace(/\0.*$/s, "");

const appleDouble = [];
let count = 0;
for (let offset = 0; offset + 512 <= tar.length;) {
  const name = field(0, 100, offset);
  if (name === "") break;
  const prefix = field(345, 500, offset);
  const full = prefix ? `${prefix}/${name}` : name;
  if (full.split("/").some((part) => part.startsWith("._"))) appleDouble.push(full);
  count += 1;
  const size = Number.parseInt(field(124, 136, offset).trim() || "0", 8);
  offset += 512 + Math.ceil(size / 512) * 512;
}

if (count === 0 || appleDouble.length > 0) {
  console.error(`dist/templates.tgz: ${count} entries, ${appleDouble.length} AppleDouble (._*)`);
  console.error(appleDouble.slice(0, 5).join("\n"));
  console.error("Build on macOS with COPYFILE_DISABLE=1 (pnpm build sets it).");
  process.exit(1);
}
console.log(`dist/templates.tgz: ${count} entries, no AppleDouble files`);
