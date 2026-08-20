# 접근성 규칙

VoiceStory는 **시각장애인 사용자를 주 대상**으로 하는 음성 일기 앱이다. 화면을 보지 않고도 모든 기능을 쓸 수 있어야 하므로, 접근성은 마감 단계의 다듬기가 아니라 기능의 일부다.

새 화면을 만들 때 아래 규칙을 따른다.

---

## 0. 기본 개념

스크린 리더(iOS VoiceOver / Android TalkBack)는 화면을 **초점(focus)이 머무는 요소들의 목록**으로 다룬다. 사용자는 스와이프로 요소를 하나씩 옮겨 다니고, 각 요소에서 다음을 듣는다.

```
라벨 → 값·상태 → 역할 → (잠시 뒤) 힌트
"AI 교정 활성화,  꺼짐,  스위치,  켜면 녹음 텍스트를 AI가 다듬어 저장합니다"
```

| prop | 무엇 | 예 |
|---|---|---|
| `accessible` | 이 요소를 **초점 한 칸**으로 만든다. 자식들은 개별 초점을 잃고 하나로 묶인다 | `<View accessible>` |
| `accessibilityLabel` | 요소의 **이름**. 지정하지 않으면 자식 텍스트를 이어붙여 읽는다 | `"AI 교정 활성화"` |
| `accessibilityRole` | 요소의 **종류**. 읽어주는 방식과 로터 탐색에 영향 | `"button"`, `"header"` |
| `accessibilityHint` | 조작하면 **일어날 일** | `"켜면 ...합니다"` |
| `accessibilityState` | 현재 **상태**. `Switch` 나 `Pressable` 은 대개 자동 처리 | `{ disabled: true }` |
| `announceForAccessibility()` | 초점과 무관하게 **한 번 읽어주는 메시지** | 다운로드 완료 알림 |

알아둘 것들:

- **`accessible` 은 View에 기본으로 꺼져 있다.** `Text` 와 터치 요소는 켜져 있다. 그래서 제목+설명을 묶으려면 부모 View에 명시해야 한다.
- **힌트는 사용자가 꺼둘 수 있다.** VoiceOver 설정에서 끄면 안 읽힌다. **꼭 필요한 정보를 힌트에만 두면 안 된다** — 라벨이나 화면 텍스트에도 있어야 한다.
- **`accessibilityLabel` 을 주면 자식 텍스트는 무시된다.** 그래서 합성 라벨을 쓸 때 원본 문자열과 어긋나지 않게 같은 변수에서 만들어야 한다.
- **역할은 읽는 방식을 바꾼다.** `button` 이면 "버튼"이라고 덧붙이고 이중 탭으로 활성화된다고 알려준다. `header` 면 로터의 제목 목록에 들어간다.

## 1. 역할(role)

| 요소 | 지정 |
|---|---|
| 화면 제목, 섹션 제목 | `accessibilityRole="header"` |
| 누를 수 있는 것 | `accessibilityRole="button"` |
| 장식용 이미지 | `accessibilityRole` 없이 초점에서 제외 |

제목에 `header` 를 주면 VoiceOver 로터에서 **제목 단위로 건너뛸 수 있다.** 항목이 늘어날수록 차이가 커진다.

```tsx
<Text style={styles.title} accessibilityRole="header">
  {t("settings.title")}
</Text>
```

## 2. 라벨과 힌트

- **`accessibilityLabel`** — 이게 무엇인가
- **`accessibilityHint`** — 조작하면 무슨 일이 일어나는가

힌트는 현재 상태가 아니라 **행동의 결과**를 쓴다. 상태에 따라 결과가 달라지면 힌트도 갈라야 한다.

```tsx
// 켜져 있을 때 끄면 모델이 삭제되므로, 누르기 전에 알린다
accessibilityHint={
  isAiEnabled
    ? t("settings.ai.deleteConfirmMessage")
    : t("settings.ai.enableCorrectionOnHint")
}
```

## 3. 초점 묶기

제목 + 설명처럼 **한 항목을 이루는 텍스트**는 초점이 여러 번 머무르지 않게 묶는다.

```tsx
<View
  style={styles.rowText}
  accessible
  accessibilityLabel={`${t("settings.ai.enableCorrection")}, ${hintText}`}
>
  <Text>{t("settings.ai.enableCorrection")}</Text>
  <Text>{hintText}</Text>
</View>
```

라벨-값 구조의 행도 마찬가지다. `AI 모델` 과 `다운로드 중 42%` 를 따로 읽으면 맥락이 끊긴다.

**표시용 문자열과 스크린 리더용 문자열은 같은 변수에서 만든다.** 따로 쓰면 한쪽만 고쳐서 어긋난다.

## 4. 음성 안내 (`announceForAccessibility`)

**알려야 할 때**
- 오래 걸리는 작업의 진행과 완료 (모델 다운로드 등)
- 화면 전환처럼 초점이 크게 움직였을 때
- 실패

**알리지 말아야 할 때**
- 컨트롤이 이미 스스로 알리는 것 (`Switch` 의 켜짐/꺼짐)
- 사용자가 직접 취소한 동작 — 실패가 아니다

```tsx
// 취소는 사용자 의도이므로 실패로 알리지 않는다
if (error && error.code !== RnExecutorchErrorCode.DownloadInterrupted) {
  AccessibilityInfo.announceForAccessibility(t("home.modelDownload.errorMessage"));
}
```

**진행률은 구간으로 끊는다.** 매 % 말하면 VoiceOver를 계속 끊어 다른 작업을 방해한다. 모델 다운로드는 25% 단위로 안내한다.

중복 발화를 막을 때는 **state가 아니라 ref**를 쓴다. state는 리렌더를 유발하고, 낡은 클로저 때문에 같은 구간을 두 번 말할 수 있다.

## 5. 햅틱

조작이 인식됐다는 즉각적인 신호. 음성 안내보다 빠르게 도달한다.

| 상황 | 세기 |
|---|---|
| 탭 이동, 토글 | `impactAsync(Light)` |
| 녹음 시작·정지 | `impactAsync(Medium)` |
| 파괴적 동작 확인 | `notificationAsync(Warning)` |

`(tabs)/_layout.tsx` 의 `accessibility()` 헬퍼가 햅틱 + 안내를 묶어 쓰는 예다.

## 6. 터치 영역

시각적 크기와 별개로 **최소 48pt** 를 확보한다. 시각적 높이를 줄이고 싶으면 `minHeight` 로 hit area만 키운다.

## 7. i18n 키 규칙

접근성 문자열도 5개 언어(`ko`, `en`, `ja`, `zh-CN`, `zh-TW`)에 모두 넣는다.

| 접미사 | 용도 |
|---|---|
| `*Hint` | `accessibilityHint` |
| `*Announcement` / `announcement.*` | `announceForAccessibility` |
| `*.accessibilityLabel` | 합성 라벨 |

---

## 새 화면 점검표

- [ ] 제목에 `accessibilityRole="header"`
- [ ] 모든 조작 요소에 라벨, 필요하면 힌트
- [ ] 한 항목을 이루는 텍스트는 초점 묶기
- [ ] 오래 걸리는 작업에 진행·완료 안내
- [ ] 조작 시 햅틱
- [ ] 터치 영역 48pt 이상
- [ ] **실기기에서 VoiceOver 켜고 직접 통과해보기** — 코드 검토로는 안 잡힌다
