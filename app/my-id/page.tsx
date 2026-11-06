import { permanentRedirect } from 'next/navigation';

/**
 * Legacy prototype route.
 *
 * The old screen looked up residents by typing a name, which exposed records
 * to anyone who loaded the page. Resident identity now lives behind the
 * authenticated dashboard at /dashboard.
 */
export default function LegacyMyIdPage() {
  permanentRedirect('/dashboard');
}
