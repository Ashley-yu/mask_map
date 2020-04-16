let map = {};
let data = {};
// 新增一個圖層存放此插件(群組)
const markers = new L.MarkerClusterGroup();
// 預設搜尋條件
let find = '台北市松山區';
let currentType = 'all';

const cardData = document.querySelector('#cardData');
const search = document.querySelector('#search');
const query = document.querySelector('#query');
const option = document.querySelector('#option');
const type = document.querySelectorAll('.type');
const messageBox = document.querySelector('#messageBox');
const locate = document.querySelector('#locate');
const switchCollapse = document.querySelector('#switchCollapse');

window.onload = function () {
    getInfo();
    getData();
};

// 取得藥局資料
function getData() {
    const xhr = new XMLHttpRequest();　// 開啟一個網路請求
    xhr.open("get", "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json");　// 向伺服器要資料
    xhr.send();　// 送出請求
    // 資料回傳時要執行的動作
    xhr.onload = function () {
        // 將資料 string 轉 JSON 格式
        data = JSON.parse(xhr.responseText).features;
        setMap();
        getLocation();
    }
}

// 取得日期相關資料
const getInfo = () => {
    const date = document.querySelector('#date');
    const week = document.querySelector('#week');

    const today = new Date();
    const day = today.getDay();
    const week_list = ['日', '一', '二', '三', '四', '五', '六'];

    // 取得日期 -----
    const formatDate = (num) => {
        return num < 10 ? `0${num}` : num;
    };
    // 解構賦值
    const [YYYY, MM, DD] = [
        today.getFullYear(),
        formatDate(today.getMonth() + 1),
        formatDate(today.getDate()),
    ];
    date.textContent = `${YYYY}-${MM}-${DD}`;

    // 取得星期 -----
    week.textContent = `星期${week_list[day]}`;
}

// 定位
const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        showMessage('您的瀏覽器不支援定位服務。');
        setSidebar();
    }
}

// 取得繪製邊欄資料
const getSidebar = (showData) => {
    let card_html = '';
    if (showData.length > 0) {
        showData.forEach(element => {
            // 依口罩數量顯示樣式 -----
            let adultClass = '';
            let childClass = '';
            let viewClass = '';

            if (element.properties.mask_adult > 0) {
                adultClass = 'adult';
            }
            if (element.properties.mask_child > 0) {
                childClass = 'child';
            }
            if (element.properties.mask_adult === 0 && element.properties.mask_child === 0) {
                viewClass = 'disabled';
            }

            // 邊欄 html
            card_html += `
                <div class="card">
                    <div class="content">
                        <div class="name text">${element.properties.name}
                            <a class="far fa-eye icon ${viewClass}" id="view" href="#"
                                data-id="${element.properties.id}"
                            ></a>
                        </div>
                        <div class="address text">${element.properties.address}
                            <a class="fas fa-location-arrow icon" 
                                href="https://www.google.com.tw/maps/dir//${element.properties.address}" 
                                target="_blank"
                            ></a>
                        </div>
                        <div class="text">${element.properties.phone}</div>
                        <div class="text">${element.properties.note}</div>
                    </div>
                    <div class="mask">
                        <div class="maskNum ${adultClass}">成人口罩
                        <div class="adultNum num">${element.properties.mask_adult}</div>
                        </div>
                        <div class="maskNum ${childClass}">兒童口罩
                        <div class="childNum num">${element.properties.mask_child}</div>
                        </div>
                    </div>
                </div>`;
        });
        cardData.innerHTML = card_html;
    }
}

// 取得查詢條件
const getFind = (e) => {
    if (query.value) {
        find = query.value;
    }
    setSidebar();
    query.value = '';
}

// 取得目前查詢類別
const getType = (e) => {
    if (e.target.classList.contains('type')) {
        type.forEach(element => {
            if (e.target.dataset.type === element.dataset.type) {
                currentType = e.target.dataset.type;
                element.classList.add('current');
            } else {
                element.classList.remove('current');
            }
        });
        setSidebar();
    }
}

// 篩選附近資料
const getNearbyData = (currentLatLng) => {
    let filterData = [];
    filterData = data.filter(
        // distanceTo 計算距離，單位（公尺）
        (element) => (currentLatLng.distanceTo([element.geometry.coordinates[1], element.geometry.coordinates[0]]) <= 1000)
    );
    getSidebar(filterData);
}

