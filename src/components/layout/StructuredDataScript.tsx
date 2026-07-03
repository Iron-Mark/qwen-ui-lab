interface StructuredDataScriptProps {
  data: { __html: string };
  id?: string;
}

export function StructuredDataScript({
  data,
  id = "structured-data",
}: StructuredDataScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={data}
    />
  );
}
