"use client";

import Image from "next/image";

type Plan = {
  name: string;
  price: number | string;
  period?: string;
  description: string;
  buttonLabel: string;
  features: string[];
  validFor?: string;
  isPopular?: boolean;
  checkIcon: string;
  mainIcon: string;
};

const plans: Plan[] = [
  {
    name: "Basic",
    price: 0,
    period: "/mo",
    description: "Essential foundations for new student pilots.",
    buttonLabel: "Current Plan",
    features: ["Access to 3 tests only"],
    checkIcon: "/images/icons/Subscription/Grey.png",
    mainIcon: "/images/icons/Subscription/Seat.png",
  },
  {
    name: "Standard",
    price: 299,
    period: "/mo",
    description: "Increase your altitude with more resources.",
    buttonLabel: "Upgrade to Standard",
    features: [
      "Full access to all Sky Quests",
      "Unlimited access to all tests",
      "Access to Mock Tests",
      "Skills Dashboard",
    ],
    validFor: "Valid for 1 month",
    checkIcon: "/images/icons/Subscription/purple.png",
    mainIcon: "/images/icons/Subscription/takeoff.png",
  },
  {
    name: "Pro",
    price: 1299,
    period: "/6mo",
    description: "Full throttle for professional certifications.",
    buttonLabel: "Upgrade to Pro",
    features: [
      "Full access to all Sky Quests",
      "Unlimited access to all tests",
      "Access to Mock Tests",
      "Skills Dashboard",
    ],
    validFor: "Valid for 6 months",
    checkIcon: "/images/icons/Subscription/purple.png",
    mainIcon: "/images/icons/Subscription/landing.png",
  },
  {
    name: "Prime",
    price: 1499,
    period: "/yr",
    description: "The ultimate package for aspiring captains.",
    buttonLabel: "Upgrade to Prime",
    isPopular: true,
    features: [
      "Full access to all Sky Quests",
      "Unlimited access to all tests",
      "Access to Mock Tests",
      "Skills Dashboard",
    ],
    validFor: "Valid for 1 year",
    checkIcon: "/images/icons/Subscription/yellow.png",
    mainIcon: "/images/icons/Subscription/Star.png",
  },
];

const faqs = [
  "Can I cancel my subscription anytime?",
  "Is the question bank updated for 2024?",
  "Do you offer refunds?",
  "Can I switch from monthly to annual later?",
];

