

// Local Storage Keys
const KEY_CUSTOMER_ORDERS = 'ws_customer_order_ids';
const KEY_CUP_COUNT = 'ws_cup_count';
const FREE_CUP_THRESHOLD = 10;

// Fallback Menu Data (in case backend is down)
const fallbackMenu = [
    {
        id: 1,
        name: 'Americano',
        regularPrice: 1.50,
        largePrice: 2.00,
        supportsMilk: false,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://qcloud.dpfile.com/pc/ubxJ-VNoyN4uOfTBepm1tCeKrZ0UPsS5TWmMGkZvPbK86DRaYKVlOfP__9y-SpoC.jpg'
    },
    {
        id: 2,
        name: 'Americano with milk',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://miaobi-lite.bj.bcebos.com/miaobi/5mao/b%275ZKW5ZWh54mb5aW2XzE3MzU1MTIyNTMuMTMyNDI5OF8xNzM1NTEyMjUzLjUxNDA2OQ%3D%3D%27/1.png'
    },
    {
        id: 3,
        name: 'Latte',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://preview.qiantucdn.com/58pic/vj/HJ/QS/7A/7r1oqpv3yzd6h49xlm2ntisw0k8j5ucf_PIC2018.png!w1024_new_small_1'
    },
    {
        id: 4,
        name: 'Cappuccino',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://inews.gtimg.com/newsapp_bt/0/12407295198/1000.jpg'
    },
    {
        id: 5,
        name: 'Hot Chocolate',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://gips3.baidu.com/it/u=1743325701,3884706280&fm=3074&app=3074&f=JPEG'
    },
    {
        id: 6,
        name: 'Mocha',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://5b0988e595225.cdn.sohucs.com/a_auto,c_cut,x_2,y_0,w_825,h_550/images/20190129/bc09903321a640c581236122a1b7123c.jpeg'
    },
    {
        id: 7,
        name: 'Mineral Water',
        regularPrice: 1.00,
        largePrice: null,
        supportsMilk: false,
        supportsSugar: false,
        supportsLarge: false,
        img: 'https://pic.rmb.bdstatic.com/c61e5447d36ae72409dbefb59aedac28@h_1280'
    }
];

// Global Menu Data
let menu = [...fallbackMenu];

// Global Application State
let appState = {
    bag: [],
    curr: null,
    q: 1,
    bp: 0,
    cupCount: 0,
    selectedSize: 'REGULAR',
    paymentMethod: 'CARD',
    pendingOrders: [],
    history: [],
    isLogin: false
};