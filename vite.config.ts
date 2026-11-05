import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * ELEMENTA — Vite multi-page build (Next.js → Vite migration).
 *
 * Following the repo house pattern (apps/daedalus, apps/solar-app): every app
 * is a plain Vite build aliased directly onto the framework and engine sources
 * — no per-app installs. Dependencies (react, recharts, tailwindcss …) resolve
 * from the hoisted root node_modules.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function nistAsdProxy(): Plugin {
  const cache = new Map<string, { body: string; expires: number }>();
  const handle = async (request: any, response: any, next: (error?: Error) => void) => {
    if (request.method !== 'GET') {
      response.statusCode = 405;
      response.end('Method not allowed');
      return;
    }
    const incoming = new URL(request.url ?? '/', 'http://localhost');
    const spectra = incoming.searchParams.get('spectra') ?? '';
    const low = Number(incoming.searchParams.get('low_w'));
    const high = Number(incoming.searchParams.get('upp_w'));
    const minIntensity = Number(incoming.searchParams.get('min_intens') ?? 0);
    if (!/^[A-Z][a-z]? (?:I|II|III)$/.test(spectra) || !Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high <= low || high > 100000 || !Number.isFinite(minIntensity) || minIntensity < 0) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end('Invalid NIST ASD spectra query');
      return;
    }

    const cacheKey = `${spectra}|${low}|${high}|${minIntensity}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.setHeader('Cache-Control', 'public, max-age=3600');
      response.end(cached.body);
      return;
    }

    const query = new URLSearchParams({
      spectra, low_w: String(low), upp_w: String(high), unit: '1', format: '2',
      A_out: '0', J_out: 'on', allowed_out: '1', bibrefs: '1', conf_out: 'on', de: '0',
      en_unit: '0', enrg_out: 'on', forbid_out: '1', intens_out: '1', limits_type: '0',
      line_out: '0', max_low_enrg: '', max_str: '', max_upp_enrg: '', min_accur: '',
      min_intens: minIntensity ? String(minIntensity) : '', min_str: '', order_out: '0', output: '0',
      page_size: '1000', show_av: '2', show_calc_wl: '1', show_obs_wl: '1',
      submit: 'Retrieve Data', term_out: 'on', tsb_value: '0', unc_out: '1',
    });
    try {
      const upstream = await fetch(`https://physics.nist.gov/cgi-bin/ASD/lines1.pl?${query}`);
      const body = await upstream.text();
      if (!upstream.ok || /<title>NIST ASD : Input Error/i.test(body) || /Invalid Column Setting|Unknown parameter|Software error/i.test(body)) {
        response.statusCode = 502;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end('NIST ASD could not return this spectrum.');
        return;
      }
      cache.set(cacheKey, { body, expires: Date.now() + 60 * 60 * 1000 });
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.setHeader('Cache-Control', 'public, max-age=3600');
      response.end(body);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return {
    name: 'elementa-nist-asd-proxy',
    configureServer(server) { server.middlewares.use('/api/nist-asd', handle); },
    configurePreviewServer(server) { server.middlewares.use('/api/nist-asd', handle); },
  };
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), nistAsdProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Nexus framework — original framework at the repo root
      'nexus-framework': path.resolve(__dirname, '../../index.js'),
      // @nexus/3d — the full showcase engine (has Texture/TextureLoader and the
      // richer WebGL renderer the 3D scenes rely on; packages/nexus-3d lacks those)
      '@nexus/3d': path.resolve(
        __dirname,
        '../../packages/3D/nexus/nexus-3d/src/index.ts',
      ),
      // React 19 JSX works through Vite's esbuild transform (tsconfig jsx:
      // react-jsx) — no @vitejs/plugin-react needed. Trade-off: no fast
      // refresh (full reload on edit), which the house apps also accept.
    },
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        orbitals: path.resolve(__dirname, 'orbitals.html'),
        mo: path.resolve(__dirname, 'mo.html'),
        segre: path.resolve(__dirname, 'segre.html'),
        daedalus: path.resolve(__dirname, 'daedalus.html'),
        em: path.resolve(__dirname, 'em.html'),
        references: path.resolve(__dirname, 'references.html'),
        thermo: path.resolve(__dirname, 'thermo.html'),
        relativity: path.resolve(__dirname, 'relativity.html'),
        quantumwave: path.resolve(__dirname, 'quantumwave.html'),
        synthesizer: path.resolve(__dirname, 'synthesizer.html'),
        crystal: path.resolve(__dirname, 'crystal.html'),
        electrochemistry: path.resolve(__dirname, 'electrochemistry.html'),
        spectroscopy: path.resolve(__dirname, 'spectroscopy.html'),
        kinetics: path.resolve(__dirname, 'kinetics.html'),
        integrity: path.resolve(__dirname, 'integrity.html'),
      },
    },
  },
  server: { port: 3520 },
});
