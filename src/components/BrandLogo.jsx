export const BRAND_LOGO = `${import.meta.env.BASE_URL}images/climoraone-logo.jpg`;
export const BRAND_MARK = `${import.meta.env.BASE_URL}images/climoraone-mark.svg`;

export function BrandLogo({ className = "", compact = false, alt = "Climoraone" }) {
  return (
    <img
      src={compact ? BRAND_MARK : BRAND_LOGO}
      alt={alt}
      className={className}
      decoding="async"
    />
  );
}
