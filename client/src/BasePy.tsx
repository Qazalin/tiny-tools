import { useEffect, useState } from "react";
import FileUploader from "./FileUpload";
import { GraphData } from "./types";

export default function TinygradParser({
  setGraph,
  showTip = false,
}: {
  setGraph: (g: GraphData) => void;
  showTip?: boolean;
}) {
  const [pickleData, setPickleData] = useState<ArrayBuffer>();
  const [isLoading, setIsLoading] = useState(false);

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
    // this is actually tinygrad master
    await micropip.install(
      "https://storage.googleapis.com/tiny-tools/tinygrad-0.8.0-py3-none-any.whl",
    );
    py.FS.writeFile("/sched.pkl", new Uint8Array(data), { encoding: "binary" });

    py.runPython(`
    import pickle, importlib, io
    import json, functools, re
    from tinygrad.ops import ScheduleItem, LazyOp, LoadOps
    from tinygrad.codegen.linearizer import Linearizer
    from tinygrad.helpers import to_function_name
    from tinygrad.renderer.cstyle import OpenCLRenderer
    from tinygrad.features.graph import _tree

    class Buffer:
      def __init__(self, device, size, dtype, *args, **kwargs) -> None: self.device, self.size, self.dtype = device, size, dtype
      def __repr__(self): return f"<buf real:True device:{self.device} size:{self.size} dtype:{self.dtype}>"
    class TinyUnpickler(pickle.Unpickler):
      def find_class(self, module: str, name: str):
        if module == "tinygrad.buffer" and name == "Buffer": return Buffer
        return getattr(importlib.import_module(module), name)
    with open("/sched.pkl", "rb") as f: s = f.read()
    schedule = TinyUnpickler(io.BytesIO(s)).load()

    @functools.lru_cache(None)
    def cached_linearize(*ast:LazyOp) -> Linearizer:
      lin= Linearizer(*ast)
      lin.linearize()
      return lin

    def transform_node(src):
      node = {"id": src["id"], "inputs": src["inputs"], "outputs": src["outputs"]}
      if src["ast"][0].op not in LoadOps:
        lin = cached_linearize(*src["ast"])
        name = to_function_name(lin.name)
        node["fill"] = "green" if bool(re.search(r'r\\d', name)) else "red" if name.startswith("r") else "green" if bool(re.search(r'E\\d', name)) else "blue"
        node["code"] = OpenCLRenderer(name, lin.uops)
        node["label"] = name
        node["shape"] = str(src["ast"][0].arg.st.shape)
        node["ast"] = "\\n".join(["\\n".join([f"{str(i).rjust(3)} {s}" for i,s in enumerate(_tree(op, {}, [-1]))]) for op in src["ast"]])
      else:
        node["fill"] = "white"
        node["code"], node["shape"] = "", ""
        node["label"] = str(src["ast"][0].op)
      return node

    buf_schedules = {out: si for si in schedule for out in si.outputs}
    nodes, edges = [], []
    def _parse(i:int, si: ScheduleItem): return transform_node({ 'id': str(i+1), 'ast': si.ast, 'inputs': list(map(str, si.inputs)), 'outputs': list(map(str, si.outputs)) })
    for i, si in enumerate(schedule):
      nodes.append(_parse(i, si))
      for x in si.inputs:
        if x not in buf_schedules: continue
        source_index = schedule.index(buf_schedules[x]) + 1
        edge_id = f"{source_index}-{i+1}"
        edges.append({'source': str(source_index), 'target': str(i+1), 'id': edge_id, 'label': edge_id})
    with open("/sched.json", "w") as fh: fh.write(json.dumps({"nodes": nodes, "edges": edges}))
    `);
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
