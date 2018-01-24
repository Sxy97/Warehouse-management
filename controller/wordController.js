var writeJson = require('../models/writeJson')
var inputController = require('../controller/inputController')
var sd = require('silly-datetime');

var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');

var fs = require('fs');
var path = require('path');

/**
 * 根据oid导出word文档
 * @param req
 * @param res
 */
exports.exportWord = async function (req, res) {
    const oid = req.params.oid || ''
    if (!oid) {
        writeJson(res, 0, '订单号不能为空')
    } else {
        try {
            const table = await inputController.findByOid(oid)
            console.log(table)
            if(table){
                let regex = new RegExp(/^[CR]K\d{17}$/)
                if (regex.test(oid)) {
                    if (oid.substr(0, 2) == "RK") {
                        if (table.com_cat == 1) {
                            table.com_cat = "上级调拨"
                        }
                        if (table.com_cat == 2) {
                            table.com_cat = "本级自筹"
                        }
                        var file = "input.docx"
                    } else if (oid.substr(0, 2) == "CK") {
                        var file = "out.docx"
                    } else {
                        writeJson(res, 0, '订单号格式错误')
                        return
                    }
                    table.time = sd.format(new Date(table.time), 'YYYY年MM月DD日')
                    for (let i = 0; i < table.datas.length; i++) {
                        table.datas[i].a = i + 1
                    }
                    var content = fs
                        .readFileSync(path.resolve("./", file), 'binary');

                    var zip = new JSZip(content);

                    var doc = new Docxtemplater();
                    doc.loadZip(zip);
                    doc.setData(
                        table
                    );
                    doc.render()
                    var buf = doc.getZip()
                        .generate({type: 'nodebuffer'});
                    //encodeURI() 可设置中文名
                    res.writeHead(200, {
                        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                        'Content-disposition': 'attachment; filename=' + oid + '.docx'
                    });
                    res.end(buf)
                } else {
                    writeJson(res, 0, '没有该订单或订单编号格式错误')
                }
            }else{
                writeJson(res, 0, '没有该订单')
            }

        } catch (err) {
            console.log("err:" + err)
            writeJson(res, 0, err)
        }
    }
}


