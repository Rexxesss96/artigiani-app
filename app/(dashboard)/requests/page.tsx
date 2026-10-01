import { redirect } from "next/navigation";

// The old "My requests" page is now "My jobs": keep old links working.
export default function OldRequestsPage() {
  redirect("/jobs");
}
