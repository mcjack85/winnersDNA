# 🧬 B2C 유전자 검사 랜딩페이지 연동 설치 가이드

본 랜딩페이지는 서버나 데이터베이스 구매 없이 **무료**로 실시간 상담 접수 내역을 수집하고 관리자 메일로 알림을 받아볼 수 있도록 **Google Sheets + Apps Script** 연동 방식으로 제작되었습니다.

아래 단계를 순서대로 따라 하시면 15분 만에 연동이 완료됩니다!

---

## STEP 1. 구글 스프레드시트 생성하기

1. [Google 스프레드시트(sheets.google.com)](https://sheets.google.com)로 이동하여 로그인한 후 **새 스프레드시트**를 만듭니다.
2. 스프레드시트의 이름을 적절히 변경합니다. (예: `유전자 검사 상담 신청 DB`)
3. 첫 번째 행(1행)에 아래 열 이름을 순서대로 입력합니다.
   - **A1**: `신청일시`
   - **B1**: `이름`
   - **C1**: `연락처`
   - **D1**: `성별`
   - **E1**: `연령대`
   - **F1**: `주요고민`
   - **G1**: `상세메시지`
   - **H1**: `UTM경로`
4. 브라우저 주소창에서 스프레드시트 ID를 복사해 둡니다.
   - 주소 형식: `https://docs.google.com/spreadsheets/d/시트_아이디_부분/edit` 에서 **`시트_아이디_부분`**을 복사합니다.

---

## STEP 2. Apps Script 소스 입력 및 설정

1. 스프레드시트 상단 메뉴에서 **[확장 프로그램] ➔ [Apps Script]**를 클릭합니다.
2. 열린 코드 편집기창의 기존 코드를 전부 삭제합니다.
3. 프로젝트 내 [apps_script.gs](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/apps_script.gs) 파일의 코드를 복사해서 붙여넣습니다.
4. 코드 최상단의 설정 항목 2가지를 본인의 정보로 변경합니다.
   ```javascript
   const SHEET_ID = 'STEP1에서_복사한_스프레드시트_ID_입력';
   const NOTIFY_EMAIL = '알림을_받으실_이메일_주소_입력';
   ```
5. 상단 디스크 모양 아이콘(**저장**) 또는 `Ctrl + S`를 눌러 저장합니다.

---

## STEP 3. 연결 및 메일 발송 테스트

1. 코드 편집기 상단 메뉴의 함수 선택 드롭다운에서 **`testForm`**을 선택합니다.
2. 바로 옆의 **[실행]** 버튼을 누릅니다.
3. 최초 실행 시 **[권한 검토]** 팝업이 뜹니다.
   - ➔ **구글 계정 선택**
   - ➔ *'Google에서 이 앱을 검증하지 않았습니다'*라는 안내 경고 발생 시, 왼쪽 하단의 **[고급]** 클릭 ➔ **[제목없는 프로젝트(으)로 이동(안전하지 않음)]** 클릭
   - ➔ **[허용]** 클릭
4. 실행 완료 후 스프레드시트에 테스트 데이터가 추가되고, 설정하신 메일 주소로 알림 메일이 도착하는지 확인합니다. (메일이 오지 않는다면 스팸함도 확인해 보세요!)

---

## STEP 4. 웹 앱으로 배포하기 (가장 중요)

1. 오른쪽 상단 파란색 **[배포] ➔ [새 배포]**를 클릭합니다.
2. 왼쪽 톱니바퀴 아이콘을 누르고 **[웹 앱]** 유형을 선택합니다.
3. 설정 창의 정보를 다음과 같이 지정합니다:
   - **설명**: `유전자 검사 신청 백엔드 v1`
   - **웹 앱을 실행할 사용자**: `나(본인 이메일)`
   - **액세스 권한이 있는 사용자**: **`모든 사용자`** (⚠️ 꼭 '모든 사용자(Anyone)'로 해야 랜딩페이지의 폼이 스프레드시트에 등록됩니다!)
4. **[배포]** 버튼을 클릭합니다.
5. 배포가 완료되면 화면에 **웹 앱 URL**이 발급됩니다. 이 URL을 전체 복사해 둡니다.
   - URL 형식: `https://script.google.com/macros/s/XXXXXX/exec`

---

## STEP 5. 랜딩페이지 HTML 파일 수정 및 적용

1. 프로젝트 폴더 내 [index.html](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/index.html) 파일을 텍스트 에디터로 엽니다.
2. 스크립트 코드 내에서 `YOUR_APPS_SCRIPT_URL_HERE` 부분을 검색합니다.
3. 해당 부분을 **STEP 4에서 복사한 웹 앱 URL**로 교체합니다.
   ```javascript
   // 예시 코드 수정 부분
   const scriptURL = 'https://script.google.com/macros/s/XXXXXX/exec';
   ```
4. 파일을 저장합니다. 이제 모든 준비가 끝났습니다! index.html 파일을 브라우저로 실행하여 직접 상담 신청을 넣으면 스프레드시트에 실시간으로 기록됩니다.

---

> [!IMPORTANT]
> **Apps Script 수정 시 주의사항**
> 만약 Apps Script의 코드를 수정하거나 이메일 주소 등을 변경한 경우, 단순히 저장만 하면 작동하지 않습니다. **반드시 [배포] ➔ [배포 관리] ➔ [편집] ➔ 버전을 '새 버전'으로 선택한 뒤 [배포]**를 다시 눌러주어야 수정 사항이 반영됩니다!

---

## STEP 6. 관리자 대시보드(admin.html) 설정 및 조회

1. 프로젝트 폴더 내 [admin.html](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/admin.html) 파일을 텍스트 에디터로 엽니다.
2. 스크립트 코드 내에서 `YOUR_APPS_SCRIPT_URL_HERE` 부분을 검색합니다.
3. 해당 부분을 **STEP 4에서 복사한 동일한 웹 앱 URL**로 교체하고 저장합니다.
4. 이제 [admin.html](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/admin.html) 파일을 브라우저로 엽니다.
5. 비밀번호 창에 **`winners123!`**를 입력하고 로그인 버튼을 누르면 스프레드시트에 저장된 고객 명단이 최신 접수 순으로 조회됩니다.
   - **조회 기능**: 이름/연락처 실시간 검색, 고민별 카테고리 필터링이 가능합니다.
   - **연락처 연동**: 모바일 기기나 연동된 PC에서 고객 전화번호를 클릭하면 즉시 전화 걸기(`tel:`)가 가능합니다.
   - **엑셀 저장**: 우측 상단 **[엑셀(CSV) 저장]**을 누르면 한글 깨짐이 없는 Excel 호환 CSV 파일로 고객 명단을 다운로드할 수 있습니다.

> [!TIP]
> **비밀번호 변경 방법**
> 비밀번호를 바꾸려면 [apps_script.gs](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/apps_script.gs) 파일의 `doGet(e)` 함수 안의 `if (pw !== 'winners123!')` 부분과 [admin.html](file:///C:/Users/mcjac/.gemini/antigravity/scratch/dna-healthcare-landing/admin.html)의 기본 placeholder 안내 텍스트를 원하는 값으로 함께 수정하시고 **Apps Script를 재배포(새 버전 배포)** 하시면 됩니다.

