import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import CodeBlock from "../CodeBlock";
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

  return (
    <div className="bg-black bg-opacity-65 data-[state=open]:animate-overlayShow fixed inset-0 h-full w-full flex items-center justify-center z-40">
      <div
        className="relative max-h-[85vh] max-w-[50vw] focus:outline-none bg-[#111113] p-4 rounded-md overflow-scroll z-50 flex flex-col space-y-1"
        ref={ref}
      >
        <div className="self-end">
          <XMarkIcon
            className="w-5 h-5 cursor-pointer"
            onClick={() => onClose()}
          />
        </div>
        <div className="space-y-3 font-mono">
          <CodeBlock code={si.code} />
          {si.shape && <div>shape: {si.shape}</div>}
          {si.ref && parseInt(si.ref) > 10 && <div>ref: {si.ref}</div>}
          {si.inputs.length !== 0 && (
            <div>
              <p className="text-lg">inputs:</p>
              {si.inputs.map((inp, i) => (
                <p key={`inp-${i}` + inp}>{inp}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-lg">outputs:</p>
            {si.outputs.map((out, i) => (
              <p key={`out-${i}` + out}>{out}</p>
            ))}
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
