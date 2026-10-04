import { startPlayground } from '../utils/playground-server';

export async function playground(options: { port?: string } = {}) {
  try {
    if (options.port !== undefined && !/^\d+$/.test(options.port)) throw new Error('Port must be an integer between 0 and 65535.');
    const runtime = await startPlayground({ themeRoot: process.cwd(), port: options.port === undefined ? undefined : Number(options.port) });
    console.log(`Ghostcn playground: ${runtime.url}`);
    console.log('Read-only previews of installed components with synthetic content. Keep npm run dev running for CSS changes.');
    console.log('Press Ctrl+C to stop.');
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      process.off('SIGINT', stop); process.off('SIGTERM', stop);
      await runtime.close();
    };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } catch (error) { console.error((error as Error).message); process.exitCode = 1; }
}
