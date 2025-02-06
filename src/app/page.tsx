import { redirect } from 'next/navigation';

export default async function Home() {
  // Redirection vers la page de login
  redirect('/auth/login');
}
