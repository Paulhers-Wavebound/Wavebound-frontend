import LabelLayout from "@/pages/label/LabelLayout";
import ComingSoon from "@/components/coming-soon/ComingSoon";
import SoundIntelligenceMock from "@/components/coming-soon/mocks/SoundIntelligenceMock";

export default function SoundIntelligencePreview() {
  return (
    <LabelLayout>
      <div style={{ padding: "32px 24px 80px" }}>
        <ComingSoon label="Q2 2026">
          <SoundIntelligenceMock />
        </ComingSoon>
      </div>
    </LabelLayout>
  );
}
