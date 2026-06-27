import { AppNavbar } from "@/components/layout/AppNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      <main className="relative min-h-screen pt-16">{children}</main>
    </>
  );
}