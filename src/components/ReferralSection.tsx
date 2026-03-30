import { Gift, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ReferralSection() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 rounded-[inherit]" />
      <CardHeader className="pb-3 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-muted-foreground">Invite Friends, Get Rewarded</CardTitle>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>
            <CardDescription>Referral rewards are on the way — stay tuned!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-20">
        <p className="text-xs text-muted-foreground">
          Soon you'll be able to invite friends and earn free Pro access. We'll let you know when it's ready.
        </p>
      </CardContent>
    </Card>
  );
}

export default ReferralSection;
