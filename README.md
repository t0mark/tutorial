# 공부 자료 사이트

GitHub Pages로 배포하는 자습용 자료 모음입니다. 빌드 도구 없이 HTML 파일만으로 동작합니다.

## 구조

```
docs/                  ← GitHub Pages가 배포하는 폴더
├── index.html         ← 자료 목록 (홈)
├── _template.html     ← 새 자료 페이지 템플릿 (배포되지 않음)
├── assets/
│   ├── style.css      ← 모든 페이지 공통 스타일
│   └── site.js        ← 목차·진행률·테마 자동 처리
├── linux/
│   └── index.html     ← 리눅스 첫걸음
└── ipc/
    └── index.html     ← 프로세스 간 통신
```

## 배포

1. 이 저장소를 GitHub에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment**에서
   Source: `Deploy from a branch`, Branch: `main`, 폴더: `/docs`를 선택합니다.
3. 잠시 후 `https://<아이디>.github.io/<저장소 이름>/`에서 열립니다.

## 새 자료 추가하기

1. `docs/` 안에 새 폴더를 만듭니다. 예: `docs/ros2/`
2. `docs/_template.html`을 그 폴더에 `index.html`로 복사합니다.
3. `<body>`의 속성을 바꿉니다.
   - `data-page`: 사이트 안에서 겹치지 않는 영문 이름 (진행 상황 저장 키)
   - `data-brand`, `data-name`: 목차 맨 위에 보일 이름
4. 장마다 `<section class="lec">`를 작성합니다.
   - `data-num`, `data-group`, `data-title`만 채우면 왼쪽 목차, 모바일 이동 메뉴, "학습 완료" 체크, 진행률이 자동으로 생깁니다.
   - 진행률에서 뺄 장(부록 등)은 `data-track="false"`
5. `docs/index.html`의 `<ul class="courses">`에 카드(`<li>`) 하나를 추가합니다.
   카드의 `data-page`를 새 페이지의 `data-page`와 같게 맞추면 홈에 진행률이 표시됩니다.

## 쓸 수 있는 구성 요소

`_template.html`에 예시가 있습니다.

| 요소 | 용도 |
|---|---|
| `<pre>` + `.p` `.c` `.o` | 터미널 예시 (프롬프트 / 설명 / 출력) |
| `.names` | 명령어 원래 이름 표시 (약자 글자는 `<b>`) |
| `.tbl` + `<table>` | 표 (좁은 화면에서 가로 스크롤) |
| `.note` `.warn` `.lab` | 참고 / 주의 / 실습 상자 |
| `.quiz` + `details.q` | 펼쳐서 답을 보는 확인 문제 |
| `figure.fig` + `svg.d` | 그림 (색은 테마를 자동으로 따름) |
| `figure.fig` + `.comm` | 통신 순서 그림: 보내는 쪽 → ① → 통로 → ② → 받는 쪽 + 아래 특징 칸 (`ipc/index.html` 참고) |

## 로컬에서 미리 보기

파일을 더블클릭해서 열어도 대부분 동작합니다. 실제 배포와 똑같이 보려면 `docs/` 폴더에서 간단한 웹 서버를 띄웁니다.

```bash
cd docs
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```
