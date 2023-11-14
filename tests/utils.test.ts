import { describe, it, expect } from "vitest";
import {
  getLegacyName,
  normalizePath,
  getFileInfos,
  getInputRelPath,
  prepareRollupInputs,
  isSubdirectory,
  parseVersionString,
  resolveDevServerUrl,
} from "../src/utils";
import { resolvePluginOptions } from "../src/pluginOptions";
import { OutputChunk, OutputAsset, NormalizedOutputOptions } from "rollup";
import {
  asyncDepChunk,
  indexCss,
  legacyPolyfills,
  logoPng,
  pageAssets,
  themeCss,
  welcomeJs,
  welcomeLegacyJs,
} from "./mocks";
import { defineConfig, InlineConfig, resolveConfig, type ResolvedConfig } from "vite";
import { VitePluginSymfonyOptions } from "../src/types";

const viteBaseConfig = {
  root: "/home/me/project-dir",
  base: "/build/",
} as unknown as ResolvedConfig;

describe("parseVersionString", () => {
  it("basic", () => {
    expect(parseVersionString("1.2.3")).toEqual(["1.2.3", 1, 2, 3]);
  });

  it("return usable version if uncommon string", () => {
    expect(parseVersionString("1.2.3-dev")).toEqual(["1.2.3-dev", 1, 2, 3]);
    expect(parseVersionString("1.2")).toEqual(["1.2", 1, 2, 0]);
    expect(parseVersionString("1")).toEqual(["1", 1, 0, 0]);
    expect(parseVersionString("1-dev")).toEqual(["1-dev", 1, 0, 0]);
  });
});

describe("normalizePath", () => {
  it("normalize correctly path", () => {
    expect(normalizePath("path//to/deep/../file.ts")).toBe("path/to/file.ts");
  });

  it("keep the path unchanged on UNIX", () => {
    expect(normalizePath("path/to/file.ts")).toBe("path/to/file.ts");
  });
});

describe("getLegacyName", () => {
  it("suffix pathname with -legacy before extension", () => {
    expect(getLegacyName("assets/page/assets/index.js")).toBe("assets/page/assets/index-legacy.js");
  });
});

/**
 * {
      viteConfig: InlineConfig,
      isIPv4: boolean,
      pluginOptions: Partial<VitePluginSymfonyOptions>,
      expectedUrl: string,
    }
 */
describe("resolveDevServerUrl", () => {
  it.each([
    {
      message: "resolve correctly default config",
      viteConfig: {},
      isIPv4: true,
      pluginOptions: {},
      expectedUrl: "http://127.0.0.1:5173",
    },
    {
      message: "resolve host priority 1",
      viteConfig: {},
      isIPv4: true,
      pluginOptions: {
        originOverride: "<override-all>",
        viteDevServerHostname: "<less-priority>",
      },
      expectedUrl: "<override-all>",
    },
    {
      message: "resolve host priority 2",
      viteConfig: {
        server: {
          hmr: {
            host: "hmr-host",
          },
          host: "server-host",
        },
      },
      isIPv4: true,
      pluginOptions: {
        viteDevServerHostname: "plugin-host",
      },
      expectedUrl: "http://hmr-host:5173",
    },
    {
      message: "resolve host priority 3 (use case docker)",
      viteConfig: {
        server: {
          host: "0.0.0.0.",
        },
      },
      isIPv4: true,
      pluginOptions: {
        viteDevServerHostname: "plugin-host",
      },
      expectedUrl: "http://plugin-host:5173",
    },
    {
      message: "resolve host priority 4",
      viteConfig: {
        server: {
          host: "server-host",
        },
      },
      isIPv4: true,
      pluginOptions: {},
      expectedUrl: "http://server-host:5173",
    },
    {
      message: "resolve host priority 5",
      viteConfig: {},
      isIPv4: false,
      pluginOptions: {},
      expectedUrl: "http://[::1]:5173",
    },
  ])("$message", async ({ viteConfig, isIPv4, pluginOptions, expectedUrl }) => {
    const address = isIPv4
      ? {
          family: "IPv4",
          address: "127.0.0.1",
          port: 5173,
        }
      : {
          family: "IPv6",
          address: "::1",
          port: 5173,
        };

    const viteResolvedConfig = await resolveConfig(viteConfig, "serve");
    const pluginConfig = resolvePluginOptions(pluginOptions);
    expect(resolveDevServerUrl(address, viteResolvedConfig, pluginConfig)).toBe(expectedUrl);
  });
});

