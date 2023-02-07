<?php
// 处理增加操作的页面
require "dbconfig.php";
// 连接mysql
$link = @mysql_connect(HOST,USER,PASS) or die("提示：数据库连接失败！");
// 选择数据库
mysql_select_db(DBNAME,$link);
// 编码设置
mysql_set_charset('utf8',$link);

//    http://ip/1/action-addnews.php?lx=ck&key=xxxxx

// 获取增加的
$lx = $_GET['lx'];
$key = $_GET['key'];
$hecheng = $lx.'--'.$key;
// 插入数据
mysql_query("INSERT INTO d1(waxx) VALUES ('$hecheng')",$link) or die('添加数据出错：'.mysql_error());
// 添加完跳转到页面
//header("Location:ok.php);

?>
