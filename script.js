// グローバル変数
let currentStep = 1;
const totalSteps = 5;
let formData = {};
let transactionType = '';
let coolingOffPeriod = 0;
let coolingOffResult = '';
let documentDeliveryMethod = '';
let electronicDocumentValid = true;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    updateProgressBar();
});

// プログレスバーの更新
function updateProgressBar() {
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress').style.width = `${progressPercent}%`;
    
    // ステップインジケーターの更新
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// 次のステップへ進む
function nextStep(step) {
    // 現在のステップのバリデーション
    if (!validateStep(step)) {
        return;
    }
    
    // フォームデータの収集
    collectFormData(step);
    
    // 現在のステップを非表示
    document.getElementById(`step-${step}`).style.display = 'none';
    
    // 次のステップを表示
    currentStep = step + 1;
    document.getElementById(`step-${currentStep}`).style.display = 'block';
    
    // ステップ4の場合、動的質問を生成
    if (currentStep === 4) {
        generateDynamicQuestions();
    }
    
    // ステップ5の場合、結果を計算して表示
    if (currentStep === 5) {
        calculateResult();
    }
    
    // プログレスバーの更新
    updateProgressBar();
    
    // ページトップにスクロール
    window.scrollTo(0, 0);
}

// 前のステップに戻る
function prevStep(step) {
    // 現在のステップを非表示
    document.getElementById(`step-${step}`).style.display = 'none';
    
    // 前のステップを表示
    currentStep = step - 1;
    document.getElementById(`step-${currentStep}`).style.display = 'block';
    
    // プログレスバーの更新
    updateProgressBar();
    
    // ページトップにスクロール
    window.scrollTo(0, 0);
}

// ステップのバリデーション
function validateStep(step) {
    let isValid = true;
    const currentStepElement = document.getElementById(`step-${step}`);
    
    // 必須項目のチェック
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value) {
            field.classList.add('error');
            isValid = false;
            
            // エラーメッセージがなければ追加
            let errorMsg = field.parentElement.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('p');
                errorMsg.className = 'error-message';
                errorMsg.style.color = '#e74c3c';
                errorMsg.style.fontSize = '14px';
                errorMsg.style.marginTop = '5px';
                errorMsg.textContent = '※この項目は必須です';
                field.parentElement.appendChild(errorMsg);
            }
        } else {
            field.classList.remove('error');
            const errorMsg = field.parentElement.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
    
    // ラジオボタンのチェック
    const radioGroups = currentStepElement.querySelectorAll('.radio-group');
    radioGroups.forEach(group => {
        const radioInputs = group.querySelectorAll('input[type="radio"]');
        const isRequired = Array.from(radioInputs).some(input => input.hasAttribute('required'));
        
        if (isRequired) {
            const isChecked = Array.from(radioInputs).some(input => input.checked);
            
            if (!isChecked) {
                isValid = false;
                
                // エラーメッセージがなければ追加
                let errorMsg = group.parentElement.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.fontSize = '14px';
                    errorMsg.style.marginTop = '5px';
                    errorMsg.textContent = '※選択してください';
                    group.parentElement.appendChild(errorMsg);
                }
            } else {
                const errorMsg = group.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        }
    });
    
    // ステップ3の特別なバリデーション
    if (step === 3) {
        const receivedDocument = document.querySelector('input[name="receivedDocument"]:checked');
        
        if (receivedDocument && receivedDocument.value === 'はい') {
            const documentType = document.querySelector('input[name="documentType"]:checked');
            const documentDate = document.getElementById('documentDate').value;
            const documentDeliveryMethod = document.querySelector('input[name="documentDeliveryMethod"]:checked');
            
            if (!documentType) {
                isValid = false;
                let errorMsg = document.getElementById('documentTypeGroup').querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.fontSize = '14px';
                    errorMsg.style.marginTop = '5px';
                    errorMsg.textContent = '※選択してください';
                    document.getElementById('documentTypeGroup').appendChild(errorMsg);
                }
            }
            
            if (!documentDeliveryMethod) {
                isValid = false;
                let errorMsg = document.getElementById('documentDeliveryMethodGroup').querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.fontSize = '14px';
                    errorMsg.style.marginTop = '5px';
                    errorMsg.textContent = '※選択してください';
                    document.getElementById('documentDeliveryMethodGroup').appendChild(errorMsg);
                }
            }
            
            // 電子書面の場合の追加バリデーション
            if (documentDeliveryMethod && (documentDeliveryMethod.value === '電子メールに添付されていた' || documentDeliveryMethod.value === 'ウェブサイトからダウンロードした')) {
                const electronicConsent = document.querySelector('input[name="electronicConsent"]:checked');
                const fileFormat = document.querySelector('input[name="fileFormat"]:checked');
                const documentAccessible = document.querySelector('input[name="documentAccessible"]:checked');
                
                if (!electronicConsent) {
                    isValid = false;
                    let errorMsg = document.querySelector('[name="electronicConsent"]').closest('.form-group').querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#e74c3c';
                        errorMsg.style.fontSize = '14px';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.textContent = '※選択してください';
                        document.querySelector('[name="electronicConsent"]').closest('.form-group').appendChild(errorMsg);
                    }
                }
                
                if (!fileFormat) {
                    isValid = false;
                    let errorMsg = document.querySelector('[name="fileFormat"]').closest('.form-group').querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#e74c3c';
                        errorMsg.style.fontSize = '14px';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.textContent = '※選択してください';
                        document.querySelector('[name="fileFormat"]').closest('.form-group').appendChild(errorMsg);
                    }
                }
                
                if (!documentAccessible) {
                    isValid = false;
                    let errorMsg = document.querySelector('[name="documentAccessible"]').closest('.form-group').querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#e74c3c';
                        errorMsg.style.fontSize = '14px';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.textContent = '※選択してください';
                        document.querySelector('[name="documentAccessible"]').closest('.form-group').appendChild(errorMsg);
                    }
                }
            }
            
            // その他の受領方法の場合
            if (documentDeliveryMethod && documentDeliveryMethod.value === 'その他') {
                const otherDeliveryMethod = document.getElementById('otherDeliveryMethod').value;
                if (!otherDeliveryMethod) {
                    isValid = false;
                    let errorMsg = document.getElementById('otherDeliveryMethodGroup').querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#e74c3c';
                        errorMsg.style.fontSize = '14px';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.textContent = '※詳細を入力してください';
                        document.getElementById('otherDeliveryMethodGroup').appendChild(errorMsg);
                    }
                }
            }
            
            if (!documentDate) {
                isValid = false;
                let errorMsg = document.getElementById('documentDateGroup').querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.fontSize = '14px';
                    errorMsg.style.marginTop = '5px';
                    errorMsg.textContent = '※日付を入力してください';
                    document.getElementById('documentDateGroup').appendChild(errorMsg);
                }
            }
        }
    }
    
    if (!isValid) {
        alert('入力内容に不備があります。必須項目を入力してください。');
    }
    
    return isValid;
}

