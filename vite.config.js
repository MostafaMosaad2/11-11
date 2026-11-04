import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const audioPath = path.resolve("public/audio/message.mp3");
const virtualId = "virtual:voice-message";
const resolvedVirtualId = "\0virtual:voice-message";

function optionalVoicePlugin() {
  return {
    name: "optional-voice-message",
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
    },
    load(id) {
      if (id !== resolvedVirtualId) return;
      const exists = fs.existsSync(audioPath);
      return `export const voiceSrc = ${exists ? '"/audio/message.mp3"' : "null"}\n`;
    },
    configureServer(server) {
      const reload = (file) => {
        if (path.resolve(file) !== audioPath) return;
        const module = server.moduleGraph.getModuleById(resolvedVirtualId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add(path.dirname(audioPath));
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

export default defineConfig({
  plugins: [react(), optionalVoicePlugin()],
});
