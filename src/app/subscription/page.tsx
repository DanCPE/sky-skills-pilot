export default function SubscriptionPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      features: [
        "Access to all topics",
        "Basic exercises",
        "Progress tracking",
      ],
    },
    {
      name: "Premium",
      price: "$9.99/mo",
      features: [
        "Everything in Free",
        "Advanced exercises",
        "Detailed analytics",
        "Ad-free experience",
        "Priority support",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Contact us",
      features: [
        "Everything in Premium",
        "Custom exercises",
        "Team management",
        "API access",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            Choose the plan that fits your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-50 dark:bg-zinc-50"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <h3
                className={`text-xl font-bold ${
                  plan.highlighted
                    ? "text-white dark:text-zinc-900"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`mt-4 text-3xl font-bold ${
                  plan.highlighted
                    ? "text-white dark:text-zinc-900"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {plan.price}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2 text-sm ${
                      plan.highlighted
                        ? "text-zinc-100 dark:text-zinc-800"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span className="mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-full py-3 font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
