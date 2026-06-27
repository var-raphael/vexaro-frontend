// hooks/useRedirectToDashboard.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRedirectToDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
}