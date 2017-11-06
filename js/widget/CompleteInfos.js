define([
    "dojo/dom-construct",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/request",
    "js/widget/Location"
], function (domConstruct,
    Graphic, GraphicsLayer, FeatureLayer, Point,
    SimpleMarkerSymbol,
    esriRequest, Location) {
        return class {
            constructor(view, graphicsLayer,layerSuco) {
                this.view = view;
                this.graphicsLayer = graphicsLayer;
                var form;
                var attributes = {};
                this.layerSuco = layerSuco;
                var addSuco = document.getElementById('addSuCo');
                var location = new Location(this.view);
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
                        attributes['X'] = this.pointGraphic.geometry.longitude;
                        attributes['Y'] = this.pointGraphic.geometry.latitude;
                        attributes['TinhTrang'] = 1;
                        attributes['Phone'] = personInfoForm.phone;
                        attributes['HoTen'] = personInfoForm.name;
                        attributes['Email'] = personInfoForm.email;
                        attributes['created_date'] = new Date().getTime();
                        attributes['MoTa'] = sucoInfoForm.mota;
                        attributes['LoaiSuCo'] = sucoInfoForm.loaisuco;
                        attributes['ThoiGianNguoiDanPhanAnh'] = new Date().getTime();

                        // for (let attribute in attributes) {
                        //     console.log(attributes[attribute]);
                        //     if (attributes[attribute] == '') {
                        //         myApp.addNotification({
                        //             title: 'Thông báo',
                        //             message: 'Phải chưa điền thông tin: ' + attribute,
                        //         });
                        //         return;
                        //     }
                        // }
                        this.pointGraphic.attributes = attributes;
                        this.layerSuco.applyEdits({
                            addFeatures: [this.pointGraphic]
                        }).then(result => {
                            if (result.addFeatureResults.length > 0) {
                                if (this.pointGraphic) {
                                    this.graphicsLayer.graphics.remove(this.pointGraphic);
                                    this.pointGraphic = null;
                                }
                                var objectId = result.addFeatureResults[0].objectId;
                                let attachmentForm = document.getElementById('attachment-data');
                                var url = this.url + '/' + objectId + "/addAttachment";
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
                    color: [226, 119, 40],
                    style: 'diamond'
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
                mainView.router.load({ url: '/form.html' });


                this.view.popup.on("trigger-action", event => {
                    if (event.action.id === "editInfo") {
                        mainView.router.load({ url: '/form.html' });
                    }
                    if (event.action.id === "deleteObj") {
                        this.graphicsLayer.graphics.remove(this.pointGraphic);
                        this.view.popup.visible = false;
                    }
                });

            }
        }

    });