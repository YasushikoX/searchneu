import { SchedulerWrapper } from "@/components/scheduler/generator/SchedulerWrapper";
import { auth } from "@/lib/auth/auth";
import { getCampuses } from "@/lib/dal/campuses";
import { getNupaths } from "@/lib/dal/nupaths";
import { getTerms } from "@/lib/dal/terms";

import { db, nupathsT, savedPlansT } from "@/lib/db";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    planId: string;
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const params = await searchParams;
  const planId = params.planId ? parseInt(params.planId) : null;

  const isValidPlanId = planId && !isNaN(planId);

  let plan = null;

  if (session?.user?.id && isValidPlanId) {
    try {
      plan = await db.query.savedPlansT.findFirst({
        where: and(
          eq(savedPlansT.id, planId),
          eq(savedPlansT.userId, session.user.id),
        ),
      });
    } catch (error) {
      console.error("Error loading plan:", error);
      return notFound();
    }

    if (!plan) {
      return notFound();
    }
  }

  // Fetch available NUPath options
  const nupathOptions = await db
    .selectDistinct({ short: nupathsT.short, name: nupathsT.name })
    .from(nupathsT)
    .then((c) => c.map((e) => ({ label: e.name, value: e.short })));

  // Fetch terms from the db
  const terms = await getTerms();

  // Fetch campuses for the mapping
  const campuses = await getCampuses();

  // Fetch nupaths for the mapping
  const nupaths = await getNupaths();

  return (
    <div className="bg-secondary h-full w-full px-4 pt-4 xl:px-6">
      <SchedulerWrapper
        nupathOptions={nupathOptions}
        terms={terms}
        campuses={campuses}
        nupaths={nupaths}
        isLoggedIn={session?.user?.id ? true : false}
      />
    </div>
  );
}
