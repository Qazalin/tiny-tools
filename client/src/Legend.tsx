export default function Legend() {
  return (
    <div className="rounded-md p-2 space-y-3 flex flex-col w-fit">
      {[
        ["Reduce", "red"],
        ["Expand", "blue"],
        ["Assign", "yellow"],
        ["Multi output", "green"],
      ].map((x, i) => (
        <div
          className="flex space-x-2 items-center w-full justify-between"
          key={i}
        >
          <p className="text-base">{x[0]}</p>
          <div className="w-5 h-5 rounded-full" style={{ background: x[1] }} />
        </div>
      ))}
    </div>
  );
}