// フォームデータの収集
function collectFormData(step) {
    const currentStepElement = document.getElementById(`step-${step}`);
    
    // テキスト、数値、日付、セレクトボックスの値を取得
    const inputs = currentStepElement.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], input[type="date"], select');
    inputs.forEach(input => {
        formData[input.name] = input.value;
    });
    
    // ラジオボタンの値を取得
    const radioGroups = currentStepElement.querySelectorAll('.radio-group');
    radioGroups.forEach(group => {
        const radioInputs = group.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            if (radio.checked) {
                formData[radio.name] = radio.value;
            }
        });
    });
    
    // 契約方法から取引類型を判定
    if (step === 3) {
        const contractMethod = document.getElementById('contractMethod').value;
        determineTransactionType(contractMethod);
        
        // 書面受領方法の判定
        const documentDeliveryMethodInput = document.querySelector('input[name="documentDeliveryMethod"]:checked');
        if (documentDeliveryMethodInput) {
            documentDeliveryMethod = documentDeliveryMethodInput.value;
            
            // 電子書面の有効性判定
            if (documentDeliveryMethod === '電子メールに添付されていた' || documentDeliveryMethod === 'ウェブサイトからダウンロードした') {
                const electronicConsent = document.querySelector('input[name="electronicConsent"]:checked')?.value;
                const fileFormat = document.querySelector('input[name="fileFormat"]:checked')?.value;
                const documentAccessible = document.querySelector('input[name="documentAccessible"]:checked')?.value;
                
                // 電子書面が有効かどうかの判定
                electronicDocumentValid = (
                    electronicConsent === 'はい' && 
                    (fileFormat === 'PDF' || fileFormat === '画像') && 
                    documentAccessible === 'はい'
                );
            }
        }
    }
}

