import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";

export async function POST() {
  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Payment gateway is not configured yet.",
      prepared: true,
      nextStep:
        "Connect Stripe, Omise, or another provider here and store provider references in account_payment_intents/account_subscriptions.",
    },
    { status: 501 },
  );
}
