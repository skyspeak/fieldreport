/** Ambient types for server ESM modules imported from vite.config.ts */
declare module './server/v3Api.mjs' {
  export function v3ApiPlugin(): import('vite').Plugin
  export function handleV3Report(
    req: import('http').IncomingMessage,
    res: import('http').ServerResponse,
  ): Promise<void>
}

declare module '../server/aoiClient.mjs'
declare module '../server/buildFieldReport.mjs'
