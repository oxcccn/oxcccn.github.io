<?php
header("Content-type:text/html;charset=utf-8");
$arr1 = array('1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18');
$key = array_rand($arr1);
echo '<br/><br/><br/><br/><p style="text-align: center"><font size="20"><a href="http://oxcc.cn/cai/c'.$arr1[$key].'.png">随机菜单</a></font></p>'
?>