export function PageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {title}
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 md:text-base">{description}</p>
    </header>
  )
}
