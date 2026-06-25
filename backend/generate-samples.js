const docx = require('docx');
const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, PageBreak,
} = docx;

function createBullet(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 720 },
    children: [
      new TextRun({ text: '•  ', font: 'Calibri', size: 22 }),
      new TextRun({ text, font: 'Calibri', size: 22 }),
    ],
  });
}

function createSection(title) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: title, bold: true, font: 'Calibri', size: 24, color: '1F4E79' }),
    ],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79' },
    },
  });
}

function createText(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text, font: 'Calibri', size: 22, ...opts }),
    ],
  });
}

function createSubText(left, right) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: left, bold: true, font: 'Calibri', size: 22 }),
      new TextRun({ text: `    ${right}`, font: 'Calibri', size: 20, color: '666666', italics: true }),
    ],
  });
}

// ====== Resume 1: Full Stack Developer (strong, high ATS) ======
const resume1 = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'ALEX JOHNSON', bold: true, font: 'Calibri', size: 32, color: '1F4E79' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'alex.johnson@email.com  |  (555) 123-4567  |  linkedin.com/in/alexjohnson', font: 'Calibri', size: 20, color: '444444' }),
        ],
      }),
      new Paragraph({ spacing: { after: 100 }, children: [] }),

      createSection('Professional Summary'),
      createText('Full Stack Developer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, TypeScript, and cloud services. Led cross-functional teams to deliver high-impact products. Strong problem-solving skills with a focus on performance optimization and clean architecture.'),

      createSection('Technical Skills'),
      createText('Languages: TypeScript, JavaScript, Python, SQL'),
      createText('Frontend: React, Redux, Next.js, HTML5, CSS3, Tailwind CSS'),
      createText('Backend: Node.js, Express, NestJS, PostgreSQL, MongoDB'),
      createText('Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD'),
      createText('Tools: Git, Jira, Figma, Jest, Cypress'),

      createSection('Work Experience'),
      createSubText('Senior Full Stack Developer', 'TechCorp Inc. | Jan 2022 – Present'),
      createBullet('Architected and built a microservices-based platform serving 500K+ users, improving response times by 40%'),
      createBullet('Implemented CI/CD pipelines using Docker and Kubernetes, reducing deployment time by 60%'),
      createBullet('Led a team of 4 developers, conducting code reviews and mentoring junior engineers'),
      createBullet('Optimized database queries, reducing API latency by 35% and improving overall system performance'),

      createSubText('Full Stack Developer', 'StartupXYZ | Mar 2019 – Dec 2021'),
      createBullet('Developed a React-based SaaS platform with real-time collaboration features using WebSockets'),
      createBullet('Designed and implemented RESTful APIs with Node.js and Express, serving 100K+ daily requests'),
      createBullet('Integrated AWS S3 and Lambda for scalable file processing and storage solutions'),
      createBullet('Reduced bug count by 50% through comprehensive unit and integration testing with Jest'),

      createSection('Education'),
      createText('B.S. in Computer Science, University of Technology – 2018'),

      createSection('Projects'),
      createBullet('E-Commerce Platform: Built a full-stack e-commerce app with React, Node.js, Stripe, and PostgreSQL'),
      createBullet('Real-Time Chat Application: Developed a WebSocket-based chat app with Redis and Docker'),
    ],
  }],
});

