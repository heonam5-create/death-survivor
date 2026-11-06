# 데스 서바이버: 전설의 귀환

설치 없이 바로 플레이하는 모바일 생존 슈팅 웹게임 (현대 화기 280종 · 40스테이지)

- 게임 주소: https://heonam5-create.github.io/death-survivor/
- 카카오톡에 위 주소를 보내면, 받은 사람이 링크를 한 번 눌러 바로 플레이할 수 있습니다.

## 파일 구성
- `index.html` — 게임 전체 (한 파일)
- `og.jpg` — 카카오톡/SNS 링크 미리보기 이미지
- `icon-*.png`, `apple-touch-icon.png`, `manifest.webmanifest` — 홈 화면 아이콘
- `source/` — 수정용 원본 코드 (`python3 build.py` 실행 시 `index.html` 생성)

## 업데이트 방법
`main` 브랜치에 새 `index.html`을 올리면 1~2분 뒤 GitHub Pages가 자동으로 새 버전을 배포합니다.

## 카카오톡 공유 API (선택)
`index.html` 안의 `kakaoKey: ''` 칸에 카카오 개발자 사이트의 JavaScript 키를 넣으면
'카카오톡 공유' 버튼이 카카오톡 공유 창을 바로 엽니다. 키가 없으면 휴대폰 기본 공유창 또는 링크 복사로 동작합니다.
