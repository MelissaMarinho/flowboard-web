export default function LabelBadge({
  name,
  color,
  onRemove,
}: {
  name: string;
  color: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full hover:opacity-70 transition-opacity leading-none"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
