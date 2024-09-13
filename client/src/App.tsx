import { useState } from "react";
import FileUploader from "./components/file-uploader";
import { GraphBatch } from "./types";

export default function App() {
  const [data, setData] = useState<ArrayBuffer>();
  const [isUploading, setIsUploading] = useState(false);
  const [batch, setBatch] = useState<GraphBatch>();
  console.log(data)

  return (
    <FileUploader setData={setData} isUploading={isUploading} showTip />
  );
}
