// src/entrypoints/index.ts
import { resolve as resolve2, join as join3, relative as relative2, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import glob from "fast-glob";
import process3 from "node:process";
import sirv from "sirv";
import colors from "picocolors";

// src/entrypoints/entryPointsHelper.ts
import process2 from "node:process";

// src/entrypoints/utils.ts
import { loadEnv } from "vite";
import os from "node:os";
import path from "node:path";
import { writeFileSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import { resolve, extname, relative } from "path";
import { createHash } from "node:crypto";

// src/entrypoints/pathMapping.ts
var inputRelPath2outputRelPath = {};
function addIOMapping(relInputPath, relOutputPath) {
  inputRelPath2outputRelPath[relInputPath] = relOutputPath;
}
function getOutputPath(relInputPath) {
  return inputRelPath2outputRelPath[relInputPath];
}
function getInputPath(relOutputPath) {
  return Object.keys(inputRelPath2outputRelPath).find((key) => inputRelPath2outputRelPath[key] === relOutputPath);
}

// src/entrypoints/utils.ts
var isWindows = os.platform() === "win32";
function parseVersionString(str) {
  const [major, minor, patch] = str.split(".").map((nb) => parseInt(nb));
  return [str, major ?? 0, minor ?? 0, patch ?? 0];
}
function slash(p) {
  return p.replace(/\\/g, "/");
}
function isSubdirectory(parent, child) {
  parent = path.normalize(parent);
  child = path.normalize(child);
  if (parent == child) {
    return false;
  }
  const parentDirs = parent.split(path.sep).filter((dir) => dir !== "");
  const childDirs = child.split(path.sep).filter((dir) => dir !== "");
  return parentDirs.every((dir, i) => childDirs[i] === dir);
}
function normalizePath(id) {
  return path.posix.normalize(isWindows ? slash(id) : id);
}
function getLegacyName(name) {
  const ext = extname(name);
  const endPos = ext.length !== 0 ? -ext.length : void 0;
  name = name.slice(0, endPos) + "-legacy" + ext;
  return name;
}
function isIpv6(address) {
  return address.family === "IPv6" || // In node >=18.0 <18.4 this was an integer value. This was changed in a minor version.
  // See: https://github.com/laravel/vite-plugin/issues/103
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line
  address.family === 6;
}
var writeJson = (filePath, jsonData) => {
  try {
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    throw new Error(`Error writing ${path.basename(filePath)}: ${err.message}`);
  }
};
var emptyDir = (dir) => {
  const files = readdirSync(dir);
  for (const file of files) {
    rmSync(join(dir, file), { recursive: true });
  }
};
var FS_PREFIX = `/@fs/`;
var VALID_ID_PREFIX = `/@id/`;
var CLIENT_PUBLIC_PATH = `/@vite/client`;
var ENV_PUBLIC_PATH = `/@vite/env`;
var importQueryRE = /(\?|&)import=?(?:&|$)/;
var isImportRequest = (url) => importQueryRE.test(url);
var internalPrefixes = [FS_PREFIX, VALID_ID_PREFIX, CLIENT_PUBLIC_PATH, ENV_PUBLIC_PATH];
var InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join("|")})`);
var isInternalRequest = (url) => InternalPrefixRE.test(url);
var CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
var cssModuleRE = new RegExp(`\\.module${CSS_LANGS_RE.source}`);
var commonjsProxyRE = /\?commonjs-proxy/;
var isCSSRequest = (request) => CSS_LANGS_RE.test(request);
var polyfillId = "\0vite/legacy-polyfills";
function resolveDevServerUrl(address, config, pluginOptions) {
  if (pluginOptions.originOverride) {
    return pluginOptions.originOverride;
  }
  if (config.server?.origin) {
    return config.server.origin;
  }
  const configHmrProtocol = typeof config.server.hmr === "object" ? config.server.hmr.protocol : null;
  const clientProtocol = configHmrProtocol ? configHmrProtocol === "wss" ? "https" : "http" : null;
  const serverProtocol = config.server.https ? "https" : "http";
  const protocol = clientProtocol ?? serverProtocol;
  const configHmrHost = typeof config.server.hmr === "object" ? config.server.hmr.host : null;
  const configHost = typeof config.server.host === "string" ? config.server.host : null;
  const serverAddress = isIpv6(address) ? `[${address.address}]` : address.address;
  const host = configHmrHost ?? pluginOptions.viteDevServerHostname ?? configHost ?? serverAddress;
  const configHmrClientPort = typeof config.server.hmr === "object" ? config.server.hmr.clientPort : null;
  const port = configHmrClientPort ?? address.port;
  return `${protocol}://${host}:${port}`;
}
var isAddressInfo = (x) => typeof x === "object";
var isCssEntryPoint = (chunk) => {
  if (!chunk.isEntry) {
    return false;
  }
  let isPureCssChunk = true;
  const ids = Object.keys(chunk.modules);
  for (const id of ids) {
    if (!isCSSRequest(id) || cssModuleRE.test(id) || commonjsProxyRE.test(id)) {
      isPureCssChunk = false;
    }
  }
  if (isPureCssChunk) {
    return chunk?.viteMetadata.importedCss.size === 1;
  }
  return false;
};
var getFileInfos = (chunk, inputRelPath, pluginOptions) => {
  const alg = pluginOptions.sriAlgorithm;
  if (chunk.type === "asset") {
    if (chunk.fileName.endsWith(".css")) {
      return {
        css: [chunk.fileName],
        hash: alg === false ? null : generateHash(chunk.source, alg),
        inputRelPath,
        outputRelPath: chunk.fileName,
        type: "css"
      };
    } else {
      return {
        hash: alg === false ? null : generateHash(chunk.source, alg),
        inputRelPath,
        outputRelPath: chunk.fileName,
        type: "asset"
      };
    }
  } else if (chunk.type === "chunk") {
    const { imports, dynamicImports, viteMetadata, fileName } = chunk;
    return {
      assets: Array.from(viteMetadata.importedAssets),
      css: Array.from(viteMetadata.importedCss),
      hash: alg === false ? null : generateHash(chunk.code, alg),
      imports,
      inputRelPath,
      js: [fileName],
      outputRelPath: fileName,
      preload: [],
      dynamic: dynamicImports,
      type: "js"
    };
  }
};
function generateHash(source, alg) {
  if (alg === false) {
    return null;
  }
  const hash = createHash(alg).update(source).digest().toString("base64");
  return `${alg}-${hash}`;
}
var prepareRollupInputs = (config) => {
  const inputParsed = {};
  for (const [entryName, inputRelPath] of Object.entries(config.build.rollupOptions.input)) {
    const entryAbsolutePath = normalizePath(resolve(config.root, inputRelPath));
    const extension = extname(inputRelPath);
    const inputType = [".css", ".scss", ".sass", ".less", ".styl", ".stylus", ".postcss"].indexOf(extension) !== -1 ? "css" : "js";
    const entryRelativePath = normalizePath(relative(config.root, entryAbsolutePath));
    inputParsed[entryName] = {
      inputType,
      inputRelPath: entryRelativePath
    };
  }
  return inputParsed;
};
var getInputRelPath = (chunk, options, config) => {
  if (chunk.type === "asset" || !chunk.facadeModuleId) {
    const inputRelPath2 = getInputPath(chunk.fileName);
    if (inputRelPath2) {
      return inputRelPath2;
    }
    return `_${chunk.fileName}`;
  }
  if ([polyfillId].indexOf(chunk.facadeModuleId) !== -1) {
    return chunk.facadeModuleId.replace(/\0/g, "");
  }
  let inputRelPath = normalizePath(path.relative(config.root, chunk.facadeModuleId));
  if (options.format === "system" && !chunk.name.includes("-legacy")) {
    inputRelPath = getLegacyName(inputRelPath);
  }
  return inputRelPath.replace(/\0/g, "");
};
function resolveUserExternal(user, id, parentId, isResolved) {
  if (typeof user === "function") {
    return user(id, parentId, isResolved);
  } else if (Array.isArray(user)) {
    return user.some((test) => isExternal(id, test));
  } else {
    return isExternal(id, user);
  }
}
function isExternal(id, test) {
  if (typeof test === "string") {
    return id === test;
  } else {
    return test.test(id);
  }
}
function extractExtraEnvVars(mode, envDir, exposedEnvVars, define) {
  const allVars = loadEnv(mode, envDir, "");
  const availableKeys = Object.keys(allVars).filter((key) => exposedEnvVars.indexOf(key) !== -1);
  const extraDefine = Object.fromEntries(
    availableKeys.map((key) => [`import.meta.env.${key}`, JSON.stringify(allVars[key])])
  );
  return {
    ...extraDefine,
    ...define ?? {}
  };
}

