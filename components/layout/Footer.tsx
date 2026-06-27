import Link from "next/link";
import { VexaroWordmark } from "@/components/ui/vexaro-mark";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border px-5 md:px-12 py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="mb-2">
            <VexaroWordmark markSize={22} textSize="text-sm" />
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Quorel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}