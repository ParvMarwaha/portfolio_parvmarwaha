import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 px-6 md:px-10">
      <p className="label text-mute">404</p>
      <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-9xl">
        Nothing <em className="font-display italic text-cobalt">here</em>
      </h1>
      <Link href="/" className="label border-b border-ink pb-1" data-cursor="hover">
        Back to the board →
      </Link>
    </main>
  );
}
