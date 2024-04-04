import { useEffect, useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, GraphEdge, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { GraphData, ScheduleNode } from "./types";

export default function Base({ data }: { data: GraphData }) {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
  const [activeTest, setActiveTest] = useState("");

  const [nodes, setNodes] = useState<ScheduleNode[]>(data.nodes);
  const [searchShape, setSearchShape] = useState("");
  const [colorReduces, setColorReduces] = useState(false);

  const graphRef = useRef<GraphCanvasRef | null>(null);

  const { selections, actives, onNodeClick, onCanvasClick } = useSelection({
    ref: graphRef,
    nodes: data.nodes,
    edges: data.edges,
    pathSelectionType: "all",
  });

  useEffect(() => {
    const newNodes = nodes.map((node) => {
      if (node.shape.startsWith(searchShape) && node.code.includes("r_")) {
        return { ...node, fill: "red" };
      }
      return { ...node, fill: "#c0c0c0" };
    });
    setNodes(newNodes);
  }, [searchShape]);

  useEffect(() => {
    const newNodes = nodes.map((node) => {
      if (node.code.includes("r_") && colorReduces) {
        return {
          ...node,
          fill: node.outputs[0].includes("ReduceOps") ? "red" : "pink",
        };
      }
      return { ...node, fill: "#c0c0c0" };
    });
    setNodes(newNodes);
  }, [colorReduces]);

  return (
    <div className="h-screen w-screen p-10 font-mono">
      <div className="space-y-4">
        <div
          className={`p-2 rounded-md cursor-pointer ${activeTest === "adam" ? "text-white bg-gray-900 " : "text-gray-300"} w-fit`}
          onClick={() => setActiveTest("adam")}
        >
          <p>Test TinyBobNet+Adam</p>
        </div>

        <div
          className={`p-2 rounded-md cursor-pointer ${activeTest === "" ? "text-white bg-gray-900 " : "text-gray-300"} w-fit`}
          onClick={() => setActiveTest("")}
        >
          <p>Test Convnext+SGD</p>
        </div>

        <div
          className={`p-2 rounded-md cursor-pointer ${activeTest === "tiny" ? "text-white bg-gray-900 " : "text-gray-300"} w-fit`}
          onClick={() => setActiveTest("tiny")}
        >
          <p>simple multioutput/multi-level possible</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <label>search lb by shape:</label>
        <input
          className="bg-gray-900 outline-none p-1 px-2 rounded-md"
          type="text"
          value={searchShape}
          onChange={(e) => setSearchShape(e.target.value)}
        />
      </div>

      <div className="flex space-x-2">
        <label>color reduces:</label>
        <input
          className="bg-gray-900 outline-none p-1 px-2 rounded-md"
          type="checkbox"
          checked={colorReduces}
          onChange={(e) => setColorReduces(e.target.checked)}
        />

        <div className="flex space-x-2 items-center">
          <div className="flex flex-col space-y-1 justify-center">
            <div className="w-4 h-4 rounded-full bg-pink-500" />
            <p>reduce pair</p>
          </div>
          <div className="flex flex-col space-y-1 justify-center">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <p>alone reduce</p>
          </div>
        </div>
      </div>
      <div className="fixed w-[100%] h-full">
        <GraphCanvas
          ref={graphRef}
          nodes={nodes}
          edges={data.edges}
          theme={{
            canvas: { background: "#000" },
            node: {
              fill: "#7CA0AB",
              activeFill: "#1DE9AC",
              opacity: 1,
              selectedOpacity: 1,
              inactiveOpacity: 0.2,
              label: { color: "white", activeColor: "#1DE9AC" },
            },
            lasso: {
              border: "1px solid #55aaff",
              background: "rgba(75, 160, 255, 0.1)",
            },
            ring: { fill: "#000", activeFill: "#1DE9AC" },
            edge: {
              fill: "#D8E6EA",
              activeFill: "#1DE9AC",
              opacity: 0.2,
              selectedOpacity: 1,
              inactiveOpacity: 0.1,
              label: {
                stroke: "#000",
                color: "#2A6475",
                activeColor: "#1DE9AC",
                fontSize: 6,
              },
            },
            arrow: { fill: "#D8E6EA", activeFill: "#1DE9AC" },
          }}
          layoutType="treeTd2d"
          onNodeDoubleClick={(node) => setFocusedSI(node.data as ScheduleNode)}
          selections={selections}
          actives={actives}
          onCanvasClick={onCanvasClick}
          animated={false}
          onNodeClick={onNodeClick}
        />
        <KernelModal si={focusedSI} onClose={() => setFocusedSI(null)} />
      </div>
    </div>
  );
}
