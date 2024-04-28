import { useEffect, useState } from "react";

export const API_URL = process.env.REACT_APP_API_URL as string;
export const WS_URL = process.env.REACT_APP_WS_URL;

export function useFile(fp: string) {
  const [file, setFile] = useState("");
  useEffect(() => {
    const f = async () => {
      const res = await fetch(fp);
      setFile(await res.text());
    };
    f();
  }, []);
  return file;
}
