import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { GraphCanvas, GraphCanvasRef, GraphEdge, useSelection } from "reagraph";
import KernelModal from "./Kernel";
import { ScheduleNode } from "./types";

export default function Base() {
  const [focusedSI, setFocusedSI] = useState<ScheduleNode | null>(null);
  const [activeTest, setActiveTest] = useState("adam");

  const graphRef = useRef<GraphCanvasRef | null>(null);

  const { data } = useQuery<{
    code: string;
    nodes: ScheduleNode[];
    edges: GraphEdge[];
  }>({
    queryKey: [`?test=${activeTest}`],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const { selections, actives, onNodeClick, onCanvasClick } = useSelection({
    ref: graphRef,
    nodes: data?.nodes ?? [],
    edges: data?.edges ?? [],
    pathSelectionType: "all",
  });

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
      {data == null ? (
        <div>loading</div>
      ) : (
        <div className="fixed w-[100%] h-full bg-red-400">
          <GraphCanvas
            ref={graphRef}
            nodes={data.nodes}
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
            onNodeDoubleClick={(node) =>
              setFocusedSI(node.data as ScheduleNode)
            }
            selections={selections}
            actives={actives}
            onCanvasClick={onCanvasClick}
            animated={false}
            onNodeClick={onNodeClick}
          />
          <KernelModal si={focusedSI} onClose={() => setFocusedSI(null)} />
        </div>
      )}
    </div>
  );
}
