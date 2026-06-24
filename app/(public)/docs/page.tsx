import { redirect } from "next/navigation";

export const metadata = {
  robots: "noindex",
};

export default function DocsPage() {
  redirect("/docs/quickstart");
}