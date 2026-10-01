import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function inside(root, relative) {
    const target = path.resolve(root, relative);
    if (target === root || !target.startsWith(root + path.sep)) throw new Error(`Path escapes theme: ${relative}`);
    // Never follow links when inspecting or packaging a theme.
    let current = root;
    for (const part of path.relative(root, target).split(path.sep)) {
        current = path.join(current, part);
        if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink is not supported: ${relative}`);
    }
    return target;
}

export function inspectTheme(themeRoot) {
    const root = path.resolve(themeRoot);
    const errors = [], warnings = [];
    const exists = relative => fs.existsSync(inside(root, relative));
    const read = relative => fs.readFileSync(inside(root, relative), 'utf8').replace(/^\uFEFF/, '');
    let pkg, config;
    try {
        for (const required of ['package.json', 'default.hbs', 'index.hbs']) {
            if (!exists(required)) errors.push(`Missing ${required}`);
        }
        if (exists('package.json')) {
            pkg = JSON.parse(read('package.json'));
            if (!pkg.engines?.ghost) errors.push('package.json needs engines.ghost');
            if (!pkg.author?.email) errors.push('package.json needs author.email');
        }
        if (exists('components.json')) {
            config = JSON.parse(read('components.json'));
            if (!['tailwind', 'css'].includes(config.style)) errors.push('components.json style must be tailwind or css');
            for (const relative of [config.cssFile, config.aliases?.styles, config.aliases?.partials]) {
                if (typeof relative !== 'string' || !relative.trim()) errors.push('components.json needs cssFile and partials/styles aliases');
                else if (!exists(relative)) errors.push(`Missing configured path: ${relative}`);
            }
            if (config.style === 'tailwind' && !pkg?.devDependencies?.tailwindcss && !pkg?.dependencies?.tailwindcss) {
                warnings.push('Tailwind selected but no local tailwindcss dependency. Configure a build pipeline before using utilities.');
            }
            if (config.style === 'tailwind' && !pkg?.scripts?.build) warnings.push('No build script is configured. Tailwind classes need compiled CSS loaded by your layout.');
        } else warnings.push('No components.json. Run ghostcn init if you want to install components.');
        const scan = (dir, visit) => {
            for (const entry of fs.readdirSync(inside(root, dir), { withFileTypes: true })) {
                const relative = path.posix.join(dir, entry.name);
                inside(root, relative);
                if (entry.isDirectory()) scan(relative, visit);
                else if (entry.isFile()) visit(relative);
            }
        };
        const templates = fs.readdirSync(root).filter(name => name.endsWith('.hbs'));
        if (exists('partials')) scan('partials', file => { if (file.endsWith('.hbs')) templates.push(file); });
        for (const file of templates) {
            const source = read(file).replace(/\{\{!--[\s\S]*?--\}\}/g, '');
            for (const match of source.matchAll(/\{\{asset\s+["']([^"']+)["']/g)) {
                if (!exists(`assets/${match[1]}`)) errors.push(`${file}: missing asset ${match[1]} (run your build)`);
            }
            for (const match of source.matchAll(/\{\{>\s*["']([^"']+)["']/g)) {
                if (!exists(`partials/${match[1]}.hbs`)) errors.push(`${file}: missing partial ${match[1]}`);
            }
        }
        if (exists('default.hbs')) {
            const layout = read('default.hbs');
            const linked = new Set();
            for (const tag of layout.replace(/\{\{!--[\s\S]*?--\}\}/g, '').matchAll(/<link\b[^>]*>/gi)) {
                if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag[0])) continue;
                const asset = tag[0].match(/\{\{asset\s+["']([^"']+)["']/);
                if (asset) linked.add(asset[1]);
            }
            for (const helper of ['ghost_head', 'ghost_foot']) {
                if (!new RegExp(`\\{\\{\\s*${helper}\\s*\\}\\}`).test(layout)) errors.push(`default.hbs needs {{${helper}}}`);
            }
            if (config && !linked.has(path.relative(path.join(root, 'assets'), inside(root, config.cssFile)).replaceAll('\\', '/'))) {
                errors.push('default.hbs does not link the configured ghostcn stylesheet');
            }
            if (config?.aliases?.styles && exists(config.aliases.styles)) {
                for (const name of fs.readdirSync(inside(root, config.aliases.styles)).filter(name => name.endsWith('.css'))) {
                    const asset = path.relative(path.join(root, 'assets'), inside(root, path.join(config.aliases.styles, name))).replaceAll('\\', '/');
                    if (!linked.has(asset)) errors.push(`default.hbs does not link component stylesheet ${asset}`);
                }
            }
        }
    } catch (error) { errors.push(error.message); }
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

export function packageTheme(themeRoot) {
    const root = path.resolve(themeRoot);
    const result = inspectTheme(root);
    if (result.errors.length) throw new Error(result.errors.join('\n'));
    const pkg = JSON.parse(fs.readFileSync(inside(root, 'package.json'), 'utf8'));
    if (!/^[a-z0-9][a-z0-9-]*$/.test(pkg.name) || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(pkg.version)) {
        throw new Error('Packaging needs a safe lowercase theme name and a semantic version in package.json');
    }
    const files = fs.readdirSync(root).filter(name => name.endsWith('.hbs') || ['package.json', 'LICENSE', 'LICENSE.md'].includes(name));
    // Keep a source stylesheet if an existing theme actually links it at runtime.
    const sourceStyles = new Set(['assets/css/source.css', 'assets/css/ghostcn-tailwind.css']);
    const linkedStyles = new Set();
    const findLinks = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'assets') continue;
            const target = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name === 'partials') {
                inside(root, path.relative(root, target));
                findLinks(target);
            }
            else if (entry.isFile() && entry.name.endsWith('.hbs')) {
                inside(root, path.relative(root, target));
                for (const match of fs.readFileSync(target, 'utf8').matchAll(/\{\{asset\s+["']([^"']+)["']/g)) linkedStyles.add(`assets/${match[1]}`);
            }
        }
    };
    findLinks(root);
    const collect = dir => {
        for (const entry of fs.readdirSync(inside(root, dir), { withFileTypes: true })) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const relative = path.posix.join(dir, entry.name);
            inside(root, relative);
            if (entry.isDirectory()) collect(relative);
            else if (entry.isFile() && !relative.endsWith('.map') && (!sourceStyles.has(relative) || linkedStyles.has(relative))) files.push(relative);
        }
    };
    for (const dir of ['partials', 'assets']) if (fs.existsSync(inside(root, dir))) collect(dir);
    const chunks = [], directory = [];
    let offset = 0;
    for (const file of files.sort()) {
        const name = Buffer.from(file.replaceAll('\\', '/'));
        const data = fs.readFileSync(inside(root, file));
        const crc = crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
        local.writeUInt16LE(33, 12); // 1980-01-01: deterministic archive timestamps
        local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
        chunks.push(local, name, data);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8);
        central.writeUInt16LE(33, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
        directory.push(central, name);
        offset += local.length + name.length + data.length;
    }
    if (files.length > 65535 || offset > 0xffffffff) throw new Error('Theme exceeds ZIP32 limits');
    const central = Buffer.concat(directory), end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
    const dist = inside(root, 'dist');
    fs.mkdirSync(dist, { recursive: true });
    const output = inside(root, `dist/${pkg.name}-${pkg.version}.zip`);
    fs.writeFileSync(output, Buffer.concat([...chunks, central, end]));
    return { output, files };
}

export function reportTheme(themeRoot) {
    const result = inspectTheme(themeRoot);
    for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    if (result.errors.length) return false;
    console.log('Theme checks passed. Run the official gscan validator before publishing.');
    return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const root = path.resolve(process.argv[3] || process.cwd());
    try {
        if (process.argv[2] === 'pack') console.log(`Created ${packageTheme(root).output}`);
        else if (!reportTheme(root)) process.exitCode = 1;
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
