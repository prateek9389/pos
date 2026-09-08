import { Loader2 } from "lucide-react";

export default function ManagerLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading panel...</p>
    </div>
  );
}
