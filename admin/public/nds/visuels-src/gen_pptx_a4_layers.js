const pptxgen = require("pptxgenjs");
const fs = require("fs");

const M = JSON.parse(fs.readFileSync("/home/claude/pptx_work/manifest_a4_layers.json", "utf8"));
const DPI = 300;
const PW = M.page.w_in, PH = M.page.h_in, SW = PW * DPI;
const inch = px => px / DPI;
const pt = px => px * 72 / DPI;

const NAMES = {
  bergerie: "Domaine de la Bergerie", pegase: "Auto-Moto-École Pégase", utile: "Utile Vence",
  "carrosserie-gp": "Carrosserie GP", giordano: "Électroménager J Giordano", alafut: "À la Fût",
};

const jobs = [];
for (const slug of Object.keys(M.commerces)) {
  const C = M.commerces[slug];
  const pres = new pptxgen();
  pres.defineLayout({ name: "A4P", width: PW, height: PH });
  pres.layout = "A4P";
  pres.author = "Flowin";
  pres.title = `Affiche A4 (éditable) — ${NAMES[slug] || slug}`;
  const slide = pres.addSlide();

  // 1) fond cinématique (image, ambiance)
  slide.addImage({ path: C.bg, x: 0, y: 0, w: PW, h: PH });
  // 2) chaque élément graphique = objet image séparé (déplaçable / remplaçable)
  for (const im of C.images) {
    slide.addImage({ path: im.path, x: inch(im.x), y: inch(im.y), w: inch(im.w), h: inch(im.h) });
  }
  // 3) tous les textes = zones éditables (centrées sur cx,cy)
  for (const t of C.texts) {
    const fpt = pt(t.size_fit != null ? t.size_fit : t.size_px);
    const wIn = Math.max(inch(Math.min(t.cx, SW - t.cx)) * 2, 0.6);
    const hIn = (fpt * 1.7) / 72;
    slide.addText(t.text, {
      x: inch(t.cx) - wIn / 2, y: inch(t.cy) - hIn / 2, w: wIn, h: hIn,
      align: "center", valign: "middle",
      fontFace: "Manrope", fontSize: fpt, bold: t.weight >= 800, color: t.hex,
      margin: 0, wrap: false,
    });
  }
  const out = `/home/claude/pptx_work/out/nds_a4_${slug}-editable.pptx`;
  jobs.push(pres.writeFile({ fileName: out }).then(() => console.log("OK", slug)));
}
Promise.all(jobs).then(() => console.log("ALL_DONE"));
