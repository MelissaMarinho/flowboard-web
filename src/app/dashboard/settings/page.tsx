import { auth } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <ProfileForm
          initialName={session?.user?.name ?? ""}
          email={session?.user?.email ?? ""}
        />
      </div>
    </div>
  );
}
