const pptxgen = require("pptxgenjs");
const fs = require("fs");

const M = JSON.parse(fs.readFileSync("/home/claude/pptx_work/manifest_tickets.json", "utf8"));
const DPI = M.dpi, TW = M.tw, TH = M.th;
const PW = TW / DPI, PH = TH / DPI;
const inch = px => px / DPI;
const pt = px => px * 72 / DPI;

const jobs = [];
for (const lot of M.lots) {
  const pres = new pptxgen();
  pres.defineLayout({ name: "TICK", width: PW, height: PH });
  pres.layout = "TICK";
  pres.author = "Flowin";
  pres.title = `Ticket tombola — ${lot.label}`;
  const slide = pres.addSlide();
  slide.addImage({ path: lot.plate, x: 0, y: 0, w: PW, h: PH });

  for (const t of lot.texts) {
    const fpt = pt(t.size_fit != null ? t.size_fit : t.size_px);
    const cyIn = inch(t.cy);
    const hIn = (fpt * 1.7) / 72;
    let x, w, align;
    if (t.anchor === "lm") {                 // texte ancré à gauche
      x = inch(t.cx); w = PW - inch(t.cx) - inch(40); align = "left";
    } else {                                  // "mm" : centré sur cx (serial dans la pill)
      w = 2 * (PW - inch(t.cx) - inch(10)); x = inch(t.cx) - w / 2; align = "center";
    }
    slide.addText(t.text, {
      x, y: cyIn - hIn / 2, w, h: hIn,
      align, valign: "middle",
      fontFace: "Manrope", fontSize: fpt, bold: t.weight >= 800,
      color: t.hex, margin: 0, wrap: false,
    });
  }
  const out = `/home/claude/pptx_work/out/nds_ticket_${lot.fn.replace("nds_tickets_", "")}-editable.pptx`;
  jobs.push(pres.writeFile({ fileName: out }).then(() => console.log("OK", lot.fn)));
}
Promise.all(jobs).then(() => console.log("ALL_DONE"));
