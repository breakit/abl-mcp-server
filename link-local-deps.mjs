import { lstat, mkdir, readFile, rm, symlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoDir = path.dirname(fileURLToPath(import.meta.url))
const packages = {
  '@breakit/abl-mcp-core': path.resolve(repoDir, '../abl-mcp-core'),
  '@breakit/abl-mcp-contracts': path.resolve(repoDir, '../abl-mcp-contracts'),
  '@breakit/abl-mcp-doc': path.resolve(repoDir, '../abl-mcp-doc'),
  '@breakit/abl-mcp-generators': path.resolve(repoDir, '../abl-mcp-generators'),
}

const linkPlans = [
  {
    rootDir: repoDir,
    packageNames: Object.keys(packages),
  },
  {
    rootDir: packages['@breakit/abl-mcp-generators'],
    packageNames: ['@breakit/abl-mcp-core'],
  },
]

for (const { rootDir, packageNames } of linkPlans) {
  const scopeDir = path.join(rootDir, 'node_modules', '@breakit')
  await mkdir(scopeDir, { recursive: true })

  for (const packageName of packageNames) {
    const packageDir = packages[packageName]
    const packageJsonPath = path.join(packageDir, 'package.json')
    const distPath = path.join(packageDir, 'dist', 'index.js')
    const linkPath = path.join(scopeDir, packageName.split('/')[1])
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

    if (packageJson.name !== packageName) {
      throw new Error(`Expected ${packageJsonPath} to declare ${packageName}, found ${packageJson.name}`)
    }

    try {
      await lstat(distPath)
    } catch {
      throw new Error(`Missing ${distPath}. Run \`yarn build:local-deps\` first.`)
    }

    await rm(linkPath, { recursive: true, force: true })
    await symlink(packageDir, linkPath, 'dir')
    console.log(`linked ${packageName} -> ${packageDir} in ${rootDir}`)
  }
}
