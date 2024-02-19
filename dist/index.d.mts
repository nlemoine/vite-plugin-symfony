import { Plugin } from 'vite';

declare module "rollup" {
  export interface RenderedChunk {
    viteMetadata?: ChunkMetadata;
  }
}

interface ChunkMetadata {
  importedAssets: Set<string>;
  importedCss: Set<string>;
}

type HashAlgorithm = false | "sha256" | "sha384" | "sha512";

type VitePluginSymfonyOptions = VitePluginSymfonyEntrypointsOptions & {
  /**
   * enable controllers.json loader for Symfony UX.
   * @default false
   */
  stimulus: boolean | string | VitePluginSymfonyStimulusOptions;
};

type VitePluginSymfonyEntrypointsOptions = {
  /**
   * Web directory root
   * Relative file path from project directory root.
   * @default 'public'
   * @deprecated use `build.outDir`: join(publicDirectory, buildDirectory) from vite config
   */
  publicDirectory: string;

  /**
   * Build directory (or path)
   * Relative path from web directory root
   * @default 'build'
   * @deprecated use `base`: "/" + buildDirectory + "/" from vite config
   */
  buildDirectory: string;

  /**
   * By default vite-plugin-symfony set vite option publicDir to false.
   * Because we don't want symfony entrypoint (index.php) and other files to
   * be copied into the build directory.
   * Related to this issue : https://github.com/lhapaipai/vite-bundle/issues/17
   *
   * Vite plugin Symfony use sirv to serve public directory.
   *
   * If you want to force vite option publicDir to true, set servePublic to false.
   *
   * @default 'public'
   */
  servePublic: false | string;

  /**
   * Refresh vite dev server when your twig templates are updated.
   *  - array of paths to files to be watched, or glob patterns
   *  - true : equivalent to ["templates/**\/*.twig"]
   * @default false
   *
   * for additional glob documentation, check out low-level library picomatch : https://github.com/micromatch/picomatch
   */
  refresh: boolean | string[];

  /**
   * If you specify vite `server.host` option to '0.0.0.0' (usage with Docker)
   * You probably need to configure your `viteDevServerHostname` to 'localhost'.
   * Related to this issue : https://github.com/lhapaipai/vite-bundle/issues/26
   *
   * @default null
   */
  viteDevServerHostname: null | string;

  /**
   * Add an integrity attribute to your <script> <link> elements
   * @default false
   */
  sriAlgorithm: HashAlgorithm;

  /**
   * Show vite resolved config
   * @default false
   */
  debug: boolean;

  /**
   * Override the origin for every dev entrypoint.
   * Useful when you use a proxy server.
   * @default null
   */
  originOverride: null | string;

  /**
   * force the plugin to run at the end of the list of all plugins
   * necessary if you want to add integrity attributes in your scripts
   * @default true
   */
  enforcePluginOrderingPosition: boolean;

  /**
   * force the vite dev server to reassign his `server.origin` Vite config after vite dev server is listening.
   * relating to https://github.com/vitejs/vite/issues/12597
   * with this option activated we no longer need to pass Vite asset requests through the symfony proxy
   * @default true
   */
  enforceServerOriginAfterListening: boolean;

  /**
   * For security reasons only variables prefixed with `VITE_` from your .env files are exposed.
   * In some cases you will want to be able to access other variables. Just add them here.
   * @default ["APP_ENV"]
   */
  exposedEnvVars: string[];

  /**
   * Prevent emptying outDir in dev mode
   * @default true
   */
  emptyOutDir: boolean;
};

type VitePluginSymfonyStimulusOptions = {
  /**
   * path to controllers.json relative to vite root
   * @default ./assets/controller.json
   */
  controllersFilePath: string;

  /**
   * enable hmr for controllers
   * @default true
   */
  hmr: boolean;
};

declare function symfony(userOptions?: Partial<VitePluginSymfonyOptions>): Plugin[];

export { symfony as default };
