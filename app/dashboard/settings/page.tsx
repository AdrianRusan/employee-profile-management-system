'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteTeamMember } from '@/components/settings/InviteTeamMember';
import { TeamMembersList } from '@/components/settings/TeamMembersList';
import { PendingInvitations } from '@/components/settings/PendingInvitations';
import { Settings, Users, Mail, Building2, User, Shield, Loader2, Pencil, X, Check, Camera, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Common timezones grouped by region
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', group: 'Universal' },
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (ET)', group: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (CT)', group: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', group: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', group: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska Time', group: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', group: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', group: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', group: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', group: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', group: 'Americas' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', group: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET)', group: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', group: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', group: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET)', group: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', group: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET)', group: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET)', group: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)', group: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET)', group: 'Europe' },
  { value: 'Europe/Bucharest', label: 'Bucharest (EET)', group: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET)', group: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)', group: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', group: 'Europe' },
  // Asia & Pacific
  { value: 'Asia/Dubai', label: 'Dubai (GST)', group: 'Asia & Pacific' },
  { value: 'Asia/Kolkata', label: 'India (IST)', group: 'Asia & Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', group: 'Asia & Pacific' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', group: 'Asia & Pacific' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', group: 'Asia & Pacific' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', group: 'Asia & Pacific' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', group: 'Asia & Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', group: 'Asia & Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', group: 'Asia & Pacific' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', group: 'Asia & Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', group: 'Asia & Pacific' },
  // Africa & Middle East
  { value: 'Africa/Cairo', label: 'Cairo (EET)', group: 'Africa & Middle East' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', group: 'Africa & Middle East' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', group: 'Africa & Middle East' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', group: 'Africa & Middle East' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)', group: 'Africa & Middle East' },
];
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc/Provider';
import { toast } from 'sonner';
import Link from 'next/link';

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Organization form schema
const organizationFormSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  timezone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type OrganizationFormData = z.infer<typeof organizationFormSchema>;

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);

  // Get current user
  const { data: currentUser, isLoading: userLoading } = trpc.auth.getCurrentUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Get organization settings - use type assertion to avoid deep type inference
  type OrgSettingsType = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    settings: Record<string, unknown> | null;
  };

  const { data: orgSettingsRaw, isLoading: orgLoading } = trpc.organization.getSettings.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const orgSettings = orgSettingsRaw as OrgSettingsType | undefined;

  const isManager = currentUser?.role === 'MANAGER';

  // Type assertion for organization field
  const user = currentUser as typeof currentUser & {
    organization?: { id: string; name: string; slug: string; logo: string | null };
  };

  // Helper to get org settings values
  const getOrgSetting = (key: string): string => {
    if (!orgSettings?.settings) return '';
    return (orgSettings.settings[key] as string) || '';
  };

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || '',
      title: currentUser?.title || '',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
    },
  });

  // Organization form
  const orgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: orgSettings?.name || '',
      description: getOrgSetting('description'),
      timezone: getOrgSetting('timezone'),
    },
  });

  // Update profile mutation
  const updateProfileMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      utils.auth.getCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Update organization mutation
  const updateOrgMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Organization settings updated successfully');
      setIsEditingOrg(false);
      utils.organization.getSettings.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update organization');
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    if (!currentUser?.id) return;
    updateProfileMutation.mutate({
      id: currentUser.id,
      data: {
        name: data.name,
        email: currentUser.email,
        title: data.title || '',
        department: data.department || '',
        bio: data.bio || '',
      },
    });
  };

  const onOrgSubmit = (data: OrganizationFormData) => {
    updateOrgMutation.mutate({
      settings: {
        ...(orgSettings?.settings || {}),
        description: data.description,
        timezone: data.timezone,
      },
    });
  };

  // Reset forms when data changes
  const handleProfileEditStart = () => {
    profileForm.reset({
      name: currentUser?.name || '',
      title: currentUser?.title || '',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
    });
    setIsEditingProfile(true);
  };

  const handleOrgEditStart = () => {
    orgForm.reset({
      name: orgSettings?.name || '',
      description: getOrgSetting('description'),
      timezone: getOrgSetting('timezone'),
    });
    setIsEditingOrg(true);
  };

  if (userLoading || orgLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, organization, and team preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how others see you
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button variant="outline" size="sm" onClick={handleProfileEditStart}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name || ''} />
                      <AvatarFallback className="text-lg">
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm text-muted-foreground">
                      <p>To change your avatar, visit your</p>
                      <Link href={`/dashboard/profiles/${currentUser?.id}`} className="text-primary hover:underline">
                        full profile page
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...profileForm.register('name')}
                        aria-invalid={profileForm.formState.errors.name ? 'true' : 'false'}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={currentUser?.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Software Engineer"
                        {...profileForm.register('title')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="e.g. Engineering"
                        {...profileForm.register('department')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      rows={3}
                      {...profileForm.register('bio')}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.bio.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name || ''} />
                      <AvatarFallback className="text-lg">
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{currentUser?.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        {currentUser?.role === 'MANAGER' ? 'Manager' : 'Employee'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Job Title</Label>
                      <p className="mt-1">{currentUser?.title || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="mt-1">{currentUser?.department || 'Not set'}</p>
                    </div>
                  </div>

                  {currentUser?.bio && (
                    <div>
                      <Label className="text-muted-foreground">Bio</Label>
                      <p className="mt-1 text-sm">{currentUser.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Link href="/dashboard/settings/security">
                  <Button variant="outline">Manage 2FA</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  {isManager
                    ? 'Manage your organization settings and preferences'
                    : 'View your organization information'}
                </CardDescription>
              </div>
              {isManager && !isEditingOrg && (
                <Button variant="outline" size="sm" onClick={handleOrgEditStart}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingOrg && isManager ? (
                <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={orgSettings?.logo || undefined} alt={orgSettings?.name || ''} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {orgSettings?.name?.charAt(0).toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Organization logo can be changed in the admin panel</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={orgSettings?.name || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Contact support to change organization name</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Organization Slug</Label>
                      <Input id="slug" value={orgSettings?.slug || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Used in URLs and API calls</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={orgForm.watch('timezone') || ''}
                      onValueChange={(value) => orgForm.setValue('timezone', value)}
                    >
                      <SelectTrigger id="timezone" className="w-full">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select timezone..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {['Universal', 'Americas', 'Europe', 'Asia & Pacific', 'Africa & Middle East'].map((group) => (
                          <div key={group}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {group}
                            </div>
                            {TIMEZONES.filter((tz) => tz.group === group).map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for scheduling and time display across the organization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your organization..."
                      rows={3}
                      {...orgForm.register('description')}
                    />
                    {orgForm.formState.errors.description && (
                      <p className="text-sm text-destructive">{orgForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditingOrg(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateOrgMutation.isPending}>
                      {updateOrgMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={orgSettings?.logo || undefined} alt={orgSettings?.name || ''} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {orgSettings?.name?.charAt(0).toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{orgSettings?.name}</h3>
                      <p className="text-sm text-muted-foreground">/{orgSettings?.slug}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Timezone</Label>
                      <p className="mt-1 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {TIMEZONES.find(tz => tz.value === getOrgSetting('timezone'))?.label || getOrgSetting('timezone') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Members</Label>
                      <p className="mt-1">View in Team tab</p>
                    </div>
                  </div>

                  {getOrgSetting('description') && (
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="mt-1 text-sm">
                        {getOrgSetting('description')}
                      </p>
                    </div>
                  )}

                  {!isManager && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground">
                        Only managers can edit organization settings. Contact your manager for changes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          {isManager ? (
            <>
              <InviteTeamMember />
              <PendingInvitations />
              <TeamMembersList />
            </>
          ) : (
            <>
              <TeamMembersList />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Team Invitations
                  </CardTitle>
                  <CardDescription>
                    Only managers can invite new team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Contact your manager if you need to invite someone to the team.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
