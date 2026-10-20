export default function StatCard({ icon: Icon, title, value, detail }) {
  return (
    <article className="surface stat-card">
      <div className="stat-card-top">
        <span className="stat-icon">{Icon && <Icon size={17} strokeWidth={1.8} aria-hidden="true" />}</span>
        <span className="stat-title">{title}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
      <style>{`
        .stat-card { min-width: 0; min-height: 151px; padding: 17px 18px 16px; }
        .stat-card-top { display: flex; align-items: center; gap: 9px; }
        .stat-icon { display: grid; width: 29px; height: 29px; place-items: center; border-radius: 9px; background: var(--accent-soft); color: var(--accent); }
        .stat-title { color: #9aaab3; font-size: .76rem; font-weight: 550; line-height: 1.35; }
        .stat-value { overflow: hidden; margin: 18px 0 7px; color: #edf4f6; font-size: clamp(1.45rem,2.3vw,2rem); font-weight: 650; letter-spacing: -.05em; text-overflow: ellipsis; white-space: nowrap; }
        .stat-detail { margin: 0; color: #778892; font-size: .7rem; line-height: 1.45; }
      `}</style>
    </article>
  );
}
