리듬리셋 v25 배포 방법

이번 버전은 index.html 하나만 올리면 안 됩니다. 아래 파일과 폴더 전체를 GitHub에 올려야 합니다.

필수 파일:
- index.html
- script.js
- package.json
- api/ai-plan.js
- README-SETUP.txt
- ADSENSE-SETUP.txt
- ANALYTICS-SETUP.txt

Vercel 환경변수:
- OPENAI_API_KEY: OpenAI API 키
- OPENAI_MODEL: 생략 가능. 기본값은 gpt-4.1-mini

v25 변경:
- 상황 카드를 실제 선택 가능하게 변경
- 선택 상황에 따라 결과와 AI 프롬프트가 달라짐
- 계산 버튼 근처 광고 자리 추가
- Vercel Web Analytics 스크립트 추가
