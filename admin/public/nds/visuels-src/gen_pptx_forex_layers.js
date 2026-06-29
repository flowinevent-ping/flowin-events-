const pptxgen = require("pptxgenjs");
const fs = require("fs");
const M = JSON.parse(fs.readFileSync("/home/claude/vid/manifest_forex_layers.json","utf8"));
const DPI=M.page.dpi, PX=M.page.px, SIDE=PX/DPI;
const inch=px=>px/DPI, pt=px=>px*72/DPI;
const out="/home/claude/vid/forex_pptx_layers"; fs.mkdirSync(out,{recursive:true});
const jobs=[];
for (const fn of Object.keys(M.stations)){
  const S=M.stations[fn];
  const pres=new pptxgen();
  pres.defineLayout({name:"FX",width:SIDE,height:SIDE}); pres.layout="FX";
  pres.author="Flowin"; pres.title=`Forex 70x70 (editable) — ${S.label}`;
  const slide=pres.addSlide();
  slide.addImage({path:S.bg,x:0,y:0,w:SIDE,h:SIDE});
  for (const im of S.images){
    slide.addImage({path:im.path,x:inch(im.x),y:inch(im.y),w:inch(im.w),h:inch(im.h)});
  }
  for (const t of S.texts){
    const fpt=pt(t.size_px);
    const wIn=Math.max(inch(Math.min(t.cx,PX-t.cx))*2,1.0);
    const hIn=(fpt*1.7)/72;
    slide.addText(t.text,{x:inch(t.cx)-wIn/2,y:inch(t.cy)-hIn/2,w:wIn,h:hIn,
      align:"center",valign:"middle",fontFace:"Manrope",fontSize:fpt,
      bold:t.weight>=800,color:t.hex,margin:0,wrap:false,fit:"shrink"});
  }
  jobs.push(pres.writeFile({fileName:`${out}/${fn}-editable.pptx`}).then(()=>console.log("OK",fn)));
}
Promise.all(jobs).then(()=>console.log("ALL_DONE"));
