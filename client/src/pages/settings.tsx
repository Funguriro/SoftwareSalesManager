import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Mail, Bell, Lock, Save, Globe } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Settings schema
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
  supportEmail: z.string().email("Invalid email address"),
  defaultCurrency: z.string(),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().min(1, "SMTP port is required"),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  smtpFrom: z.string().email("Must be a valid email"),
  emailFooter: z.string(),
});

const notificationSettingsSchema = z.object({
  licenseExpirationDays: z.number().min(1, "Must be at least 1 day"),
  sendEmailNotifications: z.boolean(),
  sendSmsNotifications: z.boolean(),
  includeBillingTeam: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;
type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  // Fetch general settings
  const { data: generalSettings, isLoading: isGeneralLoading } = useQuery<GeneralSettingsFormValues>({
    queryKey: ["/api/settings/general"],
    onError: () => {
      toast({
        title: "Error loading settings",
        description: "Could not load general settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch email settings
  const { data: emailSettings, isLoading: isEmailLoading } = useQuery<EmailSettingsFormValues>({
    queryKey: ["/api/settings/email"],
    onError: () => {
      toast({
        title: "Error loading settings",
        description: "Could not load email settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch notification settings
  const { data: notificationSettings, isLoading: isNotificationLoading } = useQuery<NotificationSettingsFormValues>({
    queryKey: ["/api/settings/notifications"],
    onError: () => {
      toast({
        title: "Error loading settings",
        description: "Could not load notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Forms setup
  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: generalSettings || {
      companyName: "",
      website: "",
      contactEmail: "",
      supportEmail: "",
      defaultCurrency: "USD",
    },
    values: generalSettings,
  });

  const emailForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: emailSettings || {
      smtpHost: "",
      smtpPort: "",
      smtpUser: "",
      smtpPassword: "",
      smtpFrom: "",
      emailFooter: "",
    },
    values: emailSettings,
  });

  const notificationForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettings || {
      licenseExpirationDays: 14,
      sendEmailNotifications: true,
      sendSmsNotifications: false,
      includeBillingTeam: true,
    },
    values: notificationSettings,
  });

  // Update mutations
  const updateGeneralSettings = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/general", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateEmailSettings = useMutation({
    mutationFn: async (data: EmailSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/email", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Email settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/email"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateNotificationSettings = useMutation({
    mutationFn: async (data: NotificationSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Notification settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onSubmitGeneral = (data: GeneralSettingsFormValues) => {
    updateGeneralSettings.mutate(data);
  };

  const onSubmitEmail = (data: EmailSettingsFormValues) => {
    updateEmailSettings.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationSettingsFormValues) => {
    updateNotificationSettings.mutate(data);
  };

  // Test email function
  const sendTestEmail = async () => {
    try {
      await apiRequest("POST", "/api/settings/test-email", {});
      toast({
        title: "Test email sent",
        description: "A test email has been sent to verify your settings.",
      });
    } catch (error) {
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      <Sidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-6 w-6 mr-2 text-primary-500" />
          <h1 className="text-2xl font-semibold text-neutral-800">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure your organization's basic information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                              <Input placeholder="https://yourcompany.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <Input placeholder="contact@example.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Used for customer communications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="supportEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Support Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <Input placeholder="support@example.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Used for support tickets
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={generalForm.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <FormControl>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                              <option value="CAD">CAD - Canadian Dollar</option>
                              <option value="AUD">AUD - Australian Dollar</option>
                              <option value="JPY">JPY - Japanese Yen</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto" 
                      disabled={updateGeneralSettings.isPending || !generalForm.formState.isDirty}
                    >
                      {updateGeneralSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Configure email delivery settings for notifications and customer communications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input placeholder="587" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={emailForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                              <Input placeholder="noreply@example.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            This email address will be used as the sender for all system emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="emailFooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Footer</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Copyright © 2023 Your Company. All rights reserved." 
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This text will be appended to all system-generated emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        type="submit" 
                        disabled={updateEmailSettings.isPending || !emailForm.formState.isDirty}
                      >
                        {updateEmailSettings.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={sendTestEmail}
                      >
                        Send Test Email
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when notifications are sent to clients and staff.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="licenseExpirationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Expiration Warning (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={90} 
                              placeholder="14" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of days before expiration to start sending notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Notification Channels</h3>
                      
                      <FormField
                        control={notificationForm.control}
                        name="sendEmailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base mb-0">Email Notifications</FormLabel>
                              <FormDescription>
                                Send license expiration reminders via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="sendSmsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base mb-0">SMS Notifications</FormLabel>
                              <FormDescription>
                                Send license expiration reminders via SMS (additional charges may apply)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="includeBillingTeam"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base mb-0">Billing Team CC</FormLabel>
                              <FormDescription>
                                Include the billing team on license expiration reminders
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={updateNotificationSettings.isPending || !notificationForm.formState.isDirty}
                    >
                      {updateNotificationSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
