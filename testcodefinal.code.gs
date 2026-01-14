// ============================================
// SEVERINA KITCHEN DISPLAY - GOOGLE APPS SCRIPT
// ============================================

// CONFIGURATION
const CONFIG = {
  SHEET_ID: '1RyMQ_73Gm9ub6EccABapzn9JgDra_79LZCX6ko_2KbU',
  ORDERS_SHEET_NAME: 'ORDERING_SHEET',
  TIMEZONE: 'GMT',
  N8N_WEBHOOK_URL: 'https://n8n.srv1186827.hstgr.cloud/webhook/kitchen-ready', // Leave empty for now, add later when you set up n8n
};

// ============================================
// WEB APP HANDLERS
// ============================================

// Handle GET requests (serve HTML page and handle all actions)
function doGet(e) {
  const page = e.parameter.page;
  const action = e.parameter.action;

  // --- 1. HANDLE API ACTIONS (fetching data) ---
  if (action === 'getOrders') return getOrders();
  if (action === 'startCooking') return startCooking(e.parameter.orderId, e.parameter.staff);
  if (action === 'markReady') return markReady(e.parameter.orderId);
  // Check menu item availability
  if (action === 'checkAvailability') {
    const itemName = e.parameter.itemName;
    if (!itemName) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'itemName parameter required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const result = checkItemAvailability(itemName);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // NEW: Handle Menu Status fetching
  if (action === 'getMenuStatus') {
    const result = getMenuStatus(); // This calls your existing getMenuStatus function
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // NEW: Handle Menu Status updating
  if (action === 'updateMenuStatus') {
    const result = updateMenuStatus(e.parameter.itemName, e.parameter.status, e.parameter.staff);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // --- 2. HANDLE PAGE LOADING (showing HTML) ---
  
  // If the URL has ?page=menu, show the menu manager
  if (page === 'menu') {
    return HtmlService.createHtmlOutputFromFile('menu_manager')
      .setTitle('Menu Manager - Severina Plus')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Default: Show the Kitchen Display
  return HtmlService.createHtmlOutputFromFile('kitchen_display')
    .setTitle('Severina Kitchen Display')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
// ============================================
// ORDER MANAGEMENT FUNCTIONS
// ============================================

// Get all orders (Pending and In Progress)
function getOrders() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + CONFIG.ORDERS_SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Return empty if only headers
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        pending: [],
        cooking: [],
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    const pending = [];
    const cooking = [];
    
    // Process rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[colIndices.STATUS];
      
      // Skip if no ORDER_ID (empty row)
      if (!row[colIndices.ORDER_ID]) continue;
      
      // Only include Pending or In Progress orders
      if (status === 'Pending' || status === 'In Progress') {
        const order = {
          rowIndex: i + 1, // Store row index for updates
          orderId: row[colIndices.ORDER_ID] || '',
          customerName: row[colIndices.CUSTOMER_NAME] || '',
          phone: row[colIndices.PHONE] || '',
          items: row[colIndices.ITEMS] || '',
          quantity: row[colIndices.QUANTITY] || '',
          deliveryOption: row[colIndices.DELIVERY_OPTION] || '',
          amount: row[colIndices.AMOUNT] || '',
          time: row[colIndices.TIME] || '',
          date: row[colIndices.DATE] || '',
          status: status,
          acceptedBy: row[colIndices.ACCEPTED_BY] || '',
          acceptedAt: row[colIndices.ACCEPTED_AT] || '',
           updated: row[colIndices.ORDER_UPDATED] === 'YES'
        };
        
        if (status === 'Pending') {
          pending.push(order);
        } else {
          cooking.push(order);
        }
      }
    }
    
    const result = {
      pending: pending,
      cooking: cooking,
      timestamp: new Date().toISOString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in getOrders: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      pending: [], 
      cooking: [], 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Start cooking an order
function startCooking(orderId, staff) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    // Find the order row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[colIndices.ORDER_ID] === orderId && row[colIndices.STATUS] === 'Pending') {
        const rowNum = i + 1;
        
        // Update STATUS to "In Progress"
        sheet.getRange(rowNum, colIndices.STATUS + 1).setValue('In Progress');
        
        // Set ACCEPTED_BY
        sheet.getRange(rowNum, colIndices.ACCEPTED_BY + 1).setValue(staff);
        
        // Set ACCEPTED_AT timestamp
        const timestamp = new Date();
        const formattedTime = Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(rowNum, colIndices.ACCEPTED_AT + 1).setValue(formattedTime);
        
        Logger.log('Order ' + orderId + ' started by ' + staff);
        
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true,
          orderId: orderId,
          staff: staff
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    throw new Error('Order not found or already in progress');
    
  } catch (error) {
    Logger.log('Error in startCooking: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Mark order as ready
function markReady(orderId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    // Find the order row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[colIndices.ORDER_ID] === orderId && row[colIndices.STATUS] === 'In Progress') {
        const rowNum = i + 1;
        
        // Update STATUS to "Ready"
        sheet.getRange(rowNum, colIndices.STATUS + 1).setValue('Ready');
        
        // Set READY_AT timestamp
        const timestamp = new Date();
        const formattedTime = Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
        sheet.getRange(rowNum, colIndices.READY_AT + 1).setValue(formattedTime);
        
        Logger.log('Order ' + orderId + ' marked as ready');
        
        // Get order details for webhook (if n8n is configured)
        if (CONFIG.N8N_WEBHOOK_URL) {
          const orderData = {
            orderId: orderId,
            customerName: row[colIndices.CUSTOMER_NAME],
            phone: row[colIndices.PHONE],
            items: row[colIndices.ITEMS],
            quantity: row[colIndices.QUANTITY],
            deliveryOption: row[colIndices.DELIVERY_OPTION],
            amount: row[colIndices.AMOUNT],
            deliveryZone: row[colIndices.DELIVERY_ZONE] || 'N/A', 
            deliveryFee: row[colIndices.DELIVERY_FEE] || '0', 
            totalAmount: row[colIndices.TOTAL_AMOUNT] || row[colIndices.AMOUNT],
            acceptedBy: row[colIndices.ACCEPTED_BY],
            readyAt: formattedTime
          };
          
          // Trigger n8n webhook
          triggerN8nWebhook(orderData);
        }
        
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true,
          orderId: orderId
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    throw new Error('Order not found or not in progress');
    
  } catch (error) {
    Logger.log('Error in markReady: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// N8N WEBHOOK INTEGRATION (Optional)
// ============================================

// Trigger n8n webhook when order is ready
function triggerN8nWebhook(orderData) {
  if (!CONFIG.N8N_WEBHOOK_URL) {
    Logger.log('N8N webhook not configured, skipping');
    return;
  }
  
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        event: 'order_ready',
        data: orderData
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.N8N_WEBHOOK_URL, options);
    Logger.log('Webhook triggered successfully: ' + response.getContentText());
    
  } catch (error) {
    Logger.log('Error triggering webhook: ' + error.toString());
    // Don't throw - we don't want to fail the order update if webhook fails
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Test function to verify setup
function testSetup() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
    
    if (!sheet) {
      Logger.log('ERROR: Sheet not found - ' + CONFIG.ORDERS_SHEET_NAME);
      return false;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('✅ Sheet found! Headers: ' + headers.join(', '));
    
    // Check required columns
    const requiredColumns = [
      'ORDER_ID', 'PHONE', 'CUSTOMER_NAME', 'ITEMS', 'QUANTITY', 
      'DELIVERY_OPTION', 'AMOUNT', 'STATUS', 'DATE', 'TIME',
      'ACCEPTED_BY', 'ACCEPTED_AT', 'READY_AT'
    ];
    
    const missingColumns = [];
    
    requiredColumns.forEach(col => {
      if (!headers.includes(col)) {
        missingColumns.push(col);
      }
    });
    
    if (missingColumns.length > 0) {
      Logger.log('⚠️ WARNING: Missing columns: ' + missingColumns.join(', '));
      Logger.log('Please add these columns to your sheet!');
    } else {
      Logger.log('✅ SUCCESS: All required columns present!');
    }
    
    return true;
    
  } catch (error) {
    Logger.log('❌ ERROR in testSetup: ' + error.toString());
    return false;
  }
}

// Test HTML file loading
function testHtmlFile() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('kitchen_display');
    const content = html.getContent();
    
    Logger.log('✅ SUCCESS! HTML file loaded.');
    Logger.log('First 200 chars: ' + content.substring(0, 200));
    Logger.log('Total length: ' + content.length + ' characters');
    
    if (content.startsWith('<!DOCTYPE html>')) {
      Logger.log('✅ HTML starts with correct DOCTYPE');
    } else {
      Logger.log('⚠️ WARNING: HTML does not start with DOCTYPE');
      Logger.log('Actually starts with: ' + content.substring(0, 50));
    }
    
    return true;
    
  } catch (error) {
    Logger.log('❌ ERROR loading HTML file:');
    Logger.log(error.toString());
    return false;
  }
}
function debugGetOrders() {
  const result = getOrders();
  const content = result.getContent();
  Logger.log('Result: ' + content);
  
  const data = JSON.parse(content);
  Logger.log('Pending orders: ' + data.pending.length);
  Logger.log('Cooking orders: ' + data.cooking.length);
  
  if (data.pending.length > 0) {
    Logger.log('First pending order: ' + JSON.stringify(data.pending[0]));
  }
}
function simpleTest() {
  Logger.log('=== STARTING TEST ===');
  
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  Logger.log('Sheet opened');
  
  const sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
  Logger.log('Sheet found: ' + sheet.getName());
  
  const data = sheet.getDataRange().getValues();
  Logger.log('Total rows: ' + data.length);
  
  const headers = data[0];
  Logger.log('Headers: ' + headers.join(', '));
  
  if (data.length > 1) {
    Logger.log('Row 2 data: ' + data[1].join(' | '));
    
    // Find STATUS column
    const statusIndex = headers.indexOf('STATUS');
    Logger.log('STATUS column index: ' + statusIndex);
    Logger.log('STATUS value in row 2: "' + data[1][statusIndex] + '"');
  }
  
  Logger.log('=== TEST COMPLETE ===');
}
// ============================================
// MENU AVAILABILITY MANAGEMENT
// ============================================

// Get menu status for display
function getMenuStatus() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const menuSheet = ss.getSheetByName('MENU_STATUS');
    
    if (!menuSheet) {
      return {
        success: false,
        error: 'MENU_STATUS sheet not found'
      };
    }
    
    const data = menuSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        items: []
      };
    }
    
    const headers = data[0];
    const menuItems = [];
    
    // Build column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim().toUpperCase();
      colIndices[cleanHeader] = index;
    });
    
    // Process menu items
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      menuItems.push({
        rowIndex: i + 1,
        category: row[colIndices['CATEGORY']] || '',
        itemName: row[colIndices['ITEM_NAME']] || '',
        status: (row[colIndices['STATUS']] || '').toString().trim(),
        lastUpdated: row[colIndices['LAST_UPDATED']] || '',
        updatedBy: row[colIndices['UPDATED_BY']] || ''
      });
    }
    
    return {
      success: true,
      items: menuItems
    };
    
  } catch (error) {
    Logger.log('Error in getMenuStatus: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Update menu item status
function updateMenuStatus(itemName, newStatus, staffName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const menuSheet = ss.getSheetByName('MENU_STATUS');
    
    if (!menuSheet) {
      return {
        success: false,
        error: 'MENU_STATUS sheet not found'
      };
    }
    
    const data = menuSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Build column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim().toUpperCase();
      colIndices[cleanHeader] = index;
    });
    
    // Find the item
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const currentItemName = row[colIndices['ITEM_NAME']];
      
      if (currentItemName === itemName) {
        const rowNum = i + 1;
        
        // Update STATUS
        menuSheet.getRange(rowNum, colIndices['STATUS'] + 1).setValue(newStatus);
        
        // Update LAST_UPDATED
        const timestamp = new Date();
        const formattedTime = Utilities.formatDate(timestamp, 'GMT', 'yyyy-MM-dd HH:mm:ss');
        menuSheet.getRange(rowNum, colIndices['LAST_UPDATED'] + 1).setValue(formattedTime);
        
        // Update UPDATED_BY
        menuSheet.getRange(rowNum, colIndices['UPDATED_BY'] + 1).setValue(staffName);
        
        Logger.log('Updated ' + itemName + ' to ' + newStatus + ' by ' + staffName);
        
        return {
          success: true,
          itemName: itemName,
          newStatus: newStatus,
          updatedBy: staffName,
          timestamp: formattedTime
        };
      }
    }
    
    return {
      success: false,
      error: 'Item not found: ' + itemName
    };
    
  } catch (error) {
    Logger.log('Error in updateMenuStatus: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Check if specific item is available (for AI/n8n)
function checkItemAvailability(itemName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const menuSheet = ss.getSheetByName('MENU_STATUS');
    
    if (!menuSheet) {
      // If sheet doesn't exist, assume everything is available
      return {
        success: true,
        available: true,
        itemName: itemName
      };
    }
    
    const data = menuSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Build column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim().toUpperCase();
      colIndices[cleanHeader] = index;
    });
    
    // Search for the item (fuzzy matching)
    const searchTerm = itemName.toLowerCase().trim();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const menuItemName = (row[colIndices['ITEM_NAME']] || '').toString().toLowerCase().trim();
      const status = (row[colIndices['STATUS']] || '').toString().trim();
      
      // Check if item name matches (contains search term or exact match)
      if (menuItemName.includes(searchTerm) || searchTerm.includes(menuItemName)) {
        const isAvailable = status === 'Available';
        
        return {
          success: true,
          available: isAvailable,
          itemName: row[colIndices['ITEM_NAME']],
          status: status
        };
      }
    }
    
    // Item not found in menu - assume available (new item or extra)
    return {
      success: true,
      available: true,
      itemName: itemName,
      status: 'Not tracked'
    };
    
  } catch (error) {
    Logger.log('Error in checkItemAvailability: ' + error.toString());
    // On error, assume available (fail-safe)
    return {
      success: true,
      available: true,
      itemName: itemName,
      error: error.toString()
    };
  }
}