// src/entrypoints/entryPointsHelper.ts
var getDevEntryPoints = (config, viteDevServerUrl) => {
  const entryPoints = {};
  for (const [entryName, { inputRelPath, inputType }] of Object.entries(prepareRollupInputs(config))) {
    entryPoints[entryName] = {
      [inputType]: [`${viteDevServerUrl}${config.base}${inputRelPath}`]
    };
  }
  return entryPoints;
};
var getFilesMetadatas = (base, generatedFiles) => {
  return Object.fromEntries(
    Object.values(generatedFiles).filter((fileInfos) => fileInfos.hash).map((fileInfos) => [
      `${base}${fileInfos.outputRelPath}`,
      {
        hash: fileInfos.hash
      }
    ])
  );
};
var getBuildEntryPoints = (generatedFiles, viteConfig) => {
  const entryPoints = {};
  let hasLegacyEntryPoint = false;
  const entryFiles = prepareRollupInputs(viteConfig);
  for (const [entryName, entry] of Object.entries(entryFiles)) {
    const outputRelPath = getOutputPath(entry.inputRelPath);
    const fileInfos = generatedFiles[outputRelPath];
    if (!outputRelPath || !fileInfos) {
      console.error("unable to map generatedFile", entry, outputRelPath, fileInfos);
      process2.exit(1);
    }
    const legacyInputRelPath = getLegacyName(entry.inputRelPath);
    const legacyFileInfos = generatedFiles[getOutputPath(legacyInputRelPath)] ?? null;
    if (legacyFileInfos) {
      hasLegacyEntryPoint = true;
      entryPoints[`${entryName}-legacy`] = resolveEntrypoint(legacyFileInfos, generatedFiles, viteConfig, false);
    }
    entryPoints[entryName] = resolveEntrypoint(
      fileInfos,
      generatedFiles,
      viteConfig,
      hasLegacyEntryPoint ? `${entryName}-legacy` : false
    );
  }
  if (hasLegacyEntryPoint && getOutputPath("vite/legacy-polyfills")) {
    const fileInfos = generatedFiles[getOutputPath("vite/legacy-polyfills")] ?? null;
    if (fileInfos) {
      entryPoints["polyfills-legacy"] = resolveEntrypoint(fileInfos, generatedFiles, viteConfig, false);
    }
  }
  return entryPoints;
};
var resolveEntrypoint = (fileInfos, generatedFiles, config, legacyEntryName, resolvedImportOutputRelPaths = []) => {
  const css = [];
  const js = [];
  const preload = [];
  const dynamic = [];
  resolvedImportOutputRelPaths.push(fileInfos.outputRelPath);
  if (fileInfos.type === "js") {
    for (const importOutputRelPath of fileInfos.imports) {
      if (resolvedImportOutputRelPaths.indexOf(importOutputRelPath) !== -1) {
        continue;
      }
      resolvedImportOutputRelPaths.push(importOutputRelPath);
      const importFileInfos = generatedFiles[importOutputRelPath];
      if (!importFileInfos) {
        const isExternal2 = config.build.rollupOptions.external ? resolveUserExternal(
          config.build.rollupOptions.external,
          importOutputRelPath,
          // use URL as id since id could not be resolved
          fileInfos.inputRelPath,
          false
        ) : false;
        if (isExternal2) {
          continue;
        }
        throw new Error(`Unable to find ${importOutputRelPath}`);
      }
      const {
        css: importCss,
        dynamic: importDynamic,
        js: importJs,
        preload: importPreload
      } = resolveEntrypoint(importFileInfos, generatedFiles, config, false, resolvedImportOutputRelPaths);
      for (const dependency of importCss) {
        if (css.indexOf(dependency) === -1) {
          css.push(dependency);
        }
      }
      for (const dependency of importJs) {
        if (preload.indexOf(dependency) === -1) {
          preload.push(dependency);
        }
      }
      for (const dependency of importPreload) {
        if (preload.indexOf(dependency) === -1) {
          preload.push(dependency);
        }
      }
      for (const dependency of importDynamic) {
        if (dynamic.indexOf(dependency) === -1) {
          dynamic.push(dependency);
        }
      }
    }
    fileInfos.js.forEach((dependency) => {
      if (js.indexOf(dependency) === -1) {
        js.push(`${config.base}${dependency}`);
      }
    });
    fileInfos.preload.forEach((dependency) => {
      if (preload.indexOf(dependency) === -1) {
        preload.push(`${config.base}${dependency}`);
      }
    });
    fileInfos.dynamic.forEach((dependency) => {
      if (dynamic.indexOf(dependency) === -1) {
        dynamic.push(`${config.base}${dependency}`);
      }
    });
  }
  if (fileInfos.type === "js" || fileInfos.type === "css") {
    fileInfos.css.forEach((dependency) => {
      if (css.indexOf(dependency) === -1) {
        css.push(`${config.base}${dependency}`);
      }
    });
  }
  return { css, dynamic, js, legacy: legacyEntryName, preload };
};

