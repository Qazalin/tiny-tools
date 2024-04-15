import { useRef } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Spinner from "./Spinner";

export default function FileUploader({
  setPickleData,
  isUploading,
  showTip = false,
}: {
  setPickleData: (ab: ArrayBuffer) => void;
  isUploading: boolean;
  showTip?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file == null) return;
    const reader = new FileReader();
    reader.onload = function (event: any) {
      setPickleData(event.target.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-2">
      <label
        className={
          "px-5 h-[44px] bg-white rounded-md text-black flex items-center w-fit " +
          (!isUploading
            ? "cursor-pointer hover:bg-gray-200 transition-colors"
            : "cursor-not-allowed bg-gray-300")
        }
      >
        <input
          type="file"
          onChange={handleUpload}
          ref={inputRef}
          id="file-upload"
          disabled={isUploading}
          className="hidden"
        />
        {isUploading ? (
          <Spinner className="w-5 h-5 text-black mr-2" />
        ) : (
          <ArrowDownTrayIcon className="w-5 h-5 stroke-black mr-2 stroke-2" />
        )}
        <span className="text-xl">Import</span>
      </label>
      {showTip && (
        <p>
          Tip: upload a pickle of <code>List[ScheduleItem]</code>
        </p>
      )}
    </div>
  );
}
