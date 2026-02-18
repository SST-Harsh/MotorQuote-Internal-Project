import MuiSkeleton from '@mui/material/Skeleton';

/**
 * Skeleton Loading Component
 * Provides loading placeholders using MUI Skeleton
 */

const Skeleton = ({
  width,
  height,
  className = '',
  variant = 'text', // text, circular, rectangular, rounded
  animation = 'pulse', // pulse, wave, none
  ...props
}) => {
  // Map 'none' to false for MUI
  const muiAnimation = animation === 'none' ? false : animation;

  return (
    <MuiSkeleton
      width={width}
      height={height}
      variant={variant}
      animation={muiAnimation}
      className={className}
      {...props}
    />
  );
};

/**
 * Skeleton for text lines
 */
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '80%' : '100%'} height="16px" />
      ))}
    </div>
  );
};

/**
 * Skeleton for avatar
 */
export const SkeletonAvatar = ({ size = 40, className = '' }) => {
  return (
    <Skeleton variant="circular" width={`${size}px`} height={`${size}px`} className={className} />
  );
};

/**
 * Skeleton for card
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-4 border border-[rgb(var(--color-border))] rounded-lg ${className}`}>
      <Skeleton height="200px" className="mb-4" />
      <Skeleton height="24px" width="60%" className="mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
};

/**
 * Skeleton for table row
 */
export const SkeletonTableRow = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background-muted))] transition-colors">
      {/* First Column: Avatar + Name/Email style */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-1">
            <Skeleton height={20} width="120px" />
            <Skeleton height={14} width="80px" />
          </div>
        </div>
      </td>

      {/* Middle Columns */}
      {Array.from({ length: columns - 2 }).map((_, index) => (
        <td key={index} className="px-6 py-4 hidden md:table-cell">
          <Skeleton height={20} width={`${Math.floor(Math.random() * 40 + 40)}%`} />
        </td>
      ))}

      {/* Last Column: Actions/Status */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Skeleton variant="rounded" width={30} height={30} />
          <Skeleton variant="rounded" width={30} height={30} />
        </div>
      </td>
    </tr>
  );
};

/**
 * Skeleton for table
 */
export const SkeletonTable = ({ rows = 5, columns = 5, className = '' }) => {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-sm ${className}`}
    >
      <table className="w-full border-collapse">
        <thead className="bg-[rgb(var(--color-background-muted))] border-b border-[rgb(var(--color-border))]">
          <tr>
            <th className="px-6 py-4 text-left w-1/3">
              <Skeleton height={20} width="40%" />
            </th>
            {Array.from({ length: columns - 2 }).map((_, index) => (
              <th key={index} className="px-6 py-4 text-left hidden md:table-cell">
                <Skeleton height={20} width="60%" />
              </th>
            ))}
            <th className="px-6 py-4 text-right w-24">
              <Skeleton height={20} width="100%" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--color-border))]">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Skeleton for form
 */
export const SkeletonForm = ({ fields = 4, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton height="14px" width="100px" className="mb-2" />
          <Skeleton height="40px" />
        </div>
      ))}
      <Skeleton height="44px" width="120px" className="mt-6" />
    </div>
  );
};

export default Skeleton;
