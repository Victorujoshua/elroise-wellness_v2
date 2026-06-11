import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const targets = [
  { input: 'socks-white.png',  output: 'socks-white.webp'  },
  { input: 'socks-black.png',  output: 'socks-black.webp'  },
  { input: 'socks-khaki.png',  output: 'socks-khaki.webp'  },
]

for (const { input, output } of targets) {
  const src  = join(publicDir, input)
  const dest = join(publicDir, output)

  const before = (await stat(src)).size
  await sharp(src)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(dest)
  const after = (await stat(dest)).size

  console.log(
    `${input}  ${(before / 1024).toFixed(0)} KB  →  ${output}  ${(after / 1024).toFixed(0)} KB` +
    `  (${((1 - after / before) * 100).toFixed(0)}% smaller)`,
  )
}

console.log('\nDone. Update ShopProduct.tsx image refs to .webp')