// 取引類型の判定
function determineTransactionType(contractMethod) {
    switch (contractMethod) {
        case 'home_visit':
        case 'workplace_visit':
        case 'street_catch':
        case 'appointment':
            transactionType = 'door_to_door';  // 訪問販売
            coolingOffPeriod = 8;
            break;
        case 'phone':
            transactionType = 'telemarketing';  // 電話勧誘販売
            coolingOffPeriod = 8;
            break;
        case 'esthetic':
        case 'beauty_medical':
        case 'language_school':
        case 'home_tutor':
        case 'cram_school':
        case 'pc_school':
        case 'marriage_service':
            transactionType = 'specific_continuous';  // 特定継続的役務提供
            coolingOffPeriod = 8;
            break;
        case 'visit_purchase':
            transactionType = 'visit_purchase';  // 訪問購入
            coolingOffPeriod = 8;
            break;
        case 'mlm':
            transactionType = 'mlm';  // 連鎖販売取引
            coolingOffPeriod = 20;
            break;
        case 'work_opportunity':
            transactionType = 'business_opportunity';  // 業務提供誘引販売取引
            coolingOffPeriod = 20;
            break;
        case 'online_shopping':
        case 'catalog_shopping':
            transactionType = 'mail_order';  // 通信販売
            coolingOffPeriod = 0;  // クーリングオフ適用外
            break;
        case 'store':
            transactionType = 'store';  // 店舗販売
            coolingOffPeriod = 0;  // クーリングオフ適用外
            break;
        default:
            transactionType = 'other';
            coolingOffPeriod = 0;
            break;
    }
}

// 書面受領関連フィールドの表示/非表示切り替え
function toggleDocumentFields(show) {
    const documentTypeGroup = document.getElementById('documentTypeGroup');
    const documentDeliveryMethodGroup = document.getElementById('documentDeliveryMethodGroup');
    const documentDateGroup = document.getElementById('documentDateGroup');
    
    if (show) {
        documentTypeGroup.style.display = 'block';
        documentDeliveryMethodGroup.style.display = 'block';
        documentDateGroup.style.display = 'block';
        document.getElementById('documentDate').setAttribute('required', '');
    } else {
        documentTypeGroup.style.display = 'none';
        documentDeliveryMethodGroup.style.display = 'none';
        documentDateGroup.style.display = 'none';
        document.getElementById('documentDate').removeAttribute('required');
        
        // 電子書面関連フィールドも非表示
        document.getElementById('electronicDocumentQuestions').style.display = 'none';
        document.getElementById('otherDeliveryMethodGroup').style.display = 'none';
    }
}

// 電子書面関連フィールドの表示/非表示切り替え
function toggleElectronicDocumentFields(show) {
    const electronicDocumentQuestions = document.getElementById('electronicDocumentQuestions');
    const otherDeliveryMethodGroup = document.getElementById('otherDeliveryMethodGroup');
    
    if (show) {
        electronicDocumentQuestions.style.display = 'block';
        otherDeliveryMethodGroup.style.display = 'none';
        document.getElementById('otherDeliveryMethod').removeAttribute('required');
    } else {
        electronicDocumentQuestions.style.display = 'none';
    }
}

// その他の受領方法フィールドの表示/非表示切り替え
function toggleOtherDeliveryMethodField() {
    const otherDeliveryMethodGroup = document.getElementById('otherDeliveryMethodGroup');
    const electronicDocumentQuestions = document.getElementById('electronicDocumentQuestions');
    
    otherDeliveryMethodGroup.style.display = 'block';
    document.getElementById('otherDeliveryMethod').setAttribute('required', '');
    electronicDocumentQuestions.style.display = 'none';
}

