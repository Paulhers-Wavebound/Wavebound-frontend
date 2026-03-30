import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import { ThemeSelector } from "@/components/ThemeSelector";
import WaveboundLoader from "@/components/WaveboundLoader";
import ReferralSection from "@/components/ReferralSection";
import AchievementsSection from "@/components/AchievementsSection";
import { AdminConsole } from "@/components/AdminConsole";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  User,
  LogOut,
  CreditCard,
  Crown,
  Mail,
  Pencil,
  Check,
  X,
  Camera,
  Users,
  Lock,
  UserPlus,
  Mic2,
  Briefcase,
  Radio,
  Building2,
  Sliders,
  Video,
  ChevronDown,
  Instagram,
  Music2,
  Youtube
} from "lucide-react";


const ROLES = [
  { id: 'artist', label: 'Artist', icon: Mic2, description: 'Musician, singer, or performer' },
  { id: 'producer', label: 'Producer', icon: Sliders, description: 'Music producer or beatmaker' },
  { id: 'manager', label: 'Manager', icon: Briefcase, description: 'Artist or talent manager' },
  { id: 'ar', label: 'A&R', icon: Radio, description: 'Artists & Repertoire' },
  { id: 'label', label: 'Label Rep', icon: Building2, description: 'Record label representative' },
  { id: 'content', label: 'Content Creator', icon: Video, description: 'Social media or content creator' },
] as const;

type RoleId = typeof ROLES[number]['id'];

const MyPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleId>('artist');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [socialHandles, setSocialHandles] = useState({
    tiktok: '',
    instagram: '',
    youtube: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { isAdmin, loading: adminLoading } = useAdminRole();

  useEffect(() => {
    checkAuth();
    // Load saved role from localStorage
    const savedRole = localStorage.getItem('userRole') as RoleId;
    if (savedRole && ROLES.some(r => r.id === savedRole)) {
      setSelectedRole(savedRole);
    }
    // Load saved social handles from localStorage
    const savedHandles = localStorage.getItem('socialHandles');
    if (savedHandles) {
      setSocialHandles(JSON.parse(savedHandles));
    }
  }, []);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const handleRoleChange = (roleId: RoleId) => {
    setSelectedRole(roleId);
    localStorage.setItem('userRole', roleId);
    setIsRoleDropdownOpen(false);
    toast({
      title: "Role updated",
      description: `You're now set as ${ROLES.find(r => r.id === roleId)?.label}`,
    });
  };

  const handleSocialHandleChange = (platform: keyof typeof socialHandles, value: string) => {
    const newHandles = { ...socialHandles, [platform]: value };
    setSocialHandles(newHandles);
    localStorage.setItem('socialHandles', JSON.stringify(newHandles));
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setUser(user);
    // Get display name from user metadata or fallback to email prefix
    const savedName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Creator';
    setDisplayName(savedName);
    setAvatarUrl(user.user_metadata?.avatar_url || null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate('/auth');
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    
    const { error } = await supabase.auth.updateUser({
      data: { display_name: tempName.trim() }
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update display name.",
        variant: "destructive"
      });
    } else {
      setDisplayName(tempName.trim());
      setIsEditingName(false);
      toast({
        title: "Updated",
        description: "Your display name has been updated.",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to user_videos bucket (already exists and is public)
      const { error: uploadError } = await supabase.storage
        .from('user_videos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user_videos')
        .getPublicUrl(filePath);

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      // First check if user has an active subscription
      const { data: subData } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!subData?.subscribed) {
        toast({
          title: "No active subscription",
          description: "You need an active plan to access the billing portal. Redirecting to plans...",
        });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Could not open billing portal. Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="My Profile - Wavebound"
          description="Manage your Wavebound account settings, preferences, and subscription."
        />
        <AppHeader />
        <div className="pt-24 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <WaveboundLoader size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="My Profile - Wavebound"
        description="Manage your Wavebound account settings, preferences, and subscription."
      />
      <AppHeader />
      
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="relative group">
              <Avatar className="w-16 h-16 rounded-xl">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                ) : null}
                <AvatarFallback className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl">
                  <User className="w-8 h-8 text-white" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="h-9 text-lg font-bold"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={() => {
                      setTempName(displayName);
                      setIsEditingName(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user?.email}
              </p>
            </div>
          </motion.div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Role & Social Media - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Role Selector */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Your Role</Label>
                  <div className="relative" ref={roleDropdownRef}>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-11"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(ROLES.find(r => r.id === selectedRole)?.icon || Mic2, { className: "w-4 h-4" })}
                        <span className="font-medium">{ROLES.find(r => r.id === selectedRole)?.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {isRoleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        {ROLES.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => handleRoleChange(role.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent transition-colors text-left text-sm ${
                              selectedRole === role.id ? 'bg-accent/50' : ''
                            }`}
                          >
                            <role.icon className={`w-4 h-4 ${selectedRole === role.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={selectedRole === role.id ? 'text-primary font-medium' : ''}>{role.label}</span>
                            {selectedRole === role.id && <Check className="w-3 h-3 text-primary ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Handles - Cleaner vertical layout */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Social Handles</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="tiktok"
                        placeholder="@tiktok_handle"
                        value={socialHandles.tiktok}
                        onChange={(e) => handleSocialHandleChange('tiktok', e.target.value)}
                        className="h-11 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
                        <Instagram className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="instagram"
                        placeholder="@instagram_handle"
                        value={socialHandles.instagram}
                        onChange={(e) => handleSocialHandleChange('instagram', e.target.value)}
                        className="h-11 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
                        <Youtube className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="youtube"
                        placeholder="@youtube_channel"
                        value={socialHandles.youtube}
                        onChange={(e) => handleSocialHandleChange('youtube', e.target.value)}
                        className="h-11 flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color theme
                  </p>
                </div>
                <ThemeSelector />
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <AchievementsSection />
            </motion.div>

            {/* Admin Console - Only visible to admins */}
            {!adminLoading && isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.23 }}
              >
                <AdminConsole />
              </motion.div>
            )}

            {/* Referral Program */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <ReferralSection />
            </motion.div>

            {/* Subscription & Billing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Subscription & Billing
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Manage Subscription</p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade, downgrade, or cancel your plan
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleManageSubscription}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing Portal
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">View Plans</p>
                    <p className="text-sm text-muted-foreground">
                      Compare subscription tiers and pricing
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    View Pricing
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Support
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Need help? Reach out to our team.
              </p>
              <a 
                href="mailto:support@wavebound.ai"
                className="text-primary hover:underline text-sm font-medium"
              >
                support@wavebound.ai
              </a>
            </motion.div>

            {/* Sign Out */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default MyPage;
