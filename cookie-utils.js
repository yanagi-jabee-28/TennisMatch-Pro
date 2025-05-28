// Cookie操作用ユーティリティ関数

// Cookieを設定する関数
function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Cookieから値を取得する関数
function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

// Cookie削除関数
function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// JSONデータをCookieに保存する関数
function saveJSONToCookie(name, jsonData, days = 30) {
    try {
        const jsonString = JSON.stringify(jsonData);
        // JSONデータを圧縮または分割する必要があるかもしれない（Cookieサイズ制限のため）
        setCookie(name, jsonString, days);
        return true;
    } catch (error) {
        console.error("Cookieへの保存に失敗しました:", error);
        return false;
    }
}

// CookieからJSONデータを取得する関数
function getJSONFromCookie(name) {
    try {
        const cookieValue = getCookie(name);
        if (!cookieValue) return null;
        return JSON.parse(cookieValue);
    } catch (error) {
        console.error("Cookieからの読み込みに失敗しました:", error);
        return null;
    }
}

// コンセントバナーの表示状態を確認
function checkCookieConsent() {
    return getCookie('cookieConsent') === 'accepted';
}

// コンセントバナーを表示
function showCookieConsentBanner() {
    if (checkCookieConsent()) return; // すでに同意済みなら表示しない
    
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
        <div class="cookie-consent-content">
            <p>当サイトではCookieを使用してユーザー体験を向上させています。データの自動保存や設定の記憶のためにCookieを使用することに同意いただける場合は「同意する」をクリックしてください。</p>
            <div class="cookie-consent-buttons">
                <button id="acceptCookies" class="accept-btn">同意する</button>
                <button id="rejectCookies" class="reject-btn">拒否する</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // イベントリスナーを追加
    document.getElementById('acceptCookies').addEventListener('click', () => {
        setCookie('cookieConsent', 'accepted', 365); // 1年間保存
        banner.remove();
    });
    
    document.getElementById('rejectCookies').addEventListener('click', () => {
        setCookie('cookieConsent', 'rejected', 365); // 1年間保存
        banner.remove();
    });
}

// ページ読み込み後にコンセントバナーを表示
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        showCookieConsentBanner();
    }, 1000); // 1秒後に表示
});