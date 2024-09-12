import { useEffect, useState } from "react";
import FileUploader from "../components/FileUpload";
import { GraphData } from "../types";
import { useFile } from "../utils";

export default function GraphLoader({
  setGraph,
  showTip = false,
}: {
  setGraph: (g: GraphData) => void;
  showTip?: boolean;
}) {
  const [pickleData, setPickleData] = useState<ArrayBuffer>();
  const [isLoading, setIsLoading] = useState(false);
  const prg = useFile("/python/load_uops.py");

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
    await micropip.install("tinygrad-tools");

    py.FS.writeFile("/uop.pkl", new Uint8Array(data), { encoding: "binary" });
    py.runPython(prg);
    const graph: GraphData = JSON.parse(
      py.FS.readFile("/uop.json", { encoding: "utf8" }),
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
