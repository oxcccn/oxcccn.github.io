<?php 

    header('Content-type:text/html; charset=utf-8');

    // 开启Session

    session_start();
	
	//密码
	$a7h5g9 = '1111';

 

    // 处理用户登录信息

    if (isset($_POST['login'])) {

        # 接收用户的登录信息


        $password = trim($_POST['password']);

        // 判断提交的登录信息

        if ($password == '') {

            // 若为空,视为未填写,提示错误,并3秒后返回登录界面

            header('refresh:3; url=login.html');

            echo "密码不能为空,系统将在3秒后跳转到登录界面,请重新填写登录信息!";

            exit;

        } elseif  ($password != $a7h5g9) {

            # 用户名或密码错误,同空的处理方式

            header('refresh:3; url=login.html');

            echo "密码错误,系统将在3秒后跳转到登录界面,请重新填写登录信息!";

            exit;

        } elseif ($password = $a7h5g9) {

            # 用户名和密码都正确,将用户信息存到Session中


            $_SESSION['islogin'] = 1;

            setcookie('username', '', time()-999);

            setcookie('code', '', time()-999);

            // 处理完附加项后跳转到登录成功的首页

            header('location:/1/do.php');

        }

    }

 ?>