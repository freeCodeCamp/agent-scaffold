// Shared drag-handle affordance for draggable task items (categorize, order).
export function DragGrip() {
  return (
    <svg className="item-grip" width="8" height="12" viewBox="0 0 8 12" aria-hidden="true" focusable="false">
      <circle cx="1.5" cy="1.5" r="1.2" fill="currentColor" />
      <circle cx="6.5" cy="1.5" r="1.2" fill="currentColor" />
      <circle cx="1.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="6.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="1.5" cy="10.5" r="1.2" fill="currentColor" />
      <circle cx="6.5" cy="10.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
