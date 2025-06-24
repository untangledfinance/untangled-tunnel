import '@untangled';

import { Boot } from '@untangled/boot';
import * as bootLoaders from '@untangled/boot/loaders';
import { Application, Module } from '@untangled/core/http';
import { shutdown } from '@untangled/core/ioc';
import { createSlackClient } from '@/config';
import { TunnelController } from '@/controllers/tunnel';
import { startTunnel, TunnelConfigs } from '@/tunnel';

@Auto
@Boot(
  bootLoaders.config({
    externalConfigFiles: process.env['X_CFG_FLS']?.split(','),
  }),
  bootLoaders.bean({
    database: true,
    jwt: true,
    new: async (configs) => {
      await createSlackClient(configs);
    },
  })
)
@Module({
  controllers: [TunnelController],
})
class App extends Application {
  async onInit() {
    this.on('started', async () => {
      await startTunnel(Configs.env as TunnelConfigs);
    });
  }

  async onStop() {
    await this.stop();
  }
}

async function start() {
  await $(App).start({
    port: Configs.app.port,
  });
}

start().then(() => process.on('SIGINT', shutdown).on('SIGTERM', shutdown));
