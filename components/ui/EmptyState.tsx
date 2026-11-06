import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  illustration?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-line bg-subtle px-6 py-12 text-center">
      {illustration ? (
        <div className="mb-5 w-40 sm:w-48">{illustration}</div>
      ) : (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-pine">
          {icon}
        </div>
      )}
      <h3 className="heading-4">{title}</h3>
      <p className="body-sm mt-1.5 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
