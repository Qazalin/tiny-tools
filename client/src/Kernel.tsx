import { ScheduleNode } from "./types";

type KernelProps = { si: ScheduleNode | null; onClose: () => void };
export default function Kernel({ si, onClose }: KernelProps) {
  if (si == null) {
    return null;
  }
  return (
    <div className="bg-black bg-opacity-65 data-[state=open]:animate-overlayShow fixed inset-0 h-full w-full flex items-center justify-center z-40">
      <div className="relative max-h-[85vh] max-w-[50vw] focus:outline-none bg-gray-900 p-4 rounded-md overflow-scroll z-50">
        <div className="absolute top-5 right-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            className="self-end"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => onClose()}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div className="space-y-3 font-mono">
          <div>
            {si?.code
              .split("\n")
              .map((s) => <p className="whitespace-pre">{s}</p>)}
          </div>
          <hr className="opacity-30" />
          <div>
            <p className="text-lg">inputs:</p>
            {si.inputs.map((inp) => (
              <p>{inp}</p>
            ))}
          </div>
          <div>
            <p className="text-lg">outputs:</p>
            {si.outputs.map((inp) => (
              <p>{inp}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}