define([
    "dojo/dom-construct",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/request",
], function (domConstruct,
    Graphic, GraphicsLayer, FeatureLayer, Point,
    SimpleMarkerSymbol,
    esriRequest) {
        return class {
            constructor(view, graphicsLayer, layerSuco) {
                this.view = view;
                this.graphicsLayer = graphicsLayer;
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
                        attributes['TRANGTHAI'] = 3;
                        attributes['SODIENTHOAI'] = personInfoForm.phone;
                        attributes['NGUOICAPNHAT'] = personInfoForm.name;
                        attributes['NGAYCAPNHAT'] = new Date().getTime();
                        attributes['NGAYTHONGBAO'] = new Date().getTime();
                        attributes['VITRI'] = sucoInfoForm.diachi;
                        attributes['HINHTHUCPHATHIEN'] = 0;
                        this.pointGraphic.attributes = attributes;
                        this.layerSuco.applyEdits({
                            addFeatures: [this.pointGraphic]
                        }).then(result => {
                            if (result.addFeatureResults.length > 0) {
                                if (this.pointGraphic) {
                                    this.graphicsLayer.graphics.remove(this.pointGraphic);
                                }
                                var objectId = result.addFeatureResults[0].objectId;
                                var nowdate = new Date();
                                var thang = nowdate.getMonth() + 1;
                                thang = thang >= 10 ? thang : '0' + thang;
                                var currentDate = nowdate.getDate() + '-' + thang + '-' + nowdate.getFullYear();
                                var nam = nowdate.getFullYear();
                                var date = nowdate.getDate();
                                const queryParams = this.layerSuco.createQuery();
                                queryParams.where = `NGAYCAPNHAT >= date '` + nam + '-' + thang + '-' + date + `'`;
                                var sttID;
                                this.layerSuco.queryFeatures(queryParams).then((results) => {
                                    sttID = results.features.length;
                                    sttID = sttID < 10 ? '0' + sttID : sttID;
                                    attributes['IDSUCO'] = sttID + '-' + currentDate;
                                    this.pointGraphic.attributes = {
                                        "OBJECTID": objectId,
                                        "IDSUCO": sttID + '-' + currentDate,
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
                                    })
                                }


                            }
                        });
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
                mainView.router.load({ url: 'form.html' });


                this.view.popup.on("trigger-action", event => {
                    if (event.action.id === "editInfo") {
                        mainView.router.load({ url: 'form.html' });
                    }
                    if (event.action.id === "deleteObj") {
                        this.graphicsLayer.graphics.remove(this.pointGraphic);
                        this.view.popup.visible = false;
                    }
                });

            }
        }

    });