// 設置地圖
const setMap = () => {
    // 設定一個 map 變數，並定位在 #map
    map = L.map('map', {
        // 預設顯示第一筆資料位置
        center: [data[0].geometry.coordinates[1], data[0].geometry.coordinates[0]],
        zoom: 16,
        zoomControl: false
    });

    // tileLayer(使用誰的圖資, 右下角資訊)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©AshleyFan',
    }).addTo(map);

    // 地圖放大/縮小圖示位置
    L.control.zoom({
        position: 'bottomright',
    }).addTo(map);

    // 設定圖標 icon 樣式
    const greenIcon = L.divIcon({
        className: "mask-div-icon",
        html: "<i class='fas fa-map-marker marker adult'></i>",
        iconAnchor: [13, 34],
        popupAnchor: [0, -36],
    });

    const redIcon = L.divIcon({
        className: "mask-div-icon",
        html: "<i class='fas fa-map-marker marker child'></i>",
        iconAnchor: [13, 34],
        popupAnchor: [0, -36],
    });
 
    // 使用資料繪製圖標
    for (let i = 0; data.length > i; i++) {
        // 判斷口罩數量顯示圖標
        let mask;
        if (data[i].properties.mask_adult !== 0 || data[i].properties.mask_child !== 0) {
            if (data[i].properties.mask_adult > 0 && data[i].properties.mask_child > 0) {
                mask = greenIcon;
            } else {
                mask = redIcon;
            }

            // 依口罩數量顯示樣式
            let adultClass = '';
            let childClass = '';
            if (data[i].properties.mask_adult > 0) {
                adultClass = 'adult';
            }
            if (data[i].properties.mask_child > 0) {
                childClass = 'child';
            }

            markers.addLayer(L.marker([data[i].geometry.coordinates[1], data[i].geometry.coordinates[0]], { icon: mask, id: data[i].properties.id } ).bindPopup(
                `<div>
                    <div class="content">
                        <div class="name text">${data[i].properties.name}</div>
                        <div class="address text">${data[i].properties.address}
                            <a class="fas fa-location-arrow navigationIcon icon" 
                                href="https://www.google.com.tw/maps/dir//${data[i].properties.address}" 
                                target="_blank"
                            ></a>
                        </div>
                        <div class="phone text">${data[i].properties.phone}</div>
                        <div class="note text">${data[i].properties.note}</div>
                    </div>
                    <div class="mask">
                        <div class="maskNum ${adultClass}">成人口罩
                        <div class="adultNum num">${data[i].properties.mask_adult}</div>
                        </div>
                        <div class="maskNum ${childClass}">兒童口罩
                        <div class="childNum num">${data[i].properties.mask_child}</div>
                        </div>
                    </div>
                </div>`
            ));
        }
    }
    map.addLayer(markers);
}

// 設置查詢結果
const setSidebar = () => {
    let filterData = [];

    if (find.indexOf('台') !== -1) {
        const _find = find.replace('台', '臺');
        filterData = data.filter(
            (element) => (element.properties.address.indexOf(_find) !== -1) || (element.properties.address.indexOf(find) !== -1)
        );
    } else if (find.indexOf('臺') !== -1) {
        const _find = find.replace('臺', '台');
        filterData = data.filter(
            (element) => (element.properties.address.indexOf(_find) !== -1) || (element.properties.address.indexOf(find) !== -1)
        );
    } else {
        filterData = data.filter(
            (element) => element.properties.address.indexOf(find) !== -1
        );
    }

    if (currentType === 'child') {
        filterData = filterData.filter(
            (element) => element.properties.mask_child > 0
        );
    } else if (currentType === 'adult') {
        filterData = filterData.filter(
            (element) => element.properties.mask_adult > 0
        );
    }

    if (filterData.length > 0) {
        getSidebar(filterData);
        // 移至第一筆資料
        map.setView([filterData[0].geometry.coordinates[1], filterData[0].geometry.coordinates[0]], 16);
    } else {
        showMessage('查無資料，請重新查詢。');
    }
}

// 顯示地圖位置
const showPosition = (position) => {
    const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    // 設定使用者所在位置
    map.setView([position.coords.latitude, position.coords.longitude], 16);
    getNearbyData(latlng);
}

// 顯示定位錯誤訊息
const showError = (error) => {
    let message = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = '您的瀏覽器未開啟定位服務。';
            break
        case error.POSITION_UNAVAILABLE:
            message = '偵測不到您目前的位置。';
            break
        case error.TIMEOUT:
            message = '讀取目前的位置逾時。';
            break
        default:
            message = '讀取目前的位置錯誤。';
            break
    }
    showMessage(message);
    setSidebar();
}

// 顯示圖標資訊
const showPopup = (e) => {
    if (e.target.id === 'view') {
        // 地圖顯示該筆資料 -----
        // MarkerClusterGroup 下的子圖層
        markers.eachLayer((layer) => {
            if (e.target.dataset.id === layer.options.id) {
                markers.zoomToShowLayer((layer), () => layer.openPopup());
            }
        });
    }
    // 自動收合邊欄
    switchCollapse.checked = true;
}

// 顯示訊息
const showMessage = (message) => {
    messageBox.textContent = message;
    messageBox.classList.add('show');

    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}


cardData.addEventListener('click', showPopup);
search.addEventListener('click', getFind);
query.addEventListener('keydown', (e) => {
    if (e.keyCode === 13) {
        getFind();
    }
});
option.addEventListener('click', getType);
locate.addEventListener('click', getLocation);
