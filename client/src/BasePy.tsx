import { useEffect, useState } from "react";
import FileUploader from "./FileUpload";
import { GraphData } from "./types";
import { useFile } from "./utils";

export default function TinygradParser({
  setGraph,
  showTip = false,
}: {
  setGraph: (g: GraphData) => void;
  showTip?: boolean;
}) {
  const [pickleData, setPickleData] = useState<ArrayBuffer>();
  const [isLoading, setIsLoading] = useState(false);
  const prg = useFile("/python/load_schedule.py");

  async function r(data: ArrayBuffer) {
    setIsLoading(true);
    const py = (await (window as any).loadPyodide()) as {
      runPython: (code: string) => string;
      loadPackage: (pkg: string) => any;
      pyimport: (pkg: string) => any;
      FS: any;
    };
    await py.loadPackage("micropip");
    await py.loadPackage("sqlite3");
    const micropip = py.pyimport("micropip");
    await micropip.install("tinygrad-tools==0.9.5");

    py.FS.writeFile("/sched.pkl", new Uint8Array(data), { encoding: "binary" });
    py.runPython(prg);
    const graph: GraphData = JSON.parse(
      py.FS.readFile("/sched.json", { encoding: "utf8" }),
    );

    setIsLoading(false);
    setGraph(graph);
  }

  useEffect(() => {
    if (pickleData == null) return;
    r(pickleData);
  }, [pickleData]);

  return (
    <FileUploader
      setPickleData={setPickleData}
      isUploading={isLoading}
      showTip={showTip}
    />
  );
}
