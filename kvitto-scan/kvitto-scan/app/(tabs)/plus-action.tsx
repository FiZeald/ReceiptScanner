import { Redirect } from 'expo-router';

// Denna fil existerar bara för att definiera platsen i menyn.
// Om någon mot förmodan skulle navigera hit via URL, skickas de hem.
export default function PlusActionPage() {
  return <Redirect href="/" />;
}