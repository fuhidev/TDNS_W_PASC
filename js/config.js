define([

], function () {
    'use strict';
    return {
        basemap: {
            title: 'Dữ liệu nền Bình Dương',
            id: 'dulieunen',
            url: 'https://ditagis.com:6443/arcgis/rest/services/BinhDuong/DuLieuNen/MapServer',
            // visible: false,
            copyright: 'Bản đồ biên tập bởi Trung tâm DITAGIS',
            layerInfos: [
                {
                    id: 5,
                    title: 'Hành chính huyện'
                },
                {
                    id: 4,
                    title: 'Hành chính xã'
                }, {
                    id: 3,
                    title: 'Phủ bề mặt',
                    visible: false
                },
                {
                    id: 2,
                    title: 'Mặt giao thông',
                    visible: false
                }, {
                    id: 1,
                    title: 'Sông hồ'
                }, {
                    id: 0,
                    title: 'Tim đường'
                }
            ]
        },
        layers: [{
            title: 'Sự cố',
            id: "SuCo",
            url: "https://sawagis.vn/arcgis/rest/services/TruyenDan/MapServicesTruyenDan/FeatureServer/0",
        }],
        zoom: 12, // Sets the zoom level based on level of detail (LOD)
        center: [106.6843694, 11.158752270428375]
    }
});