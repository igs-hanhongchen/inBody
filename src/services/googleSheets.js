// Google Sheets 服務 - 使用 Google Identity Services (GIS)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SHEETS_RANGE = import.meta.env.VITE_SHEETS_RANGE;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets openid profile';

let tokenClient = null;
let accessToken = null;
let gapiInited = false;
let gisInited = false;

// 載入 GAPI client
function loadGapiClient() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({});
          await window.gapi.client.load('sheets', 'v4');
          gapiInited = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 載入 Google Identity Services
function loadGisClient() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // 稍後設定
      });
      gisInited = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 初始化 Google API
export const initGoogleAPI = async () => {
  try {
    await Promise.all([loadGapiClient(), loadGisClient()]);
    
    // 嘗試從 sessionStorage 恢復 token
    const savedToken = sessionStorage.getItem('gapi_access_token');
    if (savedToken) {
      accessToken = savedToken;
      window.gapi.client.setToken({ access_token: accessToken });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Google API:', error);
    throw error;
  }
};

// 檢查是否已登入
export const isSignedIn = () => {
  return !!accessToken;
};

// 登入
export const signIn = () => {
  return new Promise((resolve) => {
    if (!tokenClient) {
      resolve({ success: false, error: 'Google Identity Services 未初始化' });
      return;
    }
    
    tokenClient.callback = async (response) => {
      if (response.error) {
        console.error('Token error:', response);
        resolve({ success: false, error: response.error_description || response.error });
        return;
      }
      
      accessToken = response.access_token;
      window.gapi.client.setToken({ access_token: accessToken });
      
      // 儲存 token 到 sessionStorage
      sessionStorage.setItem('gapi_access_token', accessToken);
      
      resolve({ success: true });
    };
    
    // 請求 access token
    if (accessToken === null) {
      // 首次登入，需要彈出同意畫面
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // 已有 token，直接請求新的
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// 登出
export const signOut = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Token revoked');
    });
  }
  accessToken = null;
  window.gapi.client.setToken(null);
  sessionStorage.removeItem('gapi_access_token');
  return true;
};

// 獲取當前用戶資訊 (使用 People API)
export const getCurrentUser = async () => {
  if (!accessToken) return null;
  
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return {
      name: data.name,
      email: data.email,
      imageUrl: data.picture,
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// 從 Google Sheets 讀取數據
export const readSheetData = async () => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEETS_RANGE,
    });
    
    const values = response.result.values;
    if (!values || values.length === 0) {
      return [];
    }
    
    // 跳過標題行（假設第一行是標題）
    const dataRows = values.slice(1);
    
    // 將數據轉換為物件格式
    // 欄位順序：日期, 體重, BMI, 體脂, 肌肉量, 推定骨量, 內臟脂肪, 基礎代謝, 體內年齡
    const records = dataRows.map((row) => ({
      date: row[0] || '',
      weight: parseFloat(row[1]) || 0,
      bmi: parseFloat(row[2]) || 0,
      fat: parseFloat(row[3]) || 0,
      muscle: parseFloat(row[4]) || 0,
      bone: parseFloat(row[5]) || 0,
      visceral: parseFloat(row[6]) || 0,
      calories: parseFloat(row[7]) || 0,
      age: parseInt(row[8]) || 0,
    }));
    
    return records;
  } catch (error) {
    console.error('Error reading sheet data:', error);
    throw error;
  }
};

// 寫入新記錄到 Google Sheets
// 欄位順序：日期, 體重, BMI, 體脂, 肌肉量, 推定骨量, 內臟脂肪, 基礎代謝, 體內年齡
export const appendSheetData = async (record) => {
  try {
    const values = [[
      record.date,
      record.weight,
      record.bmi,
      record.fat,
      record.muscle,
      record.bone,
      record.visceral,
      record.calories,
      record.age,
    ]];
    
    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEETS_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values,
      },
    });
    
    return response.result;
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
};

// 監聽登入狀態變化（GIS 不支援自動監聽，所以這是空函數）
export const onSignInChange = (callback) => {
  // GIS 不支援自動狀態監聽
  // 需要手動調用
};
