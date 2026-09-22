// Anay's real photo, not a placeholder. Rendered as a square crop with
// object-fit: cover so it fills whatever size it's given cleanly regardless
// of the source image's own aspect ratio.
export default function Avatar({ size = 96 }: { size?: number }) {
  return (
    <img
      src="/avatar.png"
      alt="Anay Baid"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'cover' }}
      loading="lazy"
    />
  )
}
