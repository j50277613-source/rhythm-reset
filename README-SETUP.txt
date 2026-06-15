리듬리셋 v23 업로드 방법

이번 버전부터 AI 연동을 위해 파일이 1개가 아닙니다.
GitHub 저장소에는 아래 3개를 그대로 올려야 합니다.

1. index.html
2. package.json
3. api 폴더 전체
   - api/ai-plan.js

Vercel 환경변수 설정
1. Vercel 프로젝트 접속
2. Settings
3. Environment Variables
4. 이름: OPENAI_API_KEY
5. 값: OpenAI API Key
6. Save
7. Deployments에서 Redeploy

선택 환경변수
- OPENAI_MODEL: gpt-4.1-mini

광고 기능
- Google AdSense 승인이 나기 전까지 실제 광고는 표시되지 않습니다.
- 승인 후 AdSense에서 받은 publisher ID와 광고 코드를 index.html의 광고 영역에 넣으면 됩니다.
- 지금 버전은 광고 위치와 구조만 준비한 상태입니다.
