# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# 접근성

시각장애인 사용자를 주 대상으로 하는 앱이다. UI를 만들거나 고칠 때 [ACCESSIBILITY.md](./ACCESSIBILITY.md) 의 규칙을 따를 것.

# 오픈소스 라이선스

- 의존성을 추가·제거·업데이트할 때 [오픈소스 라이선스 목록](./src/app/licenses.tsx)도 함께 검토하고 변경 사항을 반영할 것. `package-lock.json` 변경으로 실제 설치 버전이 달라지는 경우도 포함한다.
- 목록은 `package.json`의 `dependencies`에 있는 직접 의존성을 기준으로 유지하고, 누락·중복·삭제된 패키지가 남아 있는지 확인할 것.
- 라이선스 종류와 저작권 표기는 설치된 패키지의 `LICENSE`·`NOTICE` 등 원문과 메타데이터를 확인할 것. 파일이 없으면 해당 버전의 공식 저장소 자료를 확인하고, 저작권자나 연도를 추측하지 말 것.
- 기존 패키지의 버전만 바뀌어도 라이선스와 저작권 표기의 변경 여부를 확인할 것. 목록 수정이 필요 없으면 작업 결과에 대조 완료 사실을 알릴 것.
