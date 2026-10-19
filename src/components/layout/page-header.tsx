export function PageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="mb-3">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
        {title}
      </h1>
      <p className="mt-0.5 max-w-3xl text-sm text-slate-600">{description}</p>
    </header>
  )
}
