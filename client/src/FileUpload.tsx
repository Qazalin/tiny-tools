import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { GraphData } from "./types";
import { useMutation } from "@tanstack/react-query";

export default function FileUploader({
  setGraph,
}: {
  setGraph: (g: GraphData) => void;
}) {
  const { mutateAsync } = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(
        (process.env.REACT_APP_API_URL as string) + "/upload",
        { method: "POST", body: formData },
      );
      const data: GraphData = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setGraph(data);
    },
  });

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file == null) return;
    const formData = new FormData();
    formData.append("file", file);
    await mutateAsync(formData);
  };

  return (
    <div className="px-4 py-5">
      <label className="p-2 bg-white rounded-md text-black flex items-center w-fit">
        <input
          type="file"
          onChange={handleUpload}
          id="file-upload"
          className="hidden"
        />
        <ArrowDownTrayIcon className="w-4 h-4 stroke-black mr-2 stroke-2" />
        <span>Import</span>
      </label>
    </div>
  );
}
