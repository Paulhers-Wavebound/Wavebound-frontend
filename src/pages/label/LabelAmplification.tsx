import LabelLayout from "./LabelLayout";
import SEOHead from "@/components/SEOHead";
import PaidAmplificationTab from "@/components/label/PaidAmplificationTab";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function LabelAmplification() {
  const { labelId } = useUserProfile();

  return (
    <LabelLayout>
      <SEOHead
        title="Paid Amplification — Wavebound"
        description="Identify high-engagement content ready to boost"
      />
      <div
        style={{
          padding: "40px 44px 72px",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <PaidAmplificationTab labelId={labelId} />
      </div>
    </LabelLayout>
  );
}
