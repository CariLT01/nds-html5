declare global {
  var __webpack_public_path__: string;
}
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}