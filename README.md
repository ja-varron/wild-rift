# Tuon

A web-based application designed to streamline the process of checking multiple-choice examinations through Optical Mark Recognition (OMR) technology. The system automates the detection, extraction, and evaluation of shaded answers from scanned answer sheets, eliminating the need for manual checking.

---


## ✨ Features

- **Exam Paper Scanner**: Automatically scans and detects answers from multiple-choice exam sheets using Optical Mark Recognition (OMR) powered by Python and OpenCV.
- **Result Processing**: Processes scanned answer sheets by comparing detected answers with the answer key to automatically compute scores.
- **Exam Analytics**: Provides visual analytics such as score distributions, average scores, and topic-based performance to help evaluate exam results.
- **Feedback Management**: Allows instructors to review exam performance and provide feedback based on student results and identified weak topics.
- **Notification Alert**: Sends notifications to users when exam results are processed or when new feedback is available.
- **User Roles**: Supports role-based access control for administrators, instructors, and students to manage exams and results efficiently.
- **Responsive Design**: Ensures the system works smoothly across desktop, tablet, and mobile devices.
- **Authentication**: Secure authentication system where only administrators can create and manage accounts for students and instructors. Users log in using their assigned email and password through Supabase authentication.


## 🚀 Tech Stack

- **Frontend**: React Vite with App Router, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Supabase Authentication
- **Deployment**: Vercel


## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- Git installed on your machine


## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ja-varron/wild-rift.git
   cd wild-rift
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BASE_URL=http://localhost:5173
   ```


## 🏃‍♂️ Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173) to see the application in action.


## 📖 Usage

### For Administrator
1. **Create User Accounts:** Register and manage accounts for instructors and students.
2. **Manage Exams:** Create, update, and organize exam records within the system.
3. **Monitor Results:** View processed exam results and overall exam analytics.

### For Instructors:

1. **Scan Exam Papers:** Capture images of completed answer sheets for automatic OMR scanning.
2. **Review Results:** View processed scores generated from the scanned answer sheets.
3. **Analyze Performance:** Access analytics such as score distributions and topic-based performance.
4. **Provide Feedback:** Review student performance and provide feedback based on exam results.

### For Students:

1. **Log In:** Access the system using the account created by the administrator.
2. **View Exam Results:** Check scores and performance summaries for completed exams.
3. **View Feedback** Access feedback and insights provided by instructors.


## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |


## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CSci-153-Web-Systems-and-Technologies/batch-2025-resmate-web.git)


## 🤝 Contributing

1. Clone the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- [React Vite](https://vite.dev/) for the React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling


## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/ja-varron/wild-rift/issues) on GitHub.

---

Made with ❤️ for educators and students everywhere.
