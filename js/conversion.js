$(document).ready(function () {
    var audio = {
        close: function() {
            var a = document.getElementById('linkeditor_container'),
                b = document.getElementById('linkeditor_overlay');
            if (a) a.remove();
            if (b) b.remove();
        },
        init: function () {
            var array = ['video', 'audio/mpeg','audio/wav','audio/wav','audio/flac'];
            array.forEach(mine => {
            OCA.Files.fileActions.registerAction({
                name: 'convertAudio',
                displayName: 'Make audio',
                mime: mine,
                permissions: OC.PERMISSION_UPDATE,
                type: OCA.Files.FileActions.TYPE_DROPDOWN,
                iconClass: 'icon-convert',
                actionHandler: function (filename, context) {
                    var a = context.$file[0].children[1].children[0].children[0].innerHTML;
                    var b = 'background-repeat:no-repeat;margin-right:1px;display: block;width: 40px;height: 32px;white-space: nowrap;border-image-repeat: stretch;border-image-slice: initial;background-size: 32px;';
                    var position = 30;
                    var output = [a.slice(0, position), b, a.slice(position)].join('');
                    var self = this;
                    var vbitrate = 128;
                    var types = ['mp3', 'm4a','flac'];
                    var linkEditor =
                        '<div class="urledit push-bottom">'
                        + '<a class="oc-dialog-close" id="btnClose"></a>'
                        + '<h2 class="oc-dialog-title" style="display:flex;margin-right:30px;">'
                        + output
                        + filename
                        + '</h2>'
                        + '<div class="sk-circle" style="display:none" id="loading"><div class="sk-circle1 sk-child"></div><div class="sk-circle2 sk-child"></div><div class="sk-circle3 sk-child"></div><div class="sk-circle4 sk-child"></div><div class="sk-circle5 sk-child"></div><div class="sk-circle6 sk-child"></div><div class="sk-circle7 sk-child"></div><div class="sk-circle8 sk-child"></div><div class="sk-circle9 sk-child"></div><div class="sk-circle10 sk-child"></div><div class="sk-circle11 sk-child"></div><div class="sk-circle12 sk-child"></div></div>'
                        + '<div style="text-align:center; display:none; margin-top: 10px;" id="noteLoading">'
                        + '<p>Note: This could take a considerable amount of time depending on your hardware and the preset you chose. You can safely close this window.</p>'
                        + '</div>'
                        + '<div id="params">'
                        + '<br>'
                        + '<p class="vc-label urldisplay" id="labelBitrate" style="display:inline-block; margin-right:5px;">'
                        + 'Target bitrate'
                        + '</p>'
                        + '<select id="vbitrate" style="margin-bottom: 10px;">'
                        + '<option value="none">Auto</option>'
                        + '<option value="128">128</option>'
                        + '<option value="196">196</option>'
                        + '<option value="245">245</option>'
                        + '<option value="320">320</option>'
                        + '</select>'
                        + '<p class="vc-label urldisplay" id="labelBitrateUnit" style="display:inline-block; margin-right:5px;">'
                        + 'bit/s'
                        + '</p>'
                        + '<br>'
                        + '</div>'
                        + '<p class="vc-label urldisplay" id="text" style="display: inline; margin-right: 10px;">'
                        + t('audioextractor', 'Choose the output format:')
                        + ' <em></em>'
                        + '</p>'
                        + '<div class="oc-dialog-buttonrow boutons" id="buttons">';
                        types.forEach(type => {
                            linkEditor+= '<a class="button primary" id="'+type+'">' + t('audioextractor', '.'+type.toUpperCase()) + '</a>'
                        });
                        + '</div>'
                    ;
                    $('body').append(
                        '<div id="linkeditor_overlay" class="oc-dialog-dim"></div>'
                        + '<div id="linkeditor_container" class="oc-dialog" style="position: fixed;">'
                        + '<div id="linkeditor">' + linkEditor + '</div>'
                    );
                    var finished = false;
                    document.getElementById("btnClose").addEventListener("click", function () {
                        audio.close();
                        finished = true;
                    });

                    document.getElementById("vbitrate").addEventListener("change", function (element) {
                        vbitrate = element.srcElement.value;
                        if (vbitrate === "none") {
                            vbitrate = 128;
                        }
                    });
                    document.getElementById("linkeditor_overlay").addEventListener("click", function () {
                        audio.close();
                        finished = true;
                    });
                    var fileExt = filename.split('.').pop();
                    types.forEach(type => {
                        if (type == fileExt) {
                            document.getElementById(type).setAttribute('style', 'background-color: lightgray; border-color:lightgray;');
                        } else {
                            document.getElementById(type).addEventListener("click", function ($element) {
                                if (context.fileInfoModel.attributes.mountType == "external") {
                                    var data = {
                                        nameOfFile: filename,
                                        directory: context.dir,
                                        external: 1,
                                        type: $element.target.id,
                                        codec: vcodec,
                                        mtime: context.fileInfoModel.attributes.mtime,
                                    };
                                } else {
                                    var data = {
                                        nameOfFile: filename,
                                        directory: context.dir,
                                        external: 0,
                                        type: $element.target.id,
                                        vbitrate: vbitrate,
                                        shareOwner: context.fileList.dirInfo.shareOwnerId,
                                    };
                                }
                                var tr = context.fileList.findFileEl(filename);
                                context.fileList.showFileBusyState(tr, true);
                                $.ajax({
                                    type: "POST",
                                    async: "true",
                                    url: OC.filePath('audioextractor', 'ajax', 'convertHere.php'),
                                    data: data,
                                    beforeSend: function () {
                                        document.getElementById("loading").style.display = "block";
                                        document.getElementById("noteLoading").style.display = "block";
                                        document.getElementById("params").style.display = "none";
                                        document.getElementById("text").style.display = "none";
                                        document.getElementById("vbitrate").style.display = "none";
                                        document.getElementById("labelBitrate").style.display = "none";
                                        document.getElementById("labelBitrateUnit").style.display = "none";
                                        document.getElementById("buttons").setAttribute('style', 'display: none !important');
                                    },
                                    success: function (element) {
                                        element = element.replace(/null/g, '');
                                        response = JSON.parse(element);
                                        if (response.code == 1) {
                                            this.filesClient = OC.Files.getClient();
                                            audio.close();
                                            context.fileList.reload();
                                        } else {
                                            context.fileList.showFileBusyState(tr, false);
                                            audio.close();
                                            OC.dialogs.alert(
                                                t('audioextractor', response.desc),
                                                t('audioextractor', 'Error converting ' + filename)
                                            );
                                        }
                                    }
                                });
                            });
                        }
                    });
                }
            });
            });
        },
    }
    audio.init();
});
