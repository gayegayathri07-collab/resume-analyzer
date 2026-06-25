from io import BytesIO
from fpdf import FPDF
from app.models.schemas import ResumeAnalysis


class Report(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(108, 92, 231)
        self.cell(0, 12, "AI Resume Analyzer - Report", align="C", new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(144, 149, 168)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(30, 30, 40)
        self.ln(4)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 210)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def score_block(self, label: str, score: float):
        self.set_font("Helvetica", "B", 28)
        color = (0, 206, 201) if score >= 70 else (253, 203, 110) if score >= 40 else (225, 112, 85)
        self.set_text_color(*color)
        self.cell(0, 16, f"{round(score)}", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(144, 149, 168)
        self.cell(0, 6, label, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def breakdown_table(self, breakdown: dict[str, float]):
        self.set_font("Helvetica", "B", 10)
        self.set_fill_color(26, 29, 40)
        self.set_text_color(228, 230, 240)
        for key, val in breakdown.items():
            label = key.replace("_", " ").title()
            self.set_font("Helvetica", "", 10)
            self.cell(90, 8, f"  {label}", new_x="RIGHT", new_y="TOP")
            self.set_font("Helvetica", "B", 10)
            vcolor = (0, 206, 201) if val >= 70 else (253, 203, 110) if val >= 40 else (225, 112, 85)
            self.set_text_color(*vcolor)
            self.cell(0, 8, f"{round(val)}", new_x="LMARGIN", new_y="NEXT")
            self.set_text_color(228, 230, 240)
        self.ln(4)

    def suggestions_block(self, suggestions: list[str]):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(144, 149, 168)
        for s in suggestions:
            self.cell(5)
            self.multi_cell(0, 6, f"- {s}")
            self.ln(1)

    def skills_block(self, skills: list):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 80)
        for s in skills:
            prof = f" ({s.proficiency})" if s.proficiency else ""
            self.cell(5)
            self.cell(0, 7, f"{s.name}{prof}", new_x="LMARGIN", new_y="NEXT")

    def experience_block(self, exp_list: list):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 80)
        for e in exp_list:
            self.set_font("Helvetica", "B", 10)
            self.cell(5)
            self.cell(0, 7, f"{e.role} @ {e.company}", new_x="LMARGIN", new_y="NEXT")
            self.set_font("Helvetica", "I", 9)
            self.set_text_color(144, 149, 168)
            self.cell(10)
            self.cell(0, 6, e.duration, new_x="LMARGIN", new_y="NEXT")
            self.set_text_color(60, 60, 80)
            self.set_font("Helvetica", "", 9)
            for d in e.description:
                self.cell(15)
                self.multi_cell(0, 5, f"- {d}")
            self.ln(2)

    def education_block(self, edu_list: list):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 80)
        for e in edu_list:
            self.set_font("Helvetica", "B", 10)
            self.cell(5)
            self.cell(0, 7, f"{e.degree} in {e.field}", new_x="LMARGIN", new_y="NEXT")
            self.set_font("Helvetica", "", 9)
            self.set_text_color(144, 149, 168)
            self.cell(10)
            year_str = f" ({e.year})" if e.year else ""
            self.cell(0, 6, f"{e.institution}{year_str}", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)


def generate_analysis_pdf(analysis: ResumeAnalysis) -> BytesIO:
    pdf = Report()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.score_block("ATS Score", analysis.ats_score.score)
    pdf.breakdown_table(analysis.ats_score.breakdown)

    pdf.section_title("Suggestions")
    pdf.suggestions_block(analysis.ats_score.suggestions)
    pdf.ln(4)

    if analysis.skills:
        pdf.section_title("Skills")
        pdf.skills_block(analysis.skills)

    if analysis.experience:
        pdf.section_title("Experience")
        pdf.experience_block(analysis.experience)

    if analysis.education:
        pdf.section_title("Education")
        pdf.education_block(analysis.education)

    buf = BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf
