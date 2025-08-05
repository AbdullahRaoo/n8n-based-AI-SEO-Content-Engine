"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { Palette, Database, Zap, Shield, Bell, Globe, Save, Moon, Sun, Monitor } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: true,
    darkMode: theme === "dark",
    apiEndpoint: "https://your-n8n-instance.com/webhook/seo-content-generator",
    apiKey: "",
    defaultLocation: "United States",
    maxArticles: 100,
    enableAnalytics: true,
    autoBackup: false,
  })

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem("seo-dashboard-settings", JSON.stringify(settings))
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully",
    })
    onClose()
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setSettings((prev) => ({ ...prev, darkMode: newTheme === "dark" }))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Theme Settings
              </CardTitle>
              <CardDescription>Customize the appearance of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Changes</Label>
                  <p className="text-sm text-muted-foreground">Automatically save article edits</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoSave: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show toast notifications for actions</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                n8n Workflow Configuration
              </CardTitle>
              <CardDescription>Configure your n8n workflow connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">Webhook Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={settings.apiEndpoint}
                  onChange={(e) => setSettings((prev) => ({ ...prev, apiEndpoint: e.target.value }))}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                />
                <p className="text-xs text-muted-foreground">Your n8n workflow webhook URL</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key for authentication"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-location">Default Location</Label>
                <Input
                  id="default-location"
                  value={settings.defaultLocation}
                  onChange={(e) => setSettings((prev) => ({ ...prev, defaultLocation: e.target.value }))}
                  placeholder="United States"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Workflow Status</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Online
                  </Badge>
                  <span className="text-sm text-blue-800 dark:text-blue-200">Connected to SEO Content Engine v14</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Database Settings
              </CardTitle>
              <CardDescription>Manage your article storage and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-articles">Maximum Articles to Store</Label>
                <Input
                  id="max-articles"
                  type="number"
                  value={settings.maxArticles}
                  onChange={(e) => setSettings((prev) => ({ ...prev, maxArticles: Number.parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Older articles will be archived when limit is reached</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Analytics Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track article performance and SEO metrics</p>
                </div>
                <Switch
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableAnalytics: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatically backup articles daily</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoBackup: checked }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  <Bell className="h-4 w-4 inline mr-2" />
                  System Information
                </h4>
                <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex justify-between">
                    <span>Dashboard Version:</span>
                    <span>v2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Articles Stored:</span>
                    <span>4 articles</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Globe className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>

                <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 bg-transparent">
                  Reset All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
