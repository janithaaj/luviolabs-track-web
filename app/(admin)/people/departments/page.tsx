import { redirect } from 'next/navigation';

/** Departments live under Workspace Settings. */
export default function DepartmentsRedirectPage() {
  redirect('/system/settings#departments');
}
