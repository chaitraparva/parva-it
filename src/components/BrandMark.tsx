/** Parva IT logo mark: a P inside code brackets. Same artwork as public/favicon.svg. */
export default function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M28 18 H16 V82 H28" fill="none" stroke="#C9A44A" strokeWidth="6" />
      <path d="M72 18 H84 V82 H72" fill="none" stroke="#C9A44A" strokeWidth="6" />
      <path fillRule="evenodd" d="M38 26 H54 A14 14 0 0 1 54 54 H48 V74 H38 Z M48 36 H54 A4 4 0 0 1 54 44 H48 Z" fill="#F4EFE4" />
    </svg>
  )
}
