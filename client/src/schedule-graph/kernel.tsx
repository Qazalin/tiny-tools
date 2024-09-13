import { XMarkIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import CodeBlock from "../components/code-block";
import { ScheduleNode } from "../types";

type KernelProps = { si: ScheduleNode | null; onClose: () => void };
export default function Kernel({ si, onClose }: KernelProps) {
  const ref = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (si == null) return null;

  function onCopy() {
    document.getElementById("code-block");
    navigator.clipboard.writeText(si!.code);
  }

  return (
    <div className="bg-black bg-opacity-65 data-[state=open]:animate-overlayShow fixed inset-0 h-full w-full flex items-center justify-center z-40">
      <div
        className="relative max-h-[85vh] max-w-[50vw] focus:outline-none bg-black p-4 rounded-md overflow-scroll z-50 flex flex-col space-y-1"
        ref={ref}
      >
        <div className="self-end flex space-x-2">
          <ClipboardIcon
            className="w-5 h-5 cursor-pointer"
            onClick={() => onCopy()}
          />
          <XMarkIcon
            className="w-5 h-5 cursor-pointer"
            onClick={() => onClose()}
          />
        </div>
        <div className="space-y-3 font-mono">
          <div className="space-y-0">
            <CodeBlock code={si.code} />
            {si.shape && <div>output_shape: {si.shape}</div>}
            {si.full_shape && <div>full_shape: {si.full_shape}</div>}
            {si.ref && parseInt(si.ref) > 10 && <div>ref: {si.ref}</div>}
            {<div>forced_realize: {String(si.forced_realize)}</div>}
          </div>
          <div>{si.metadata}</div>

          <div>
            <div>
              <p className="text-neutral-500"># outputs</p>
              {si.outputs.map((out, i) => (
                <p key={`out-${i}` + out}>
                  <span className="text-neutral-500">{i}</span> {out}
                </p>
              ))}
            </div>
            {si.inputs.length !== 0 && (
              <div>
                <p className="text-neutral-500"># inputs</p>
                {si.inputs.map((inp, i) => (
                  <p key={`inp-${i}` + inp}>
                    <span className="text-neutral-500">
                      {i + si.outputs.length}
                    </span>{" "}
                    {inp}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div>
            {si.ast?.split("\n").map((s) => (
              <p className="whitespace-pre" key={s}>
                {s}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