// 契約方法の「その他」選択時の追加フィールド表示
function handleContractMethodChange() {
    const contractMethod = document.getElementById('contractMethod').value;
    const otherContractMethodGroup = document.getElementById('otherContractMethodGroup');
    
    if (contractMethod === 'other') {
        otherContractMethodGroup.style.display = 'block';
        document.getElementById('otherContractMethod').setAttribute('required', '');
    } else {
        otherContractMethodGroup.style.display = 'none';
        document.getElementById('otherContractMethod').removeAttribute('required');
    }
}

// 動的質問の生成
function generateDynamicQuestions() {
    const dynamicQuestionsContainer = document.getElementById('dynamic-questions');
    dynamicQuestionsContainer.innerHTML = '';  // コンテナをクリア
    
    // 取引類型に応じた質問を生成
    switch (transactionType) {
        case 'door_to_door':  // 訪問販売
        case 'telemarketing':  // 電話勧誘販売
        case 'visit_purchase':  // 訪問購入
            generateDoorToDoorQuestions(dynamicQuestionsContainer);
            break;
        case 'specific_continuous':  // 特定継続的役務提供
            generateSpecificContinuousQuestions(dynamicQuestionsContainer);
            break;
        case 'mlm':  // 連鎖販売取引
        case 'business_opportunity':  // 業務提供誘引販売取引
            generateMLMQuestions(dynamicQuestionsContainer);
            break;
        case 'mail_order':  // 通信販売
            generateMailOrderQuestions(dynamicQuestionsContainer);
            break;
        case 'store':  // 店舗販売
            generateStoreQuestions(dynamicQuestionsContainer);
            break;
        default:
            generateOtherQuestions(dynamicQuestionsContainer);
            break;
    }
    
    // 共通の適用除外条件の質問
    generateCommonExclusionQuestions(dynamicQuestionsContainer);
}

// 訪問販売、電話勧誘販売、訪問購入の質問
function generateDoorToDoorQuestions(container) {
    // 書面不備の確認
    addQuestionGroup(container, 'documentDefect', '受け取った書面について、以下の項目に当てはまるものはありますか？（複数選択可）', [
        { value: 'no_red_frame', label: 'クーリングオフに関する事項が赤枠・赤字で明記されていなかった' },
        { value: 'missing_info', label: '事業者の氏名・住所・電話番号、契約担当者名、商品名、金額、支払方法、引渡時期などの記載に不備があった' },
        { value: 'none', label: '上記のような不備はなかった' }
    ], 'checkbox');
    
    // クーリングオフ妨害の確認
    addQuestionGroup(container, 'interference', '事業者から以下のような対応を受けましたか？（複数選択可）', [
        { value: 'false_info', label: '「クーリングオフはできない」と言われた' },
        { value: 'intimidation', label: '威圧的な態度で断念させられた' },
        { value: 'none', label: '上記のような対応はなかった' }
    ], 'checkbox');
    
    // 自ら請求した訪問かどうか
    addQuestionGroup(container, 'requestedVisit', 'あなたから事業者に連絡して、自宅や職場に来てもらいましたか？', [
        { value: 'yes', label: 'はい' },
        { value: 'no', label: 'いいえ' }
    ], 'radio');
    
    // 自ら請求した場合の追加質問
    addConditionalQuestion(container, 'requestedVisit', 'yes', 'requestedVisitDifference', '依頼した内容と、実際に勧められた契約内容は異なっていましたか？', [
        { value: 'yes', label: 'はい、異なっていた' },
        { value: 'no', label: 'いいえ、依頼した内容と同じだった' }
    ], 'radio');
}