// src/pluginOptions.ts
import { join as join2 } from "node:path";
function resolvePluginOptions(userConfig = {}) {
  if (typeof userConfig.publicDirectory === "string") {
    userConfig.publicDirectory = userConfig.publicDirectory.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (userConfig.publicDirectory === "") {
      throw new Error("vite-plugin-symfony: publicDirectory must be a subdirectory. E.g. 'public'.");
    }
  }
  if (typeof userConfig.buildDirectory === "string") {
    userConfig.buildDirectory = userConfig.buildDirectory.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (userConfig.buildDirectory === "") {
      throw new Error("vite-plugin-symfony: buildDirectory must be a subdirectory. E.g. 'build'.");
    }
  }
  if (typeof userConfig.servePublic === "undefined") {
    userConfig.servePublic = "public";
  }
  if (typeof userConfig.sriAlgorithm === "string" && ["sha256", "sha384", "sha512"].indexOf(userConfig.sriAlgorithm.toString()) === -1) {
    userConfig.sriAlgorithm = false;
  }
  if (userConfig.stimulus === true) {
    userConfig.stimulus = {
      controllersFilePath: "./assets/controllers.json",
      hmr: true
    };
  } else if (typeof userConfig.stimulus === "string") {
    userConfig.stimulus = {
      controllersFilePath: userConfig.stimulus,
      hmr: true
    };
  } else if (typeof userConfig.stimulus === "object") {
    userConfig.stimulus = {
      controllersFilePath: userConfig.stimulus.controllersFilePath ?? "./assets/controllers.json",
      hmr: userConfig.stimulus.hmr !== false ? true : false
    };
  } else {
    userConfig.stimulus = false;
  }
  return {
    buildDirectory: userConfig.buildDirectory,
    debug: userConfig.debug === true,
    enforcePluginOrderingPosition: userConfig.enforcePluginOrderingPosition === false ? false : true,
    enforceServerOriginAfterListening: userConfig.enforceServerOriginAfterListening === false ? false : true,
    exposedEnvVars: userConfig.exposedEnvVars ?? ["APP_ENV"],
    originOverride: userConfig.originOverride ?? null,
    publicDirectory: userConfig.publicDirectory,
    refresh: userConfig.refresh ?? false,
    servePublic: userConfig.servePublic,
    sriAlgorithm: userConfig.sriAlgorithm ?? false,
    stimulus: userConfig.stimulus,
    viteDevServerHostname: userConfig.viteDevServerHostname ?? null,
    emptyOutDir: userConfig.emptyOutDir ?? true
  };
}
function resolveBase(config) {
  if (typeof config.buildDirectory !== "undefined") {
    return "/" + config.buildDirectory + "/";
  }
  return "/build/";
}
function resolveOutDir(config) {
  let publicDirectory = "public";
  let buildDirectory = "build";
  if (typeof config.publicDirectory !== "undefined") {
    publicDirectory = config.publicDirectory;
  }
  if (typeof config.buildDirectory !== "undefined") {
    buildDirectory = config.buildDirectory;
  }
  return join2(publicDirectory, buildDirectory);
}
function resolvePublicDir(config) {
  if (typeof config.publicDirectory !== "undefined") {
    return config.publicDirectory;
  }
  return config.servePublic === false ? null : config.servePublic;
}
var refreshPaths = ["templates/**/*.twig"];

