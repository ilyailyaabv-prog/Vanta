import Link from "next/link";

interface ChartListItem {
  label: string;
  value: string;
  href?: string;
}

interface ChartPlaceholderProps {
  title: string;
  items?: ChartListItem[];
}

export function ChartPlaceholder({ title, items }: ChartPlaceholderProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                >
                  <span className="truncate text-sm text-foreground">
                    {item.label}
                  </span>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    {item.value}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="truncate text-sm text-foreground">
                    {item.label}
                  </span>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available.</p>
        </div>
      )}
    </div>
  );
}