// 特定継続的役務提供の質問
function generateSpecificContinuousQuestions(container) {
    // 契約期間の確認
    addQuestionGroup(container, 'contractPeriod', '契約期間はどれくらいですか？', [
        { value: 'less_than_1month', label: '1ヶ月未満' },
        { value: '1to2months', label: '1ヶ月以上2ヶ月未満' },
        { value: 'more_than_2months', label: '2ヶ月以上' }
    ], 'radio');
    
    // 書面不備の確認
    addQuestionGroup(container, 'documentDefect', '受け取った書面について、以下の項目に当てはまるものはありますか？（複数選択可）', [
        { value: 'no_red_frame', label: 'クーリングオフに関する事項が赤枠・赤字で明記されていなかった' },
        { value: 'missing_info', label: '事業者の氏名・住所・電話番号、契約担当者名、商品名、金額、支払方法、引渡時期などの記載に不備があった' },
        { value: 'none', label: '上記のような不備はなかった' }
    ], 'checkbox');
    
    // クーリングオフ妨害の確認
    addQuestionGroup(container, 'interference', '事業者から以下のような対応を受けましたか？（複数選択可）', [
        { value: 'false_info', label: '「クーリングオフはできない」と言われた' },
        { value: 'intimidation', label: '威圧的な態度で断念させられた' },
        { value: 'none', label: '上記のような対応はなかった' }
    ], 'checkbox');
}

// 連鎖販売取引、業務提供誘引販売取引の質問
function generateMLMQuestions(container) {
    // 書面不備の確認
    addQuestionGroup(container, 'documentDefect', '受け取った書面について、以下の項目に当てはまるものはありますか？（複数選択可）', [
        { value: 'no_red_frame', label: 'クーリングオフに関する事項が赤枠・赤字で明記されていなかった' },
        { value: 'missing_info', label: '事業者の氏名・住所・電話番号、契約担当者名、商品名、金額、支払方法、引渡時期などの記載に不備があった' },
        { value: 'none', label: '上記のような不備はなかった' }
    ], 'checkbox');
    
    // クーリングオフ妨害の確認
    addQuestionGroup(container, 'interference', '事業者から以下のような対応を受けましたか？（複数選択可）', [
        { value: 'false_info', label: '「クーリングオフはできない」と言われた' },
        { value: 'intimidation', label: '威圧的な態度で断念させられた' },
        { value: 'none', label: '上記のような対応はなかった' }
    ], 'checkbox');
    
    // 営業目的かどうかの確認
    addQuestionGroup(container, 'businessPurpose', 'この契約は、あなたが事業として行うためのものですか？', [
        { value: 'yes', label: 'はい、事業として行うためのものです' },
        { value: 'no', label: 'いいえ、個人的な目的です' },
        { value: 'unsure', label: 'わからない' }
    ], 'radio');
    
    // 事業目的の場合の追加質問
    addConditionalQuestion(container, 'businessPurpose', 'yes', 'businessExperience', '以下の項目に当てはまるものはありますか？（複数選択可）', [
        { value: 'has_equipment', label: 'この事業に必要な設備や準備をすでに整えている' },
        { value: 'has_experience', label: 'この種の取引に関する知識や経験がある' },
        { value: 'is_profitable', label: 'すでに利益が出ている、または具体的な利益計画がある' },
        { value: 'none', label: '上記のいずれにも当てはまらない' }
    ], 'checkbox');
}

// 通信販売の質問
function generateMailOrderQuestions(container) {
    // 返品特約の確認
    addQuestionGroup(container, 'returnPolicy', '購入時のウェブサイトや広告、商品に同梱されていた書類などに返品条件の記載はありましたか？', [
        { value: 'yes', label: 'はい、返品条件の記載がありました' },
        { value: 'no', label: 'いいえ、返品条件の記載はありませんでした' },
        { value: 'unsure', label: 'わからない/確認していない' }
    ], 'radio');
    
    // 返品特約がある場合の追加質問
    addConditionalQuestion(container, 'returnPolicy', 'yes', 'returnPolicyDetails', '記載されていた返品条件はどのようなものでしたか？（わかる範囲で記入してください）', [], 'textarea');
    
    // 商品受け取り日の確認
    addQuestionGroup(container, 'productReceiveDate', '商品をいつ受け取りましたか？', [], 'date');
}

