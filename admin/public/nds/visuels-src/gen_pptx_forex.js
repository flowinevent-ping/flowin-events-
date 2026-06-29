const pptxgen = require("pptxgenjs");
const fs = require("fs");
const M = JSON.parse(fs.readFileSync("/home/claude/vid/manifest_forex.json","utf8"));
const DPI = M.page.dpi;            // 127
const PX = M.page.px;              // 3500
const SIDE = PX / DPI;             // 27.559 inch
const inch = px => px / DPI;
const pt   = px => px * 72 / DPI;
const outdir = "/home/claude/vid/forex_pptx";
fs.mkdirSync(outdir, {recursive:true});

const jobs = [];
for (const fn of Object.keys(M.stations)) {
  const S = M.stations[fn];
  const pres = new pptxgen();
  pres.defineLayout({ name:"FX", width: SIDE, height: SIDE });
  pres.layout = "FX";
  pres.author = "Flowin";
  pres.title = `Forex 70x70 — ${S.label}`;
  const slide = pres.addSlide();
  slide.addImage({ path: S.plate, x:0, y:0, w:SIDE, h:SIDE });
  for (const t of S.texts) {
    const fpt = pt(t.size_px);
    const halfMax = Math.min(t.cx, PX - t.cx);
    const wIn = Math.max(inch(halfMax)*2, 1.0);
    const hIn = (fpt*1.7)/72;
    slide.addText(t.text, {
      x: inch(t.cx) - wIn/2, y: inch(t.cy) - hIn/2, w: wIn, h: hIn,
      align:"center", valign:"middle", fontFace:"Manrope",
      fontSize: fpt, bold: t.weight>=800, color: t.hex,
      margin:0, wrap:false, fit:"shrink",
    });
  }
  const out = `${outdir}/${fn}-editable.pptx`;
  jobs.push(pres.writeFile({fileName: out}).then(()=>console.log("OK", fn)));
}
Promise.all(jobs).then(()=>console.log("ALL_DONE"));
