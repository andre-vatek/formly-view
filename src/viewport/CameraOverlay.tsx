const Label = ({ text, style }: { text: string; style: React.CSSProperties }) => (
  <span className="ql" style={style}>
    {text}
  </span>
);

/** Quadrant labels and divider lines for the four-up Camera screen. */
export default function CameraOverlay({ fov }: { fov: number }) {
  return (
    <>
      <Label text="Top · Ortho" style={{ left: 8, top: 8 }} />
      <Label
        text={"Perspective · FOV " + fov + "°"}
        style={{ left: "calc(50% + 8px)", top: 8 }}
      />
      <Label
        text="Front · Ortho"
        style={{ left: 8, top: "calc(50% + 8px)" }}
      />
      <Label
        text="Right · Ortho"
        style={{ left: "calc(50% + 8px)", top: "calc(50% + 8px)" }}
      />
      <i className="xl" style={{ left: "50%", top: 0, bottom: 0, width: 1 }} />
      <i className="xl" style={{ top: "50%", left: 0, right: 0, height: 1 }} />
    </>
  );
}
