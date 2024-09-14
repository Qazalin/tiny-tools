import classNames from "classnames";
import { Dispatch, SetStateAction, useEffect } from "react";

type PageSelectorProps = {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
};
export default function PageSelector({ page, setPage, total }: PageSelectorProps) {
  function handleSpace(e: KeyboardEvent) {
    if (e.key === " ") {
      setPage((i) => (i + 1 === total ? 0 : i + 1));
    }
  }
  useEffect(() => {
    document.addEventListener("keydown", handleSpace, false);
    return () => {
      document.removeEventListener("keydown", handleSpace, false);
    };
  }, []);

  return (
    <div>
      {new Array(total).fill(0).map((_, i) => {
        return (
          <p key={i} className={classNames("text-xl cursor-pointer", i === page ? "text-gray-50" : "text-gray-500")} onClick={() => setPage(i)}>
            {i}
          </p>
        );
      })}
    </div>
  );
}
