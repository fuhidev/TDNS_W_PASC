define([
    "dojo/dom-construct",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/tasks/Locator",
    "esri/request",
], function (domConstruct,
    Graphic, GraphicsLayer, FeatureLayer, Point,
    SimpleMarkerSymbol, Locator,
    esriRequest) {
    return class {
        constructor(view, graphicsLayer, layerSuco) {
            this.view = view;
            this.graphicsLayer = graphicsLayer;
            this.locator = new Locator({
                url: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
            });
            var form;
            var attributes = {};
            this.layerSuco = layerSuco;
            var addSuco = document.getElementById('addSuCo');
            myApp.onPageBack('*', () => {
                addSuco.style.display = 'inline-grid';
            })
            myApp.onPageInit('*', () => {
                addSuco.style.display = 'none';
                // var input = document.getElementById('fileInput');
                var div = document.getElementById('form-attachment');
                // nếu có điểm thì cập nhật giá trị địa chỉ
                if (this.pointGraphic) {
                    this.capNhatDiaChi(this.pointGraphic.geometry);
                }
                div.appendChild(this.form);
                $$('.form-to-data').on('click', () => {

                    var personInfoForm = myApp.formToData('#personInfoForm');
                    var sucoInfoForm = myApp.formToData('#sucoInfoForm');
                    let attachmentForm = document.getElementById('attachment-data');
                    if (sucoInfoForm.diachi == '' || personInfoForm.phone == '' || attachmentForm.firstChild.files.length == 0) {
                        myApp.addNotification({
                            title: 'Thông báo',
                            message: 'Cần điền đầy đủ thông tin',
                        });
                        return;
                    }
                    attributes['TOADO_X'] = this.pointGraphic.geometry.x;
                    attributes['TOADO_Y'] = this.pointGraphic.geometry.y;
                    attributes['TRANGTHAI'] = 0;
                    attributes['SODIENTHOAI'] = personInfoForm.phone;
                    attributes['NGUOICAPNHAT'] = personInfoForm.name;
                    attributes['NGAYCAPNHAT'] = new Date().getTime();
                    attributes['NGAYTHONGBAO'] = new Date().getTime();
                    attributes['VITRI'] = sucoInfoForm.diachi;
                    attributes['GhiChu'] = sucoInfoForm.ghichu;
                    attributes['HINHTHUCPHATHIEN'] = 0;
                    this.pointGraphic.attributes = attributes;
                    myApp.showIndicator();
                    this.layerSuco.applyEdits({
                            addFeatures: [this.pointGraphic]
                        }).then(result => {
                            if (result.addFeatureResults.length > 0) {
                                if (this.pointGraphic) {
                                    this.graphicsLayer.graphics.remove(this.pointGraphic);
                                }
                                var objectId = result.addFeatureResults[0].objectId;
                                esriRequest('/tdns/tiepnhansuco/generateidsuco', {
                                    responseType: 'json',
                                    method: 'post'
                                }).then(response => {
                                    var idSuCo = response.data;
                                    this.pointGraphic.attributes = {
                                        "OBJECTID": objectId,
                                        "IDSUCO": idSuCo
                                    }
                                    this.layerSuco.applyEdits({
                                        updateFeatures: [this.pointGraphic]
                                    }).then(result => {
                                        if (this.pointGraphic) {
                                            this.graphicsLayer.graphics.remove(this.pointGraphic);
                                            this.pointGraphic = null;
                                        }
                                    });
                                });

                                var url = this.layerSuco.url + '/0/' + objectId + "/addAttachment";
                                if (attachmentForm) {
                                    esriRequest(url, {
                                            responseType: 'json',
                                            body: attachmentForm
                                        }).then(res => {
                                            if (res.data && res.data.addAttachmentResult && res.data.addAttachmentResult.success) {
                                                myApp.addNotification({
                                                    title: 'Thông báo',
                                                    message: 'Cảm ơn bạn đã phản ánh tình trạng sự cố',
                                                });
                                                if (this.pointGraphic) {
                                                    this.graphicsLayer.graphics.remove(this.pointGraphic);
                                                    this.pointGraphic = null;
                                                    this.view.popup.visible = false;
                                                }
                                            }
                                            myApp.views[0].router.back();
                                        })
                                        .always(_ => myApp.hideIndicator())
                                }


                            }
                        })
                        .always(_ => myApp.hideIndicator());
                });
            });

        }

        capNhatDiaChi(point) {
            this.locator.locationToAddress(point)
                .then((result) => {
                    myApp.formFromData('#sucoInfoForm', {
                        diachi: result.attributes.LongLabel
                    });
                });
        }

        addGraphics(coords) {
            if (this.pointGraphic) {
                this.graphicsLayer.graphics.remove(this.pointGraphic);
                this.pointGraphic = null;
            }
            var point = new Point({
                longitude: coords.longitude,
                latitude: coords.latitude,
            });
            var markerSymbol = new SimpleMarkerSymbol({
                color: [255, 128, 0],
                style: 'circle',
            });

            var completeInfos = {
                title: "Điền thông tin",
                id: "editInfo",
                className: "esri-icon-edit",
            };
            var cencelInfos = {
                id: "deleteObj",
                title: "Xóa",
                className: "esri-icon-erase",
            };
            var template = { // autocasts as new PopupTemplate()
                title: "Sự cố",
                dockEnabled: false,
                actions: [completeInfos, cencelInfos]
            };
            // Create a graphic and add the geometry and symbol to it
            this.pointGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol,
                popupTemplate: template
            });
            this.graphicsLayer.graphics.add(this.pointGraphic);
            this.form = document.createElement('form');
            this.form.id = 'attachment-data';
            this.form.enctype = 'multipart/form-data';
            this.form.method = 'post';
            let file = document.createElement('input');
            file.type = 'file';
            file.name = 'attachment';
            this.form.appendChild(file);
            let hideField = document.createElement('input');
            hideField.hidden = 'hidden';
            hideField.name = 'f';
            hideField.value = 'json';
            this.form.appendChild(hideField);
            mainView.router.load({
                url: 'form.html'
            });


            this.view.popup.on("trigger-action", event => {
                if (event.action.id === "editInfo") {
                    mainView.router.load({
                        url: 'form.html'
                    });
                }
                if (event.action.id === "deleteObj") {
                    this.graphicsLayer.graphics.remove(this.pointGraphic);
                    this.view.popup.visible = false;
                }
            });

        }
    }

});