// src/entrypoints/depreciations.ts
function showDepreciationsWarnings(pluginOptions, logger) {
  if (typeof pluginOptions.buildDirectory !== "undefined") {
    logger.error(
      `"buildDirectory" plugin option is deprecated and will be removed in v5.x use base: "${resolveBase(
        pluginOptions
      )}" from vite config instead`
    );
  }
  if (typeof pluginOptions.publicDirectory !== "undefined") {
    logger.error(
      `"publicDirectory" plugin option is deprecated and will be removed in v5.x use build.outDir: "${resolveOutDir(
        pluginOptions
      )}" from vite config instead`
    );
  }
}

// src/entrypoints/index.ts
var pluginDir = dirname(dirname(fileURLToPath(import.meta.url)));
var pluginVersion;
var bundleVersion;
if (process3.env.VITEST) {
  pluginDir = dirname(pluginDir);
  pluginVersion = ["test"];
  bundleVersion = ["test"];
} else {
  try {
    const packageJson = JSON.parse(readFileSync(join3(pluginDir, "package.json")).toString());
    pluginVersion = parseVersionString(packageJson?.version);
  } catch {
    pluginVersion = [""];
  }
  try {
    const composerJson = JSON.parse(readFileSync("composer.lock").toString());
    bundleVersion = parseVersionString(
      composerJson.packages?.find(
        (composerPackage) => composerPackage.name === "pentatrion/vite-bundle"
      )?.version
    );
  } catch {
    bundleVersion = [""];
  }
}
function symfonyEntrypoints(pluginOptions, logger) {
  let viteConfig;
  let viteDevServerUrl;
  const entryPointsFileName = ".vite/entrypoints.json";
  const generatedFiles = {};
  let outputCount = 0;
  return {
    name: "symfony-entrypoints",
    enforce: "post",
    config(userConfig, { mode }) {
      const root = userConfig.root ? resolve2(userConfig.root) : process3.cwd();
      const envDir = userConfig.envDir ? resolve2(root, userConfig.envDir) : root;
      const extraEnvVars = extractExtraEnvVars(mode, envDir, pluginOptions.exposedEnvVars, userConfig.define);
      if (userConfig.build.rollupOptions.input instanceof Array) {
        logger.error(colors.red("rollupOptions.input must be an Objet like {app: './assets/app.js'}"));
        process3.exit(1);
      }
      const extraConfig = {
        base: userConfig.base ?? resolveBase(pluginOptions),
        publicDir: false,
        build: {
          manifest: true,
          outDir: userConfig.build?.outDir ?? resolveOutDir(pluginOptions)
        },
        define: extraEnvVars,
        optimizeDeps: {
          //Set to true to force dependency pre-bundling.
          force: true
        },
        server: {
          watch: {
            ignored: userConfig.server?.watch?.ignored ? [] : ["**/vendor/**", glob.escapePath(root + "/var") + "/**", glob.escapePath(root + "/public") + "/**"]
          }
        }
      };
      return extraConfig;
    },
    configResolved(config) {
      viteConfig = config;
      if (pluginOptions.enforcePluginOrderingPosition) {
        const pluginPos = viteConfig.plugins.findIndex((plugin) => plugin.name === "symfony-entrypoints");
        const symfonyPlugin = viteConfig.plugins.splice(pluginPos, 1);
        const manifestPos = viteConfig.plugins.findIndex((plugin) => plugin.name === "vite:reporter");
        viteConfig.plugins.splice(manifestPos, 0, symfonyPlugin[0]);
      }
    },
    configureServer(devServer) {
      const { watcher, ws } = devServer;
      const _printUrls = devServer.printUrls;
      devServer.printUrls = () => {
        _printUrls();
        const versions = [];
        if (pluginVersion[0]) {
          versions.push(colors.dim(`vite-plugin-symfony: `) + colors.bold(`v${pluginVersion[0]}`));
        }
        if (bundleVersion[0]) {
          versions.push(colors.dim(`pentatrion/vite-bundle: `) + colors.bold(`${bundleVersion[0]}`));
        }
        const versionStr = versions.length === 0 ? "" : versions.join(colors.dim(", "));
        console.log(`  ${colors.green("\u279C")}  Vite ${colors.yellow("\u26A1\uFE0F")} Symfony: ${versionStr}`);
      };
      devServer.httpServer?.once("listening", () => {
        if (viteConfig.env.DEV) {
          showDepreciationsWarnings(pluginOptions, logger);
          const buildDir = resolve2(viteConfig.root, viteConfig.build.outDir);
          const viteDir = resolve2(buildDir, ".vite");
          const address = devServer.httpServer?.address();
          const entryPointsPath = resolve2(viteConfig.root, viteConfig.build.outDir, entryPointsFileName);
          if (!isSubdirectory(viteConfig.root, buildDir) && viteConfig.build.emptyOutDir !== true) {
            logger.error(
              `outDir ${buildDir} is not a subDirectory of your project root. To prevent recursively deleting files anywhere else set "build.outDir" to true in your vite.config.js to confirm that you did not accidentally specify a wrong directory location.`
            );
            process3.exit(1);
          }
          if (!isAddressInfo(address)) {
            logger.error(
              `address is not an object open an issue with your address value to fix the problem : ${address}`
            );
            process3.exit(1);
          }
          if (!existsSync(buildDir)) {
            mkdirSync(buildDir, { recursive: true });
          }
          if (pluginOptions.emptyOutDir) {
            existsSync(buildDir) && emptyDir(buildDir);
          }
          mkdirSync(viteDir, { recursive: true });
          viteDevServerUrl = resolveDevServerUrl(address, devServer.config, pluginOptions);
          if (pluginOptions.enforceServerOriginAfterListening) {
            viteConfig.server.origin = viteDevServerUrl;
          }
          writeJson(entryPointsPath, {
            base: viteConfig.base,
            entryPoints: getDevEntryPoints(viteConfig, viteDevServerUrl),
            legacy: false,
            metadatas: {},
            version: pluginVersion,
            viteServer: viteDevServerUrl
          });
        }
      });
      if (pluginOptions.refresh !== false) {
        const paths = pluginOptions.refresh === true ? refreshPaths : pluginOptions.refresh;
        for (const path2 of paths) {
          watcher.add(path2);
        }
        watcher.on("change", function(path2) {
          if (path2.endsWith(".twig")) {
            ws.send({
              type: "full-reload"
            });
          }
        });
      }
      if (pluginOptions.servePublic !== false) {
        const serve = sirv(resolvePublicDir(pluginOptions), {
          dev: true,
          etag: true,
          extensions: [],
          setHeaders(res, pathname) {
            if (/\.[tj]sx?$/.test(pathname)) {
              res.setHeader("Content-Type", "application/javascript");
            }
            res.setHeader("Access-Control-Allow-Origin", "*");
          }
        });
        devServer.middlewares.use(function viteServePublicMiddleware(req, res, next) {
          if (req.url === "/" || req.url === "/build/") {
            res.statusCode = 404;
            res.end(readFileSync(join3(pluginDir, "static/dev-server-404.html")));
            return;
          }
          if (isImportRequest(req.url) || isInternalRequest(req.url)) {
            return next();
          }
          serve(req, res, next);
        });
      }
    },
    async renderChunk(code, chunk) {
      if (!isCssEntryPoint(chunk)) {
        return;
      }
      const cssAssetName = chunk.facadeModuleId ? normalizePath(relative2(viteConfig.root, chunk.facadeModuleId)) : chunk.name;
      chunk.viteMetadata.importedCss.forEach((cssBuildFilename) => {
        addIOMapping(cssAssetName, cssBuildFilename);
      });
    },
    generateBundle(options, bundle) {
      for (const chunk of Object.values(bundle)) {
        const inputRelPath = getInputRelPath(chunk, options, viteConfig);
        addIOMapping(inputRelPath, chunk.fileName);
        generatedFiles[chunk.fileName] = getFileInfos(chunk, inputRelPath, pluginOptions);
      }
      outputCount++;
      const output = viteConfig.build.rollupOptions?.output;
      const outputLength = Array.isArray(output) ? output.length : 1;
      if (outputCount >= outputLength) {
        const entryPoints = getBuildEntryPoints(generatedFiles, viteConfig);
        this.emitFile({
          fileName: entryPointsFileName,
          source: JSON.stringify(
            {
              base: viteConfig.base,
              entryPoints,
              legacy: typeof entryPoints["polyfills-legacy"] !== "undefined",
              metadatas: getFilesMetadatas(viteConfig.base, generatedFiles),
              version: pluginVersion,
              viteServer: null
            },
            null,
            2
          ),
          type: "asset"
        });
      }
    }
  };
}

