import PDFDocument from "pdfkit";

type ReportContext = {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  classTeacherName: string;
  principalName: string;
  rows: Array<{ subject: string; half: number; final: number; total: number }>;
  grandTotal: number;
  maxTotal: number;
  percentage: number;
  grade: string;
};

export function generateReportPdf(input: ReportContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(input.schoolName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text("Report Card", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Student: ${input.studentName}`);
    doc.text(`Admission Number: ${input.admissionNumber}`);
    doc.text(`Class/Section: ${input.className} - ${input.sectionName}`);
    doc.moveDown();

    doc.fontSize(11).text("Subject                Half-Yearly      Final Term      Total");
    doc.moveDown(0.3);

    for (const row of input.rows) {
      const line = `${row.subject.padEnd(22)} ${String(row.half).padEnd(15)} ${String(row.final).padEnd(15)} ${row.total}`;
      doc.text(line);
    }

    doc.moveDown();
    doc.text(`Grand Total: ${input.grandTotal} / ${input.maxTotal}`);
    doc.text(`Percentage: ${input.percentage}%`);
    doc.text(`Final Grade: ${input.grade}`);
    doc.moveDown(2);

    doc.text(`Class Teacher: ${input.classTeacherName}`);
    doc.text(`Principal: ${input.principalName}`);

    doc.end();
  });
}
