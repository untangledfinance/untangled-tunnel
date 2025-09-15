import { boot, Boot } from '@untangled/boot';
import * as bootLoaders from '@untangled/boot/loaders';
import { Application, Module } from '@untangled/core/http';
import { TunnelController } from '@/controllers';
import { start, TunnelConfigs } from '@/tunnel';

@Auto
@Boot(
  bootLoaders.config({
    externalConfigFiles: process.env['X_CFG_FLS']?.split(','),
  }),
  bootLoaders.bean({
    database: {
      mongo: true,
    },
    jwt: true,
    rbac: true,
    slack: true,
    safeExit: true,
  })
)
@Module({
  controllers: [TunnelController],
})
class App extends Application {
  async onInit() {
    await start(Configs.env as TunnelConfigs);
    return this.start({
      host: Configs.app.host,
      port: Configs.app.port,
    });
  }

  async onStop() {
    return this.stop();
  }
}

boot(App);
