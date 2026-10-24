type Props = {
  stock: Record<string, number>;
  selected: string | null;
  onSelect: (size: string) => void;
};

export default function SizeSelector({ stock, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(stock).map(([size, qty]) => {
        const soldOut = qty === 0;
        const isSelected = selected === size;

        return (
          <button
            key={size}
            type="button"
            disabled={soldOut}
            onClick={() => onSelect(size)}
            className={`h-12 w-14 rounded-lg border text-sm font-semibold transition
              ${isSelected ? "border-lime-400 bg-lime-400 text-zinc-950" : "border-white/20 hover:border-lime-400"}
              ${soldOut ? "cursor-not-allowed text-zinc-600 line-through opacity-40 hover:border-white/20" : ""}`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}