describe("getFileInfos", () => {
  it("parse correctly an output", () => {
    expect(getFileInfos(asyncDepChunk, "assets/lib/async-dep.js", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "assets": [],
          "css": [],
          "dynamic": [],
          "hash": null,
          "imports": [],
          "inputRelPath": "assets/lib/async-dep.js",
          "js": [
            "assets/async-dep-e2ac9f96.js",
          ],
          "outputRelPath": "assets/async-dep-e2ac9f96.js",
          "preload": [],
          "type": "js",
        }
      `);
    expect(getFileInfos(indexCss, "_assets/index-aa7c8190.css", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "css": [
            "assets/index-aa7c8190.css",
          ],
          "hash": null,
          "inputRelPath": "_assets/index-aa7c8190.css",
          "outputRelPath": "assets/index-aa7c8190.css",
          "type": "css",
        }
      `);
    expect(getFileInfos(themeCss, "assets/theme.scss", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "css": [
            "assets/theme-44b5be96.css",
          ],
          "hash": null,
          "inputRelPath": "assets/theme.scss",
          "outputRelPath": "assets/theme-44b5be96.css",
          "type": "css",
        }
      `);
    expect(getFileInfos(logoPng, "_assets/logo-d015cc3f.png", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "hash": null,
          "inputRelPath": "_assets/logo-d015cc3f.png",
          "outputRelPath": "assets/logo-d015cc3f.png",
          "type": "asset",
        }
      `);
    expect(getFileInfos(welcomeJs, "assets/page/welcome/index.js", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "assets": [],
          "css": [],
          "dynamic": [],
          "hash": null,
          "imports": [],
          "inputRelPath": "assets/page/welcome/index.js",
          "js": [
            "assets/welcome-1e67239d.js",
          ],
          "outputRelPath": "assets/welcome-1e67239d.js",
          "preload": [],
          "type": "js",
        }
      `);
    expect(
      getFileInfos(welcomeJs, "assets/page/welcome/index.js", { sriAlgorithm: "sha256" } as VitePluginSymfonyOptions),
    ).toMatchInlineSnapshot(`
      {
        "assets": [],
        "css": [],
        "dynamic": [],
        "hash": "sha256-w+Sit18/MC+LC1iX8MrNapOiCQ8wbPX8Rb6ErbfDX1Q=",
        "imports": [],
        "inputRelPath": "assets/page/welcome/index.js",
        "js": [
          "assets/welcome-1e67239d.js",
        ],
        "outputRelPath": "assets/welcome-1e67239d.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(pageAssets, "assets/page/assets/index.js", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "assets": [
            "assets/logo-d015cc3f.png",
          ],
          "css": [
            "assets/index-aa7c8190.css",
          ],
          "dynamic": [],
          "hash": null,
          "imports": [],
          "inputRelPath": "assets/page/assets/index.js",
          "js": [
            "assets/pageAssets-05cfe79c.js",
          ],
          "outputRelPath": "assets/pageAssets-05cfe79c.js",
          "preload": [],
          "type": "js",
        }
      `);
    expect(
      getFileInfos(welcomeLegacyJs, "assets/page/welcome/index-legacy.js", {
        sriAlgorithm: false,
      } as VitePluginSymfonyOptions),
    ).toMatchInlineSnapshot(`
      {
        "assets": [],
        "css": [],
        "dynamic": [],
        "hash": null,
        "imports": [],
        "inputRelPath": "assets/page/welcome/index-legacy.js",
        "js": [
          "assets/welcome-legacy-64979d13.js",
        ],
        "outputRelPath": "assets/welcome-legacy-64979d13.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(legacyPolyfills, "vite/legacy-polyfills", { sriAlgorithm: false } as VitePluginSymfonyOptions))
      .toMatchInlineSnapshot(`
        {
          "assets": [],
          "css": [],
          "dynamic": [],
          "hash": null,
          "imports": [],
          "inputRelPath": "vite/legacy-polyfills",
          "js": [
            "assets/polyfills-legacy-40963d34.js",
          ],
          "outputRelPath": "assets/polyfills-legacy-40963d34.js",
          "preload": [],
          "type": "js",
        }
      `);
  });
});

describe("prepareRollupInputs", () => {
  it("prepare inputs", () => {
    expect(
      prepareRollupInputs({
        ...viteBaseConfig,
        build: {
          rollupOptions: {
            input: {
              app: "./path/to/filename.ts",
              theme: "./other/place/to/theme.scss",
            },
          },
        },
      } as unknown as ResolvedConfig),
    ).toMatchInlineSnapshot(`
      {
        "app": {
          "inputRelPath": "path/to/filename.ts",
          "inputType": "js",
        },
        "theme": {
          "inputRelPath": "other/place/to/theme.scss",
          "inputType": "css",
        },
      }
    `);
  });
});

describe("getInputRelPath", () => {
  it("generate Correct path", () => {
    expect(
      getInputRelPath(
        {
          type: "asset",
          fileName: "theme.css",
        } as OutputAsset,
        { format: "es" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("_theme.css");

    expect(
      getInputRelPath(
        {
          type: "chunk",
          facadeModuleId: "/home/me/project-dir/assets/page/welcome/index.js",
          name: "welcome",
        } as OutputChunk,
        { format: "es" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("assets/page/welcome/index.js");

    expect(
      getInputRelPath(
        {
          type: "chunk",
          facadeModuleId: "/home/me/project-dir/assets/page/welcome/index.js",
          name: "welcome",
        } as OutputChunk,
        { format: "system" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("assets/page/welcome/index-legacy.js");
  });
});

describe("isAncestorDir", () => {
  it("subdirectory is a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/vite-project/public")).toBe(true);
  });
  it("same folder is not a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/vite-project")).toBe(false);
  });
  it("sibling folder is not a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/symfony-project")).toBe(false);
  });
  it("sibling folder starting with same name is not a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/vite-project-2")).toBe(false);
  });
  it("traversing up the tree and into a sibling folder is not a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/vite-project/../react-project")).toBe(false);
  });
  it("unnormalized path in project folder: is a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "/projects/vite-project/./public")).toBe(true);
  });
  it("unnormalized path with path traversal into subdirectory is a subdirectory", () => {
    expect(isSubdirectory("/vite-project/../projects", "/projects/vite-project")).toBe(true);
  });
  it("unnormalized path relative to current directory: is not a subdirectory", () => {
    expect(isSubdirectory("/projects/vite-project", "./vite-project")).toBe(false);
  });
});
