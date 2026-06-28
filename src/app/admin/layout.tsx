import { redirect } from "next/navigation";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { getCurrentAdminAccountUser } from "@/lib/account/admin";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminUser = await getCurrentAdminAccountUser();
  if (!adminUser) redirect("/");

  return (
    <>
      <AdminNavbar />
      {children}
    </>
  );
}
