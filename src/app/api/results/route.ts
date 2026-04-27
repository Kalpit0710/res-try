import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildResultExport } from "@/lib/excel";
import { fail, ok, requireAuth } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return fail("Unauthorized", 401);

  const classId = request.nextUrl.searchParams.get("classId") ?? undefined;
  const asExcel = request.nextUrl.searchParams.get("format") === "excel";

  const results = await prisma.result.findMany({
    where: classId ? { classId } : undefined,
    include: {
      class: true,
      student: {
        include: { section: true },
      },
    },
    orderBy: [{ class: { name: "asc" } }, { student: { name: "asc" } }],
  });

  if (asExcel) {
    const buffer = buildResultExport(
      results.map((result) => ({
        admission_number: result.student.admissionNumber,
        student_name: result.student.name,
        class: result.class.name,
        section: result.student.section.name,
        grand_total: result.grandTotal,
        max_total: result.maxTotal,
        percentage: result.percentage,
        grade: result.grade,
      })),
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=results.xlsx",
      },
    });
  }

  return ok(results);
}
