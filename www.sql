-- --------------------------------------------------------
-- 主机:                           192.168.1.200
-- 服务器版本:                        10.1.19-MariaDB - mariadb.org binary distribution
-- 服务器操作系统:                      Win32
-- HeidiSQL 版本:                  9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- 导出 outofstorage 的数据库结构
CREATE DATABASE IF NOT EXISTS `outofstorage` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `outofstorage`;

-- 导出  表 outofstorage.input 结构
CREATE TABLE IF NOT EXISTS `input` (
  `sid` int(11) NOT NULL AUTO_INCREMENT COMMENT '商品id',
  `sname` varchar(50) NOT NULL COMMENT '品名',
  `size` varchar(50) NOT NULL COMMENT '规格型号',
  `unit` char(50) NOT NULL COMMENT '单位',
  `price` decimal(10,2) NOT NULL COMMENT '单价',
  `num` int(11) NOT NULL COMMENT '数量',
  `prices` decimal(10,2) NOT NULL COMMENT '总金额',
  `oid` char(50) NOT NULL COMMENT '订单id',
  PRIMARY KEY (`sid`),
  KEY `sname` (`sname`),
  KEY `oid` (`oid`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='入库表';

-- 正在导出表  outofstorage.input 的数据：~6 rows (大约)
/*!40000 ALTER TABLE `input` DISABLE KEYS */;
INSERT INTO `input` (`sid`, `sname`, `size`, `unit`, `price`, `num`, `prices`, `oid`) VALUES
	(1, '电视机', '海信T60', '台', 6000.00, 2, 12000.00, 'RK84481515984421403'),
	(2, '中性笔', '齐心', '支', 1.50, 100, 150.00, 'RK84481515984421403'),
	(3, '电视机', '海信T60', '台', 6000.00, 2, 12000.00, 'RK88411515984423666'),
	(4, '中性笔', '齐心', '支', 1.50, 100, 150.00, 'RK88411515984423666'),
	(5, '电视机', '海信T60', '台', 6000.00, 2, 12000.00, 'RK63971515984425819'),
	(6, '中性笔', '齐心', '支', 1.50, 100, 150.00, 'RK63971515984425819');
/*!40000 ALTER TABLE `input` ENABLE KEYS */;

-- 导出  表 outofstorage.orders 结构
CREATE TABLE IF NOT EXISTS `orders` (
  `oid` char(19) NOT NULL COMMENT '订单编号',
  `com_cat` char(50) NOT NULL COMMENT '收料单位/物品类别（出库时收料单位）/',
  `onepeople` char(50) NOT NULL COMMENT '经办人',
  `twopeople` char(50) NOT NULL COMMENT '收料人/保管员',
  `threepeople` char(50) NOT NULL COMMENT '负责人',
  `time` datetime NOT NULL COMMENT '时间',
  `type` char(50) NOT NULL COMMENT '0出库/1入库',
  PRIMARY KEY (`oid`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='订单表';

-- 正在导出表  outofstorage.orders 的数据：~6 rows (大约)
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` (`oid`, `com_cat`, `onepeople`, `twopeople`, `threepeople`, `time`, `type`) VALUES
	('CK11271515984449636', '炊事班', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:29', '0'),
	('CK67741515984447676', '炊事班', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:27', '0'),
	('CK90341515984445132', '炊事班', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:25', '0'),
	('RK63971515984425819', '1', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:05', '1'),
	('RK84481515984421403', '1', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:01', '1'),
	('RK88411515984423666', '1', 'onepeople', 'twopeople', 'admin', '2018-01-15 10:47:03', '1');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;

-- 导出  表 outofstorage.output 结构
CREATE TABLE IF NOT EXISTS `output` (
  `sid` int(11) NOT NULL AUTO_INCREMENT COMMENT '商品id',
  `sname` varchar(50) NOT NULL COMMENT '品名',
  `size` varchar(50) NOT NULL COMMENT '规格型号',
  `unit` char(50) NOT NULL COMMENT '单位',
  `price` decimal(10,2) NOT NULL COMMENT '单价',
  `expectednum` int(11) NOT NULL COMMENT '通知数量',
  `actualnum` int(11) NOT NULL COMMENT '实发数量',
  `prices` decimal(10,2) NOT NULL COMMENT '总金额',
  `oid` char(50) NOT NULL COMMENT '订单id',
  PRIMARY KEY (`sid`),
  KEY `sname` (`sname`),
  KEY `oid` (`oid`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='出库表';

-- 正在导出表  outofstorage.output 的数据：~6 rows (大约)
/*!40000 ALTER TABLE `output` DISABLE KEYS */;
INSERT INTO `output` (`sid`, `sname`, `size`, `unit`, `price`, `expectednum`, `actualnum`, `prices`, `oid`) VALUES
	(1, '电视机', '海信T60', '台', 6000.00, 2, 2, 6000.00, 'CK90341515984445132'),
	(2, '中性笔', '齐心', '支', 1.50, 50, 50, 75.00, 'CK90341515984445132'),
	(3, '电视机', '海信T60', '台', 6000.00, 2, 2, 6000.00, 'CK67741515984447676'),
	(4, '中性笔', '齐心', '支', 1.50, 50, 50, 75.00, 'CK67741515984447676'),
	(5, '电视机', '海信T60', '台', 6000.00, 2, 2, 6000.00, 'CK11271515984449636'),
	(6, '中性笔', '齐心', '支', 1.50, 50, 50, 75.00, 'CK11271515984449636');
/*!40000 ALTER TABLE `output` ENABLE KEYS */;

-- 导出  表 outofstorage.user 结构
CREATE TABLE IF NOT EXISTS `user` (
  `uid` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `loginname` char(50) NOT NULL COMMENT '登录账号',
  `username` char(50) NOT NULL COMMENT '用户名称',
  `password` char(50) NOT NULL COMMENT '密码',
  `state` char(50) NOT NULL COMMENT '权限(0为普通/1为超级管理员)',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `loginname` (`loginname`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COMMENT='用户表';

-- 正在导出表  outofstorage.user 的数据：~2 rows (大约)
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`uid`, `loginname`, `username`, `password`, `state`) VALUES
	(1, 'admin', 'admin', 'e5b8545c27e2fdb9b2032c724b0d2a83', '2'),
	(17, 'sxy', 'sxy', 'c4096e4bbc70fdaac457d9ee9cc93e98', '1');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