// 店舗販売の質問
function generateStoreQuestions(container) {
    // 店舗での購入確認
    addQuestionGroup(container, 'storeConfirmation', '実際に店舗に行って購入しましたか？', [
        { value: 'yes', label: 'はい、店舗で直接購入しました' },
        { value: 'no', label: 'いいえ、店舗以外の場所で購入しました' }
    ], 'radio');
    
    // 店舗以外での購入の場合の詳細
    addConditionalQuestion(container, 'storeConfirmation', 'no', 'nonStoreLocation', 'どのような場所で購入しましたか？', [], 'text');
}

// その他の契約方法の質問
function generateOtherQuestions(container) {
    // 契約方法の詳細
    addQuestionGroup(container, 'otherContractMethodDetail', '契約方法について詳しく教えてください', [], 'textarea');
    
    // 書面不備の確認
    addQuestionGroup(container, 'documentDefect', '受け取った書面について、以下の項目に当てはまるものはありますか？（複数選択可）', [
        { value: 'no_red_frame', label: 'クーリングオフに関する事項が赤枠・赤字で明記されていなかった' },
        { value: 'missing_info', label: '事業者の氏名・住所・電話番号、契約担当者名、商品名、金額、支払方法、引渡時期などの記載に不備があった' },
        { value: 'none', label: '上記のような不備はなかった' }
    ], 'checkbox');
}

// 共通の適用除外条件の質問
function generateCommonExclusionQuestions(container) {
    // 現金取引かつ3,000円未満の確認
    if (formData.contractAmount < 3000) {
        addQuestionGroup(container, 'paymentMethod', 'お支払い方法はどのようなものでしたか？', [
            { value: 'cash', label: '現金払い' },
            { value: 'credit_card', label: 'クレジットカード' },
            { value: 'bank_transfer', label: '銀行振込' },
            { value: 'installment', label: '分割払い/ローン' },
            { value: 'other', label: 'その他' }
        ], 'radio');
    }
    
    // 消耗品の使用確認
    addQuestionGroup(container, 'consumableUsed', '契約した商品は消耗品（化粧品、健康食品、サプリメントなど）ですか？', [
        { value: 'yes', label: 'はい' },
        { value: 'no', label: 'いいえ' },
        { value: 'unsure', label: 'わからない' }
    ], 'radio');
    
    // 消耗品の場合の使用状況
    addConditionalQuestion(container, 'consumableUsed', 'yes', 'consumableUsedStatus', 'その消耗品を使用しましたか？', [
        { value: 'yes', label: 'はい、使用しました' },
        { value: 'no', label: 'いいえ、使用していません' },
        { value: 'partially', label: '一部だけ使用しました' }
    ], 'radio');
    
    // 自動車の購入確認
    addQuestionGroup(container, 'carPurchase', '契約した商品は自動車ですか？', [
        { value: 'yes', label: 'はい' },
        { value: 'no', label: 'いいえ' }
    ], 'radio');
}

