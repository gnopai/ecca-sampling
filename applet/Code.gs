// ============================================================
// ECCA Roadside Litter Study — Google Apps Script Backend
// ============================================================
// Deploy as Web App:
//   Execute as: Me
//   Who has access: Anyone
// ============================================================

var SS_ID = ''; // Leave blank — script uses the bound spreadsheet
var BAGS_TAB   = 'Bags';
var ITEMS_TAB  = 'Items';

// ── Column definitions ───────────────────────────────────────
var BAG_COLS = [
  'timestamp','transect_id','bag_number','classifier_name',
  'date','bag_weight_lb','plastic_weight_lb','confirmed','field_notes'
];
var ITEM_COLS = [
  'timestamp','transect_id','bag_number','classifier',
  'material','functional_categories','likely_source',
  'brand','size','is_fragment','notes','confirmed'
];

// ── Helpers ──────────────────────────────────────────────────
function getSheet(name) {
  var ss = SS_ID ? SpreadsheetApp.openById(SS_ID)
                 : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" not found. Create it first.');
  return sh;
}

function ensureHeaders(sheet, cols) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols);
    sheet.getRange(1, 1, 1, cols.length)
         .setFontWeight('bold')
         .setBackground('#e8f5e9');
  }
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function corsResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── doGet ────────────────────────────────────────────────────
// Returns all rows from both tabs for Review/Orphan check
function doGet(e) {
  try {
    var bags  = sheetToObjects(getSheet(BAGS_TAB));
    var items = sheetToObjects(getSheet(ITEMS_TAB));
    return corsResponse({ ok: true, bags: bags, items: items });
  } catch(err) {
    return corsResponse({ ok: false, error: err.message });
  }
}

// ── doPost ───────────────────────────────────────────────────
// action values: "writeBag" | "writeItem" | "delete" |
//                "updateBagInfo" | "confirmBag"
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action  = payload.action;

    if (action === 'writeBag')     return doWriteBag(payload);
    if (action === 'writeItem')    return doWriteItem(payload);
    if (action === 'delete')       return doDelete(payload);
    if (action === 'updateBagInfo')return doUpdateBagInfo(payload);
    if (action === 'confirmBag')   return doConfirmBag(payload);

    return corsResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) {
    return corsResponse({ ok: false, error: err.message });
  }
}

// ── Write a Bag row ──────────────────────────────────────────
function doWriteBag(payload) {
  var sh = getSheet(BAGS_TAB);
  ensureHeaders(sh, BAG_COLS);
  var d = payload.data;
  sh.appendRow([
    d.timestamp, d.transect_id, d.bag_number, d.classifier_name || '',
    d.date, d.bag_weight_lb, d.plastic_weight_lb || '',
    d.confirmed || false, d.field_notes || ''
  ]);
  return corsResponse({ ok: true });
}

// ── Write an Item row ────────────────────────────────────────
function doWriteItem(payload) {
  var sh = getSheet(ITEMS_TAB);
  ensureHeaders(sh, ITEM_COLS);
  var d = payload.data;
  sh.appendRow([
    d.timestamp, d.transect_id, d.bag_number, d.classifier || '',
    d.material || '', d.functional_categories || '',
    d.likely_source || '', d.brand || '',
    d.size || '', d.is_fragment || false,
    d.notes || '', d.confirmed || false
  ]);
  return corsResponse({ ok: true });
}

// ── Delete a row by timestamp ────────────────────────────────
// payload: { tab, timestamp }
function doDelete(payload) {
  var sh = getSheet(payload.tab);
  var data = sh.getDataRange().getValues();
  var headers = data[0];
  var tsCol = headers.indexOf('timestamp');
  if (tsCol < 0) return corsResponse({ ok: false, error: 'No timestamp column' });

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][tsCol]) === String(payload.timestamp)) {
      sh.deleteRow(i + 1);
      return corsResponse({ ok: true });
    }
  }
  return corsResponse({ ok: false, error: 'Row not found' });
}

// ── Update bag info (transect_id + bag_number) ───────────────
// Updates the Bags row and all matching Items rows
// payload: { oldTransectId, oldBagNumber, newTransectId, newBagNumber }
function doUpdateBagInfo(payload) {
  var oldTid = String(payload.oldTransectId).trim();
  var oldBag = String(payload.oldBagNumber).trim();
  var newTid = String(payload.newTransectId).trim();
  var newBag = String(payload.newBagNumber).trim();

  // Update Bags tab
  _updateRows(getSheet(BAGS_TAB), oldTid, oldBag, newTid, newBag);
  // Update Items tab
  _updateRows(getSheet(ITEMS_TAB), oldTid, oldBag, newTid, newBag);

  return corsResponse({ ok: true });
}

function _updateRows(sh, oldTid, oldBag, newTid, newBag) {
  var data = sh.getDataRange().getValues();
  var headers = data[0];
  var tidCol = headers.indexOf('transect_id');
  var bagCol = headers.indexOf('bag_number');
  if (tidCol < 0 || bagCol < 0) return;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][tidCol]).trim() === oldTid &&
        String(data[i][bagCol]).trim() === oldBag) {
      sh.getRange(i + 1, tidCol + 1).setValue(newTid);
      sh.getRange(i + 1, bagCol + 1).setValue(newBag);
    }
  }
}

// ── Confirm a bag: set confirmed=true on bag + all its items ─
// Also writes plastic_weight_lb on the Bag row
// payload: { transect_id, bag_number, plastic_weight_lb }
function doConfirmBag(payload) {
  var tid = String(payload.transect_id).trim();
  var bag = String(payload.bag_number).trim();

  // Update Bags tab
  var bsh   = getSheet(BAGS_TAB);
  var bdata = bsh.getDataRange().getValues();
  var bh    = bdata[0];
  var bTid  = bh.indexOf('transect_id');
  var bBag  = bh.indexOf('bag_number');
  var bConf = bh.indexOf('confirmed');
  var bPlastic = bh.indexOf('plastic_weight_lb');

  for (var i = 1; i < bdata.length; i++) {
    if (String(bdata[i][bTid]).trim() === tid &&
        String(bdata[i][bBag]).trim() === bag) {
      if (bConf >= 0)    bsh.getRange(i+1, bConf+1).setValue(true);
      if (bPlastic >= 0) bsh.getRange(i+1, bPlastic+1).setValue(payload.plastic_weight_lb || '');
    }
  }

  // Update Items tab
  var ish   = getSheet(ITEMS_TAB);
  var idata = ish.getDataRange().getValues();
  var ih    = idata[0];
  var iTid  = ih.indexOf('transect_id');
  var iBag  = ih.indexOf('bag_number');
  var iConf = ih.indexOf('confirmed');

  for (var j = 1; j < idata.length; j++) {
    if (String(idata[j][iTid]).trim() === tid &&
        String(idata[j][iBag]).trim() === bag) {
      if (iConf >= 0) ish.getRange(j+1, iConf+1).setValue(true);
    }
  }

  return corsResponse({ ok: true });
}
