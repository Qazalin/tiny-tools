import { useState } from "react";
import FileUploader from "./components/file-uploader";
import ScheduleGraph from "./schedule-graph";
import { GraphBatch, ScheduleNode, UOpNode } from "./types";
import UOpGraph from "./uop-graph";

export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [batch, setBatch] = useState<GraphBatch>();

  async function loadBatch(raw: ArrayBuffer) {
    setIsUploading(true);
    const py = (await (window as any).loadPyodide()) as {
      runPython: (code: string) => string;
      loadPackage: (pkg: string) => any;
      pyimport: (pkg: string) => any;
      FS: any;
    };
    await py.loadPackage("micropip");
    await py.loadPackage("sqlite3");
    const micropip = py.pyimport("micropip");
    await micropip.install("tinygrad-tools");

    py.FS.writeFile("/graph.pkl", new Uint8Array(raw), { encoding: "binary" });
    const res = await fetch("/python/main.py");
    const prg = await res.text();
    py.runPython(prg);
    setBatch(JSON.parse(py.FS.readFile("/graph.json", { encoding: "utf8" })));
    setIsUploading(false);
  }

  if (batch == null) {
    return <FileUploader setData={loadBatch} isUploading={isUploading} showTip />;
  }
  if (batch.graphs.length == 0) {
    return <div>can't render empty graph!</div>;
  }

  if ("op" in batch.graphs[0].nodes) {
    return <UOpGraph batch={batch as GraphBatch<UOpNode>} />;
  }
  return <ScheduleGraph batch={batch as GraphBatch<ScheduleNode>} />
}
