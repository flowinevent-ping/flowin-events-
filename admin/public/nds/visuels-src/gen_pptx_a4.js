const pptxgen = require("pptxgenjs");
const fs = require("fs");

const M = JSON.parse(fs.readFileSync("/home/claude/pptx_work/manifest_a4.json", "utf8"));
const DPI = 300;
const PW = M.page.w_in, PH = M.page.h_in;          // 8.267 x 11.693
const SW = PW * DPI;                                // slide width in px (2480)

// px(300dpi) -> inch ; px font-size -> pt
const inch = px => px / DPI;
const pt   = px => px * 72 / DPI;

const NAMES = {
  bergerie: "Domaine de la Bergerie",
  pegase: "Auto-Moto-École Pégase",
  utile: "Utile Vence",
  "carrosserie-gp": "Carrosserie GP",
  giordano: "Électroménager J Giordano",
  alafut: "À la Fût",
};

const jobs = [];
for (const slug of Object.keys(M.commerces)) {
  const C = M.commerces[slug];
  const pres = new pptxgen();
  pres.defineLayout({ name: "A4P", width: PW, height: PH });
  pres.layout = "A4P";
  pres.author = "Flowin";
  pres.title = `Affiche A4 — ${NAMES[slug] || slug}`;

  const slide = pres.addSlide();
  // décor (plate sans texte) plein cadre
  slide.addImage({ path: C.plate, x: 0, y: 0, w: PW, h: PH });

  // zones de texte éditables, centrées sur (cx,cy)
  for (const t of C.texts) {
    if (t.burned) continue;                        // texte déjà dans le décor -> non reposé (évite le doublon)
    const cxIn = inch(t.cx), cyIn = inch(t.cy);
    const fpt = pt(t.size_fit != null ? t.size_fit : t.size_px);
    // largeur de box = symétrique max autour de cx, sans sortir de la slide
    const halfMax = Math.min(t.cx, SW - t.cx);     // px jusqu'au bord le plus proche
    const wIn = Math.max(inch(halfMax) * 2, 0.6);
    const hIn = (fpt * 1.7) / 72;                   // hauteur ~ taille de police + slack
    slide.addText(t.text, {
      x: cxIn - wIn / 2,
      y: cyIn - hIn / 2,
      w: wIn,
      h: hIn,
      align: "center",
      valign: "middle",
      fontFace: "Manrope",
      fontSize: fpt,
      bold: t.weight >= 800,
      color: t.hex,
      margin: 0,
      wrap: false,
      fit: "shrink",
    });
  }

  const out = `/home/claude/pptx_work/out/nds_a4_${slug}-editable.pptx`;
  jobs.push(pres.writeFile({ fileName: out }).then(() => console.log("OK", slug)));
}
Promise.all(jobs).then(() => console.log("ALL_DONE"));
