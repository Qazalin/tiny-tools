import { useRef, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { GraphData } from "./types";
import { useIsMutating, useMutation } from "@tanstack/react-query";
import Spinner from "./Spinner";

export default function FileUploader({
  setGraph,
}: {
  setGraph: (g: GraphData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useMutation({
    mutationKey: ["upload"],
    mutationFn: async (formData: FormData) => {
      const res = await fetch(process.env.REACT_APP_API_URL as string, {
        method: "POST",
        body: formData,
      });
      const data: GraphData = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setGraph(data);
    },
  });
  let isUploading = useIsMutating({ mutationKey: ["upload"] }) > 1;
  isUploading = false;

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file == null) return;
    const formData = new FormData();
    formData.append("file", file);
    await mutateAsync(formData);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
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
        accept=".tiny"
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
  );
}
