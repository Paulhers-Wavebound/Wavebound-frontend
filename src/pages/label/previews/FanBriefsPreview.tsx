import ComingSoon from "@/components/coming-soon/ComingSoon";
import FanBriefsMock from "@/components/coming-soon/mocks/FanBriefsMock";

export default function FanBriefsPreview() {
  return (
    <div style={{ padding: "32px 24px 80px" }}>
      <ComingSoon label="Q2 2026">
        <FanBriefsMock />
      </ComingSoon>
    </div>
  );
}
