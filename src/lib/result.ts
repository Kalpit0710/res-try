import { prisma } from "@/lib/prisma";
import { resolveGrade } from "@/lib/grade";

export async function recomputeStudentResult(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          subjects: {
            include: { subject: true },
          },
        },
      },
      marks: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const subjectCount = student.class.subjects.length;
  const maxTotal = subjectCount * 200;
  const grandTotal = student.marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
  const percentage = maxTotal === 0 ? 0 : Number(((grandTotal / maxTotal) * 100).toFixed(2));

  const ranges = await prisma.gradeRange.findMany({ orderBy: { min: "asc" } });
  const grade = resolveGrade(percentage, ranges);

  const result = await prisma.result.upsert({
    where: {
      studentId_classId: {
        studentId,
        classId: student.classId,
      },
    },
    update: {
      grandTotal,
      maxTotal,
      percentage,
      grade,
    },
    create: {
      studentId,
      classId: student.classId,
      grandTotal,
      maxTotal,
      percentage,
      grade,
    },
  });

  return {
    result,
    subjectCount,
  };
}
