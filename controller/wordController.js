var writeJson = require('../models/writeJson')
var inputController = require('../controller/inputController')
var sd = require('silly-datetime');
var formidable = require('formidable')
var db = require("../models/db");
var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');

var fs = require('fs');
var path = require('path');
const storepath = "./public/orderpic/"

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
            if (table) {
                for (let i = 0; i < table.datas.length; i++) {
                    table.datas[i].a = i + 1
                }
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
                        var yeshu = Math.ceil(table.datas.length / 5)
                        var cha = yeshu * 5 - table.datas.length
                        for (let i = 0; i < cha; i++) {
                            table.datas.push({
                                a: '',
                                sname: "",
                                size: "",
                                unit: "",
                                price: '',
                                num: '',
                                prices: ''
                            })
                        }
                    } else if (oid.substr(0, 2) == "CK") {
                        var file = "out.docx"
                        var yeshu = Math.ceil(table.datas.length / 5)
                        var cha = yeshu * 5 - table.datas.length
                        for (let i = 0; i < cha; i++) {
                            table.datas.push({
                                a: '',
                                sname: "",
                                size: "",
                                unit: "",
                                price: '',
                                expectednum: '',
                                actualnum: '',
                                prices: ''
                            })
                        }
                    } else {
                        writeJson(res, 0, '订单号格式错误')
                        return
                    }
                    table.time = sd.format(new Date(table.time), 'YYYY年MM月DD日')

                    var a = []
                    for (let i = 0; i < yeshu; i++) {
                        a.push({})
                    }
                    for (let i = 0; i < yeshu; i++) {
                        a[i].dd = table.datas.slice(i * 5, i * 5 + 5)
                    }
                    table.datas = a


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
            } else {
                writeJson(res, 0, '没有该订单')
            }

        } catch (err) {
            console.log("err:" + err)
            writeJson(res, 0, err)
        }
    }
}
/**
 * 添加图片
 * @param req
 * @param res
 */
exports.picadd = function (req, res) {
    try {
        var form = new formidable.IncomingForm();
        form.encoding = 'utf-8'
        form.keepExtensions = true //保留后缀名
        form.uploadDir = storepath //上传路径
        form.multiples = true; //多图上传
//多文件存储到 files
        var files = []
        form.on('file', function (filed, file) {
            files.push([filed, file]);
        })
//解析form表单 fields为表单中非文件内容   files为文件信息
        form.parse(req, async function (err, fields, files) {

            console.log(`oid:${fields.oid}`)
            const pictures = await findpic(fields.oid)
            console.log("111" + pictures)
            if (pictures) {
                var paths = stringtoarr(pictures)
            } else {
                var paths = []
            }
//单文件
            if (typeof(files.pictures.length) === "undefined") {
                let path = files.pictures.path.replace(/public/g, '')
                path = path.replace(/\\/g, '/')
                paths.push(path)
                await updatapic(fields.oid, paths)
                res.json({paths: paths})
            } else {
//多文件
                for (let i = 0; i < files.pictures.length; i++) {
                    let path = files.pictures[i].path.replace(/public/g, '')
                    path = path.replace(/\\/g, '/')
                    paths.push(path)
                }
                await updatapic(fields.oid, paths)
                res.json({paths: paths})
            }
        })
    } catch (err) {
        console.log(err)
    }
}
/**
 * 删除图片 oid 路径 更新
 * @param req
 * @param res
 */
exports.dele =  function (req, res) {
    try{
        const path =req.body.paths
        const oid = req.body.oid
        const paths="./public"+path
        if (!oid || !path) {
            writeJson(res, 0, "商品信息不能为空")
        } else {
            fs.exists(paths, function(exists) {
                if(exists){
                    fs.unlink(paths,async function(err){
                        if(err){
                            writeJson(res, 0, err)
                        }else{
                            const pictures= await findpic(oid)
                            const newpictures =removeWithoutCopy(stringtoarr(pictures),path)
                            const data=await updatapic(oid,newpictures)
                            writeJson(res, 1,'', data)
                            console.log("删除成功")
                        }
                    })
                }else{
                    console.log(exists)
                    writeJson(res, 0, "没有该图片")
                }
            });

        }
    }catch(err){
        writeJson(res, 0, err)
    }
}

//根据oid更新图片
function updatapic(oid, path) {
    path = arrtostring(path)
    return new Promise(function (resolve, reject) {
        db.query("update orders set picture=? where oid= ?", [path, oid], function (err, result) {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                resolve("更新成功")
            }
        })
    })
}

//根据oid查找图片
function findpic(oid) {
    return new Promise(function (resolve, reject) {
        db.query("select picture from orders where oid =?", [oid], function (err, result) {
            if (err) {
                reject(err)
            } else {
                resolve(result[0].picture)
            }
        })
    })
}

//将字符串转化为数组
function stringtoarr(str) {
    return str.split(",")
}

//将数组转化为字符串
function arrtostring(arr) {
    return arr.join()
}

//删除数组指定元素
function removeWithoutCopy(arr, item) {
    for(var i = 0; i < arr.length; i++){
        if(arr[i] == item){
            //splice方法会改变数组长度，当减掉一个元素后，后面的元素都会前移，因此需要相应减少i的值
            arr.splice(i,1);
            i--;
        }
    }
    return arr;
}