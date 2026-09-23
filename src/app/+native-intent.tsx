import { isOnboardingCompleted } from "@/utils/onboarding";

// 딥링크 처리
export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  if (!/^(?:voicestory:\/\/|\/?)record\/?(?:[?#].*)?$/.test(path)) {
    return path;
  }

  try {
    // 첫 설치 등 온보딩을 완료하지 않은 경우 온보딩으로, 완료한 경우 녹음 화면으로 이동
    return (await isOnboardingCompleted()) ? path : "/onboarding?next=record";
  } catch {
    // 저장소 읽기 오류(온보딩 확인)로 완료 여부를 확인할 수 없으면 온보딩으로 이동
    return "/onboarding?next=record";
  }
}
