import ComingSoon from "@/components/coming-soon/ComingSoon";
import PaidAmplificationMock from "@/components/coming-soon/mocks/PaidAmplificationMock";

export default function PaidAmplificationPreview() {
  return (
    <div
      className="p-6 md:p-8 lg:p-10"
      style={{ maxWidth: 1200, margin: "0 auto" }}
    >
      <ComingSoon label="Q2 2026">
        <PaidAmplificationMock />
      </ComingSoon>
    </div>
  );
}
