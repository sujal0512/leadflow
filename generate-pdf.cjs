const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('public/LeadHero_Documentation.pdf'));

doc.fontSize(20).text('LeadHero: Intelligent Pipeline for High-Velocity Sales Teams', { align: 'center' });
doc.moveDown();

doc.fontSize(16).text('1. Introduction and Use of the Project');
doc.fontSize(12).text(`LeadHero is a robust, full-stack CRM (Customer Relationship Management) and Lead Pipeline tool. It is designed to help sales teams manage their leads, track communication, and visualize their sales pipeline in an intuitive interface.

With recent updates, the platform serves as a highly adaptable data analysis tool. It can ingest any dataset via CSV, dynamically create columns based on the imported headers, and adjust its status stages to match the incoming data.

Primary Uses:
- Sales Pipeline Management: Track leads from initial contact to closed deals.
- Dynamic Data Analysis: Import any CSV dataset and instantly visualize it in an adaptable table or Kanban board.
- Team Collaboration: Role-based access control (Admin vs. Member) allowing teams to collaborate securely.`);
doc.moveDown();

doc.fontSize(16).text('2. Technologies Used');
doc.fontSize(12).text(`- Frontend Framework: React 18 with TypeScript.
- Build Tool: Vite for blazing-fast development and optimized production builds.
- Styling: Tailwind CSS for modern, responsive, and maintainable styling.
- Icons & UI Elements: Lucide React for consistent iconography.
- Data Visualization: Recharts for rendering analytics and pipeline statistics.
- Backend Server: Express.js (Node.js) handling REST API requests.
- Database / Storage: In-memory TypeScript data store (designed for fast prototyping and preview, easily swappable with a database like PostgreSQL or Firebase).
- Authentication: Custom token-based auth with secure login/signup pages.`);
doc.moveDown();

doc.fontSize(16).text('3. Key Features');
doc.fontSize(12).text(`- Adaptive Data Engine: The application automatically reads CSV headers during import and populates custom columns and tracking stages without requiring code changes.
- Dual-View Interface: Toggle between a rich Kanban board for visual stage tracking and a detailed Table view for dense data analysis.
- Role-Based Authentication: Sign in securely with email and password. Admins have access to destructive actions (like "Clear Data"), while Members have restricted access.
- Customizable Avatars: User profiles feature integrated anime-style avatars (e.g., Naruto, Sasuke, Sakura, Kakashi).
- Export & Backup: Easily export the entire current dataset back to a CSV for external analysis.`);
doc.moveDown();

doc.fontSize(16).text('4. Frequently Asked Questions (FAQ)');
doc.fontSize(12).text(`Q: How do I import my own custom dataset?
A: Simply click the "Import CSV" button in the top right of the pipeline view. The system will automatically clear the demo data, read your CSV's headers, and adapt the table columns and stages to match your data structure.

Q: Is my data secure?
A: Access to the pipeline requires authentication. Users must sign in or create an account. Passwords and sessions are managed securely by the backend API.

Q: How do I reset or clear all data?
A: If you are logged in as an Admin, you will see a red "Clear Data" button next to the Export button. This will wipe all current leads and metrics, providing a clean slate for a new dataset.

Q: Can I use this system for purposes other than sales?
A: Yes! Because of the dynamic CSV import engine, you can use this platform to track job applications, real estate listings, customer support tickets, or any other workflow that relies on statuses and categorized data.`);
doc.moveDown();

doc.fontSize(16).text('5. Future Roadmap');
doc.fontSize(12).text(`- Integration with external persistent databases (e.g., PostgreSQL, Cloud SQL).
- Advanced custom filtering and sorting by dynamic columns.
- Real-time WebSocket updates for collaborative team editing.`);

doc.end();
console.log('PDF generated successfully!');