// ====== Resume 2: Data Scientist (medium ATS) ======
const resume2 = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'SARAH CHEN', bold: true, font: 'Calibri', size: 32, color: '1F4E79' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'sarah.chen@email.com  |  linkedin.com/in/sarachen', font: 'Calibri', size: 20, color: '444444' }),
        ],
      }),
      new Paragraph({ spacing: { after: 100 }, children: [] }),

      createSection('Professional Summary'),
      createText('Data Scientist skilled in Python, machine learning, and data analysis. Experienced in building predictive models and deriving insights from complex datasets.'),

      createSection('Technical Skills'),
      createText('Languages: Python, R, SQL'),
      createText('ML Frameworks: TensorFlow, PyTorch, Scikit-learn'),
      createText('Data Tools: Pandas, NumPy, Jupyter, Tableau'),
      createText('Cloud: AWS, GCP'),

      createSection('Work Experience'),
      createSubText('Data Scientist', 'DataDrive Analytics | Jun 2020 – Present'),
      createBullet('Developed machine learning models for customer churn prediction, improving retention by 25%'),
      createBullet('Built ETL pipelines processing 10GB+ of daily data using Python and Apache Airflow'),
      createBullet('Created interactive dashboards in Tableau for executive reporting'),
      createBullet('Collaborated with product teams to define KPIs and implement A/B testing frameworks'),

      createSubText('Junior Data Analyst', 'Insights Lab | Aug 2018 – May 2020'),
      createBullet('Analyzed customer behavior data to identify trends and provide actionable recommendations'),
      createBullet('Automated weekly reporting processes using Python scripts, saving 10 hours per week'),

      createSection('Education'),
      createText('M.S. in Data Science, Stanford University – 2020'),
      createText('B.S. in Statistics, UC Berkeley – 2018'),
    ],
  }],
});

// ====== Resume 3: Entry Level (weak, low ATS) ======
const resume3 = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'JAKE MILLER', bold: true, font: 'Calibri', size: 32, color: '1F4E79' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'jake.miller@email.com', font: 'Calibri', size: 20, color: '444444' }),
        ],
      }),
      new Paragraph({ spacing: { after: 100 }, children: [] }),

      createSection('Objective'),
      createText('Looking for a job in web development where I can use my skills and learn new things.'),

      createSection('Skills'),
      createText('HTML, CSS, JavaScript, Python, Java'),

      createSection('Projects'),
      createBullet('Built a personal portfolio website using HTML and CSS'),
      createBullet('Created a calculator app with JavaScript'),
      createBullet('Made a to-do list app as a college project'),

      createSection('Education'),
      createText('B.S. in Computer Science, State University – 2024'),
    ],
  }],
});

// ====== Job Description file ======
const jobDescription = `Senior Full Stack Developer

We are looking for an experienced Full Stack Developer to join our growing engineering team. You will be responsible for building and maintaining scalable web applications used by millions of users.

Required Skills:
- Strong proficiency in TypeScript, React, and Node.js
- Experience with AWS cloud services (EC2, S3, Lambda, RDS)
- Docker and Kubernetes for container orchestration
- PostgreSQL or similar relational databases
- Experience building RESTful APIs and microservices
- CI/CD pipelines and automated testing

Nice to Have:
- Experience with Next.js and server-side rendering
- GraphQL API development
- Redis caching
- Python scripting

Responsibilities:
- Design and implement new features across the full stack
- Optimize application performance and scalability
- Participate in code reviews and mentor junior developers
- Collaborate with product and design teams
- Write comprehensive unit and integration tests

Qualifications:
- 3+ years of experience in full stack development
- Strong problem-solving and communication skills
- Bachelor's degree in Computer Science or related field`;

const outDir = 'F:\\gayathri\\resume-analyzer\\samples';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const buffer1 = await Packer.toBuffer(resume1);
  fs.writeFileSync(path.join(outDir, 'Alex_Johnson_Resume.docx'), buffer1);
  console.log('Created: Alex_Johnson_Resume.docx');

  const buffer2 = await Packer.toBuffer(resume2);
  fs.writeFileSync(path.join(outDir, 'Sarah_Chen_Resume.docx'), buffer2);
  console.log('Created: Sarah_Chen_Resume.docx');

  const buffer3 = await Packer.toBuffer(resume3);
  fs.writeFileSync(path.join(outDir, 'Jake_Miller_Resume.docx'), buffer3);
  console.log('Created: Jake_Miller_Resume.docx');

  fs.writeFileSync(path.join(outDir, 'Job_Description.txt'), jobDescription);
  console.log('Created: Job_Description.txt');

  console.log('\nAll sample files saved to:', outDir);
}

main().catch(console.error);
