import fs from "node:fs";
import opentype from "opentype.js";

const font = opentype.parse(fs.readFileSync("tmp/cinzel.ttf").buffer);
const scale = 1000 / font.unitsPerEm;
const glyphs = {};

function round(value) {
  return Math.round(value * scale);
}

for (let index = 0; index < font.glyphs.length; index += 1) {
  const glyph = font.glyphs.get(index);
  const codes = glyph.unicodes?.length ? glyph.unicodes : glyph.unicode !== undefined ? [glyph.unicode] : [];
  for (const code of codes) {
    if (code < 32 || (code > 126 && code !== 0x00d7 && code !== 0x2014 && code !== 0x2026)) continue;
    let outline = "";
    const commands = glyph.path?.commands ?? [];
    for (const command of commands) {
      if (command.type === "M") outline += `m ${round(command.x)} ${round(command.y)} `;
      else if (command.type === "L") outline += `l ${round(command.x)} ${round(command.y)} `;
      else if (command.type === "Q") {
        outline += `q ${round(command.x1)} ${round(command.y1)} ${round(command.x)} ${round(command.y)} `;
      } else if (command.type === "C") {
        outline += `b ${round(command.x1)} ${round(command.y1)} ${round(command.x2)} ${round(command.y2)} ${round(command.x)} ${round(command.y)} `;
      }
    }
    glyphs[String.fromCharCode(code)] = {
      ha: round(glyph.advanceWidth || 0),
      x_min: round(glyph.xMin || 0),
      x_max: round(glyph.xMax || 0),
      o: outline.trim(),
    };
  }
}

const family = font.names?.fontFamily?.en || "Cinzel";
const result = {
  glyphs,
  familyName: family,
  ascender: round(font.ascender),
  descender: round(font.descender),
  underlinePosition: round(font.tables.post?.underlinePosition || -100),
  underlineThickness: round(font.tables.post?.underlineThickness || 50),
  boundingBox: {
    yMin: round(font.tables.head.yMin),
    xMin: round(font.tables.head.xMin),
    yMax: round(font.tables.head.yMax),
    xMax: round(font.tables.head.xMax),
  },
  resolution: 1000,
  original_font_information: {
    format: "derived from Cinzel, licensed under the SIL Open Font License",
    fontFamily: family,
  },
};

fs.mkdirSync("public/fonts", { recursive: true });
fs.writeFileSync("public/fonts/cinzel.json", JSON.stringify(result));
const sample = "IGNITE THE NEXT DECADE 5TH ANNIVERSARY YOU ARE INVITED TO... YOMA BANK × PRUDENTIAL CELEBRATION";
const missing = [...new Set(sample)].filter((char) => char !== " " && !glyphs[char]);
console.log("glyphs", Object.keys(glyphs).length, "missing", missing, "bytes", fs.statSync("public/fonts/cinzel.json").size);
