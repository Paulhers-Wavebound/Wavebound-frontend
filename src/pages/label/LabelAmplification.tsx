import LabelLayout from './LabelLayout';
import SEOHead from '@/components/SEOHead';
import PaidAmplificationTab from '@/components/label/PaidAmplificationTab';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function LabelAmplification() {
  const { labelId } = useUserProfile();

  return (
    <LabelLayout>
      <SEOHead title="Paid Amplification — Wavebound" description="Identify high-engagement content ready to boost" />
      <div className="p-6 md:p-8 lg:p-10">
        <PaidAmplificationTab labelId={labelId} />
      </div>
    </LabelLayout>
  );
}
