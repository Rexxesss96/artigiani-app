import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { CompanySidebar } from "@/components/company-sidebar";

// Layout shared by every /company/... page. A layout wraps its pages
// and stays mounted while you move between them: perfect for a menu.
// Users without a company (or logged out) get the page alone, without
// the menu: /company then shows the registration form.

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await createContext();
  const myCompany = ctx.session
    ? await appRouter.createCaller(ctx).companies.getMine()
    : null;

  if (!myCompany) {
    return children;
  }

  return (
    <div className="container-page grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <CompanySidebar />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
