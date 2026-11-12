import { createApp } from './app.js';
import { env } from './config/env.js';
import { getSupabaseAdapter } from './config/supabase.config.js';

async function bootstrap(): Promise<void> {
  const adapter = getSupabaseAdapter();
  const status = await adapter.ping();

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    console.log('==============================================================');
    console.log(`🚀 [DANENTANG BACKEND] Running on http://localhost:${env.port}`);
    console.log(`⚡ [SUPABASE DB MODE]  ${status.mode} (${status.databaseType})`);
    console.log(`🔗 [SUPABASE URL]      ${status.projectUrl}`);
    console.log('==============================================================');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start backend server:', err);
  process.exit(1);
});
