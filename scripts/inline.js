import fs from 'fs'
import path from 'path'

const distDir = path.join(process.cwd(), 'dist')
const indexPath = path.join(distDir, 'index.html')
const cssPath = path.join(distDir, 'assets', 'style.css')
const jsPath = path.join(distDir, 'assets', 'app.js')
const outPath = path.join(distDir, 'index.inline.html')

function run() {
  const html = fs.readFileSync(indexPath, 'utf8')
  const css = fs.readFileSync(cssPath, 'utf8')
  const js = fs.readFileSync(jsPath, 'utf8')
  const inlined = html
    .replace('<link rel="stylesheet" crossorigin href="/assets/style.css">', `<style>${css}</style>`)
    .replace('<script type="module" crossorigin src="/assets/app.js"></script>', `<script type="module">${js}</script>`)
  fs.writeFileSync(outPath, inlined)
  console.log('Wrote', outPath)
}

run()