// src/stimulus/util.ts
var CONTROLLER_FILENAME_REGEX = /^(?:.*?(controllers)\/|\.?\.\/)?(.+)\.[jt]sx?$/;
var CONTROLLER_SUFFIX_REGEX = /^(.*)(?:[/_-](lazy)?controller)$/;
function getStimulusControllerFileInfos(key, onlyControllersDir = false) {
  const [, controllers, relativePath] = key.match(CONTROLLER_FILENAME_REGEX) || [];
  if (!relativePath || onlyControllersDir && controllers !== "controllers") {
    return {
      identifier: void 0,
      lazy: false
    };
  }
  const [, identifier, lazy] = relativePath.match(CONTROLLER_SUFFIX_REGEX) || [];
  return {
    identifier: (identifier ?? relativePath).replace(/_/g, "-").replace(/\//g, "--"),
    lazy: lazy === "lazy"
  };
}
function generateStimulusId(packageName) {
  if (packageName.startsWith("@")) {
    packageName = packageName.substring(1);
  }
  return packageName.replace(/_/g, "-").replace(/\//g, "--");
}

// src/stimulus/node/bridge.ts
import { createRequire } from "node:module";
var virtualSymfonyControllersModuleId = "virtual:symfony/controllers";
function createControllersModule(config) {
  const require2 = createRequire(import.meta.url);
  const controllerContents = [];
  let importStatementContents = "";
  let hasLazyControllers = false;
  let controllerIndex = 0;
  if ("undefined" === typeof config["controllers"]) {
    throw new Error('Your Stimulus configuration file (assets/controllers.json) lacks a "controllers" key.');
  }
  for (const originalPackageName in config.controllers) {
    let packageConfig = null;
    let packageNameResolved;
    if (originalPackageName === "@symfony/ux-svelte" || originalPackageName === "@symfony/ux-react") {
      packageNameResolved = "vite-plugin-symfony";
    } else {
      packageNameResolved = originalPackageName;
    }
    try {
      packageConfig = require2(`${packageNameResolved}/package.json`);
    } catch (e) {
      console.log(
        `The file "${packageNameResolved}/package.json" could not be found. Try running "npm install --force".`
      );
    }
    for (const controllerName in config.controllers[originalPackageName]) {
      const controllerReference = `${originalPackageName}/${controllerName}`;
      if (packageConfig && packageConfig.symfony && "undefined" === typeof packageConfig.symfony.controllers[controllerName]) {
        throw new Error(`Controller "${controllerReference}" does not exist in the package and cannot be compiled.`);
      }
      const controllerPackageConfig = packageConfig?.symfony?.controllers[controllerName] || {};
      const controllerUserConfig = config.controllers[originalPackageName][controllerName];
      if (!controllerUserConfig.enabled) {
        continue;
      }
      let controllerMain = packageNameResolved;
      if (controllerPackageConfig.main) {
        controllerMain = `${packageNameResolved}/${controllerPackageConfig.main}`;
      }
      if (controllerUserConfig.main) {
        controllerMain = `${packageNameResolved}/${controllerPackageConfig.main}`;
      }
      const fetchMode = controllerUserConfig.fetch || "eager";
      let moduleValueContents = ``;
      if (fetchMode === "eager") {
        const controllerNameForVariable = `controller_${controllerIndex++}`;
        importStatementContents += `import ${controllerNameForVariable} from '${controllerMain}';
`;
        moduleValueContents = controllerNameForVariable;
      } else if (fetchMode === "lazy") {
        hasLazyControllers = true;
        moduleValueContents = generateLazyController(controllerMain);
      } else {
        throw new Error(`Invalid fetch mode "${fetchMode}" in controllers.json. Expected "eager" or "lazy".`);
      }
      let controllerNormalizedName = generateStimulusId(controllerReference);
      if ("undefined" !== typeof controllerPackageConfig.name) {
        controllerNormalizedName = controllerPackageConfig.name.replace(/\//g, "--");
      }
      if ("undefined" !== typeof controllerUserConfig.name) {
        controllerNormalizedName = controllerUserConfig.name.replace(/\//g, "--");
      }
      controllerContents.push(`'${controllerNormalizedName}': ${moduleValueContents}`);
      for (const autoimport in controllerUserConfig.autoimport || []) {
        if (controllerUserConfig.autoimport[autoimport]) {
          importStatementContents += "import '" + autoimport + "';\n";
        }
      }
    }
  }
  if (hasLazyControllers) {
    importStatementContents = `import { Controller } from '@hotwired/stimulus';
` + importStatementContents;
  }
  const moduleContent = `${importStatementContents}
export default {
${controllerContents.join(",\n")}
};
`;
  return moduleContent;
}
function generateLazyController(controllerPath, exportName = "default") {
  return `class extends Controller {
      constructor(context) {
        super(context);
        this.__stimulusLazyController = true;
      }
      initialize() {
        if (this.application.controllers.find((controller) => {
            return controller.identifier === this.identifier && controller.__stimulusLazyController;
        })) {
            return;
        }
        import('${controllerPath.replace(/\\/g, "\\\\")}').then((controller) => {
            this.application.register(this.identifier, controller.${exportName});
        });
      }
    }`;
}

// src/stimulus/index.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { resolve as resolve3 } from "node:path";
var applicationGlobalVarName = "$$stimulusApp$$";
function symfonyStimulus(pluginOptions, logger) {
  let viteConfig;
  let viteCommand;
  let stimulusControllersContent = null;
  let controllersFilePath;
  return {
    name: "symfony-stimulus",
    config(userConfig, { command }) {
      viteCommand = command;
      const extraConfig = {
        optimizeDeps: {
          exclude: [...userConfig?.optimizeDeps?.exclude ?? [], virtualSymfonyControllersModuleId]
        }
      };
      return extraConfig;
    },
    configResolved(config) {
      viteConfig = config;
      controllersFilePath = resolve3(viteConfig.root, pluginOptions.controllersFilePath);
      stimulusControllersContent = JSON.parse(readFileSync2(controllersFilePath).toString());
    },
    resolveId(id) {
      if (id === virtualSymfonyControllersModuleId) {
        return id;
      }
    },
    load(id) {
      if (id === virtualSymfonyControllersModuleId) {
        return createControllersModule(stimulusControllersContent);
      }
    },
    transform(code, id, options) {
      if (viteCommand !== "serve" || options?.ssr && !process.env.VITEST || id.includes("node_modules")) {
        return null;
      }
      if (id.endsWith("bootstrap.js") || id.endsWith("bootstrap.ts")) {
        const appRegex = /[^\n]*?\s(\w+)(?:\s*=\s*startStimulusApp\(\))/;
        const appVariable = (code.match(appRegex) || [])[1];
        if (appVariable) {
          logger.info(`appVariable ${appVariable}`);
          const exportFooter = `window.${applicationGlobalVarName} = ${appVariable}`;
          return `${code}
${exportFooter}`;
        }
        return null;
      }
      const { identifier } = getStimulusControllerFileInfos(id, true);
      if (!identifier)
        return null;
      logger.info(`controller ${identifier}`);
      const metaHotFooter = `
if (import.meta.hot) {
  import.meta.hot.accept(newModule => {
    if (!window.${applicationGlobalVarName}) {
      console.warn('Simulus app not available. Are you creating app with startStimulusApp() ?');
      import.meta.hot.invalidate();
    } else {
      window.${applicationGlobalVarName}.register('${identifier}', newModule.default);
    }
  })
}`;
      return `${code}
${metaHotFooter}`;
    },
    configureServer(devServer) {
      const { watcher } = devServer;
      watcher.on("change", (path2) => {
        if (path2 === controllersFilePath) {
          logger.info("\u2728 controllers.json updated, we restart server.");
          devServer.restart();
        }
      });
    }
  };
}

// src/logger.ts
import readline from "node:readline";
import colors2 from "picocolors";
var LogLevels = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3
};
var lastType;
var lastMsg;
var sameCount = 0;
function clearScreen() {
  const repeatCount = process.stdout.rows - 2;
  const blank = repeatCount > 0 ? "\n".repeat(repeatCount) : "";
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}
function createLogger(level = "info", options = {}) {
  if (options.customLogger) {
    return options.customLogger;
  }
  const timeFormatter = new Intl.DateTimeFormat(void 0, {
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  });
  const loggedErrors = /* @__PURE__ */ new WeakSet();
  const { prefix = "[vite]", allowClearScreen = true } = options;
  const thresh = LogLevels[level];
  const canClearScreen = allowClearScreen && process.stdout.isTTY && !process.env.CI;
  const clear = canClearScreen ? clearScreen : () => {
  };
  function output(type, msg, options2 = {}) {
    if (thresh >= LogLevels[type]) {
      const method = type === "info" ? "log" : type;
      const format = () => {
        const tag = type === "info" ? colors2.cyan(colors2.bold(prefix)) : type === "warn" ? colors2.yellow(colors2.bold(prefix)) : colors2.red(colors2.bold(prefix));
        if (options2.timestamp) {
          return `${colors2.dim(timeFormatter.format(/* @__PURE__ */ new Date()))} ${tag} ${msg}`;
        } else {
          return `${tag} ${msg}`;
        }
      };
      if (options2.error) {
        loggedErrors.add(options2.error);
      }
      if (canClearScreen) {
        if (type === lastType && msg === lastMsg) {
          sameCount++;
          clear();
          console[method](format(), colors2.yellow(`(x${sameCount + 1})`));
        } else {
          sameCount = 0;
          lastMsg = msg;
          lastType = type;
          if (options2.clear) {
            clear();
          }
          console[method](format());
        }
      } else {
        console[method](format());
      }
    }
  }
  const warnedMessages = /* @__PURE__ */ new Set();
  const logger = {
    hasWarned: false,
    info(msg, opts) {
      output("info", msg, opts);
    },
    warn(msg, opts) {
      logger.hasWarned = true;
      output("warn", msg, opts);
    },
    warnOnce(msg, opts) {
      if (warnedMessages.has(msg))
        return;
      logger.hasWarned = true;
      output("warn", msg, opts);
      warnedMessages.add(msg);
    },
    error(msg, opts) {
      logger.hasWarned = true;
      output("error", msg, opts);
    },
    clearScreen(type) {
      if (thresh >= LogLevels[type]) {
        clear();
      }
    },
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    }
  };
  return logger;
}

// src/index.ts
function symfony(userOptions = {}) {
  const { stimulus: stimulusOptions, ...entrypointsOptions } = resolvePluginOptions(userOptions);
  const plugins = [
    symfonyEntrypoints(
      entrypointsOptions,
      createLogger("info", { prefix: "[symfony:entrypoints]", allowClearScreen: true })
    )
  ];
  if (typeof stimulusOptions === "object") {
    plugins.push(
      symfonyStimulus(stimulusOptions, createLogger("info", { prefix: "[symfony:stimulus]", allowClearScreen: true }))
    );
  }
  return plugins;
}
export {
  symfony as default
};