// Get all unavailable items (for AI to suggest alternatives)
function getUnavailableItems() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const menuSheet = ss.getSheetByName('MENU_STATUS');
    
    if (!menuSheet) {
      return {
        success: true,
        unavailableItems: []
      };
    }
    
    const data = menuSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Build column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim().toUpperCase();
      colIndices[cleanHeader] = index;
    });
    
    const unavailable = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = (row[colIndices['STATUS']] || '').toString().trim();
      
      if (status === 'Out of Stock') {
        unavailable.push({
          category: row[colIndices['CATEGORY']],
          itemName: row[colIndices['ITEM_NAME']]
        });
      }
    }
    
    return {
      success: true,
      unavailableItems: unavailable
    };
    
  } catch (error) {
    Logger.log('Error in getUnavailableItems: ' + error.toString());
    return {
      success: true,
      unavailableItems: []
    };
  }
}

// Get available items by category (for AI suggestions)
function getAvailableItemsByCategory(category) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const menuSheet = ss.getSheetByName('MENU_STATUS');
    
    if (!menuSheet) {
      return {
        success: true,
        availableItems: []
      };
    }
    
    const data = menuSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Build column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim().toUpperCase();
      colIndices[cleanHeader] = index;
    });
    
    const available = [];
    const searchCategory = category.toLowerCase().trim();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const itemCategory = (row[colIndices['CATEGORY']] || '').toString().toLowerCase().trim();
      const status = (row[colIndices['STATUS']] || '').toString().trim();
      
      if (itemCategory === searchCategory && status === 'Available') {
        available.push(row[colIndices['ITEM_NAME']]);
      }
    }
    
    return {
      success: true,
      category: category,
      availableItems: available
    };
    
  } catch (error) {
    Logger.log('Error in getAvailableItemsByCategory: ' + error.toString());
    return {
      success: true,
      category: category,
      availableItems: []
    };
  }
}
function testDoGet() {
  // Simulate the menu page request
  var e = {
    parameter: {
      page: 'menu'
    }
  };
  
  var result = doGet(e);
  Logger.log('=== TESTING doGet(page=menu) ===');
  Logger.log('Result type: ' + typeof result);
  Logger.log('Has getContent: ' + (typeof result.getContent === 'function'));
  
  if (typeof result.getContent === 'function') {
    var content = result.getContent();
    Logger.log('Content length: ' + content.length);
    Logger.log('First 200 chars: ' + content.substring(0, 200));
  }
  
  return result;
}
function testMenuManagerFile() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('menu_manager');
    var content = html.getContent();
    
    Logger.log('=== MENU MANAGER FILE TEST ===');
    Logger.log('✅ File found!');
    Logger.log('Content length: ' + content.length);
    Logger.log('First 200 chars: ' + content.substring(0, 200));
    
    if (content.includes('Menu Manager')) {
      Logger.log('✅ Content looks correct - contains "Menu Manager"');
    } else {
      Logger.log('⚠️ WARNING: Content does not contain "Menu Manager"');
    }
    
    return true;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    Logger.log('The file "menu_manager" does NOT exist or has a different name!');
    return false;
  }
}
function testDoGetLive() {
  // Test with page=menu parameter
  var e = {
    parameter: {
      page: 'menu'
    }
  };
  
  Logger.log('=== TESTING LIVE doGet ===');
  Logger.log('Parameter page: ' + e.parameter.page);
  
  var result = doGet(e);
  
  Logger.log('Result type: ' + typeof result);
  
  if (typeof result.getContent === 'function') {
    var content = result.getContent();
    Logger.log('Content length: ' + content.length);
    Logger.log('Title in content: ' + (content.includes('Menu Manager') ? 'YES' : 'NO'));
    Logger.log('Kitchen in content: ' + (content.includes('SEVERINA PLUS KITCHEN') ? 'YES' : 'NO'));
    Logger.log('First 300 chars: ' + content.substring(0, 300));
  }
}
