import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('./public/icon.svg')
const sizes = [180, 192, 512]
for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(`./public/icon-${size}.png`)
  console.log(`Generated icon-${size}.png`)
}
