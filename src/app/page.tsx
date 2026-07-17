import { redirect } from 'next/navigation';

/** Root entry: send everyone to the attendance tab. Middleware handles auth. */
export default function Home() {
  redirect('/attendance');
}
