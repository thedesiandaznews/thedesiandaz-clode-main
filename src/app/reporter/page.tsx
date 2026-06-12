import { redirect } from 'next/navigation';

export default async function ReporterPage() {
  // Automatically redirect anyone landing on /reporter to /correspondent/login
  redirect('/correspondent/login');
}
