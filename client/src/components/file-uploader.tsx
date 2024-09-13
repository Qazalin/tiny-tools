import { useDropzone } from "react-dropzone";
import classNames from "classnames"
import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Spinner from "./spinner";

export default function FileUploader({
  setData,
  isUploading,
  showTip = false,
}: {
  setData: (ab: ArrayBuffer) => void;
  isUploading: boolean;
  showTip?: boolean;
}) {
  const [value, setValue] = useState("");
  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file == null) return;
    fileToBuffer(file);
    setValue("");
  };

  function fileToBuffer(file: File) {
    const reader = new FileReader();
    reader.onload = function(event: any) {
      setData(event.target.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      fileToBuffer(files[0]);
      setValue("");
    },
    noClick: true,
  });

  return (
    <div
      className={classNames("space-y-2 flex-col flex", showTip ? "w-screen h-screen justify-center items-center" : "")}
      {...getRootProps()}
    >
      <div className="h-fit w-fit">
        <label
          className={classNames(
            "px-5 h-[44px] bg-white rounded-md text-black flex items-center w-fit",
            !isUploading ? "cursor-pointer hover:bg-gray-200 transition-colors" : "cursor-not-allowed bg-gray-300")
          }
        >
          <input
            type="file"
            onChange={handleUpload}
            id="file-upload"
            disabled={isUploading}
            className="hidden"
            {...getInputProps()}
            value={value}
          />
          {isUploading ? (
            <Spinner className="w-5 h-5 text-black mr-2" />
          ) : (
            <ArrowDownTrayIcon className="w-5 h-5 stroke-black mr-2 stroke-2" />
          )}
          <span className="text-xl">
            {isDragActive ? "Drop here" : "Import"}
          </span>
        </label>
        {showTip && (
          <p className="mt-2">
            Tip: run tinygrad with <code>SAVE_SCHEDULE=1</code>
          </p>
        )}
      </div>
    </div>
  );
}
