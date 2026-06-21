interface StructuredDataScriptProps {
  data: { __html: string };
}

export function StructuredDataScript({ data }: StructuredDataScriptProps) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={data}
    />
  );
}
