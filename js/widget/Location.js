define([
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
], function (QueryTask, Query) {
    'use strict';
    return class {
        constructor(view, options = {}) {
            this.view = view;
        }
        getLocationInfo(geometry) {

            return new Promise((resolve, reject) => {
                try {
                    if (!geometry)
                        reject('geometry is null')
                    if (!this.queryLocation)
                        this.queryLocation = new QueryTask({
                            url: 'https://ditagis.com:6443/arcgis/rest/services/BinhDuong/DuLieuNen/MapServer/4'
                        });
                    this.queryLocation.execute({
                        outFields: ['MaHuyenTP', 'MaPhuongXa'],
                        geometry: geometry
                    }).then(res => {
                        if (res) {
                            let ft = res.features[0];
                            if (ft && ft.attributes) {
                                resolve({ XaPhuong: ft.attributes['MaPhuongXa'], HuyenTP: ft.attributes['MaHuyenTP'] });
                            }
                        } else {
                            resolve(null);
                        }
                    });
                } catch (error) {
                    console.log(error)
                    reject(error);
                }
            });
        }
    }
});