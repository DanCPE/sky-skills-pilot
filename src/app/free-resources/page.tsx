import { redirect } from "next/navigation";

export default function FreeResourcesRedirectPage() {
  redirect("/news?category=free-resources");
}
