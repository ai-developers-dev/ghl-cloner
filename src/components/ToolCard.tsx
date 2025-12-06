import Link from 'next/link';

interface ToolCardProps {
  icon: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  href?: string;
}

export default function ToolCard({ icon, title, description, status, href = '#' }: ToolCardProps) {
  const isAvailable = status === 'available';

  const cardContent = (
    <div
      className={`relative rounded-xl p-6 h-full transition-all ${
        isAvailable
          ? 'bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer'
          : 'bg-slate-900/50 border border-slate-800/50'
      }`}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {isAvailable ? (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
            Available Now
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-800 text-slate-500 text-xs font-semibold rounded-full">
            Coming Soon
          </span>
        )}
      </div>

      {/* Icon */}
      <div
        className={`text-4xl mb-4 ${isAvailable ? '' : 'opacity-50 grayscale'}`}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-xl mb-2 ${
          isAvailable ? 'text-white' : 'text-slate-500'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`text-sm mb-6 ${
          isAvailable ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {description}
      </p>

      {/* CTA Button */}
      {isAvailable && (
        <div className="mt-auto">
          <span className="inline-flex items-center gap-2 text-emerald-400 font-medium text-sm group-hover:gap-3 transition-all">
            Try Now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );

  if (isAvailable) {
    return (
      <Link href={href} className="group block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
