import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const audioDir = path.resolve("public/audio");
const virtualId = "virtual:voice-message";
const resolvedVirtualId = "\0virtual:voice-message";

function audioModuleSource() {
  const line = (key, name) => {
    const exists = fs.existsSync(path.join(audioDir, name));
    return `export const ${key} = ${exists ? JSON.stringify(`/audio/${name}`) : "null"};`;
  };
  return [line("voiceSrc", "message.mp3"), line("ambientSrc", "ambient.mp3"), line("paperSrc", "paper.mp3")].join(
    "\n",
  );
}

function optionalAudioPlugin() {
  return {
    name: "optional-audio",
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
    },
    load(id) {
      if (id !== resolvedVirtualId) return;
      return audioModuleSource();
    },
    configureServer(server) {
      const reload = (file) => {
        if (path.dirname(path.resolve(file)) !== audioDir) return;
        const module = server.moduleGraph.getModuleById(resolvedVirtualId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      };
      fs.mkdirSync(audioDir, { recursive: true });
      server.watcher.add(audioDir);
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

export default defineConfig({
  plugins: [react(), optionalAudioPlugin()],
});
