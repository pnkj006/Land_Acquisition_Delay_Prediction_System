import logo from '../../assets/images/logo.png'

/**
 * Faint "security paper" watermark rendered behind the main page content.
 * - Absolutely positioned behind everything (z-0); real content sits at z-10.
 * - pointer-events-none so it never intercepts clicks.
 * - opacity 0.05 (within the 0.04–0.08 accessibility-safe band).
 * - Single large image (~520px), centered, never tiled.
 */
export default function WatermarkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
    >
      <img
        src={logo}
        alt=""
        draggable={false}
        className="w-[520px] max-w-[85vw] select-none opacity-[0.05]"
      />
    </div>
  )
}
