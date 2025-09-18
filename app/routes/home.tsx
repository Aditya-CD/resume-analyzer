import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "../../constants";
import ResumeCard from "~/components/resumeCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ClearPath" },
    { name: "description", content: "Simplifying resumes with AI" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page_heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        <h2>Your AI-powered resume builder</h2>
      </div>

      {resumes.length > 0 && (
        <div className="resume-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </section>
  </main>;
}
