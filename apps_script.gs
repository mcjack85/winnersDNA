/**
 * ====================================================================
 * B2C 질병 유전자 검사 & 헬스케어 랜딩페이지 Apps Script 백엔드 코드
 * ====================================================================
 * 
 * [설정 방법]
 * 1. Google Sheets(스프레드시트) 생성 후 상단 URL에서 SHEET_ID 복사
 * 2. 아래 SHEET_ID, NOTIFY_EMAIL 값을 변경하십시오.
 * 3. 스프레드시트 1행(헤더)에 다음 열을 설정하십시오.
 *    A: 신청일시 | B: 이름 | C: 연락처 | D: 성별 | E: 연령대 | F: 주요고민 | G: 상세메시지 | H: UTM경로
 */

const SHEET_ID = '160gkJp3RfLOXM7mKk1CX1WQPHk4Se6fzL4oM28MNOlM';        // <-- 구글 스프레드시트 ID 입력
const NOTIFY_EMAIL = 'zmb5857@naver.com', 'mcjack85@gmail.com'; // <-- 알림을 받을 본인 이메일 주소 입력
const SHEET_NAME = 'DNA검사 신청 명단';                    // <-- 스프레드시트 내 시트 이름 (기본값: 시트1)

function doPost(e) {
  const result = { status: 'success', message: '접수가 성공적으로 완료되었습니다.' };
  
  try {
    // 1. 전달받은 파라미터 파싱
    const params = e.parameter;
    const name = params.name || '미입력';
    const phone = params.phone || '미입력';
    const gender = params.gender || '미입력';
    const age = params.age || '미입력';
    const concern = params.concern || '미입력';
    const message = params.message || '없음';
    const utm = params.utm || '직접 유입';
    
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 2. 구글 스프레드시트 연결 및 데이터 저장
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // 중복 방지 검증 (동일 연락처로 최근 5분 내 중복 신청 방지)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // 연락처 열 (C열)
      const times = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // 신청일시 열 (A열)
      
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i][0] === phone) {
          const prevTime = new Date(times[i][0]);
          const diffMs = now.getTime() - prevTime.getTime();
          const diffMins = diffMs / (1000 * 60);
          
          if (diffMins < 5) {
            result.status = 'error';
            result.message = '이미 상담 신청이 접수되었습니다. 잠시만 기다려주시면 연락드리겠습니다.';
            return ContentService.createTextOutput(JSON.stringify(result))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }
    
    // 데이터 행 추가
    sheet.appendRow([
      formattedDate,
      name,
      phone,
      gender,
      age,
      concern,
      message,
      utm
    ]);
    
    // 3. 이메일 알림 전송 (HTML 형식)
    sendHtmlEmailAlert({
      date: formattedDate,
      name: name,
      phone: phone,
      gender: gender,
      age: age,
      concern: concern,
      message: message,
      utm: utm
    });
    
  } catch (error) {
    result.status = 'error';
    result.message = '시스템 오류가 발생했습니다: ' + error.toString();
  }
  
  // CORS 대응을 위한 JSON Output 반환
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ====================================================================
 * 신규 추가: 데이터 조회용 doGet 함수 (Admin Dashboard 연동)
 * ====================================================================
 */
function doGet(e) {
  const result = { status: 'success', data: [] };
  
  try {
    const params = e.parameter;
    const pw = params.pw;
    
    // 보안인증용 간이 비밀번호 설정 (필요시 변경 가능)
    if (pw !== 'winners123!') {
      result.status = 'error';
      result.message = '비밀번호가 일치하지 않습니다.';
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
      const values = dataRange.getValues();
      
      // 최신 접수 건이 가장 위에 보이도록 역순(Reverse)으로 파싱
      for (let i = values.length - 1; i >= 0; i--) {
        let rawDate = values[i][0];
        let dateString = '';
        if (rawDate instanceof Date) {
          dateString = Utilities.formatDate(rawDate, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
        } else {
          dateString = String(rawDate);
        }
        
        result.data.push({
          date: dateString,
          name: values[i][1] || '',
          phone: values[i][2] || '',
          gender: values[i][3] || '',
          age: values[i][4] || '',
          concern: values[i][5] || '',
          message: values[i][6] || '',
          utm: values[i][7] || ''
        });
      }
    }
    
  } catch (error) {
    result.status = 'error';
    result.message = '데이터 조회 오류: ' + error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 관리자에게 전달될 예쁜 디자인의 HTML 메일 템플릿 발송
 */
function sendHtmlEmailAlert(data) {
  const subject = `[신규 상담 신청] ${data.name} 님이 유전자 검사 상담을 신청했습니다.`;
  
  const htmlBody = `
    <div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <!-- 헤더 -->
      <div style="background: linear-gradient(135deg, #10B981, #0EA5E9); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">🧬 신규 유전자 검사 신청</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">상담 신청이 실시간으로 접수되었습니다. 고객님께 신속히 연락해 주세요.</p>
      </div>
      
      <!-- 본문 -->
      <div style="padding: 30px 20px; background-color: #ffffff; color: #374151;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 0; color: #111827;">📋 신청 정보</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="width: 30%; padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px;">신청 일시</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px;">고객 성함</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: bold;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px;">연락처</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #0EA5E9; font-size: 15px; font-weight: bold;">
              <a href="tel:${data.phone}" style="color: #0EA5E9; text-decoration: none;">${data.phone}</a> (클릭 시 통화 연결)
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px;">성별 / 연령</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${data.gender} / ${data.age}</td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px;">가장 큰 건강 고민</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #10B981; font-size: 14px; font-weight: bold;">${data.concern}</td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: top;">상세 요청사항</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${data.message}</td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: bold; color: #4B5563; font-size: 14px;">광고 유입경로 (UTM)</td>
            <td style="padding: 12px 8px; color: #6B7280; font-size: 13px;">${data.utm}</td>
          </tr>
        </table>
        
        <!-- 꿀팁 리마인더 -->
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin-top: 30px; border-radius: 4px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #065F46; font-weight: bold;">💡 영업 전환 팁</h3>
          <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.5;">
            상담 신청 접수 후 <strong>30분 이내에 전화 상담</strong>을 연결할 경우, 3시간 이후에 통화하는 것보다 최종 전환율이 약 <strong>21배</strong> 높습니다. 지금 바로 연락해 보세요!
          </p>
        </div>
      </div>
      
      <!-- 푸터 -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #9CA3AF; font-size: 12px;">
        본 메일은 B2C 유전자 건강관리 서비스 랜딩페이지 시스템에서 자동 발송되었습니다.<br>
        © 인카다이렉트 위너스지점. All rights reserved.
      </div>
    </div>
  `;
  
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * 연동 테스트를 위한 함수 (Apps Script 내에서 직접 실행 가능)
 */
function testForm() {
  const dummyEvent = {
    parameter: {
      name: '홍길동(테스트)',
      phone: '010-1234-5678',
      gender: '남성',
      age: '40대',
      concern: '가족력(암/심혈관) 걱정',
      message: '유전자 검사 후 나에게 맞는 영양제 추천 및 보험 점검을 자세히 받아보고 싶습니다.',
      utm: 'sns_inst_ad_test'
    }
  };
  
  const response = doPost(dummyEvent);
  Logger.log(response.getContent());
}
