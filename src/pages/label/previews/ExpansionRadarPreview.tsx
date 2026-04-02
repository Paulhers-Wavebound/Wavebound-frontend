import LabelLayout from "@/pages/label/LabelLayout";
import ComingSoon from "@/components/coming-soon/ComingSoon";
import ExpansionRadarMock from "@/components/coming-soon/mocks/ExpansionRadarMock";

export default function ExpansionRadarPreview() {
  return (
    <LabelLayout>
      <div
        style={{ padding: "40px 44px 72px", maxWidth: 1280, margin: "0 auto" }}
      >
        <ComingSoon label="Q2 2026">
          <ExpansionRadarMock />
        </ComingSoon>
      </div>
    </LabelLayout>
  );
}
