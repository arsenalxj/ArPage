import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'extension')
const distDir = path.join(root, 'dist')

const targets = [
  { name: 'chrome', manifest: 'manifest.chrome.json' },
  { name: 'firefox', manifest: 'manifest.firefox.json' },
]

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

for (const target of targets) {
  const outputDir = path.join(distDir, target.name)
  await mkdir(outputDir, { recursive: true })
  await copyExtensionFiles(outputDir)
  await copyFile(path.join(sourceDir, target.manifest), path.join(outputDir, 'manifest.json'))
  await copyIcons(outputDir)
}

console.log('Extension builds written to dist/chrome and dist/firefox')

async function copyExtensionFiles(outputDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) continue
    if (entry.name.startsWith('manifest.')) continue
    await copyFile(path.join(sourceDir, entry.name), path.join(outputDir, entry.name))
  }
}

async function copyIcons(outputDir) {
  const iconsDir = path.join(outputDir, 'icons')
  await mkdir(iconsDir, { recursive: true })

  const iconSources = [
    ['favicon-16.png', 'icon-16.png'],
    ['favicon-32.png', 'icon-32.png'],
    ['favicon-48.png', 'icon-48.png'],
    ['icon-192.png', 'icon-128.png'],
  ]

  for (const [sourceName, outputName] of iconSources) {
    const sourcePath = path.join(root, 'web', 'public', sourceName)
    const outputPath = path.join(iconsDir, outputName)
    if (existsSync(sourcePath)) {
      await copyFile(sourcePath, outputPath)
    } else {
      await writeFile(outputPath, fallbackPngBytes())
    }
  }
}

function fallbackPngBytes() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  )
}
