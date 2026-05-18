#!/bin/bash
echo "=== Validation JS dashboard ==="
cd /home/claude/flowin/admin
node -e "
const acorn=require('acorn'),fs=require('fs');
const html=fs.readFileSync('public/dashboard.html','utf8');
const scripts=html.match(/<script[^>]*>([\s\S]*?)<\/script>/g)||[];
let err=0, ok=0;
scripts.forEach(function(s,i){
  const code=s.replace(/<script[^>]*/,'').replace(/<\/script>/,'');
  if(code.trim().length<10||code.trim()[0]==='>') return;
  try{acorn.parse(code,{ecmaVersion:'latest'});ok++;}
  catch(e){err++;console.log('ERR bloc',i,'pos',e.pos,':',e.message.substr(0,80));}
});
if(err===0) console.log('✅ '+ok+' blocs JS valides');
else process.exit(1);
" && echo "✅ dashboard OK" || echo "❌ CRASH"

echo ""
echo "=== Validation JS quiz.html ==="
node -e "
const acorn=require('acorn'),fs=require('fs');
const html=fs.readFileSync('public/parcours/quiz.html','utf8');
const scripts=html.match(/<script[^>]*>([\s\S]*?)<\/script>/g)||[];
let err=0, ok=0;
scripts.forEach(function(s,i){
  const code=s.replace(/<script[^>]*/,'').replace(/<\/script>/,'');
  if(code.trim().length<10||code.trim()[0]==='>') return;
  try{acorn.parse(code,{ecmaVersion:'latest'});ok++;}
  catch(e){err++;console.log('ERR bloc',i,'pos',e.pos,':',e.message.substr(0,80));}
});
if(err===0) console.log('✅ '+ok+' blocs JS valides');
else process.exit(1);
" && echo "✅ quiz.html OK" || echo "❌ CRASH"
