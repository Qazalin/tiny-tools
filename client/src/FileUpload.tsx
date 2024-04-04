import React, { useState } from "react";
import { GraphData } from "./types";

export default function FileUploader({
  setGraph,
}: {
  setGraph: (g: GraphData) => void;
}) {
  const [file, setFile] = useState(null);

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };
  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          (process.env.REACT_APP_API_URL as string) + "/upload",
          { method: "POST", body: formData },
        );
        const data: GraphData = await res.json();
        setGraph(data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
