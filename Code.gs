// =====================================================
// 위너스DNA - 건강 컨설팅 상담 신청 백엔드
// Google Apps Script Web App
// =====================================================

// ⚙️ 설정값 - 여기만 수정하세요
const SHEET_ID = '1XzykqdouKMHYKt6V165OnAs_ptYT7m75sI1jh0_RH30';  // Google Sheets URL의 /d/XXXXX/edit 에서 XXXXX 부분
const SHEET_NAME = '상담신청';
const ADMIN_PASSWORD = 'winners12@!';        // 관리자 페이지 비밀번호 (반드시 변경하세요)

// =====================================================
// POST: 폼 제출 처리 (application/x-www-form-urlencoded)
// =====================================================
function doPost(e) {
  try {
    const data = e.parameter;

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // 시트 없으면 생성 + 헤더 설정
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = ['접수시간', '이름', '연락처', '성별', '연령대', '주요고민', '메시지', '유입경로'];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#059669')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // 한국 시간(KST) 타임스탬프
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const timestamp = Utilities.formatDate(kst, 'GMT', 'yyyy-MM-dd HH:mm:ss');

    sheet.appendRow([
      timestamp,
      data.name    || '',
      data.phone   || '',
      data.gender  || '',
      data.age     || '',
      data.concern || '',
      data.message || '',
      data.utm     || '직접접속'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================
// GET: 관리자 데이터 조회
// =====================================================
function doGet(e) {
  const password = e.parameter.pw;

  // 비밀번호 검증
  if (password !== ADMIN_PASSWORD) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: [], total: 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];

    // 데이터 행만 추출 (최신순 정렬)
    const data = rows.slice(1).reverse().map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    });

    // 오늘 접수 수 계산
    const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
    const todayCount = data.filter(r => String(r['접수시간']).startsWith(today)).length;

    // 성별 통계
    const maleCount = data.filter(r => r['성별'] === '남성').length;
    const femaleCount = data.filter(r => r['성별'] === '여성').length;

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        data: data,
        total: data.length,
        today: todayCount,
        male: maleCount,
        female: femaleCount
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
