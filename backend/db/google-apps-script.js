/**
 * KHH Telemedicine - Google Sheets Synchronization Script
 * 
 * วิธีการติดตั้งใน Google Sheets:
 * 1. เปิด Google Sheet ลิงก์: https://docs.google.com/spreadsheets/d/1j25Lz41DsmYkbQ8KOTI0Wfr0duo9kZvmC_N5zxMAKu8/edit
 * 2. ไปที่เมนูหลักด้านบน คลิก "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 3. ลบโค้ดเก่าในหน้าต่างออกทั้งหมด แล้วคัดลอกโค้ดไฟล์นี้ไปวางแทนที่
 * 4. กดปุ่มบันทึก 💾 (Save Project) ด้านบน
 * 5. กดปุ่ม "การใช้งานจริง" (Deploy) -> "การจัดการการใช้งานจริงใหม่" (New deployment)
 * 6. เลือกประเภทการใช้งานเป็น "เว็บแอป" (Web app)
 * 7. ตั้งค่าการกำหนดสิทธิ์:
 *    - อัปเดตคำอธิบาย (Description) เป็นอะไรก็ได้ เช่น: "Telemed69 Sync"
 *    - รันในฐานะ (Execute as): "ฉัน" (Me / อีเมลของคุณ)
 *    - ผู้มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone)
 * 8. กดปุ่ม "ใช้งานจริง" (Deploy)
 * 9. (ถ้ามี) กด "ให้สิทธิ์เข้าถึง" (Authorize access) และเลือกบัญชี Google ของคุณเพื่อกดยืนยันอนุญาตสิทธิ์
 * 10. คัดลอก "URL ของเว็บแอป" (Web app URL) ที่ได้ (จะขึ้นต้นด้วย https://script.google.com/macros/s/...)
 * 11. นำ URL นั้นไปวางในไฟล์ backend/.env ที่ตัวแปร `GOOGLE_SHEET_WEBAPP_URL`
 */

function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var action = json.action; // 'upsert', 'delete', 'bulk'
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Telemed69");
    
    if (!sheet) {
      // สร้างชีต Telemed69 ถ้าไม่มีอยู่
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Telemed69");
      sheet.appendRow([
        "ID", "HN", "ชื่อ-สกุล", "คลินิก/กลุ่มโรค", "ความดัน (BP)", "น้ำตาล (FBS)", 
        "สิทธิ์รักษา", "วันที่สั่งยา", "นัดครั้งต่อไปที่รพ", "หน่วยงานที่ทำ", 
        "ส่งยาไป", "วันที่จัดส่งยา", "เภสัชกร", "ยาฉีด", 
        "จนท รพสต ที่รับยา(ตอนเปิดกล่อง)", "วันที่ผู้ป่วยรับยา", "หมายเหตุ", "อัปเดตล่าสุด"
      ]);
    }
    
    var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    
    if (action === 'upsert') {
      var record = json.data;
      upsertRow(sheet, headers, record);
    } else if (action === 'delete') {
      var id = json.id;
      deleteRow(sheet, id);
    } else if (action === 'bulk') {
      var records = json.data;
      for (var i = 0; i < records.length; i++) {
        upsertRow(sheet, headers, records[i]);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function upsertRow(sheet, headers, p) {
  var idColIndex = headers.indexOf("ID") + 1;
  if (idColIndex === 0) idColIndex = 1;
  
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, idColIndex, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      if (idValues[i][0] === p.id) {
        foundRow = i + 2;
        break;
      }
    }
  }
  
  var clinicStr = Array.isArray(p.clinicTags) ? p.clinicTags.join(", ") : (p.clinicTags || "");
  
  // จัดเรียงฟิลด์ตามหัวตารางคอลัมน์
  var rowValues = [
    p.id,
    p.hn,
    p.name,
    clinicStr,
    p.bp || "",
    p.fbs || "",
    p.rights || "",
    p.orderDate || "",
    p.nextAppt || "",
    p.facility || "",
    p.sentTo || "",
    p.dispatchDate || "",
    p.pharmacist || "",
    p.injection || "",
    p.receivedBy || "",
    p.patientReceivedDate || "",
    p.notes || "",
    new Date()
  ];
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRow(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === id) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}