export default function SubscriptionPage() {
  return (
    <div
      className="min-h-screen bg-[#fafafa] text-zinc-900 pb-32"
      style={{ "--font-scale": 1 } as React.CSSProperties}
    >
      {/* Hero Banner Section */}
      <section className="relative w-full h-[380px] md:h-[450px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/backgrounds/home.png"
            alt="Cockpit Background"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-violet-950/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fafafa] opacity-90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 -mt-10">
          <div className="mb-6 inline-flex border border-white/20 rounded-full bg-black/40 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm">
            Subscription
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-space-grotesk)] font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Master the Skills That <br className="hidden md:block" />
            Matter with <span className="text-yellow-400">SkySkills</span>
          </h1>
          <p className="mt-0.5 text-sm md:text-base text-violet-200 font-medium">
            designed to <span className="text-white">support</span> every step
            of your aviation aptitude preparation.
          </p>
        </div>
      </section>

      {/* Pricing Grid Section */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 lg:px-8 -mt-24 md:-mt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{ "--font-scale": 1.2 } as React.CSSProperties}
              className={`relative flex flex-col rounded-2xl p-6 pt-8 transition-transform hover:-translate-y-2 shadow-xl ${
                plan.isPopular
                  ? "bg-[#2b253b] text-white border-2 border-yellow-400 shadow-yellow-900/20"
                  : "bg-white text-zinc-900 border border-zinc-200 shadow-zinc-200/50"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-[-2px] right-[-2px] bg-yellow-400 text-violet-900 px-4 py-1.5 rounded-tr-[14px] rounded-bl-xl text-[10px] font-bold uppercase tracking-wider z-10 border-b-2 border-l-2 border-[#1c182d]">
                  Recommended
                </div>
              )}

              {/* Plan Icon */}
              <div
                className={`relative w-12 h-12 mb-6 rounded-xl flex items-center justify-center ${
                  plan.name === "Standard" || plan.name === "Pro"
                    ? "bg-violet-100"
                    : plan.isPopular
                      ? "bg-yellow-400"
                      : "bg-zinc-100/80"
                }`}
              >
                <Image
                  src={plan.mainIcon}
                  alt={`${plan.name} icon`}
                  fill
                  className="object-contain p-2"
                />
              </div>

              {/* Tier Details */}
              <h3 className="text-lg font-bold mb-1 font-[family-name:var(--font-space-grotesk)]">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-[family-name:var(--font-space-grotesk)] font-bold">
                  ฿{plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-xs font-medium font-[family-name:var(--font-space-grotesk)] ${plan.isPopular ? "text-zinc-400" : "text-zinc-500"}`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              <p
                className={`text-[13px] leading-relaxed min-h-[40px] font-[family-name:var(--font-space-grotesk)] ${plan.isPopular ? "text-violet-200" : "text-zinc-500"}`}
              >
                {plan.description}
              </p>

              {/* CTA Button */}
              <button
                className={`mt-6 w-full rounded-xl py-3 text-sm font-bold transition-colors font-[family-name:var(--font-space-grotesk)] ${
                  plan.isPopular
                    ? "bg-yellow-400 text-zinc-900 hover:bg-yellow-300 shadow-yellow-400/20 shadow-lg"
                    : plan.name === "Basic"
                      ? "bg-zinc-100 text-zinc-500 cursor-default"
                      : "bg-white border-2 border-violet-700 text-violet-800 hover:bg-violet-50"
                }`}
              >
                {plan.buttonLabel}
              </button>

              <hr
                className={`my-6 ${plan.isPopular ? "border-white/10" : "border-zinc-100"}`}
              />

              {/* Features List */}
              <ul className="flex-1 space-y-4 font-[family-name:var(--font-space-grotesk)]">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex flex-col gap-1">
                    <div className="flex items-start gap-2 text-xs font-semibold">
                      <span className="relative w-4 h-4 flex-shrink-0 mt-0.5">
                        <Image
                          src={plan.checkIcon}
                          alt="check"
                          fill
                          className="object-contain"
                        />
                      </span>
                      <span
                        className={
                          plan.isPopular
                            ? "text-white"
                            : plan.name === "Basic"
                              ? "text-zinc-500"
                              : "text-zinc-700"
                        }
                      >
                        {feature}
                      </span>
                    </div>
                    {feature === "Skills Dashboard" && (
                      <span
                        className={`text-[11px] ml-6 leading-relaxed ${plan.isPopular ? "text-violet-300" : "text-zinc-400"}`}
                      >
                        compare, and analyze your scores to identify strengths
                        and areas for improvement
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* Validity Footer */}
              {plan.validFor ? (
                <div className="mt-8 flex items-center gap-2 text-xs font-bold font-[family-name:var(--font-space-grotesk)]">
                  <span className="relative w-4 h-4 flex-shrink-0">
                    <Image
                      src={plan.checkIcon}
                      alt="check"
                      fill
                      className="object-contain"
                    />
                  </span>
                  <span
                    className={
                      plan.isPopular ? "text-yellow-400" : "text-violet-800"
                    }
                  >
                    {plan.validFor}
                  </span>
                </div>
              ) : (
                <div className="mt-8 flex items-center gap-2 text-xs font-medium text-zinc-400 font-[family-name:var(--font-space-grotesk)]">
                  <span className="relative w-4 h-4 flex-shrink-0 grayscale opacity-70">
                    <Image
                      src={plan.checkIcon}
                      alt="check"
                      fill
                      className="object-contain"
                    />
                  </span>
                  <span className="text-zinc-400">No expiry</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-6 mt-32">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-500 font-medium">
            Everything you need to know about billing and subscriptions.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-white rounded-xl border border-zinc-200 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-6 text-sm font-bold text-zinc-900">
                {faq}
                <span className="transition duration-300 group-open:-rotate-180 text-zinc-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-sm text-zinc-500">
                Detailed answer for "{faq}" would go here. This provides the
                necessary information for the user regarding their subscription
                query.
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
