export default function PanelHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pad row" style={{ gap: 10 }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "linear-gradient(#7c5cff,#452db3)",
        }}
      />
      <div className="grow">
        <div className="h">{title}</div>
        <div className="mute" style={{ fontSize: 11 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
