export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-amber-300">
          SkySkills
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-6 text-zinc-600 dark:text-zinc-300">
          SkySkills uses Google sign-in to create and protect user accounts. We
          collect account details provided by Google, such as name, email address,
          profile image, and Google account identifier, to operate the service.
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          We may store practice activity, score history, subscription status, and
          basic usage analytics to provide learning features and improve the
          platform. We do not sell personal information.
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          To request account deletion or privacy support, contact
          skyskills.contact@gmail.com.
        </p>
      </article>
    </main>
  );
}
