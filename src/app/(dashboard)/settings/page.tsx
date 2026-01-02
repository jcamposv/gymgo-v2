import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {user?.user_metadata?.name || 'Not set'}
              </p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Member since</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account management features coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