// 質問グループの追加
function addQuestionGroup(container, name, label, options, type) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    formGroup.id = `${name}Group`;
    
    const questionLabel = document.createElement('label');
    questionLabel.textContent = label;
    if (type !== 'text' && type !== 'textarea' && type !== 'date') {
        questionLabel.innerHTML += ' <span class="required">*</span>';
    }
    formGroup.appendChild(questionLabel);
    
    if (type === 'radio' || type === 'checkbox') {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';
        
        options.forEach(option => {
            const label = document.createElement('label');
            
            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.value = option.value;
            if (type === 'radio') {
                input.required = true;
            }
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${option.label}`));
            
            radioGroup.appendChild(label);
        });
        
        formGroup.appendChild(radioGroup);
    } else if (type === 'textarea') {
        const textarea = document.createElement('textarea');
        textarea.name = name;
        textarea.id = name;
        textarea.rows = 4;
        formGroup.appendChild(textarea);
    } else if (type === 'date') {
        const input = document.createElement('input');
        input.type = 'date';
        input.name = name;
        input.id = name;
        formGroup.appendChild(input);
    } else {
        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.id = name;
        formGroup.appendChild(input);
    }
    
    container.appendChild(formGroup);
}

// 条件付き質問の追加
function addConditionalQuestion(container, parentName, parentValue, name, label, options, type) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group conditional-question';
    formGroup.id = `${name}Group`;
    formGroup.style.display = 'none';
    formGroup.dataset.parent = parentName;
    formGroup.dataset.parentValue = parentValue;
    
    const questionLabel = document.createElement('label');
    questionLabel.textContent = label;
    if (type !== 'text' && type !== 'textarea' && type !== 'date') {
        questionLabel.innerHTML += ' <span class="required">*</span>';
    }
    formGroup.appendChild(questionLabel);
    
    if (type === 'radio' || type === 'checkbox') {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';
        
        options.forEach(option => {
            const label = document.createElement('label');
            
            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.value = option.value;
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${option.label}`));
            
            radioGroup.appendChild(label);
        });
        
        formGroup.appendChild(radioGroup);
    } else if (type === 'textarea') {
        const textarea = document.createElement('textarea');
        textarea.name = name;
        textarea.id = name;
        textarea.rows = 4;
        formGroup.appendChild(textarea);
    } else if (type === 'date') {
        const input = document.createElement('input');
        input.type = 'date';
        input.name = name;
        input.id = name;
        formGroup.appendChild(input);
    } else {
        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.id = name;
        formGroup.appendChild(input);
    }
    
    container.appendChild(formGroup);
    
    // 親質問の変更イベントリスナーを追加
    document.addEventListener('change', function(e) {
        if (e.target.name === parentName && e.target.checked) {
            const conditionalQuestions = document.querySelectorAll(`.conditional-question[data-parent="${parentName}"]`);
            conditionalQuestions.forEach(question => {
                if (question.dataset.parentValue === e.target.value) {
                    question.style.display = 'block';
                } else {
                    question.style.display = 'none';
                }
            });
        }
    });
}

