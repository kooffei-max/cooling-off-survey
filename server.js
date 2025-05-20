const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Google Sheets API設定
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1mGfu7H8tfE68YDUbvrg8MnT2zd1AAIaMKFi0GOu4vuk';
const SHEET_NAME = 'シート1';

// 認証情報の読み込み（環境変数またはファイルから）
let credentials;
try {
  if (process.env.GOOGLE_CREDENTIALS) {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } else {
    credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));
  }
} catch (error) {
  console.error('認証情報の読み込みに失敗しました:', error);
  process.exit(1);
}

// JWT認証クライアントの作成
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

// Google Sheets APIクライアントの作成
const sheets = google.sheets({ version: 'v4', auth });

// フォームデータ受信エンドポイント
app.post('/submit', async (req, res) => {
  try {
    const formData = req.body;
    
    // 現在の日時を取得
    const now = new Date();
    const submissionDate = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
    const submissionTime = now.toTimeString().split(' ')[0]; // HH:MM:SS形式
    
    // 名前の結合
    const fullName = `${formData.lastName || ''} ${formData.firstName || ''}`.trim();
    
    // 書面受領方法の取得
    const documentDeliveryMethod = formData.documentDeliveryMethod || '未回答';
    
    // 電子書面関連情報の取得
    const electronicConsent = formData.electronicConsent || '';
    const fileFormat = formData.fileFormat || '';
    const documentAccessible = formData.documentAccessible || '';
    
    // 電子書面の詳細情報（該当する場合のみ）
    let electronicDocumentDetails = '';
    if (documentDeliveryMethod === '電子メールに添付されていた' || documentDeliveryMethod === 'ウェブサイトからダウンロードした') {
      electronicDocumentDetails = `事前承諾: ${electronicConsent}, ファイル形式: ${fileFormat}, 閲覧可否: ${documentAccessible}`;
    }
    
    // 契約方法の詳細
    let contractMethodDetail = formData.contractMethod || '';
    if (formData.contractMethod === 'other' && formData.otherContractMethod) {
      contractMethodDetail = `その他: ${formData.otherContractMethod}`;
    }
    
    // スプレッドシートに追加するデータの準備
    const values = [
      [
        formData.age || '',                                // 年齢
        fullName,                                          // 名前
        formData.gender || '',                             // 性別
        formData.companyName || '',                        // 契約先の会社名
        formData.contractAmount || '',                     // 金額
        formData.serviceName || '',                        // サービス名または商品名
        formData.phone || '',                              // 電話番号
        formData.email || '',                              // メールアドレス
        formData.contractDate || '',                       // 契約日
        formData.documentDate || '',                       // 書面受領日
        documentDeliveryMethod,                            // 書面の受領方法（紙／電子など）
        electronicDocumentDetails,                         // 電子書面の詳細情報
        contractMethodDetail,                              // 契約場所/方法
        formData.coolingOffResult || '',                   // 審査結果（高い/低い）
        submissionDate,                                    // 送信日
        submissionTime                                     // 送信時間
      ]
    ];
    
    try {
      // シートを完全にクリアする
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`,
      });
      
      // ヘッダー行を追加（A1から始める）
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            '年齢', '名前', '性別', '契約先会社名', '金額', 'サービス名', 
            '電話番号', 'メールアドレス', '契約日', '書面受領日', 
            '書面受領方法', '電子書面詳細', '契約方法', '審査結果', 
            '送信日', '送信時間'
          ]]
        }
      });
      
      // データを追加（A2から始める）
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });
      
      console.log('データが正常に記録されました:', response.data);
      res.status(200).json({ success: true, message: 'データが正常に記録されました' });
    } catch (error) {
      console.error('スプレッドシートへの書き込みエラー:', error);
      res.status(500).json({ success: false, message: 'スプレッドシートへの書き込み中にエラーが発生しました', error: error.message });
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).json({ success: false, message: 'データの記録中にエラーが発生しました', error: error.message });
  }
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: ポート ${PORT}`);
});
