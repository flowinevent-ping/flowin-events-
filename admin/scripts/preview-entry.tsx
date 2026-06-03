import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import LandingClient from '../app/landing/LandingClient'
import fs from 'node:fs'

const body = renderToStaticMarkup(
  React.createElement(LandingClient as any, { cfg: {}, source: 'preview' })
)
const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<link rel="preconnect" href="https://fonts.googleapis.com">'
  + '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">'
  + '</head><body style="margin:0;font-family:Nunito,-apple-system,sans-serif">'
  + body + '</body></html>'
fs.writeFileSync(process.argv[2] || '/mnt/user-data/outputs/flowin-landing-preview.html', html)
console.log('bytes', html.length)
