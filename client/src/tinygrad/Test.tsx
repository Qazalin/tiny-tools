import { useEffect, useState } from "react";

export default function TestLoader() {
  const files = ["schedule", "uops", "main"];
  const [loaders, setLoaders] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetch_file(fp: string) {
      const res = await fetch(`/python/${fp}.py`);
      const txt = await res.text();
      setLoaders((prev) => ({ ...prev, [fp]: txt }));
    }
    files.map(fetch_file);
  }, []);

  useEffect(() => {
    console.log(loaders);
  }, [loaders]);

  return <div>hi</div>;
}
