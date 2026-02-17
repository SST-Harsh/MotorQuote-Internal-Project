import Image from 'next/image';

const ActivityFeed = ({ items = [] }) => (
  <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-5 py-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <p className="text-lg font-semibold text-[rgb(var(--color-text))]">Recent Activity</p>
      <button type="button" className="text-sm font-medium text-primary hover:text-primary-dark">
        See all
      </button>
    </div>
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="relative h-10 w-10">
            <Image
              src={item.avatar}
              alt={item.name}
              fill
              className="rounded-full object-cover"
              sizes="40px"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[rgb(var(--color-text))]">
              {item.name}{' '}
              <span className="font-normal text-[rgb(var(--color-text-muted))]">
                {item.action}{' '}
                <span className="text-[rgb(var(--color-primary))] font-semibold">
                  {item.subject}
                </span>
              </span>
            </p>
            <p className="text-xs text-[rgb(var(--color-text-muted))]">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
