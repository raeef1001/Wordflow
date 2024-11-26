import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and profile preferences
        </p>
      </div>
      
      <div className="space-y-8">
        <SettingsForm user={session.user} />
      </div>
    </div>
  )
}