// 結果の計算と表示
function calculateResult() {
    // 基本情報の取得
    const contractDate = new Date(formData.contractDate);
    const documentDate = formData.documentDate ? new Date(formData.documentDate) : null;
    const today = new Date();
    
    // 結果の初期化
    let resultMessage = '';
    let resultDetails = '';
    let resultClass = '';
    
    // 通信販売と店舗販売も含めて判定ロジックを統一
    // 適用除外条件の確認
    let isExcluded = false;
    let exclusionReason = '';
    
    // 通信販売の場合
    if (transactionType === 'mail_order') {
        isExcluded = true;
        exclusionReason = '通信販売はクーリングオフ制度の対象外です。ただし、事業者が返品特約を定めている場合は、その条件に従って返品が可能な場合があります。';
    }
    
    // 店舗販売の場合
    else if (transactionType === 'store') {
        isExcluded = true;
        exclusionReason = '店舗で直接行った契約はクーリングオフ制度の対象外です。';
    }
    
    // 現金取引かつ3,000円未満
    else if (formData.contractAmount < 3000 && formData.paymentMethod === 'cash') {
        isExcluded = true;
        exclusionReason = '現金取引かつ3,000円未満の契約はクーリングオフの対象外です。';
    }
    
    // 使用済み消耗品
    else if (formData.consumableUsed === 'yes' && formData.consumableUsedStatus === 'yes') {
        isExcluded = true;
        exclusionReason = '使用済みの消耗品はクーリングオフの対象外です。';
    }
    
    // 自ら請求した訪問で契約内容が同じ
    else if (formData.requestedVisit === 'yes' && formData.requestedVisitDifference === 'no') {
        isExcluded = true;
        exclusionReason = '自ら請求した訪問で、依頼した内容と同じ契約の場合はクーリングオフの対象外です。';
    }
    
    // 自動車の購入
    else if (formData.carPurchase === 'yes') {
        isExcluded = true;
        exclusionReason = '自動車の購入契約はクーリングオフの対象外です。';
    }
    
    // 営業のための契約
    else if (formData.businessPurpose === 'yes' && 
        (formData.businessExperience === 'has_equipment' || 
         formData.businessExperience === 'has_experience' || 
         formData.businessExperience === 'is_profitable')) {
        isExcluded = true;
        exclusionReason = '営業のための契約はクーリングオフの対象外です。';
    }
    
    // 書面不備・クーリングオフ妨害の確認
    const hasDocumentDefect = formData.documentDefect && formData.documentDefect !== 'none';
    const hasInterference = formData.interference && formData.interference !== 'none';
    
    // 電子書面の不備確認
    const hasElectronicDocumentDefect = (
        (documentDeliveryMethod === '電子メールに添付されていた' || 
         documentDeliveryMethod === 'ウェブサイトからダウンロードした') && 
        !electronicDocumentValid
    );
    
    // 期間内かどうかの確認
    let isWithinPeriod = false;
    
    if (documentDate) {
        // 書面受領日からの日数計算
        const daysSinceDocument = Math.floor((today - documentDate) / (1000 * 60 * 60 * 24));
        
        // 書面不備・クーリングオフ妨害・電子書面不備がある場合は期間延長
        if (hasDocumentDefect || hasInterference || hasElectronicDocumentDefect) {
            isWithinPeriod = true;  // 期間延長により常に期間内と判断
        } else {
            // 通常の期間判定
            isWithinPeriod = daysSinceDocument <= coolingOffPeriod;
        }
    } else {
        // 書面未受領の場合は期間進行せず
        isWithinPeriod = true;
    }
    
    // 結果の設定（「対象外」を廃止し、全て「高い」または「低い」に集約）
    if (isExcluded || !isWithinPeriod) {
        coolingOffResult = '低い';
        resultMessage = 'クーリングオフできる可能性は低いと考えられます。';
        
        if (isExcluded) {
            resultDetails = `理由: ${exclusionReason}`;
        } else {
            resultDetails = `クーリングオフ期間（${coolingOffPeriod}日間）を経過しているため、通常のクーリングオフは難しい可能性があります。`;
        }
        
        resultClass = 'low';
    } else {
        coolingOffResult = '高い';
        resultMessage = 'クーリングオフできる可能性が高いと考えられます。';
        
        if (hasDocumentDefect || hasElectronicDocumentDefect) {
            resultDetails += '書面に不備があるため、クーリングオフ期間が延長される可能性があります。';
        } else if (hasInterference) {
            resultDetails += '事業者によるクーリングオフ妨害があったため、クーリングオフ期間が延長される可能性があります。';
        } else {
            resultDetails += `クーリングオフ期間（${coolingOffPeriod}日間）内であるため、クーリングオフが可能と考えられます。`;
        }
        
        resultClass = 'high';
    }
    
    // 結果の表示
    document.getElementById('result-message').textContent = resultMessage;
    document.getElementById('result-details').innerHTML = resultDetails;
    document.getElementById('result-container').className = resultClass;
    
    // フォームデータにクーリングオフ結果を追加
    formData.coolingOffResult = coolingOffResult;
    
    // ボタンの設定（結果に関わらず「AI審査を終了する」というテキストで直接URLに遷移するように統一）
    if (coolingOffResult === '高い') {
        document.getElementById('final-button').textContent = 'AI審査を終了する';
        document.getElementById('final-button').onclick = function() {
            window.location.href = 'https://utage-system.com/line/open/K2J9OUTfgStM';
        };
    } else {
        document.getElementById('final-button').textContent = 'AI審査を終了する';
        document.getElementById('final-button').onclick = function() {
            window.location.href = 'https://utage-system.com/line/open/cNVpdEvR13VS';
        };
    }
    
    // サーバーにデータを送信
    submitDataToServer();
}

// サーバーにデータを送信
function submitDataToServer() {
    // フォームデータをJSON形式に変換
    const jsonData = JSON.stringify(formData);
    
    // サーバーにデータを送信
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('データの送信に失敗しました');
        }
        return response.json();
    })
    .then(data => {
        console.log('データが正常に送信されました:', data);
    })
    .catch(error => {
        console.error('エラーが発生しました:', error);
    });
}

// フォーム送信処理
function submitForm() {
    // 結果ページの場合は、ボタンのonclickで処理
}
